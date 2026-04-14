'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import StatusBadge from '@/components/ui/StatusBadge'
import AIResponseDisplay from '@/components/ui/AIResponseDisplay'

const INDUSTRIES = [
  'Dentistry',
  'Restaurants',
  'Health Clinics',
  'Real Estate',
  'Car Dealerships',
  'Hospitality',
  'Debt Collection',
]

const CHANNELS = ['Website', 'WhatsApp', 'Facebook', 'Instagram']

const inputClass =
  'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'

interface ChatAgent {
  id: string
  name: string
  welcomeMessage: string
  personality: string
  industry: string
  responseTime: string
  channels: string[]
  status: string
}

export default function ChatAgentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [agent, setAgent] = useState<ChatAgent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<ChatAgent | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [testInput, setTestInput] = useState('')
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    async function fetchAgent() {
      try {
        const res = await fetch(`/api/chat-agents/${id}`)
        if (!res.ok) throw new Error('Failed to fetch chat agent')
        const data = await res.json()
        setAgent(data)
        setForm(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchAgent()
  }, [id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (!form) return
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleChannelToggle = (channel: string) => {
    if (!form) return
    setForm({
      ...form,
      channels: form.channels.includes(channel)
        ? form.channels.filter((c) => c !== channel)
        : [...form.channels, channel],
    })
  }

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      const res = await fetch(`/api/chat-agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to update chat agent')
      const updated = await res.json()
      setAgent(updated)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/chat-agents/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete chat agent')
      router.push('/chat-agents')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
      setDeleting(false)
    }
  }

  const handleTestChat = async () => {
    if (!testInput.trim()) return
    setAiLoading(true)
    setAiResponse(null)
    try {
      const res = await fetch('/api/ai/chat-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: `Chat agent: ${agent?.name}, Industry: ${agent?.industry}`,
          message: testInput,
          personality: agent?.personality || 'Professional',
        }),
      })
      if (!res.ok) throw new Error('Failed to get AI response')
      const data = await res.json()
      setAiResponse(data.result)
    } catch {
      setError('Failed to get AI response')
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-100 rounded w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && !agent) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <p className="font-medium">Error</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  if (!agent || !form) return null

  return (
    <div className="max-w-3xl mx-auto">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
            <StatusBadge status={agent.status} />
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setForm(agent)
                    setEditing(false)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {editing ? (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
              <textarea name="welcomeMessage" value={form.welcomeMessage} onChange={handleChange} rows={3} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personality</label>
              <input type="text" name="personality" value={form.personality} onChange={handleChange} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select name="industry" value={form.industry} onChange={handleChange} className={inputClass}>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Response Time</label>
                <input type="text" name="responseTime" value={form.responseTime} onChange={handleChange} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Channels</label>
              <div className="grid grid-cols-2 gap-3">
                {CHANNELS.map((channel) => (
                  <label
                    key={channel}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      form.channels.includes(channel)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.channels.includes(channel)}
                      onChange={() => handleChannelToggle(channel)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{channel}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Personality</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{agent.personality}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Industry</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{agent.industry}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Response Time</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{agent.responseTime || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Channels</p>
              <div className="flex flex-wrap gap-1.5 mt-0.5">
                {agent.channels && agent.channels.length > 0 ? (
                  agent.channels.map((ch) => (
                    <span key={ch} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {ch}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">None</span>
                )}
              </div>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-500">Welcome Message</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{agent.welcomeMessage || 'Not set'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Test Chat Response Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Chat Response</h2>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Type a message to test the chat agent..."
            className={`flex-1 ${inputClass}`}
            onKeyDown={(e) => e.key === 'Enter' && handleTestChat()}
          />
          <button
            onClick={handleTestChat}
            disabled={aiLoading || !testInput.trim()}
            className="bg-primary-600 text-white px-5 py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 whitespace-nowrap"
          >
            {aiLoading ? 'Testing...' : 'Test'}
          </button>
        </div>
        <AIResponseDisplay response={aiResponse} loading={aiLoading} title="AI Chat Response" />
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Chat Agent"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{agent.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={() => setDeleteModalOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
