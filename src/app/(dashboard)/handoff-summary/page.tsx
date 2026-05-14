'use client'

import { useState } from 'react'
import AIResponseDisplay from '@/components/ui/AIResponseDisplay'

export default function HandoffSummaryPage() {
  const [transcript, setTranscript] = useState('')
  const [channel, setChannel] = useState('voice')
  const [urgency, setUrgency] = useState('normal')
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputClassName = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'

  const handleSubmit = async () => {
    if (!transcript.trim()) return
    setLoading(true)
    setError(null)
    setResponse(null)
    try {
      const res = await fetch('/api/ai/handoff-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, channel, urgency }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to generate handoff summary')
      }
      const data = await res.json()
      setResponse(data.result || JSON.stringify(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate handoff summary')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Handoff Summary</h1>
        <p className="text-sm text-gray-500 mt-1">Generate a concise handoff summary for a human agent takeover</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                  <select value={channel} onChange={(e) => setChannel(e.target.value)} className={inputClassName}>
                    <option value="voice">Voice</option>
                    <option value="chat">Chat</option>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                  <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className={inputClassName}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transcript *</label>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={10}
                  className={inputClassName}
                  placeholder="Paste the conversation transcript here..."
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !transcript.trim()}
                className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Generating...
                  </span>
                ) : (
                  'Generate Handoff Summary'
                )}
              </button>
            </div>
          </div>

          <AIResponseDisplay response={response} loading={loading} title="Handoff Summary" />
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
            <p className="text-sm text-gray-600">
              When the AI agent escalates, the human agent benefits from a tight summary covering: what the customer needs,
              what has been attempted, current sentiment, and the next best step.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
