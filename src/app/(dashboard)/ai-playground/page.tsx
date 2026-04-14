'use client'

import { useState } from 'react'
import AIResponseDisplay from '@/components/ui/AIResponseDisplay'

interface HistoryItem {
  id: string
  prompt: string
  context: string
  aiFunction: string
  response: string
  timestamp: Date
}

const aiFunctions = [
  { value: 'general', label: 'General', endpoint: '/api/ai/generate' },
  { value: 'voice', label: 'Voice Response', endpoint: '/api/ai/voice-response' },
  { value: 'chat', label: 'Chat Response', endpoint: '/api/ai/chat-response' },
  { value: 'email', label: 'Email Draft', endpoint: '/api/ai/email-draft' },
  { value: 'sms', label: 'SMS Compose', endpoint: '/api/ai/sms-compose' },
  { value: 'sentiment', label: 'Sentiment Analysis', endpoint: '/api/ai/sentiment' },
  { value: 'summarize', label: 'Summarize', endpoint: '/api/ai/summarize' },
]

export default function AIPlaygroundPage() {
  const [prompt, setPrompt] = useState('')
  const [context, setContext] = useState('')
  const [selectedFunction, setSelectedFunction] = useState('general')
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])

  const inputClassName = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setResponse(null)

    const fn = aiFunctions.find((f) => f.value === selectedFunction) || aiFunctions[0]

    try {
      let body: Record<string, string> = {}

      switch (fn.value) {
        case 'general':
          body = { prompt, context: context || '' }
          break
        case 'voice':
          body = { context: context || 'General business inquiry', query: prompt }
          break
        case 'chat':
          body = { context: context || 'General business', message: prompt, personality: 'Professional, helpful, and friendly' }
          break
        case 'email':
          body = { context: context || 'Business communication', subject: prompt, tone: 'professional' }
          break
        case 'sms':
          body = { context: context || 'Business communication', purpose: prompt }
          break
        case 'sentiment':
          body = { text: prompt }
          break
        case 'summarize':
          body = { transcript: prompt }
          break
        default:
          body = { prompt, context: context || '' }
      }

      const res = await fetch(fn.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to generate response')

      const data = await res.json()
      const result = data.result || data.response || data.content || JSON.stringify(data)

      setResponse(result)

      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        prompt,
        context,
        aiFunction: fn.label,
        response: result,
        timestamp: new Date(),
      }
      setHistory((prev) => [historyItem, ...prev])
    } catch (err) {
      setResponse(`Error: ${err instanceof Error ? err.message : 'Failed to generate response'}`)
    } finally {
      setLoading(false)
    }
  }

  const loadFromHistory = (item: HistoryItem) => {
    setPrompt(item.prompt)
    setContext(item.context)
    setResponse(item.response)
    const fn = aiFunctions.find((f) => f.label === item.aiFunction)
    if (fn) setSelectedFunction(fn.value)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Playground</h1>
        <p className="text-sm text-gray-500 mt-1">Test and experiment with AI-powered responses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AI Function</label>
                <select
                  value={selectedFunction}
                  onChange={(e) => setSelectedFunction(e.target.value)}
                  className={inputClassName}
                >
                  {aiFunctions.map((fn) => (
                    <option key={fn.value} value={fn.value}>{fn.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedFunction === 'sentiment' ? 'Text to Analyze *' :
                   selectedFunction === 'summarize' ? 'Conversation Transcript *' :
                   selectedFunction === 'sms' ? 'SMS Purpose *' :
                   selectedFunction === 'email' ? 'Email Subject/Purpose *' :
                   'Prompt *'}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className={inputClassName}
                  placeholder={
                    selectedFunction === 'voice' ? "e.g., 'I'd like to schedule a dental cleaning next week'" :
                    selectedFunction === 'chat' ? "e.g., 'Do you have any tables available for tonight?'" :
                    selectedFunction === 'email' ? "e.g., 'Follow-up after missed dental appointment'" :
                    selectedFunction === 'sms' ? "e.g., 'Appointment reminder for tomorrow at 2pm'" :
                    selectedFunction === 'sentiment' ? "Paste a customer message or conversation to analyze..." :
                    selectedFunction === 'summarize' ? "Paste a conversation transcript to summarize..." :
                    "Enter your prompt here... e.g., 'Create a greeting script for a dental office receptionist'"
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Context <span className="text-gray-400 font-normal">
                    {selectedFunction === 'sentiment' || selectedFunction === 'summarize' ? '(not used for this function)' : '(optional — improves results)'}
                  </span>
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                  className={inputClassName}
                  disabled={selectedFunction === 'sentiment' || selectedFunction === 'summarize'}
                  placeholder={
                    selectedFunction === 'voice' ? "e.g., 'Dental office, patient is a returning customer, last visit was 6 months ago'" :
                    selectedFunction === 'chat' ? "e.g., 'Italian restaurant, open Tue-Sun 5-11pm, private dining available'" :
                    selectedFunction === 'email' ? "e.g., 'Patient missed their cleaning appointment on March 15. No prior cancellations.'" :
                    selectedFunction === 'sms' ? "e.g., 'Dental patient John Smith, appointment with Dr. Lee tomorrow at 2pm'" :
                    selectedFunction === 'sentiment' || selectedFunction === 'summarize' ? 'Not needed — paste the full text in the prompt field above' :
                    "Add business context: industry, customer details, situation, tone preferences..."
                  }
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Generating...
                  </span>
                ) : (
                  'Generate Response'
                )}
              </button>
            </div>
          </div>

          <AIResponseDisplay
            response={response}
            loading={loading}
            title={`AI Response - ${aiFunctions.find((f) => f.value === selectedFunction)?.label || 'General'}`}
          />
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Session History</h2>
            {history.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-500">No history yet</p>
                <p className="text-xs text-gray-400 mt-1">Your prompts will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors border border-gray-100 hover:border-primary-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-primary-600">{item.aiFunction}</span>
                      <span className="text-xs text-gray-400">
                        {item.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{item.prompt}</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                      {item.response.slice(0, 80)}...
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
