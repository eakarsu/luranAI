import { PrismaClient } from '@prisma/client'
import { ALL_INDUSTRY_WORKFLOWS } from '../src/lib/workflow-templates'

const prisma = new PrismaClient()

async function main() {
  console.log(`Deploying ${ALL_INDUSTRY_WORKFLOWS.length} industry workflows...`)

  const createdWorkflows: any[] = []

  for (const template of ALL_INDUSTRY_WORKFLOWS) {
    // Check if active workflow for this industry already exists
    const existing = await prisma.workflow.findFirst({
      where: { industry: template.industry, status: 'active' },
    })

    if (existing) {
      console.log(`  [skip] ${template.industry} — already active`)
      createdWorkflows.push(existing)
      continue
    }

    const workflow = await prisma.workflow.create({
      data: {
        name: template.name,
        description: template.description,
        trigger: template.trigger,
        industry: template.industry,
        nodes: template.nodes as any,
        edges: template.edges as any,
        status: 'active',
      },
    })
    console.log(`  [created] ${template.industry} -> ${template.name} (${template.nodes.length} nodes)`)
    createdWorkflows.push(workflow)
  }

  // Link voice agents to their industry workflows
  const agents = await prisma.voiceAgent.findMany()
  let linked = 0

  for (const agent of agents) {
    const industryKey = agent.industry.toLowerCase()
    const workflow = createdWorkflows.find((w: any) => w.industry === industryKey)

    if (workflow && agent.workflowId !== workflow.id) {
      await prisma.voiceAgent.update({
        where: { id: agent.id },
        data: { workflowId: workflow.id },
      })
      linked++
      console.log(`  [linked] ${agent.name} -> ${workflow.name}`)
    }
  }

  console.log(`\nDone! ${createdWorkflows.length} workflows active, ${linked} agents linked.`)
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
