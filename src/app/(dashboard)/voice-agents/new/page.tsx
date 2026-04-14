'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AIResponseDisplay from '@/components/ui/AIResponseDisplay'

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Portuguese']
const VOICES = ['Male-1', 'Female-1', 'Male-2', 'Female-2']
const INDUSTRIES = [
  'Dentistry',
  'Restaurants',
  'Health Clinics',
  'Real Estate',
  'Car Dealerships',
  'Hospitality',
  'Debt Collection',
  'Insurance',
  'Legal',
  'Home Services',
  'Pharmacy',
  'Fitness',
  'Education',
  'Pet Care',
  'Accounting',
  'Salon',
  'Auto Repair',
]

const inputClass =
  'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'

export default function NewVoiceAgentPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    language: 'English',
    voice: 'Male-1',
    greeting: '',
    industry: 'Dentistry',
    systemPrompt: '',
    maxCallDuration: 300,
    transferNumber: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: name === 'maxCallDuration' ? Number(value) : value }))
  }

  const handleGenerateGreeting = async () => {
    setAiLoading(true)
    setAiResponse(null)
    try {
      const res = await fetch('/api/ai/voice-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate a professional greeting for a ${form.industry} voice agent named "${form.name}" that speaks ${form.language}.`,
          industry: form.industry,
        }),
      })
      if (!res.ok) throw new Error('Failed to generate greeting')
      const data = await res.json()
      setAiResponse(data.response)
      if (data.response) {
        setForm((prev) => ({ ...prev, greeting: data.response }))
      }
    } catch {
      setError('Failed to generate greeting with AI')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/voice-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to create voice agent')
      router.push('/voice-agents')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Voice Agent</h1>

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
            placeholder="e.g. Front Desk Agent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <select name="language" value={form.language} onChange={handleChange} className={inputClass}>
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Voice</label>
            <select name="voice" value={form.voice} onChange={handleChange} className={inputClass}>
              {VOICES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
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
            <label className="block text-sm font-medium text-gray-700">Greeting</label>
            <button
              type="button"
              onClick={handleGenerateGreeting}
              disabled={aiLoading}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
            >
              {aiLoading ? 'Generating...' : 'Generate Greeting with AI'}
            </button>
          </div>
          <textarea
            name="greeting"
            value={form.greeting}
            onChange={handleChange}
            rows={3}
            className={inputClass}
            placeholder="Hello! Thank you for calling..."
          />
        </div>

        {(aiResponse || aiLoading) && (
          <AIResponseDisplay response={aiResponse} loading={aiLoading} title="AI Generated Greeting" />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
          <textarea
            name="systemPrompt"
            value={form.systemPrompt}
            onChange={handleChange}
            rows={4}
            className={inputClass}
            placeholder="You are a helpful voice agent that..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Call Duration (seconds)</label>
            <input
              type="number"
              name="maxCallDuration"
              value={form.maxCallDuration}
              onChange={handleChange}
              min={30}
              max={3600}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Number</label>
            <input
              type="tel"
              name="transferNumber"
              value={form.transferNumber}
              onChange={handleChange}
              className={inputClass}
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={submitting}
            className="bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Voice Agent'}
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
