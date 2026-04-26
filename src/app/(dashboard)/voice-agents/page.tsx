'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAllIndustries, getIndustryConfig } from '@/lib/industry-config'
import { getIndustryEmoji, getIndustryColorClass } from '@/lib/industry-display'

interface VoiceAgent {
  id: string
  name: string
  industry: string
  workflowId: string | null
}

interface Workflow {
  id: string
  name: string
  industry: string
  status: string
  nodes: unknown[]
  edges: unknown[]
}

export default function VoiceAgentsPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<VoiceAgent[]>([])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [creatingFor, setCreatingFor] = useState<string | null>(null)
  const industries = getAllIndustries()

  useEffect(() => {
    async function fetchData() {
      try {
        const [agentsRes, workflowsRes] = await Promise.all([
          fetch('/api/voice-agents'),
          fetch('/api/workflows'),
        ])
        if (agentsRes.ok) setAgents(await agentsRes.json())
        if (workflowsRes.ok) setWorkflows(await workflowsRes.json())
      } catch {}
    }
    fetchData()
  }, [])

  const handleIndustryClick = async (industryId: string) => {
    const existing = agents.find(
      a => a.industry.toLowerCase() === industryId.toLowerCase()
    )
    if (existing) {
      router.push(`/voice-agents/${existing.id}`)
      return
    }

    // No agent yet for this industry — auto-create one using industry config defaults.
    const config = getIndustryConfig(industryId)
    if (!config) return
    setCreatingFor(industryId)
    try {
      const res = await fetch('/api/voice-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${config.name} Assistant`,
          language: 'en-US',
          voice: 'alloy',
          greeting: config.defaultGreeting,
          industry: config.id,
          status: 'active',
          systemPrompt: config.systemPrompt,
          maxCallDuration: 300,
        }),
      })
      if (!res.ok) throw new Error('Failed to create voice agent')
      const created = await res.json()
      router.push(`/voice-agents/${created.id}`)
    } catch (err) {
      console.error(err)
      setCreatingFor(null)
    }
  }

  const getWorkflowForIndustry = (industryId: string) => {
    const idMap: Record<string, string> = {
      'health clinics': 'health-clinics',
      'real estate': 'real-estate',
      'car dealerships': 'car-dealerships',
      'debt collection': 'debt-collection',
      'home services': 'home-services',
      'pet care': 'pet-care',
      accounting: 'accounting-tax',
      salon: 'salon-spa',
      'auto repair': 'auto-repair',
    }
    const mapped = idMap[industryId] || industryId
    return workflows.find(w => w.industry === mapped)
  }

  const getAgentCountForIndustry = (industryId: string) => {
    return agents.filter(a => a.industry.toLowerCase() === industryId.toLowerCase()).length
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voice Agents</h1>
          <p className="text-sm text-gray-500 mt-1">
            AI-powered outbound calling agents tailored for each industry. Select an industry to configure and make calls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-primary-50 border border-primary-200 rounded-lg px-3 py-1.5 text-sm text-primary-700">
            {agents.length} agents across {industries.length} industries
          </div>
          <button
            onClick={() => router.push('/voice-agents/new')}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Agent
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {industries.map((industry) => {
          const emoji = getIndustryEmoji(industry.id)
          const colorClass = getIndustryColorClass(industry.id)
          const workflow = getWorkflowForIndustry(industry.id)
          const agentCount = getAgentCountForIndustry(industry.id)

          const isCreating = creatingFor === industry.id

          return (
            <button
              key={industry.id}
              onClick={() => handleIndustryClick(industry.id)}
              disabled={isCreating}
              className={`bg-white rounded-xl border-2 p-6 text-left transition-all duration-200 cursor-pointer group disabled:opacity-60 disabled:cursor-wait ${colorClass}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-4xl group-hover:scale-110 transition-transform duration-200">
                  {emoji}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {workflow ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      workflow.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        workflow.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      Workflow {workflow.status}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      No workflow
                    </span>
                  )}
                  {agentCount > 0 && (
                    <span className="text-xs text-gray-400">{agentCount} agent{agentCount > 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">{industry.name}</h3>
              {isCreating && (
                <p className="text-xs text-primary-600 mt-1">Setting up agent…</p>
              )}
              {!isCreating && workflow && (
                <p className="text-xs text-gray-500 mt-1 truncate">{workflow.name}</p>
              )}
              {workflow && Array.isArray(workflow.nodes) && (
                <p className="text-xs text-gray-400 mt-2">
                  {workflow.nodes.length} steps &middot; {workflow.edges?.length || 0} connections
                </p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
