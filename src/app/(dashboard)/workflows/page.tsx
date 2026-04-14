'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import StatusBadge from '@/components/ui/StatusBadge'

interface Workflow {
  id: string
  name: string
  description: string | null
  trigger: string
  industry: string | null
  status: string
  nodes: unknown[]
  createdAt: string
  updatedAt: string
}

interface Template {
  id: string
  name: string
  description: string
  trigger: string
  industry: string
  nodes: unknown[]
  edges: unknown[]
}

const triggerLabels: Record<string, string> = {
  inbound_call: 'Inbound Call',
  outbound_call: 'Outbound Call',
  sms_received: 'SMS Received',
  chat_message: 'Chat Message',
  email_received: 'Email Received',
  manual: 'Manual',
}

const industryEmojis: Record<string, string> = {
  dentistry: '\uD83E\uDDB7',
  restaurants: '\uD83C\uDF7D\uFE0F',
  'health clinics': '\uD83C\uDFE5',
  'real estate': '\uD83C\uDFE0',
  'car dealerships': '\uD83D\uDE97',
  hospitality: '\uD83C\uDFE8',
  'debt collection': '\uD83D\uDCB0',
  insurance: '\uD83D\uDEE1\uFE0F',
  legal: '\u2696\uFE0F',
  'home services': '\uD83D\uDD27',
  pharmacy: '\uD83D\uDC8A',
  fitness: '\uD83C\uDFCB\uFE0F',
  education: '\uD83C\uDF93',
  'pet care': '\uD83D\uDC3E',
  accounting: '\uD83D\uDCCA',
  salon: '\uD83D\uDC87',
  'auto repair': '\uD83D\uDD29',
}

