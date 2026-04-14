'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import StatusBadge from '@/components/ui/StatusBadge'
import AIResponseDisplay from '@/components/ui/AIResponseDisplay'

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
}

interface TranscriptMessage {
  role: string
  content?: string
  text?: string
}

interface Conversation {
  id: string
  channel: string
  contactId: string
  contact: Contact
  agentName: string
  transcript: TranscriptMessage[]
  sentiment: string | null
  status: string
  summary: string | null
  duration: number | null
  createdAt: string
  updatedAt: string
}

const channelColors: Record<string, string> = {
  VOICE: 'bg-purple-100 text-purple-800',
  SMS: 'bg-blue-100 text-blue-800',
  CHAT: 'bg-green-100 text-green-800',
  EMAIL: 'bg-orange-100 text-orange-800',
}

export default function ConversationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [sentimentResult, setSentimentResult] = useState<string | null>(null)
  const [summaryResult, setSummaryResult] = useState<string | null>(null)

  useEffect(() => {
    async function fetchConversation() {
      try {
        const res = await fetch(`/api/conversations/${id}`)
        if (!res.ok) throw new Error('Conversation not found')
        const data = await res.json()
        setConversation(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchConversation()
  }, [id])

  const getTranscriptText = () => {
    if (!conversation?.transcript) return ''
    const messages = Array.isArray(conversation.transcript) ? conversation.transcript : []
    return messages.map((m: TranscriptMessage) => `${m.role}: ${m.content || m.text}`).join('\n')
  }

  const handleAnalyzeSentiment = async () => {
    setAiLoading(true)
    setSentimentResult(null)
    try {
      const res = await fetch('/api/ai/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: getTranscriptText() }),
      })
      if (!res.ok) throw new Error('Failed to analyze sentiment')
      const data = await res.json()
      setSentimentResult(data.result || data.response || JSON.stringify(data))
    } catch (err) {
      setSentimentResult(`Error: ${err instanceof Error ? err.message : 'Failed to analyze'}`)
    } finally {
      setAiLoading(false)
    }
  }

  const handleSummarize = async () => {
    setAiLoading(true)
    setSummaryResult(null)
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: getTranscriptText() }),
      })
      if (!res.ok) throw new Error('Failed to summarize')
      const data = await res.json()
      setSummaryResult(data.result || data.response || JSON.stringify(data))
    } catch (err) {
      setSummaryResult(`Error: ${err instanceof Error ? err.message : 'Failed to summarize'}`)
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-6" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-100 rounded w-3/4" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !conversation) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <p className="font-medium">Error</p>
        <p className="text-sm mt-1">{error || 'Conversation not found'}</p>
        <button onClick={() => router.push('/conversations')} className="mt-3 text-sm underline">
          Back to Conversations
        </button>
      </div>
    )
  }

  const transcript: TranscriptMessage[] = Array.isArray(conversation.transcript) ? conversation.transcript : []

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.push('/conversations')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Conversations
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Conversation Details</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500">Channel</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${channelColors[conversation.channel] || 'bg-gray-100 text-gray-800'}`}>
              {conversation.channel}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Contact</p>
            <p className="text-gray-900 font-medium">
              {conversation.contact?.firstName} {conversation.contact?.lastName}
            </p>
            {conversation.contact?.email && (
              <p className="text-xs text-gray-400">{conversation.contact.email}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">Agent</p>
            <p className="text-gray-900 font-medium">{conversation.agentName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Sentiment</p>
            <p className="text-gray-900 font-medium">{conversation.sentiment || 'Not analyzed'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <StatusBadge status={conversation.status} />
          </div>
          {conversation.duration && (
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="text-gray-900 font-medium">
                {Math.floor(conversation.duration / 60)}:{String(conversation.duration % 60).padStart(2, '0')}
              </p>
            </div>
          )}
        </div>
        {conversation.summary && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Summary</p>
            <p className="text-gray-700">{conversation.summary}</p>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Created: {new Date(conversation.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transcript</h2>
        {transcript.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {transcript.map((msg, i) => {
              const isAgent = msg.role === 'agent' || msg.role === 'assistant'
              return (
                <div
                  key={i}
                  className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      isAgent
                        ? 'bg-gray-100 text-gray-800 rounded-bl-md'
                        : 'bg-primary-600 text-white rounded-br-md'
                    }`}
                  >
                    <p className={`text-xs font-medium mb-1 ${isAgent ? 'text-gray-500' : 'text-primary-100'}`}>
                      {msg.role === 'agent' || msg.role === 'assistant' ? 'Agent' : 'User'}
                    </p>
                    <p className="text-sm leading-relaxed">{msg.content || msg.text}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No transcript available</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h2>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={handleAnalyzeSentiment}
            disabled={aiLoading || transcript.length === 0}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            Analyze Sentiment
          </button>
          <button
            onClick={handleSummarize}
            disabled={aiLoading || transcript.length === 0}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            Summarize
          </button>
        </div>

        {aiLoading && (
          <AIResponseDisplay response={null} loading={true} title="Processing..." />
        )}
        {sentimentResult && (
          <div className="mb-4">
            <AIResponseDisplay response={sentimentResult} title="Sentiment Analysis" />
          </div>
        )}
        {summaryResult && (
          <AIResponseDisplay response={summaryResult} title="Summary" />
        )}
      </div>
    </div>
  )
}
