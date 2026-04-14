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

interface SmsCampaign {
  id: string
  name: string
  messageTemplate: string
  audience: string
  scheduledAt: string
  industry: string
  status: string
  sent: number
  delivered: number
  responses: number
}

export default function SmsCampaignDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [campaign, setCampaign] = useState<SmsCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<SmsCampaign | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [sendingViaTwilio, setSendingViaTwilio] = useState(false)
  const [twilioResult, setTwilioResult] = useState<string | null>(null)

  const handleSendViaTwilio = async () => {
    const phone = prompt('Enter recipient phone number (e.g., +1234567890):')
    if (!phone) return
    setSendingViaTwilio(true)
    setTwilioResult(null)
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone, body: campaign?.messageTemplate }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setTwilioResult(`SMS sent successfully! SID: ${data.sid}, Status: ${data.status}`)
    } catch (err) {
      setTwilioResult(`Error: ${err instanceof Error ? err.message : 'Failed to send SMS'}`)
    } finally {
      setSendingViaTwilio(false)
    }
  }

  useEffect(() => {
    async function fetchCampaign() {
      try {
        const res = await fetch(`/api/sms-campaigns/${id}`)
        if (!res.ok) throw new Error('Failed to fetch SMS campaign')
        const data = await res.json()
        setCampaign(data)
        setForm(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchCampaign()
  }, [id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (!form) return
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      const res = await fetch(`/api/sms-campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to update SMS campaign')
      const updated = await res.json()
      setCampaign(updated)
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
      const res = await fetch(`/api/sms-campaigns/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete SMS campaign')
      router.push('/sms-campaigns')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
      setDeleting(false)
    }
  }

  const handleComposeWithAI = async () => {
    setAiLoading(true)
    setAiResponse(null)
    try {
      const res = await fetch('/api/ai/sms-compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: `Campaign: ${form?.name || campaign?.name}, Audience: ${form?.audience || campaign?.audience}, Industry: ${form?.industry || campaign?.industry}`,
          purpose: `Compose an SMS message for the ${form?.name || campaign?.name} campaign`,
        }),
      })
      if (!res.ok) throw new Error('Failed to compose with AI')
      const data = await res.json()
      setAiResponse(data.result)
      if (data.result && form) {
        setForm({ ...form, messageTemplate: data.result })
      }
    } catch {
      setError('Failed to compose message with AI')
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

  if (error && !campaign) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <p className="font-medium">Error</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  if (!campaign || !form) return null

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
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <StatusBadge status={campaign.status} />
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
                    setForm(campaign)
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
                  onClick={handleSendViaTwilio}
                  disabled={sendingViaTwilio}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {sendingViaTwilio ? 'Sending...' : 'Send via Twilio'}
                </button>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
              <input type="text" name="audience" value={form.audience} onChange={handleChange} className={inputClass} />
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Message Template</label>
                <button
                  type="button"
                  onClick={handleComposeWithAI}
                  disabled={aiLoading}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                >
                  {aiLoading ? 'Composing...' : 'Compose with AI'}
                </button>
              </div>
              <textarea name="messageTemplate" value={form.messageTemplate} onChange={handleChange} rows={4} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled At</label>
              <input type="datetime-local" name="scheduledAt" value={form.scheduledAt} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Audience</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{campaign.audience}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Industry</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{campaign.industry}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Scheduled At</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleString() : 'Not scheduled'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{campaign.sent}</p>
                <p className="text-xs text-gray-500 mt-1">Sent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{campaign.delivered}</p>
                <p className="text-xs text-gray-500 mt-1">Delivered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{campaign.responses}</p>
                <p className="text-xs text-gray-500 mt-1">Responses</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Message Template</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5 whitespace-pre-wrap">{campaign.messageTemplate}</p>
            </div>
          </div>
        )}

        {twilioResult && (
          <div className={`mt-4 p-4 rounded-lg text-sm ${twilioResult.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {twilioResult}
          </div>
        )}

        {(aiResponse || aiLoading) && (
          <div className="mt-6">
            <AIResponseDisplay response={aiResponse} loading={aiLoading} title="AI Composed Message" />
          </div>
        )}
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete SMS Campaign"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{campaign.name}</strong>? This action cannot be undone.
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
