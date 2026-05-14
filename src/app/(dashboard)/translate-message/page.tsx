'use client'

import { useState } from 'react'
import AIResponseDisplay from '@/components/ui/AIResponseDisplay'

export default function TranslateMessagePage() {
  const [text, setText] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('Spanish')
  const [sourceLanguage, setSourceLanguage] = useState('')
  const [channel, setChannel] = useState('chat')
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputClassName = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'

  const handleSubmit = async () => {
    if (!text.trim() || !targetLanguage.trim()) return
    setLoading(true)
    setError(null)
    setResponse(null)
    try {
      const res = await fetch('/api/ai/translate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          target_language: targetLanguage,
          source_language: sourceLanguage || undefined,
          channel,
        }),
      })
      if (res.status === 503) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'AI service unavailable: OpenRouter API key not configured (503).')
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to translate message')
      }
      const data = await res.json()
      setResponse(data.result || JSON.stringify(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to translate message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Translate Message</h1>
        <p className="text-sm text-gray-500 mt-1">Translate customer-communication messages while preserving tone and channel norms</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source language</label>
                  <input
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value)}
                    placeholder="auto-detect"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target language *</label>
                  <input
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    placeholder="e.g. Spanish, French, Japanese"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                  <select value={channel} onChange={(e) => setChannel(e.target.value)} className={inputClassName}>
                    <option value="voice">Voice</option>
                    <option value="chat">Chat</option>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                  className={inputClassName}
                  placeholder="Paste the message to translate..."
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !text.trim() || !targetLanguage.trim()}
                className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Translating...
                  </span>
                ) : (
                  'Translate Message'
                )}
              </button>
            </div>
          </div>

          <AIResponseDisplay response={response} loading={loading} title="Translation" />
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
            <p className="text-sm text-gray-600">
              Multi-language support with cultural and channel-aware adaptation. Preserves tone, names, and IDs.
              Useful for SMS, voice, chat, and email handoffs across languages.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
