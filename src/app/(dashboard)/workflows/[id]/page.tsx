'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { NODE_TYPE_CONFIG } from '@/lib/workflow-engine'
import type { WorkflowNode, WorkflowEdge, NodeType } from '@/lib/workflow-engine'

interface Workflow {
  id: string
  name: string
  description: string | null
  trigger: string
  industry: string | null
  status: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export default function WorkflowEditorPage() {
  const params = useParams()
  const router = useRouter()
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [showAddNode, setShowAddNode] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/workflows/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setWorkflow(data)
        setNameValue(data.name)
      }
      setLoading(false)
    }
    load()
  }, [params.id])

  const handleSave = useCallback(async () => {
    if (!workflow) return
    setSaving(true)
    try {
      const res = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameValue,
          nodes: workflow.nodes,
          edges: workflow.edges,
          trigger: workflow.trigger,
          industry: workflow.industry,
          description: workflow.description,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }, [workflow, nameValue])

  function addNode(type: NodeType) {
    if (!workflow) return
    const config = NODE_TYPE_CONFIG[type]
    const id = `node_${Date.now()}`
    const maxY = Math.max(...workflow.nodes.map((n) => n.position.y), 0)
    const newNode: WorkflowNode = {
      id,
      type,
      label: config.label,
      config: getDefaultConfig(type),
      position: { x: 250, y: maxY + 120 },
    }

    // Find the last node before end_call, insert new node before it
    const endNode = workflow.nodes.find((n) => n.type === 'end_call')
    const updatedNodes = [...workflow.nodes, newNode]

    // Auto-connect: find the edge going to end_call and reroute
    let updatedEdges = [...workflow.edges]
    if (endNode) {
      const edgeToEnd = updatedEdges.find((e) => e.target === endNode.id && !e.condition)
      if (edgeToEnd) {
        // Reroute: previous -> new node -> end
        edgeToEnd.target = id
        updatedEdges.push({
          id: `edge_${Date.now()}`,
          source: id,
          target: endNode.id,
        })
      } else {
        // Just add edge from new node to end
        updatedEdges.push({
          id: `edge_${Date.now()}`,
          source: id,
          target: endNode.id,
        })
      }
    }

    setWorkflow({ ...workflow, nodes: updatedNodes, edges: updatedEdges })
    setSelectedNode(id)
    setShowAddNode(false)
  }

  function removeNode(nodeId: string) {
    if (!workflow) return
    const node = workflow.nodes.find((n) => n.id === nodeId)
    if (!node || node.type === 'trigger') return

    const incomingEdges = workflow.edges.filter((e) => e.target === nodeId)
    const outgoingEdges = workflow.edges.filter((e) => e.source === nodeId)
    const otherEdges = workflow.edges.filter((e) => e.source !== nodeId && e.target !== nodeId)

    // Reconnect: incoming sources → outgoing targets
    const newEdges = [...otherEdges]
    if (incomingEdges.length > 0 && outgoingEdges.length > 0) {
      for (const incoming of incomingEdges) {
        newEdges.push({
          id: `edge_${Date.now()}_${Math.random()}`,
          source: incoming.source,
          target: outgoingEdges[0].target,
          condition: incoming.condition,
          label: incoming.label,
        })
      }
    }

    setWorkflow({
      ...workflow,
      nodes: workflow.nodes.filter((n) => n.id !== nodeId),
      edges: newEdges,
    })
    setSelectedNode(null)
  }

  function updateNodeConfig(nodeId: string, key: string, value: unknown) {
    if (!workflow) return
    setWorkflow({
      ...workflow,
      nodes: workflow.nodes.map((n) =>
        n.id === nodeId ? { ...n, config: { ...n.config, [key]: value } } : n
      ),
    })
  }

  function updateNodeLabel(nodeId: string, label: string) {
    if (!workflow) return
    setWorkflow({
      ...workflow,
      nodes: workflow.nodes.map((n) =>
        n.id === nodeId ? { ...n, label } : n
      ),
    })
  }

  function addEdge(sourceId: string, targetId: string, condition?: string, label?: string) {
    if (!workflow) return
    setWorkflow({
      ...workflow,
      edges: [...workflow.edges, {
        id: `edge_${Date.now()}`,
        source: sourceId,
        target: targetId,
        condition,
        label,
      }],
    })
  }

  function removeEdge(edgeId: string) {
    if (!workflow) return
    setWorkflow({
      ...workflow,
      edges: workflow.edges.filter((e) => e.id !== edgeId),
    })
  }

  const selectedNodeData = workflow?.nodes.find((n) => n.id === selectedNode)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-400">Loading workflow...</div>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Workflow not found</p>
        <button onClick={() => router.push('/workflows')} className="text-primary-600 mt-2">Back to Workflows</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/workflows')} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {editingName ? (
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
              className="text-lg font-semibold text-gray-900 border-b-2 border-primary-500 outline-none px-1"
              autoFocus
            />
          ) : (
            <h2
              className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-primary-600"
              onClick={() => setEditingName(true)}
            >
              {nameValue}
            </h2>
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            workflow.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {workflow.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600">Saved!</span>}
          <button
            onClick={() => setShowAddNode(!showAddNode)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + Add Step
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 bg-gray-50 overflow-auto p-8">
          {/* Add Node Palette */}
          {showAddNode && (
            <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Add a Step</h3>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {(Object.entries(NODE_TYPE_CONFIG) as [NodeType, typeof NODE_TYPE_CONFIG[NodeType]][]).map(([type, config]) => {
                  if (type === 'trigger') return null
                  return (
                    <button
                      key={type}
                      onClick={() => addNode(type)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: config.color + '20' }}>
                        <svg className="w-4 h-4" style={{ color: config.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-gray-700 text-center leading-tight">{config.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Flow Visualization */}
          <div className="max-w-2xl mx-auto space-y-3">
            {workflow.nodes
              .sort((a, b) => a.position.y - b.position.y)
              .map((node, index) => {
                const config = NODE_TYPE_CONFIG[node.type]
                const isSelected = selectedNode === node.id
                const outgoingEdges = workflow.edges.filter((e) => e.source === node.id)

                return (
                  <div key={node.id}>
                    {/* Node */}
                    <div
                      className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary-500 shadow-lg ring-2 ring-primary-100'
                          : 'border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md'
                      }`}
                      onClick={() => setSelectedNode(isSelected ? null : node.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: config.color + '20' }}
                        >
                          <svg className="w-5 h-5" style={{ color: config.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: config.color + '15', color: config.color }}>
                              {config.label}
                            </span>
                            <span className="text-xs text-gray-400">#{index + 1}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">{node.label}</p>
                          {node.config.message ? (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{String(node.config.message).slice(0, 80)}</p>
                          ) : null}
                          {node.config.prompt ? (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{String(node.config.prompt).slice(0, 80)}</p>
                          ) : null}
                        </div>
                        {node.type !== 'trigger' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removeNode(node.id) }}
                            className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Edge arrows */}
                    {outgoingEdges.length > 0 && (
                      <div className="flex justify-center py-1">
                        {outgoingEdges.length === 1 ? (
                          <div className="flex flex-col items-center">
                            <div className="w-0.5 h-4 bg-gray-300" />
                            <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 12 12">
                              <path d="M6 9L1 4h10L6 9z" />
                            </svg>
                          </div>
                        ) : (
                          <div className="flex gap-6 items-start">
                            {outgoingEdges.map((edge) => (
                              <div key={edge.id} className="flex flex-col items-center">
                                <div className="w-0.5 h-3 bg-gray-300" />
                                {edge.label && (
                                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                    {edge.label}
                                  </span>
                                )}
                                <div className="w-0.5 h-2 bg-gray-300" />
                                <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 12 12">
                                  <path d="M6 9L1 4h10L6 9z" />
                                </svg>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>

        {/* Properties Panel */}
        {selectedNodeData && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto shrink-0">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Properties</h3>
                <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{NODE_TYPE_CONFIG[selectedNodeData.type].description}</p>
            </div>
            <div className="p-4 space-y-4">
              {/* Label */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                <input
                  type="text"
                  value={selectedNodeData.label}
                  onChange={(e) => updateNodeLabel(selectedNodeData.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Type-specific config */}
              {(selectedNodeData.type === 'play_message' || selectedNodeData.type === 'end_call') && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Message</label>
                  <textarea
                    value={String(selectedNodeData.config.message || '')}
                    onChange={(e) => updateNodeConfig(selectedNodeData.id, 'message', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={4}
                    placeholder="Message to play..."
                  />
                  <p className="text-xs text-gray-400 mt-1">Use {'{{variable}}'} for dynamic values</p>
                </div>
              )}

              {(selectedNodeData.type === 'ai_response') && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">AI Prompt</label>
                    <textarea
                      value={String(selectedNodeData.config.prompt || '')}
                      onChange={(e) => updateNodeConfig(selectedNodeData.id, 'prompt', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={5}
                      placeholder="Instructions for the AI..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Set Variable (optional)</label>
                    <input
                      type="text"
                      value={String(selectedNodeData.config.setVariable || '')}
                      onChange={(e) => updateNodeConfig(selectedNodeData.id, 'setVariable', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., caller_intent"
                    />
                  </div>
                </>
              )}

              {selectedNodeData.type === 'collect_info' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Question / Prompt</label>
                    <textarea
                      value={String(selectedNodeData.config.prompt || '')}
                      onChange={(e) => updateNodeConfig(selectedNodeData.id, 'prompt', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={4}
                      placeholder="What to ask the caller..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fields to Collect (comma-separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(selectedNodeData.config.fields) ? (selectedNodeData.config.fields as string[]).join(', ') : ''}
                      onChange={(e) => updateNodeConfig(selectedNodeData.id, 'fields', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="name, phone, date"
                    />
                  </div>
                </>
              )}

              {selectedNodeData.type === 'condition' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Variable</label>
                    <input
                      type="text"
                      value={String(selectedNodeData.config.variable || '')}
                      onChange={(e) => updateNodeConfig(selectedNodeData.id, 'variable', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., caller_intent"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Conditions are set on edges (connections). Each outgoing connection can have a condition like &quot;variable = value&quot;.</p>
                  </div>
                </>
              )}

              {selectedNodeData.type === 'send_sms' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">SMS Message</label>
                  <textarea
                    value={String(selectedNodeData.config.message || '')}
                    onChange={(e) => updateNodeConfig(selectedNodeData.id, 'message', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    placeholder="SMS message to send..."
                  />
                </div>
              )}

              {selectedNodeData.type === 'transfer_call' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Transfer Message</label>
                  <textarea
                    value={String(selectedNodeData.config.message || '')}
                    onChange={(e) => updateNodeConfig(selectedNodeData.id, 'message', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={2}
                    placeholder="Message before transfer..."
                  />
                </div>
              )}

              {selectedNodeData.type === 'escalate' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Escalation Message</label>
                    <textarea
                      value={String(selectedNodeData.config.message || '')}
                      onChange={(e) => updateNodeConfig(selectedNodeData.id, 'message', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                    <select
                      value={String(selectedNodeData.config.priority || 'normal')}
                      onChange={(e) => updateNodeConfig(selectedNodeData.id, 'priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </>
              )}

              {selectedNodeData.type === 'book_appointment' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Appointment Type</label>
                    <input
                      type="text"
                      value={String(selectedNodeData.config.type || '')}
                      onChange={(e) => updateNodeConfig(selectedNodeData.id, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., Cleaning, Checkup"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                    <input
                      type="text"
                      value={String(selectedNodeData.config.notes || '')}
                      onChange={(e) => updateNodeConfig(selectedNodeData.id, 'notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {selectedNodeData.type === 'webhook' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Webhook URL</label>
                    <input
                      type="url"
                      value={String(selectedNodeData.config.url || '')}
                      onChange={(e) => updateNodeConfig(selectedNodeData.id, 'url', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Method</label>
                    <select
                      value={String(selectedNodeData.config.method || 'POST')}
                      onChange={(e) => updateNodeConfig(selectedNodeData.id, 'method', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                    </select>
                  </div>
                </>
              )}

              {/* Edges / Connections */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Connections</h4>
                {workflow.edges.filter((e) => e.source === selectedNodeData.id).map((edge) => {
                  const targetNode = workflow.nodes.find((n) => n.id === edge.target)
                  return (
                    <div key={edge.id} className="flex items-center gap-2 py-1.5">
                      <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span className="text-xs text-gray-600 flex-1 truncate">{targetNode?.label || edge.target}</span>
                      {edge.condition && (
                        <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">if: {edge.condition}</span>
                      )}
                      <button onClick={() => removeEdge(edge.id)} className="text-gray-300 hover:text-red-500">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function getDefaultConfig(type: NodeType): Record<string, unknown> {
  switch (type) {
    case 'play_message': return { message: '' }
    case 'ai_response': return { prompt: '', setVariable: '' }
    case 'collect_info': return { fields: [], prompt: '' }
    case 'condition': return { variable: '', operator: '=', value: '' }
    case 'send_sms': return { message: '' }
    case 'send_email': return { subject: '', body: '' }
    case 'transfer_call': return { message: '', transferNumber: '' }
    case 'escalate': return { message: '', priority: 'normal' }
    case 'book_appointment': return { type: '', notes: '' }
    case 'check_calendar': return { calendarId: '' }
    case 'create_contact': return { source: 'workflow', tags: [] }
    case 'lookup_contact': return { lookupBy: 'phone' }
    case 'set_variable': return { variable: '', value: '' }
    case 'webhook': return { url: '', method: 'POST', headers: {} }
    case 'end_call': return { message: 'Thank you for calling!' }
    default: return {}
  }
}
