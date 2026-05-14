import { NextRequest, NextResponse } from 'next/server'
import { predictiveProactiveOutreach, isOpenRouterConfigured } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const { contact_profile, recent_interactions, business_goal } = await request.json()

    if (!contact_profile || typeof contact_profile !== 'string' || !contact_profile.trim()) {
      return NextResponse.json({ error: 'contact_profile is required' }, { status: 400 })
    }
    if (!recent_interactions || typeof recent_interactions !== 'string' || !recent_interactions.trim()) {
      return NextResponse.json({ error: 'recent_interactions is required' }, { status: 400 })
    }
    if (!isOpenRouterConfigured()) {
      return NextResponse.json({ error: 'OpenRouter API key not configured.' }, { status: 503 })
    }

    const result = await predictiveProactiveOutreach(contact_profile, recent_interactions, business_goal)
    return NextResponse.json({ result })
  } catch (error) {
    console.error('Error generating proactive outreach plan:', error)
    return NextResponse.json({ error: 'Failed to generate proactive outreach plan' }, { status: 500 })
  }
}
