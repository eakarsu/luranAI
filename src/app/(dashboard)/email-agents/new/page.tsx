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

export default function NewEmailAgentPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    emailAddress: '',
    signature: '',
    confidenceThreshold: 0.7,
    industry: 'Dentistry',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'confidenceThreshold' ? parseFloat(value) : value,
    }))
  }

  const handleDraftWithAI = async () => {
    setAiLoading(true)
    setAiResponse(null)
    try {
      const res = await fetch('/api/ai/email-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          industry: form.industry,
          prompt: `Draft a professional email signature and template for a ${form.industry} email agent named "${form.name}".`,
        }),
      })
      if (!res.ok) throw new Error('Failed to draft with AI')
      const data = await res.json()
      setAiResponse(data.response)
      if (data.response) {
        setForm((prev) => ({ ...prev, signature: data.response }))
      }
    } catch {
      setError('Failed to generate draft with AI')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/email-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to create email agent')
      router.push('/email-agents')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Email Agent</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="e.g. Support Email Agent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            name="emailAddress"
            value={form.emailAddress}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="e.g. support@company.com"
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
            <label className="block text-sm font-medium text-gray-700">Signature</label>
            <button
              type="button"
              onClick={handleDraftWithAI}
              disabled={aiLoading}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
            >
              {aiLoading ? 'Drafting...' : 'Draft with AI'}
            </button>
          </div>
          <textarea
            name="signature"
            value={form.signature}
            onChange={handleChange}
            rows={4}
            className={inputClass}
            placeholder="Best regards,&#10;Your Name&#10;Company Name"
          />
        </div>

        {(aiResponse || aiLoading) && (
          <AIResponseDisplay response={aiResponse} loading={aiLoading} title="AI Drafted Content" />
        )}

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

        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={submitting}
            className="bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Email Agent'}
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
