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

const inputClass =
  'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'

interface EmailAgent {
  id: string
  name: string
  emailAddress: string
  signature: string
  confidenceThreshold: number
  industry: string
  status: string
}

export default function EmailAgentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [agent, setAgent] = useState<EmailAgent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<EmailAgent | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [draftPrompt, setDraftPrompt] = useState('')
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    async function fetchAgent() {
      try {
        const res = await fetch(`/api/email-agents/${id}`)
        if (!res.ok) throw new Error('Failed to fetch email agent')
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
    setForm({
      ...form,
      [name]: name === 'confidenceThreshold' ? parseFloat(value) : value,
    })
  }

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      const res = await fetch(`/api/email-agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to update email agent')
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
      const res = await fetch(`/api/email-agents/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete email agent')
      router.push('/email-agents')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
      setDeleting(false)
    }
  }

  const handleGenerateDraft = async () => {
    if (!draftPrompt.trim()) return
    setAiLoading(true)
    setAiResponse(null)
    try {
      const res = await fetch('/api/ai/email-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: `Email agent: ${agent?.name}, Industry: ${agent?.industry}. ${draftPrompt}`,
          subject: draftPrompt,
          tone: 'professional',
        }),
      })
      if (!res.ok) throw new Error('Failed to generate email draft')
      const data = await res.json()
      setAiResponse(data.result)
    } catch {
      setError('Failed to generate email draft')
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" name="emailAddress" value={form.emailAddress} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <select name="industry" value={form.industry} onChange={handleChange} className={inputClass}>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
              <textarea name="signature" value={form.signature} onChange={handleChange} rows={4} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confidence Threshold: {(form.confidenceThreshold * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                name="confidenceThreshold"
                value={form.confidenceThreshold}
                onChange={handleChange}
                min={0}
                max={1}
                step={0.1}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Email Address</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{agent.emailAddress}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Industry</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{agent.industry}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Confidence Threshold</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full"
                    style={{ width: `${agent.confidenceThreshold * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {(agent.confidenceThreshold * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-500">Signature</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5 whitespace-pre-wrap">{agent.signature || 'Not set'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Generate Email Draft Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Email Draft</h2>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={draftPrompt}
            onChange={(e) => setDraftPrompt(e.target.value)}
            placeholder="Describe the email you want to draft..."
            className={`flex-1 ${inputClass}`}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateDraft()}
          />
          <button
            onClick={handleGenerateDraft}
            disabled={aiLoading || !draftPrompt.trim()}
            className="bg-primary-600 text-white px-5 py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 whitespace-nowrap"
          >
            {aiLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>
        <AIResponseDisplay response={aiResponse} loading={aiLoading} title="AI Email Draft" />
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Email Agent"
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
