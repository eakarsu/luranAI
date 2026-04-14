import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTenantContext } from '@/lib/tenant'

export async function GET() {
  try {
    const tenant = await getTenantContext()
    const where = tenant ? { orgId: tenant.orgId } : {}

    const [
      voiceAgents, smsCampaigns, chatAgents, emailAgents,
      contacts, conversations, callLogs, appointments
    ] = await Promise.all([
      prisma.voiceAgent.count({ where }),
      prisma.smsCampaign.count({ where }),
      prisma.chatAgent.count({ where }),
      prisma.emailAgent.count({ where }),
      prisma.contact.count({ where }),
      prisma.conversation.count({ where }),
      prisma.callLog.count({ where }),
      prisma.appointment.count({ where }),
    ])

    const activeVoiceAgents = await prisma.voiceAgent.count({ where: { ...where, status: 'active' } })
    const activeChatAgents = await prisma.chatAgent.count({ where: { ...where, status: 'active' } })
    const resolvedConversations = await prisma.conversation.count({ where: { ...where, status: 'resolved' } })

    return NextResponse.json({
      totalVoiceAgents: voiceAgents,
      totalSmsCampaigns: smsCampaigns,
      totalChatAgents: chatAgents,
      totalEmailAgents: emailAgents,
      totalContacts: contacts,
      totalConversations: conversations,
      totalCallLogs: callLogs,
      totalAppointments: appointments,
      activeVoiceAgents,
      activeChatAgents,
      resolutionRate: conversations > 0 ? Math.round((resolvedConversations / conversations) * 100) : 0,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
