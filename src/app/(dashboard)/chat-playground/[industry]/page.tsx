'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ChatWindow, { ChatMessage } from '@/components/ui/ChatWindow'
import { getAllIndustries, getIndustryConfig, type IndustryConfig } from '@/lib/industry-config'
import { getIndustryEmoji } from '@/lib/industry-display'
import { getIndustryExamples } from '@/lib/industry-examples'

interface WorkflowSummary {
  id: string
  name: string
  industry: string | null
  status: string
  channels?: string[]
  nodes: { id: string; type: string; label: string }[]
  edges: { id: string; source: string; target: string }[]
}

// Map industry-config IDs to workflow.industry slugs (mirrors voice-agents page).
function workflowIndustrySlug(industryId: string): string {
  const map: Record<string, string> = {
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
  return map[industryId] || industryId
}

export default function ChatPlaygroundPage() {
  const router = useRouter()
  const params = useParams()
  const industryParam = decodeURIComponent((params.industry as string) || '').toLowerCase()

  const industry: IndustryConfig | undefined = useMemo(
    () => getIndustryConfig(industryParam),
    [industryParam]
  )

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [personality, setPersonality] = useState('Professional, helpful, and friendly')

  // Workflow state
  const [workflow, setWorkflow] = useState<WorkflowSummary | null>(null)
  const [useWorkflow, setUseWorkflow] = useState(true)
  const [executionId, setExecutionId] = useState<string | null>(null)
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null)
  const [collectedInfo, setCollectedInfo] = useState<Record<string, string>>({})
  const [isComplete, setIsComplete] = useState(false)
  const [isEscalated, setIsEscalated] = useState(false)

  // Save dialog
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [visitorName, setVisitorName] = useState('')
  const [visitorEmail, setVisitorEmail] = useState('')
  const [visitorPhone, setVisitorPhone] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savedConversationId, setSavedConversationId] = useState<string | null>(null)

  // Seed greeting on first load + fetch industry workflow
  useEffect(() => {
    if (!industry) return
    setMessages([
      {
        role: 'assistant',
        content: industry.defaultGreeting,
        timestamp: Date.now(),
      },
    ])

    const targetSlug = workflowIndustrySlug(industry.id)
    fetch('/api/workflows')
      .then(r => (r.ok ? r.json() : []))
      .then((all: WorkflowSummary[]) => {
        const match = (all || []).find(
          w => w.industry === targetSlug && w.status === 'active'
        )
        setWorkflow(match || null)
      })
      .catch(() => setWorkflow(null))
  }, [industry])

  if (!industry) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <p className="font-medium">Unknown industry: {industryParam}</p>
          <p className="text-sm mt-1">Pick one of the supported industries below.</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {getAllIndustries().map((i) => (
              <button
                key={i.id}
                onClick={() => router.push(`/chat-playground/${encodeURIComponent(i.id)}`)}
                className="px-3 py-1 rounded-full bg-white border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              >
                {getIndustryEmoji(i.id)} {i.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const emoji = getIndustryEmoji(industry.id)
  const workflowActive = useWorkflow && !!workflow && !isComplete && !isEscalated
  const examples = getIndustryExamples(industry.id)

  const handleSend = async (text: string) => {
    setError(null)
    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }
    const nextHistory = [...messages, userMessage]
    setMessages(nextHistory)
    setIsSending(true)

    try {
      const body: Record<string, unknown> = {
        industry: industry.id,
        message: text,
        personality,
        conversationHistory: nextHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }
      if (workflowActive) {
        body.workflowId = workflow!.id
        if (executionId) body.executionId = executionId
      }

      const res = await fetch('/api/ai/chat-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get response')

      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: data.result,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, aiMessage])

      if (data.executionId) setExecutionId(data.executionId)
      if (data.currentNodeId) setCurrentNodeId(data.currentNodeId)
      if (data.collectedInfo) setCollectedInfo(data.collectedInfo)
      if (data.isComplete) setIsComplete(true)
      if (data.isEscalated) setIsEscalated(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setIsSending(false)
    }
  }

  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content: industry.defaultGreeting,
        timestamp: Date.now(),
      },
    ])
    setSavedConversationId(null)
    setExecutionId(null)
    setCurrentNodeId(null)
    setCollectedInfo({})
    setIsComplete(false)
    setIsEscalated(false)
    setError(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/chat-playground/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: industry.id,
          transcript: messages,
          visitorName: visitorName.trim() || undefined,
          visitorEmail: visitorEmail.trim() || undefined,
          visitorPhone: visitorPhone.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save conversation')

      setSavedConversationId(data.id)
      setShowSaveDialog(false)
    } catch (err: any) {
      setError(err.message || 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  const userTurnCount = messages.filter((m) => m.role === 'user').length
  const collectedEntries = Object.entries(collectedInfo).filter(([, v]) => v)
  const currentNode = workflow?.nodes.find(n => n.id === currentNodeId)
  const currentNodeIndex = workflow?.nodes.findIndex(n => n.id === currentNodeId) ?? -1

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{emoji}</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{industry.name} Chat Assistant</h1>
            <p className="text-sm text-gray-500">
              Industry-specific chat playground using the same prompts and workflows that power voice calls.
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push('/chat-agents')}
          className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Chat Agents
        </button>
      </div>

      {/* Workflow status banner */}
      {workflow && (
        <div className={`mb-4 rounded-xl border p-4 ${useWorkflow ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`w-2 h-2 rounded-full ${useWorkflow ? 'bg-green-500' : 'bg-gray-400'}`} />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {useWorkflow ? 'Workflow active' : 'Workflow available'}: {workflow.name}
                </div>
                <div className="text-xs text-gray-500">
                  {workflow.nodes.length} steps · {workflow.edges.length} connections
                  {currentNode && useWorkflow && (
                    <span className="ml-2">
                      · current step: <span className="font-medium text-gray-700">{currentNode.label}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => router.push(`/workflows/${workflow.id}`)}
                className="text-xs text-gray-600 hover:text-gray-900 underline"
              >
                Edit workflow
              </button>
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useWorkflow}
                  onChange={(e) => {
                    setUseWorkflow(e.target.checked)
                    if (!e.target.checked) {
                      // Switching to free chat — clear workflow runtime state
                      setExecutionId(null)
                      setCurrentNodeId(null)
                      setCollectedInfo({})
                    }
                  }}
                  className="w-3.5 h-3.5"
                />
                Use workflow
              </label>
            </div>
          </div>

          {/* Step strip */}
          {useWorkflow && workflow.nodes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {workflow.nodes.map((n, i) => {
                const isCurrent = n.id === currentNodeId
                const isPast = currentNodeIndex >= 0 && i < currentNodeIndex
                return (
                  <span
                    key={n.id}
                    className={`text-xs px-2 py-0.5 rounded border ${
                      isCurrent
                        ? 'bg-primary-600 text-white border-primary-600'
                        : isPast
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-white text-gray-500 border-gray-200'
                    }`}
                    title={n.type}
                  >
                    {n.label}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}

      {!workflow && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
          No active workflow found for this industry. Falling back to prompt-only chat.{' '}
          <button
            onClick={() => router.push('/workflows')}
            className="underline text-gray-700 hover:text-gray-900"
          >
            Create one
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: chat */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 ml-2">
                &times;
              </button>
            </div>
          )}

          {isEscalated && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-orange-800 text-sm">
              This conversation has been escalated. A human agent will follow up.
            </div>
          )}

          {isComplete && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800 text-sm">
              Workflow completed. Click <span className="font-medium">Reset</span> to start a new session.
            </div>
          )}

          {savedConversationId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-sm flex items-center justify-between">
              <span>
                Conversation saved.{' '}
                <button
                  onClick={() => router.push(`/conversations/${savedConversationId}`)}
                  className="underline font-medium hover:text-green-900"
                >
                  View it in Conversations →
                </button>
              </span>
              <button
                onClick={() => setSavedConversationId(null)}
                className="text-green-600 hover:text-green-800 ml-2"
              >
                &times;
              </button>
            </div>
          )}

          {examples.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Try an example
                </span>
                <span className="text-xs text-gray-400">
                  Click to send instantly
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {examples.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(ex.message)}
                    disabled={isSending || isComplete}
                    title={ex.message}
                    className="text-xs px-2.5 py-1.5 rounded-full border border-gray-300 bg-gray-50 text-gray-700 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {ex.emoji && <span className="mr-1">{ex.emoji}</span>}
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <ChatWindow
            messages={messages}
            onSend={handleSend}
            isSending={isSending}
            isDisabled={isComplete}
            placeholder={isComplete ? 'Conversation ended. Reset to start a new one.' : 'Type a question — try scheduling, pricing, or an emergency scenario…'}
            agentLabel={industry.name}
            userLabel="You"
            minHeight="600px"
          />

          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-gray-500">
              {userTurnCount} message{userTurnCount === 1 ? '' : 's'} sent
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                onClick={() => setShowSaveDialog(true)}
                disabled={userTurnCount === 0}
                className="text-sm px-3 py-1.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Conversation
              </button>
            </div>
          </div>
        </div>

        {/* Right: configuration + context */}
        <div className="space-y-4">
          {workflowActive && collectedEntries.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Collected so far</h2>
              <ul className="space-y-1.5">
                {collectedEntries.map(([k, v]) => (
                  <li key={k} className="flex items-start gap-2 text-sm">
                    <span className="text-xs uppercase tracking-wide text-gray-400 mt-0.5 min-w-[80px]">
                      {k.replace(/_/g, ' ')}
                    </span>
                    <span className="text-gray-800 flex-1 break-words">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Personality</h2>
            <textarea
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">
              Layered onto the industry system prompt. Edit anytime.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Conversation Goals</h2>
            <ul className="space-y-1.5">
              {industry.conversationGoals.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-primary-500 mt-0.5">•</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>

          {industry.escalationTriggers.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Escalation Triggers</h2>
              <div className="flex flex-wrap gap-1.5">
                {industry.escalationTriggers.map((t, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {industry.complianceNotes.length > 0 && (
            <details className="bg-white rounded-xl shadow-sm border border-gray-200">
              <summary className="p-4 cursor-pointer text-sm font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                {industry.complianceNotes.length} Compliance Notes
              </summary>
              <div className="px-4 pb-4 space-y-2">
                {industry.complianceNotes.map((note, i) => (
                  <div
                    key={i}
                    className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-2.5"
                  >
                    {note}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Save Conversation</h3>
            <p className="text-sm text-gray-500 mb-4">
              Optional — add visitor info to associate this transcript with a real
              contact. Leave blank to save as an anonymous playground session.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Visitor name</label>
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                  placeholder="+1 555-555-1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowSaveDialog(false)}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
