'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAllIndustries } from '@/lib/industry-config'

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

const INDUSTRY_EMOJIS: Record<string, string> = {
  dentistry: '\u{1F9B7}',
  restaurants: '\u{1F37D}',
  'health clinics': '\u{1F3E5}',
  'real estate': '\u{1F3E0}',
  'car dealerships': '\u{1F697}',
  hospitality: '\u{1F3E8}',
  'debt collection': '\u{1F4B0}',
  insurance: '\u{1F6E1}',
  legal: '\u{2696}',
  'home services': '\u{1F527}',
  pharmacy: '\u{1F48A}',
  fitness: '\u{1F4AA}',
  education: '\u{1F393}',
  'pet care': '\u{1F43E}',
  accounting: '\u{1F4CA}',
  salon: '\u{1F487}',
  'auto repair': '\u{1F6E0}',
}

const INDUSTRY_COLORS: Record<string, string> = {
  dentistry: 'border-blue-300 hover:border-blue-500 hover:bg-blue-50',
  restaurants: 'border-orange-300 hover:border-orange-500 hover:bg-orange-50',
  'health clinics': 'border-green-300 hover:border-green-500 hover:bg-green-50',
  'real estate': 'border-purple-300 hover:border-purple-500 hover:bg-purple-50',
  'car dealerships': 'border-red-300 hover:border-red-500 hover:bg-red-50',
  hospitality: 'border-cyan-300 hover:border-cyan-500 hover:bg-cyan-50',
  'debt collection': 'border-gray-300 hover:border-gray-500 hover:bg-gray-50',
  insurance: 'border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50',
  legal: 'border-slate-300 hover:border-slate-500 hover:bg-slate-50',
  'home services': 'border-yellow-300 hover:border-yellow-500 hover:bg-yellow-50',
  pharmacy: 'border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50',
  fitness: 'border-rose-300 hover:border-rose-500 hover:bg-rose-50',
  education: 'border-sky-300 hover:border-sky-500 hover:bg-sky-50',
  'pet care': 'border-amber-300 hover:border-amber-500 hover:bg-amber-50',
  accounting: 'border-teal-300 hover:border-teal-500 hover:bg-teal-50',
  salon: 'border-pink-300 hover:border-pink-500 hover:bg-pink-50',
  'auto repair': 'border-zinc-300 hover:border-zinc-500 hover:bg-zinc-50',
}

export default function VoiceAgentsPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<VoiceAgent[]>([])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
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

  const handleIndustryClick = (industryId: string) => {
    const agent = agents.find(
      a => a.industry.toLowerCase() === industryId.toLowerCase()
    )
    if (agent) {
      router.push(`/voice-agents/${agent.id}`)
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
          const emoji = INDUSTRY_EMOJIS[industry.id] || '\u{1F4BC}'
          const colorClass = INDUSTRY_COLORS[industry.id] || 'border-gray-300 hover:border-gray-500'
          const workflow = getWorkflowForIndustry(industry.id)
          const agentCount = getAgentCountForIndustry(industry.id)

          return (
            <button
              key={industry.id}
              onClick={() => handleIndustryClick(industry.id)}
              className={`bg-white rounded-xl border-2 p-6 text-left transition-all duration-200 cursor-pointer group ${colorClass}`}
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
              {workflow && (
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
