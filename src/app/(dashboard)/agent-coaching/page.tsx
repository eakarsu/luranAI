'use client'

import { useState } from 'react'
import AIResponseDisplay from '@/components/ui/AIResponseDisplay'

export default function AgentCoachingPage() {
  const [transcript, setTranscript] = useState('')
  const [agentName, setAgentName] = useState('')
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
      const res = await fetch('/api/ai/agent-coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, agentName }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to generate coaching analysis')
      }
      const data = await res.json()
      setResponse(data.result || JSON.stringify(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate coaching analysis')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agent Coaching</h1>
        <p className="text-sm text-gray-500 mt-1">Post-call coaching analysis for human agents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className={inputClassName}
                  placeholder="e.g., Jordan Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conversation Transcript *</label>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={12}
                  className={inputClassName}
                  placeholder="Paste a full conversation transcript to receive strengths, improvement areas, and concrete coaching tips..."
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
                    Analyzing...
                  </span>
                ) : (
                  'Generate Coaching Analysis'
                )}
              </button>
            </div>
          </div>

          <AIResponseDisplay response={response} loading={loading} title="Coaching Analysis" />
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Tips</h2>
            <ul className="text-sm text-gray-600 space-y-2 list-disc pl-4">
              <li>Include the full conversation, not just snippets.</li>
              <li>Note speaker turns clearly (Agent: / Customer:).</li>
              <li>Provide an agent name for personalized feedback.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
