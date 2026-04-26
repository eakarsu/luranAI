'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import { getAllIndustries } from '@/lib/industry-config'
import { getIndustryEmoji, getIndustryColorClass } from '@/lib/industry-display'

interface ChatAgent {
  id: string
  name: string
  personality: string
  industry: string
  status: string
  responseTime: string
}

export default function ChatAgentsPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<ChatAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const industries = getAllIndustries()

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

  const getAgentCountForIndustry = (industryId: string) =>
    agents.filter((a) => a.industry.toLowerCase() === industryId.toLowerCase()).length

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
    <div className="space-y-8">
      {/* Industry Chat Playground */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chat Agents</h1>
            <p className="text-sm text-gray-500 mt-1">
              Open an industry-specific chat window to test or demo the assistant.
              Same prompts that power voice calls.
            </p>
          </div>
          <div className="bg-primary-50 border border-primary-200 rounded-lg px-3 py-1.5 text-sm text-primary-700">
            {industries.length} industries
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {industries.map((industry) => {
            const emoji = getIndustryEmoji(industry.id)
            const colorClass = getIndustryColorClass(industry.id)
            const agentCount = getAgentCountForIndustry(industry.id)
            return (
              <button
                key={industry.id}
                onClick={() =>
                  router.push(`/chat-playground/${encodeURIComponent(industry.id)}`)
                }
                className={`bg-white rounded-xl border-2 p-6 text-left transition-all duration-200 cursor-pointer group ${colorClass}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl group-hover:scale-110 transition-transform duration-200">
                    {emoji}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      Open chat
                    </span>
                    {agentCount > 0 && (
                      <span className="text-xs text-gray-400">
                        {agentCount} agent{agentCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">{industry.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {industry.conversationGoals[0]}
                </p>
              </button>
            )
          })}
        </div>
      </section>

      {/* Configured Chat Agents (DB) */}
      <section>
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
            <p className="font-medium">Error loading chat agents</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={agents}
            basePath="/chat-agents"
            title="Configured Chat Agents"
            searchField="name"
          />
        )}
      </section>
    </div>
  )
}
