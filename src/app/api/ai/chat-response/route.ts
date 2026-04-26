import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateChatResponse, generateChatTurnResponse } from '@/lib/openrouter'
import { buildSystemPrompt, getIndustryConfig } from '@/lib/industry-config'
import { executeWorkflowTurn } from '@/lib/workflow-executor'
import type { WorkflowState } from '@/lib/call-state'
import type { WorkflowNode } from '@/lib/workflow-engine'

interface HistoryEntry {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const {
      context,
      message,
      personality,
      industry,
      conversationHistory,
      workflowId,
      executionId,
    } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const history: HistoryEntry[] = Array.isArray(conversationHistory) ? conversationHistory : []

    // ─────────────── Workflow-driven chat path ───────────────
    if (workflowId) {
      const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } })
      if (!workflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
      }

      const nodes = (workflow.nodes as unknown as WorkflowNode[]) || []
      const edges = (workflow.edges as unknown as { id: string; source: string; target: string; condition?: string; label?: string }[]) || []
      const triggerNode = nodes.find(n => n.type === 'trigger')

      // Load or create the execution row
      let execution = executionId
        ? await prisma.workflowExecution.findUnique({ where: { id: executionId } })
        : null

      if (!execution) {
        execution = await prisma.workflowExecution.create({
          data: {
            workflowId: workflow.id,
            currentNode: triggerNode?.id || nodes[0]?.id || 'trigger',
            state: { variables: workflow.variables || {}, collectedInfo: {} },
            status: 'running',
          },
        })
      }

      if (execution.status !== 'running') {
        return NextResponse.json({
          error: `Workflow execution is ${execution.status}`,
          executionId: execution.id,
        }, { status: 400 })
      }

      // Hydrate the in-memory WorkflowState from the persisted row
      const state = (execution.state as unknown as { variables?: Record<string, unknown>; collectedInfo?: Record<string, string> }) || {}
      const workflowState: WorkflowState = {
        workflowId: workflow.id,
        executionId: execution.id,
        currentNodeId: execution.currentNode,
        nodes,
        edges,
        variables: (state.variables as Record<string, unknown>) || {},
        collectedInfo: (state.collectedInfo as Record<string, string>) || {},
      }

      // Build the industry-aware system prompt (same source as voice)
      const cfg = industry ? getIndustryConfig(industry) : undefined
      const agentName = cfg ? `${cfg.name} Chat Assistant` : 'Chat Assistant'
      const systemPrompt = buildSystemPrompt({
        name: agentName,
        industry: industry || workflow.industry || 'general',
      })

      const result = await executeWorkflowTurn(
        workflowState,
        message,
        systemPrompt,
        history,
        'chat'
      )

      // Persist updated execution state
      const newStatus = result.shouldHangup
        ? 'completed'
        : result.shouldTransfer
          ? 'escalated'
          : 'running'

      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          currentNode: result.updatedWorkflow.currentNodeId,
          state: {
            variables: result.updatedWorkflow.variables,
            collectedInfo: result.updatedWorkflow.collectedInfo,
          } as object,
          status: newStatus,
          completedAt: newStatus !== 'running' ? new Date() : null,
        },
      })

      const currentNode = nodes.find(n => n.id === result.updatedWorkflow.currentNodeId)

      return NextResponse.json({
        result: result.response,
        executionId: execution.id,
        currentNodeId: result.updatedWorkflow.currentNodeId,
        currentNodeLabel: currentNode?.label || null,
        currentNodeType: currentNode?.type || null,
        collectedInfo: result.updatedWorkflow.collectedInfo,
        isComplete: result.shouldHangup,
        isEscalated: result.shouldTransfer,
        status: newStatus,
      })
    }

    // ─────────────── Industry-aware path (no workflow) ───────────────
    if (industry) {
      const config = getIndustryConfig(industry)
      const agentName = config ? `${config.name} Assistant` : 'AI Assistant'
      const systemPrompt = buildSystemPrompt({
        name: agentName,
        industry,
      })

      const result = await generateChatTurnResponse(
        `${systemPrompt}

PERSONALITY: ${personality || 'professional, helpful, and friendly'}`,
        [...history, { role: 'user', content: message }]
      )

      return NextResponse.json({ result })
    }

    // ─────────────── Legacy single-turn path ───────────────
    const result = await generateChatResponse(
      context || 'General business inquiry',
      message,
      personality || 'Professional, helpful, and friendly'
    )
    return NextResponse.json({ result })
  } catch (error) {
    console.error('Error generating chat response:', error)
    return NextResponse.json({ error: 'Failed to generate chat response' }, { status: 500 })
  }
}
