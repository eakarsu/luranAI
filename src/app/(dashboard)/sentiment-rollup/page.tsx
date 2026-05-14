'use client'

import { useState } from 'react'
import AIResponseDisplay from '@/components/ui/AIResponseDisplay'

const DEFAULT_ROWS = JSON.stringify([
  { channel: 'voice', samples: ['I waited 20 minutes on hold.'] },
  { channel: 'chat', samples: ['You finally got back to me, thanks.', 'Issue is now resolved.'] },
  { channel: 'email', samples: ['Following up — still unresolved.'] },
], null, 2)

export default function SentimentRollupPage() {
  const [contactLabel, setContactLabel] = useState('')
  const [perChannel, setPerChannel] = useState(DEFAULT_ROWS)
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputClassName = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'

  const handleSubmit = async () => {
    let parsed
    try {
      parsed = JSON.parse(perChannel)
    } catch {
      setError('per_channel_sentiments must be valid JSON')
      return
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      setError('per_channel_sentiments must be a non-empty array')
      return
    }
    setLoading(true)
    setError(null)
    setResponse(null)
    try {
      const res = await fetch('/api/ai/sentiment-rollup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          per_channel_sentiments: parsed,
          contact_label: contactLabel || undefined,
        }),
      })
      if (res.status === 503) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'AI service unavailable: OpenRouter API key not configured (503).')
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to generate sentiment rollup')
      }
      const data = await res.json()
      setResponse(data.result || JSON.stringify(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate sentiment rollup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cross-Channel Sentiment Rollup</h1>
        <p className="text-sm text-gray-500 mt-1">Aggregate per-channel sentiment samples for one contact into a single trend snapshot</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact label</label>
                <input
                  value={contactLabel}
                  onChange={(e) => setContactLabel(e.target.value)}
                  placeholder="e.g. Acme Corp, Jane Doe"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Per-channel sentiment samples (JSON) *</label>
                <textarea
                  value={perChannel}
                  onChange={(e) => setPerChannel(e.target.value)}
                  rows={12}
                  className={inputClassName + ' font-mono text-sm'}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !perChannel.trim()}
                className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Aggregating...
                  </span>
                ) : (
                  'Generate Rollup'
                )}
              </button>
            </div>
          </div>

          <AIResponseDisplay response={response} loading={loading} title="Sentiment Rollup" />
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
            <p className="text-sm text-gray-600">
              Many contacts behave differently on voice vs SMS vs email. This rollup spots cross-channel divergence
              (e.g. polite over email, frustrated on voice) and surfaces escalation risk plus next-best-action.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
