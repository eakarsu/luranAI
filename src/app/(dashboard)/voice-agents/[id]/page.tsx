'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import StatusBadge from '@/components/ui/StatusBadge'
import { getIndustryConfig, type IndustryConfig } from '@/lib/industry-config'

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

interface WorkflowNode {
  id: string
  type: string
  label: string
  config: Record<string, unknown>
}

interface WorkflowData {
  id: string
  name: string
  description: string
  status: string
  nodes: WorkflowNode[]
  edges: { id: string; source: string; target: string; label?: string }[]
}

interface VoiceAgent {
  id: string
  name: string
  language: string
  voice: string
  greeting: string
  industry: string
  systemPrompt: string
  workflowId: string | null
}

interface TranscriptEntry {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export default function VoiceAgentDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [agent, setAgent] = useState<VoiceAgent | null>(null)
  const [industry, setIndustry] = useState<IndustryConfig | null>(null)
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null)
  const [loading, setLoading] = useState(true)

  const [agentName, setAgentName] = useState('')
  const [customGreeting, setCustomGreeting] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [provider, setProvider] = useState<'twilio' | 'vapi' | 'bland'>('twilio')
  const [callSid, setCallSid] = useState<string | null>(null)
  const [callStatus, setCallStatus] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  // Fetch agent from DB
  useEffect(() => {
    async function fetchAgent() {
      try {
        const res = await fetch(`/api/voice-agents/${id}`)
        if (!res.ok) throw new Error('Failed to fetch voice agent')
        const data = await res.json()
        setAgent(data)
        setAgentName(data.name)
        setCustomGreeting(data.greeting || '')
        const config = getIndustryConfig(data.industry)
        setIndustry(config || null)
        // Fetch linked workflow
        if (data.workflowId) {
          try {
            const wfRes = await fetch(`/api/workflows/${data.workflowId}`)
            if (wfRes.ok) {
              const wfData = await wfRes.json()
              setWorkflow(wfData)
            }
          } catch {}
        }
      } catch {
        setError('Voice agent not found')
      } finally {
        setLoading(false)
      }
    }
    fetchAgent()
  }, [id])

  // Poll for call status
  useEffect(() => {
    if (!callSid) return

    const poll = async () => {
      try {
        const res = await fetch(`/api/voice/call/status/${callSid}`)
        const data = await res.json()
        setCallStatus(data.status)
        setTranscript(data.transcript || [])
        if (['completed', 'failed', 'busy', 'no-answer'].includes(data.status)) {
          stopPolling()
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }

    poll()
    pollRef.current = setInterval(poll, 2000)
    return () => stopPolling()
  }, [callSid, stopPolling])

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  const handleMakeCall = async () => {
    if (!phoneNumber.trim() || !agent) {
      setError('Please enter a phone number')
      return
    }

    setIsLoading(true)
    setError(null)
    setTranscript([])
    setCallStatus(null)

    try {
      const res = await fetch('/api/voice/call/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          phoneNumber: phoneNumber.trim(),
          agentName: agentName !== agent.name ? agentName : undefined,
          customGreeting: customGreeting !== (agent.greeting || '') ? customGreeting : undefined,
          provider,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to initiate call')

      setCallSid(data.callSid)
      setCallStatus(data.status)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const [isEnding, setIsEnding] = useState(false)

  const handleEndCall = async () => {
    if (!callSid) return
    setIsEnding(true)
    stopPolling()
    try {
      const res = await fetch('/api/voice/call/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callSid }),
      })
      const data = await res.json()
      if (data.transcript?.length) {
        setTranscript(data.transcript)
      }
    } catch {}
    setCallStatus('completed')
    setIsEnding(false)
  }

  const isCallActive = callStatus === 'initiating' || callStatus === 'ringing' || callStatus === 'in-progress'

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-100 rounded w-1/2 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-100 rounded-xl" />
            <div className="h-96 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!agent || !industry) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          Voice agent not found.
        </div>
      </div>
    )
  }

  const emoji = INDUSTRY_EMOJIS[industry.id] || '\u{1F4BC}'

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">{emoji}</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{industry.name} Voice Agent</h1>
          <p className="text-sm text-gray-500">AI-powered outbound calling with industry-specific conversation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Configuration & Call */}
        <div className="space-y-6">
          {/* Agent Configuration */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Agent Configuration</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder={`${industry.name} Assistant`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom Greeting</label>
              <textarea
                value={customGreeting}
                onChange={(e) => setCustomGreeting(e.target.value)}
                placeholder={industry.defaultGreeting}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {workflow && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium text-green-800">{workflow.name}</span>
                  </div>
                  <button
                    onClick={() => window.location.href = `/workflows/${workflow.id}`}
                    className="text-xs text-green-700 hover:text-green-900 font-medium underline"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-xs text-green-600 mt-1">{workflow.nodes.length} steps &middot; {workflow.edges.length} connections &middot; Handles all intents automatically</p>
              </div>
            )}
          </div>

          {/* Make Call */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Make Call
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm flex items-center justify-between">
                {error}
                <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 ml-2">&times;</button>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Call Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as 'twilio' | 'vapi' | 'bland')}
                disabled={isCallActive}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isCallActive ? 'bg-gray-100' : 'bg-white'}`}
              >
                <option value="twilio">Twilio (Default)</option>
                <option value="vapi">Vapi.ai</option>
                <option value="bland">Bland.ai</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                disabled={isCallActive}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isCallActive ? 'bg-gray-100' : ''}`}
              />
            </div>

            <button
              onClick={handleMakeCall}
              disabled={isLoading || isCallActive || !phoneNumber.trim()}
              className={`w-full py-3 rounded-lg font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                isCallActive ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Initiating...
                </>
              ) : isCallActive ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                  </span>
                  Call In Progress
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Make Call
                </>
              )}
            </button>

            {(isCallActive || isEnding) && (
              <button
                onClick={handleEndCall}
                disabled={isEnding}
                className="w-full mt-3 py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 transition-colors flex items-center justify-center gap-2"
              >
                {isEnding ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Ending Call &amp; Fetching Transcript...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    End Call
                  </>
                )}
              </button>
            )}

            {callStatus && (
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-gray-500">Status:</span>
                <StatusBadge status={callStatus} />
                {callSid && (
                  <span className="text-xs text-gray-400 ml-auto font-mono">{callSid.slice(0, 12)}...</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Live Transcript */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full min-h-[500px] flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              Live Transcript
              {isCallActive && (
                <svg className="animate-spin w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </h2>

            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-y-auto min-h-[400px]">
              {transcript.length === 0 ? (
                <p className="text-gray-400 text-sm text-center mt-16">
                  {callSid ? 'Waiting for conversation...' : 'Start a call to see the live transcript'}
                </p>
              ) : (
                <div className="space-y-4">
                  {transcript.map((entry, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${entry.role === 'assistant' ? 'items-start' : 'items-end'}`}
                    >
                      <span className={`text-xs font-semibold mb-1 px-2 py-0.5 rounded-full ${
                        entry.role === 'assistant'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {entry.role === 'assistant' ? 'AI' : 'Caller'}
                      </span>
                      <div className={`rounded-lg px-3 py-2 max-w-[85%] text-sm ${
                        entry.role === 'assistant'
                          ? 'bg-primary-50 border border-primary-200 text-gray-800'
                          : 'bg-white border border-gray-300 text-gray-800'
                      }`}>
                        {entry.content}
                      </div>
                      <span className="text-xs text-gray-400 mt-0.5">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      {i < transcript.length - 1 && (
                        <div className="w-full border-t border-gray-100 my-2" />
                      )}
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Workflow */}
      {workflow && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Linked Workflow
            </h2>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                workflow.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${workflow.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                {workflow.status}
              </span>
              <button
                onClick={() => window.location.href = `/workflows/${workflow.id}`}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Edit Workflow
              </button>
            </div>
          </div>
          <div className="mb-3">
            <h3 className="font-medium text-gray-900">{workflow.name}</h3>
            <p className="text-sm text-gray-500">{workflow.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {workflow.nodes.map((node, i) => {
              const typeColors: Record<string, string> = {
                trigger: 'bg-blue-50 border-blue-200 text-blue-700',
                play_message: 'bg-purple-50 border-purple-200 text-purple-700',
                ai_response: 'bg-indigo-50 border-indigo-200 text-indigo-700',
                collect_info: 'bg-cyan-50 border-cyan-200 text-cyan-700',
                condition: 'bg-amber-50 border-amber-200 text-amber-700',
                book_appointment: 'bg-green-50 border-green-200 text-green-700',
                send_sms: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                create_contact: 'bg-sky-50 border-sky-200 text-sky-700',
                escalate: 'bg-red-50 border-red-200 text-red-700',
                end_call: 'bg-gray-50 border-gray-200 text-gray-600',
                lookup_contact: 'bg-teal-50 border-teal-200 text-teal-700',
                transfer_call: 'bg-orange-50 border-orange-200 text-orange-700',
              }
              const color = typeColors[node.type] || 'bg-gray-50 border-gray-200 text-gray-600'
              return (
                <div key={node.id} className="flex items-center gap-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded border text-xs font-medium ${color}`}>
                    {node.label}
                  </span>
                  {i < workflow.nodes.length - 1 && (
                    <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3">{workflow.nodes.length} steps, {workflow.edges.length} connections</p>
        </div>
      )}

      {/* Compliance Notes - collapsed */}
      {industry.complianceNotes.length > 0 && (
        <details className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6">
          <summary className="p-4 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {industry.complianceNotes.length} Compliance Notes
          </summary>
          <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {industry.complianceNotes.map((note, i) => (
              <div key={i} className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                <p className="text-xs text-blue-700">{note}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