export default function WorkflowsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState<string | null>(null)
  const [filterIndustry, setFilterIndustry] = useState<string>(searchParams.get('industry') || 'all')

  useEffect(() => {
    async function load() {
      try {
        const [wfRes, tplRes] = await Promise.all([
          fetch('/api/workflows'),
          fetch('/api/workflows/templates'),
        ])
        setWorkflows(await wfRes.json())
        setTemplates(await tplRes.json())
      } catch {
        // handle error
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleCreateFromTemplate(template: Template) {
    setDeploying(template.id)
    const res = await fetch('/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: template.name,
        description: template.description,
        trigger: template.trigger,
        industry: template.industry,
        nodes: template.nodes,
        edges: template.edges,
        status: 'draft',
      }),
    })
    if (res.ok) {
      const workflow = await res.json()
      router.push(`/workflows/${workflow.id}`)
    }
    setDeploying(null)
  }

  async function handleCreateBlank() {
    const res = await fetch('/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Workflow',
        trigger: 'inbound_call',
        nodes: [
          { id: 'trigger', type: 'trigger', label: 'Inbound Call', config: { trigger: 'inbound_call' }, position: { x: 250, y: 0 } },
          { id: 'end', type: 'end_call', label: 'End Call', config: { message: 'Thank you for calling!' }, position: { x: 250, y: 200 } },
        ],
        edges: [
          { id: 'e1', source: 'trigger', target: 'end' },
        ],
      }),
    })
    if (res.ok) {
      const workflow = await res.json()
      router.push(`/workflows/${workflow.id}`)
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/workflows/${id}`, { method: 'DELETE' })
    setWorkflows((prev) => prev.filter((w) => w.id !== id))
  }

  async function handleToggleStatus(workflow: Workflow) {
    const newStatus = workflow.status === 'active' ? 'draft' : 'active'
    const res = await fetch(`/api/workflows/${workflow.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setWorkflows((prev) => prev.map((w) => w.id === workflow.id ? { ...w, status: newStatus } : w))
    }
  }

  // Group templates by industry
  const industries = Array.from(new Set(templates.map((t) => t.industry)))
  const filteredIndustries = filterIndustry === 'all' ? industries : industries.filter((i) => i === filterIndustry)

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Workflows</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-40 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-sm text-gray-500 mt-1">
            {templates.length} industry workflows available &middot; {workflows.length} deployed
          </p>
        </div>
        <button
          onClick={handleCreateBlank}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          + Blank Workflow
        </button>
      </div>

      {/* Active Workflows */}
      {workflows.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Deployed Workflows
            <span className="text-sm font-normal text-gray-500 ml-2">({workflows.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{industryEmojis[workflow.industry || ''] || '\uD83D\uDD27'}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{workflow.name}</h3>
                        {workflow.industry && (
                          <span className="text-xs text-gray-500 capitalize">{workflow.industry}</span>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={workflow.status} />
                  </div>

                  {workflow.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{workflow.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span>{triggerLabels[workflow.trigger] || workflow.trigger}</span>
                    <span>&middot;</span>
                    <span>{(workflow.nodes as unknown[]).length} steps</span>
                    <span>&middot;</span>
                    <span>{new Date(workflow.updatedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/workflows/${workflow.id}`)}
                      className="flex-1 bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(workflow)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                        workflow.status === 'active'
                          ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                          : 'border-green-200 text-green-700 hover:bg-green-50'
                      }`}
                    >
                      {workflow.status === 'active' ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(workflow.id)}
                      className="px-2 py-1.5 rounded-lg text-xs border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Industry Filter */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h2 className="text-lg font-semibold text-gray-900">Industry Workflows</h2>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterIndustry('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterIndustry === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({templates.length})
          </button>
          {industries.map((industry) => {
            const hasDeployed = workflows.some((w) => w.industry === industry)
            return (
              <button
                key={industry}
                onClick={() => setFilterIndustry(filterIndustry === industry ? 'all' : industry)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterIndustry === industry
                    ? 'bg-primary-600 text-white'
                    : hasDeployed
                      ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {industryEmojis[industry] || ''} {industry}
              </button>
            )
          })}
        </div>
      </div>

      {/* Industry Workflow Cards */}
      <div className="space-y-6">
        {filteredIndustries.map((industry) => {
          const industryTemplates = templates.filter((t) => t.industry === industry)
          const deployedWorkflows = workflows.filter((w) => w.industry === industry)
          const isDeployed = deployedWorkflows.length > 0

          return (
            <div
              key={industry}
              className={`rounded-xl border ${isDeployed ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'} overflow-hidden`}
            >
              <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{industryEmojis[industry] || '\uD83C\uDFE2'}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 capitalize">{industry}</h3>
                    <p className="text-xs text-gray-500">
                      {industryTemplates.length} workflow{industryTemplates.length !== 1 ? 's' : ''} available
                      {isDeployed && (
                        <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          {deployedWorkflows.length} deployed
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {industryTemplates.map((template) => {
                    const deployed = deployedWorkflows.find((w) => w.name === template.name)
                    return (
                      <div
                        key={template.id}
                        className={`rounded-lg border p-4 ${
                          deployed
                            ? 'border-green-200 bg-white'
                            : 'border-gray-200 bg-gray-50 hover:border-primary-200 hover:bg-primary-50/30'
                        } transition-colors`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 text-sm">{template.name}</h4>
                          {deployed ? (
                            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                              Deployed
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Template</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{template.description}</p>

                        {/* Workflow steps preview */}
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {(template.nodes as { type: string; label: string }[]).slice(0, 6).map((node, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                              >
                                {node.label}
                              </span>
                            ))}
                            {template.nodes.length > 6 && (
                              <span className="text-[10px] text-gray-400 px-1.5 py-0.5">
                                +{template.nodes.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {template.nodes.length} steps &middot; {template.edges.length} connections
                          </span>
                          {deployed ? (
                            <button
                              onClick={() => router.push(`/workflows/${deployed.id}`)}
                              className="text-xs font-medium text-primary-600 hover:text-primary-700"
                            >
                              Edit &rarr;
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCreateFromTemplate(template)}
                              disabled={deploying === template.id}
                              className="text-xs font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
                            >
                              {deploying === template.id ? 'Deploying...' : 'Deploy &rarr;'}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
