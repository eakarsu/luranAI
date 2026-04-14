'use client'

import { useState, useEffect } from 'react'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'

interface ChatAgent {
  id: string
  name: string
  personality: string
  industry: string
  status: string
  responseTime: string
}

export default function ChatAgentsPage() {
  const [agents, setAgents] = useState<ChatAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch('/api/chat-agents')
        if (!res.ok) throw new Error('Failed to fetch chat agents')
        const data = await res.json()
        setAgents(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchAgents()
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
        <p className="font-medium">Error loading chat agents</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  const columns = [
    { key: 'name' as const, label: 'Name' },
    { key: 'personality' as const, label: 'Personality' },
    { key: 'industry' as const, label: 'Industry' },
    {
      key: 'status' as const,
      label: 'Status',
      render: (agent: ChatAgent) => <StatusBadge status={agent.status} />,
    },
    { key: 'responseTime' as const, label: 'Response Time' },
  ]

  return (
    <DataTable
      columns={columns}
      data={agents}
      basePath="/chat-agents"
      title="Chat Agents"
      searchField="name"
    />
  )
}
