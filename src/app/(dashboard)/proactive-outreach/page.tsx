'use client'

import { useState } from 'react'
import AIResponseDisplay from '@/components/ui/AIResponseDisplay'

export default function ProactiveOutreachPage() {
  const [contactProfile, setContactProfile] = useState('')
  const [recentInteractions, setRecentInteractions] = useState('')
  const [businessGoal, setBusinessGoal] = useState('retention and timely upsell')
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputClassName = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'

  const handleSubmit = async () => {
    if (!contactProfile.trim() || !recentInteractions.trim()) return
    setLoading(true)
    setError(null)
    setResponse(null)
    try {
      const res = await fetch('/api/ai/proactive-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_profile: contactProfile,
          recent_interactions: recentInteractions,
          business_goal: businessGoal || undefined,
        }),
      })
      if (res.status === 503) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'AI service unavailable: OpenRouter API key not configured (503).')
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to generate proactive outreach plan')
      }
      const data = await res.json()
      setResponse(data.result || JSON.stringify(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate proactive outreach plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Predictive Proactive Outreach</h1>
        <p className="text-sm text-gray-500 mt-1">Decide whether to reach out, on which channel, and what to say — before the customer has to ask</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business goal</label>
                <input
                  value={businessGoal}
                  onChange={(e) => setBusinessGoal(e.target.value)}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact profile *</label>
                <textarea
                  value={contactProfile}
                  onChange={(e) => setContactProfile(e.target.value)}
                  rows={6}
                  className={inputClassName}
                  placeholder="Plan, tenure, role, region, current health score, recent NPS..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recent interactions *</label>
                <textarea
                  value={recentInteractions}
                  onChange={(e) => setRecentInteractions(e.target.value)}
                  rows={8}
                  className={inputClassName}
                  placeholder="Last 30 days: support tickets, calls, chats, churn signals, expansion signals..."
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !contactProfile.trim() || !recentInteractions.trim()}
                className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Planning...
                  </span>
                ) : (
                  'Generate Outreach Plan'
                )}
              </button>
            </div>
          </div>

          <AIResponseDisplay response={response} loading={loading} title="Outreach Plan" />
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
            <p className="text-sm text-gray-600">
              Predictive customer service: detect at-risk and opportunity signals from a profile and recent interactions,
              then return whether to reach out, on which channel, when, and a draft message.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
