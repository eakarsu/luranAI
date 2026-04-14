'use client'

import { useState, useEffect } from 'react'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'

interface Contact {
  id: string
  firstName: string
  lastName: string
}

interface Conversation {
  id: string
  channel: string
  contactId: string
  contact: Contact
  agentName: string
  sentiment: string | null
  status: string
}

const channelColors: Record<string, string> = {
  VOICE: 'bg-purple-100 text-purple-800',
  SMS: 'bg-blue-100 text-blue-800',
  CHAT: 'bg-green-100 text-green-800',
  EMAIL: 'bg-orange-100 text-orange-800',
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await fetch('/api/conversations')
        if (!res.ok) throw new Error('Failed to fetch conversations')
        const data = await res.json()
        setConversations(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchConversations()
  }, [])

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <p className="font-medium">Error loading conversations</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  const columns = [
    {
      key: 'channel' as const,
      label: 'Channel',
      render: (conv: Conversation) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${channelColors[conv.channel] || 'bg-gray-100 text-gray-800'}`}>
          {conv.channel}
        </span>
      ),
    },
    {
      key: 'contact' as const,
      label: 'Contact Name',
      render: (conv: Conversation) => (
        <span>{conv.contact?.firstName} {conv.contact?.lastName}</span>
      ),
    },
    { key: 'agentName' as const, label: 'Agent' },
    {
      key: 'sentiment' as const,
      label: 'Sentiment',
      render: (conv: Conversation) => (
        <span className="text-sm text-gray-600">{conv.sentiment || '-'}</span>
      ),
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (conv: Conversation) => <StatusBadge status={conv.status} />,
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={conversations}
      basePath="/conversations"
      title="Conversations"
      searchField="agentName"
    />
  )
}
