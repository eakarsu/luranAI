import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Import workflow templates inline to avoid TS module issues
async function main() {
  // Dynamic import
  const { ALL_INDUSTRY_WORKFLOWS } = await import('../src/lib/workflow-templates')

  // Find the demo org
  const org = await prisma.organization.findFirst({ where: { slug: 'demo-org' } })
  const orgId = org?.id || null

  console.log(`Seeding ${ALL_INDUSTRY_WORKFLOWS.length} industry workflows...`)

  for (const wf of ALL_INDUSTRY_WORKFLOWS) {
    // Check if workflow already exists for this industry
    const existing = await prisma.workflow.findFirst({
      where: { industry: wf.industry, name: wf.name },
    })

    if (existing) {
      console.log(`  ✓ ${wf.name} (${wf.industry}) — already exists, updating`)
      await prisma.workflow.update({
        where: { id: existing.id },
        data: {
          description: wf.description,
          trigger: wf.trigger,
          nodes: JSON.parse(JSON.stringify(wf.nodes)),
          edges: JSON.parse(JSON.stringify(wf.edges)),
          status: 'active',
          orgId,
        },
      })
    } else {
      console.log(`  + ${wf.name} (${wf.industry})`)
      await prisma.workflow.create({
        data: {
          name: wf.name,
          description: wf.description,
          trigger: wf.trigger,
          industry: wf.industry,
          channels: JSON.stringify(['VOICE']),
          nodes: JSON.parse(JSON.stringify(wf.nodes)),
          edges: JSON.parse(JSON.stringify(wf.edges)),
          variables: JSON.stringify({}),
          status: 'active',
          orgId,
        },
      })
    }
  }

  // Link voice agents to their matching workflows
  const voiceAgents = await prisma.voiceAgent.findMany()
  const workflows = await prisma.workflow.findMany()

  for (const agent of voiceAgents) {
    const match = workflows.find(w => {
      const agentIndustry = agent.industry.toLowerCase().replace(/\s+/g, '-')
      return w.industry === agentIndustry || w.industry === agent.industry.toLowerCase()
    })
    if (match && !agent.workflowId) {
      await prisma.voiceAgent.update({
        where: { id: agent.id },
        data: { workflowId: match.id },
      })
      console.log(`  → Linked "${agent.name}" to workflow "${match.name}"`)
    }
  }

  console.log('\nDone! All industry workflows seeded and linked.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
