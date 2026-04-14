'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function NewSmsCampaignPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    messageTemplate: '',
    audience: '',
    scheduledAt: '',
    industry: 'Dentistry',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleComposeWithAI = async () => {
    setAiLoading(true)
    setAiResponse(null)
    try {
      const res = await fetch('/api/ai/sms-compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          audience: form.audience,
          industry: form.industry,
        }),
      })
      if (!res.ok) throw new Error('Failed to compose with AI')
      const data = await res.json()
      setAiResponse(data.response)
      if (data.response) {
        setForm((prev) => ({ ...prev, messageTemplate: data.response }))
      }
    } catch {
      setError('Failed to compose message with AI')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/sms-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to create SMS campaign')
      router.push('/sms-campaigns')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create SMS Campaign</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="e.g. Spring Promotion"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
          <input
            type="text"
            name="audience"
            value={form.audience}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="e.g. All active customers"
          />
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
          <textarea
            name="messageTemplate"
            value={form.messageTemplate}
            onChange={handleChange}
            required
            rows={4}
            className={inputClass}
            placeholder="Hi {name}, we wanted to let you know..."
          />
        </div>

        {(aiResponse || aiLoading) && (
          <AIResponseDisplay response={aiResponse} loading={aiLoading} title="AI Composed Message" />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled At</label>
          <input
            type="datetime-local"
            name="scheduledAt"
            value={form.scheduledAt}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={submitting}
            className="bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Campaign'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
