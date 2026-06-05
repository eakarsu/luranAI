import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { makeCall, configureInboundWebhook } from '@/lib/twilio'
import { makeVapiCall } from '@/lib/vapi'
import { makeBlandCall } from '@/lib/bland'
import { makeRetellCall } from '@/lib/retell'
import { buildSystemPrompt } from '@/lib/industry-config'
import { createCall, type CallProvider } from '@/lib/call-state'
import { formatSalesforceContextForPrompt, lookupSalesforceRecords } from '@/lib/salesforce'

const SUPPORTED_PROVIDERS: CallProvider[] = ['twilio', 'vapi', 'bland', 'retell']

export async function POST(request: NextRequest) {
  try {
    const { agentId, phoneNumber, conversationGoal, agentName, customGreeting, provider = 'twilio' } = await request.json()
    const callProvider = provider as CallProvider

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }
    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 })
    }
    if (!SUPPORTED_PROVIDERS.includes(callProvider)) {
      return NextResponse.json({ error: `Unsupported call provider: ${provider}` }, { status: 400 })
    }

    // Fetch voice agent from database
    const agent = await prisma.voiceAgent.findUnique({ where: { id: agentId } })
    if (!agent) {
      return NextResponse.json({ error: 'Voice agent not found' }, { status: 404 })
    }

    const effectiveName = agentName || agent.name
    const effectiveGreeting = customGreeting || agent.greeting

    let systemPrompt = buildSystemPrompt({
      name: effectiveName,
      industry: agent.industry,
      systemPrompt: agent.systemPrompt,
    }, conversationGoal)

    const salesforceContext = await lookupSalesforceRecords({
      orgId: agent.orgId,
      phone: phoneNumber,
    }).catch((error) => {
      console.error('Salesforce caller lookup failed:', error)
      return null
    })

    const salesforcePrompt = formatSalesforceContextForPrompt(salesforceContext)
    if (salesforcePrompt) {
      systemPrompt = `${systemPrompt}\n\n${salesforcePrompt}`
    }

    const webhookBase = process.env.PUBLIC_WEBHOOK_URL
    if (!webhookBase) {
      return NextResponse.json(
        { error: 'PUBLIC_WEBHOOK_URL not configured. Set it to your ngrok URL for development.' },
        { status: 500 }
      )
    }

    let sid: string
    let status: string

    const transferNumber = agent.transferNumber || undefined

    // Auto-configure Twilio inbound only for the providers that use Twilio for transfer legs.
    if (transferNumber) {
      try {
        await configureInboundWebhook(transferNumber, `${webhookBase}/api/voice/inbound`)
        console.log(`[setup] Twilio webhook configured for ${transferNumber}`)
      } catch {
        // Silently skip — transfer number may be a personal/non-Twilio line
      }
    }

    if (callProvider === 'vapi') {
      const vapiWebhookUrl = `${webhookBase}/api/voice/call/vapi-webhook`
      const result = await makeVapiCall({
        phoneNumber,
        systemPrompt,
        greeting: effectiveGreeting,
        agentName: effectiveName,
        webhookUrl: vapiWebhookUrl,
      })
      sid = result.sid
      status = result.status
    } else if (callProvider === 'bland') {
      const blandWebhookUrl = `${webhookBase}/api/voice/call/bland-webhook`
      const result = await makeBlandCall({
        phoneNumber,
        systemPrompt,
        greeting: effectiveGreeting,
        agentName: effectiveName,
        webhookUrl: blandWebhookUrl,
      })
      sid = result.sid
      status = result.status
    } else if (callProvider === 'retell') {
      const result = await makeRetellCall({
        phoneNumber,
        systemPrompt,
        greeting: effectiveGreeting,
        agentName: effectiveName,
        industry: agent.industry,
      })
      sid = result.sid
      status = result.status
    } else {
      const answerUrl = `${webhookBase}/api/voice/call/webhook/answer`
      const statusUrl = `${webhookBase}/api/voice/call/webhook/status`
      const result = await makeCall(phoneNumber, answerUrl, statusUrl)
      sid = result.sid
      status = result.status
    }

    // Load workflow if agent has one linked
    let workflowState = undefined
    if (agent.workflowId) {
      const workflow = await prisma.workflow.findUnique({ where: { id: agent.workflowId } })
      if (workflow && workflow.status === 'active') {
        const nodes = workflow.nodes as any[]
        const edges = workflow.edges as any[]
        const triggerNode = nodes.find((n: any) => n.type === 'trigger')

        // Create execution record
        const execution = await prisma.workflowExecution.create({
          data: {
            workflowId: workflow.id,
            callSid: sid,
            currentNode: triggerNode?.id || nodes[0]?.id || 'trigger',
            state: { variables: workflow.variables || {}, collectedInfo: {} },
            status: 'running',
          },
        })

        workflowState = {
          workflowId: workflow.id,
          executionId: execution.id,
          currentNodeId: triggerNode?.id || nodes[0]?.id || 'trigger',
          nodes,
          edges,
          variables: {
            ...(workflow.variables as Record<string, unknown>) || {},
            // Inject agent's transfer number so {{transfer_number}} resolves in all workflow nodes
            ...(transferNumber ? { transfer_number: transferNumber } : {}),
          },
          collectedInfo: {},
        }
        console.log(`Workflow "${workflow.name}" loaded for call ${sid} (${nodes.length} nodes)`)
      }
    }

    createCall({
      callSid: sid,
      agentId: agent.id,
      orgId: agent.orgId,
      industry: agent.industry,
      systemPrompt,
      greeting: effectiveGreeting,
      voice: agent.voice,
      language: agent.language,
      phoneNumber,
      conversationGoal,
      provider: callProvider,
      transferNumber,
      workflow: workflowState,
      salesforceContext,
    })

    return NextResponse.json({ callSid: sid, status })
  } catch (error: any) {
    console.error('Call initiation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initiate call' },
      { status: 500 }
    )
  }
}
