'use client'

import { useState } from 'react'
import AIResponseDisplay from '@/components/ui/AIResponseDisplay'

interface HistoryItem {
  id: string
  prompt: string
  context: string
  aiFunction: string
  response: string
  timestamp: Date
}

const aiFunctions = [
  { value: 'general', label: 'General', endpoint: '/api/ai/generate' },
  { value: 'voice', label: 'Voice Response', endpoint: '/api/ai/voice-response' },
  { value: 'chat', label: 'Chat Response', endpoint: '/api/ai/chat-response' },
  { value: 'email', label: 'Email Draft', endpoint: '/api/ai/email-draft' },
  { value: 'sms', label: 'SMS Compose', endpoint: '/api/ai/sms-compose' },
  { value: 'sentiment', label: 'Sentiment Analysis', endpoint: '/api/ai/sentiment' },
  { value: 'summarize', label: 'Summarize', endpoint: '/api/ai/summarize' },
]

const sampleInputs = [
  {
    label: 'Dental Call',
    aiFunction: 'voice',
    prompt: "I'd like to schedule a dental cleaning next week, preferably after 3pm.",
    context: 'BrightSmile Dental. Returning patient, last cleaning was 6 months ago. Offer Tuesday 3:30pm or Thursday 4:15pm with Dr. Lee.',
  },
  {
    label: 'Emergency Triage',
    aiFunction: 'voice',
    prompt: 'My child chipped a tooth and it is bleeding. Can someone see us today?',
    context: 'BrightSmile Kids Dental. Same-day emergency slots are held at 11:30am and 3:45pm. If severe bleeding, swelling, fever, or trouble breathing, advise urgent medical care.',
  },
  {
    label: 'Real Estate Lead',
    aiFunction: 'voice',
    prompt: 'I am relocating next month and need a three-bedroom home near good schools.',
    context: 'Northstar Realty. Buyer has not been pre-approved yet. Service areas: Austin, Cedar Park, Round Rock. Goal: collect budget, move date, financing status, and preferred neighborhoods.',
  },
  {
    label: 'Restaurant Chat',
    aiFunction: 'chat',
    prompt: 'Do you have a table for four tonight around 7:30, and can one person eat gluten-free?',
    context: 'Luna Bistro. Open 5pm-11pm. Gluten-free pasta and risotto available. Patio and indoor seating. Reservations accepted by phone or SMS.',
  },
  {
    label: 'Hotel Concierge',
    aiFunction: 'chat',
    prompt: 'Can I get late checkout and airport transportation tomorrow morning?',
    context: 'Harbor View Hotel. Standard checkout is 11am. Late checkout to 1pm is complimentary when available; 3pm costs $45. Airport shuttle runs every 30 minutes from 5am to 11pm.',
  },
  {
    label: 'Auto Service',
    aiFunction: 'chat',
    prompt: 'My check engine light came on and the car shakes when I accelerate.',
    context: 'Metro Auto Service. Open Mon-Sat 7am-6pm. Diagnostic fee is $129 and can be applied to repair. For unsafe driving symptoms, recommend towing instead of driving.',
  },
  {
    label: 'Sales Follow-up',
    aiFunction: 'email',
    prompt: 'Follow up after a qualified demo call and propose next steps.',
    context: 'Prospect: Maya Chen, Northstar Dental Group. Interested in AI appointment reminders and call logging. Budget approved, wants implementation timeline and pricing.',
  },
  {
    label: 'No-show Email',
    aiFunction: 'email',
    prompt: 'Send a polite no-show follow-up and make it easy to reschedule.',
    context: 'Patient: Jordan Park. Missed dental cleaning today at 10:00am. First no-show in 18 months. Practice policy: friendly reminder, no fee this time, offer online booking link.',
  },
  {
    label: 'Proposal Email',
    aiFunction: 'email',
    prompt: 'Send a proposal recap after a hotel event-planning call.',
    context: 'Client: Priya Shah, Acme Finance. Needs 80-person leadership retreat, July 10-12, ballroom, breakfast, AV, and 35 room block. Proposal due Friday.',
  },
  {
    label: 'SMS Reminder',
    aiFunction: 'sms',
    prompt: 'Appointment reminder with confirmation request',
    context: 'Patient Jordan Park has a dental cleaning tomorrow at 2:00pm with Dr. Lee. Ask them to reply YES to confirm or call to reschedule.',
  },
  {
    label: 'Payment SMS',
    aiFunction: 'sms',
    prompt: 'Friendly payment plan reminder',
    context: 'Customer Alex Rivera has a payment plan installment of $233 due Friday. Keep it respectful, include a payment link placeholder, and offer help if they need to discuss options.',
  },
  {
    label: 'Promo SMS',
    aiFunction: 'sms',
    prompt: 'Limited-time whitening promotion for existing dental patients',
    context: 'BrightSmile Dental. June whitening promotion: $99 for existing patients, normally $149. Include opt-out language. Avoid sounding spammy.',
  },
  {
    label: 'Retention Plan',
    aiFunction: 'general',
    prompt: 'Create a 30-day retention outreach plan for customers who have not replied after a demo.',
    context: 'B2B SaaS voice AI product. Audience: dental offices and clinics. Channels available: email, SMS, phone call, and Salesforce task creation.',
  },
  {
    label: 'Deep Prompt',
    aiFunction: 'general',
    prompt: 'Analyze this customer communication workflow in depth and produce an implementation-ready plan. Include goals, assumptions, required data fields, automation steps, AI decision points, Salesforce updates, risk handling, success metrics, and a short rollout checklist.',
    context: 'Scenario: Luran AI handles inbound and outbound calls for a multi-location dental group. The AI should qualify callers, look up contacts, create or update Salesforce leads, log call summaries, route urgent issues to a human, schedule follow-ups, and attribute each lead to the correct campaign/source. The output should be specific enough for product, engineering, and sales operations to use.',
  },
  {
    label: 'Call Script',
    aiFunction: 'general',
    prompt: 'Write a concise outbound call script for reactivating cold leads.',
    context: 'Leads downloaded a guide about AI appointment scheduling 60-90 days ago. Goal: book a 20-minute demo without sounding pushy.',
  },
  {
    label: 'Angry Customer',
    aiFunction: 'sentiment',
    prompt: "I called three times and nobody followed up. This is wasting my time, and I'm ready to cancel unless someone fixes this today.",
    context: '',
  },
  {
    label: 'Happy Customer',
    aiFunction: 'sentiment',
    prompt: 'Thanks for getting me scheduled so quickly. The reminder texts were helpful, and the front desk was very kind.',
    context: '',
  },
  {
    label: 'Mixed Feedback',
    aiFunction: 'sentiment',
    prompt: 'The technician was excellent, but I had to wait 45 minutes and nobody explained the delay until I asked.',
    context: '',
  },
  {
    label: 'Call Summary',
    aiFunction: 'summarize',
    prompt: "Caller: Hi, I missed a call about my appointment.\nAI: I can help with that. Can I confirm your name?\nCaller: Maya Chen.\nAI: Your dental cleaning is tomorrow at 2pm with Dr. Lee.\nCaller: I need to move it to next week.\nAI: We have Tuesday at 3:30pm or Thursday at 4:15pm.\nCaller: Thursday works.\nAI: Great, I moved your appointment to Thursday at 4:15pm.",
    context: '',
  },
  {
    label: 'Sales Summary',
    aiFunction: 'summarize',
    prompt: "Rep: Thanks for taking the demo call today.\nProspect: We need better call summaries and Salesforce updates.\nRep: You mentioned 12 locations and around 2,000 calls per month.\nProspect: Correct, and missed follow-ups are our biggest issue.\nRep: Next step is a pricing proposal and implementation timeline.\nProspect: Send it by Friday and include Salesforce task logging.",
    context: '',
  },
  {
    label: 'Support Summary',
    aiFunction: 'summarize',
    prompt: "Customer: My reminder campaign sent twice.\nAgent: I see two active workflows with the same audience.\nCustomer: Can you stop it from happening again?\nAgent: I paused the duplicate workflow and added an exclusion rule.\nCustomer: Please send me what changed.\nAgent: I will email a summary and monitor the next send.",
    context: '',
  },
]

export default function AIPlaygroundPage() {
  const [prompt, setPrompt] = useState('')
  const [context, setContext] = useState('')
  const [selectedFunction, setSelectedFunction] = useState('general')
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])

  const inputClassName = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setResponse(null)

    const fn = aiFunctions.find((f) => f.value === selectedFunction) || aiFunctions[0]

    try {
      let body: Record<string, string> = {}

      switch (fn.value) {
        case 'general':
          body = { prompt, context: context || '' }
          break
        case 'voice':
          body = { context: context || 'General business inquiry', query: prompt }
          break
        case 'chat':
          body = { context: context || 'General business', message: prompt, personality: 'Professional, helpful, and friendly' }
          break
        case 'email':
          body = { context: context || 'Business communication', subject: prompt, tone: 'professional' }
          break
        case 'sms':
          body = { context: context || 'Business communication', purpose: prompt }
          break
        case 'sentiment':
          body = { text: prompt }
          break
        case 'summarize':
          body = { transcript: prompt }
          break
        default:
          body = { prompt, context: context || '' }
      }

      const res = await fetch(fn.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to generate response')

      const data = await res.json()
      const result = data.result || data.response || data.content || JSON.stringify(data)

      setResponse(result)

      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        prompt,
        context,
        aiFunction: fn.label,
        response: result,
        timestamp: new Date(),
      }
      setHistory((prev) => [historyItem, ...prev])
    } catch (err) {
      setResponse(`Error: ${err instanceof Error ? err.message : 'Failed to generate response'}`)
    } finally {
      setLoading(false)
    }
  }

  const loadFromHistory = (item: HistoryItem) => {
    setPrompt(item.prompt)
    setContext(item.context)
    setResponse(item.response)
    const fn = aiFunctions.find((f) => f.label === item.aiFunction)
    if (fn) setSelectedFunction(fn.value)
  }

  const loadSample = (sample: typeof sampleInputs[number]) => {
    setSelectedFunction(sample.aiFunction)
    setPrompt(sample.prompt)
    setContext(sample.context)
    setResponse(null)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Playground</h1>
        <p className="text-sm text-gray-500 mt-1">Test and experiment with AI-powered responses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AI Function</label>
                <select
                  value={selectedFunction}
                  onChange={(e) => setSelectedFunction(e.target.value)}
                  className={inputClassName}
                >
                  {aiFunctions.map((fn) => (
                    <option key={fn.value} value={fn.value}>{fn.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sample Inputs</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                  {sampleInputs.map((sample) => (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => loadSample(sample)}
                      disabled={loading}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 disabled:opacity-50"
                    >
                      {sample.label}
                      <span className="mt-0.5 block text-xs font-normal text-gray-400">
                        {aiFunctions.find((fn) => fn.value === sample.aiFunction)?.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedFunction === 'sentiment' ? 'Text to Analyze *' :
                   selectedFunction === 'summarize' ? 'Conversation Transcript *' :
                   selectedFunction === 'sms' ? 'SMS Purpose *' :
                   selectedFunction === 'email' ? 'Email Subject/Purpose *' :
                   'Prompt *'}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className={inputClassName}
                  placeholder={
                    selectedFunction === 'voice' ? "e.g., 'I'd like to schedule a dental cleaning next week'" :
                    selectedFunction === 'chat' ? "e.g., 'Do you have any tables available for tonight?'" :
                    selectedFunction === 'email' ? "e.g., 'Follow-up after missed dental appointment'" :
                    selectedFunction === 'sms' ? "e.g., 'Appointment reminder for tomorrow at 2pm'" :
                    selectedFunction === 'sentiment' ? "Paste a customer message or conversation to analyze..." :
                    selectedFunction === 'summarize' ? "Paste a conversation transcript to summarize..." :
                    "Enter your prompt here... e.g., 'Create a greeting script for a dental office receptionist'"
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Context <span className="text-gray-400 font-normal">
                    {selectedFunction === 'sentiment' || selectedFunction === 'summarize' ? '(not used for this function)' : '(optional — improves results)'}
                  </span>
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                  className={inputClassName}
                  disabled={selectedFunction === 'sentiment' || selectedFunction === 'summarize'}
                  placeholder={
                    selectedFunction === 'voice' ? "e.g., 'Dental office, patient is a returning customer, last visit was 6 months ago'" :
                    selectedFunction === 'chat' ? "e.g., 'Italian restaurant, open Tue-Sun 5-11pm, private dining available'" :
                    selectedFunction === 'email' ? "e.g., 'Patient missed their cleaning appointment on March 15. No prior cancellations.'" :
                    selectedFunction === 'sms' ? "e.g., 'Dental patient John Smith, appointment with Dr. Lee tomorrow at 2pm'" :
                    selectedFunction === 'sentiment' || selectedFunction === 'summarize' ? 'Not needed — paste the full text in the prompt field above' :
                    "Add business context: industry, customer details, situation, tone preferences..."
                  }
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Generating...
                  </span>
                ) : (
                  'Generate Response'
                )}
              </button>
            </div>
          </div>

          <AIResponseDisplay
            response={response}
            loading={loading}
            title={`AI Response - ${aiFunctions.find((f) => f.value === selectedFunction)?.label || 'General'}`}
          />
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Session History</h2>
            {history.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-500">No history yet</p>
                <p className="text-xs text-gray-400 mt-1">Your prompts will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors border border-gray-100 hover:border-primary-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-primary-600">{item.aiFunction}</span>
                      <span className="text-xs text-gray-400">
                        {item.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{item.prompt}</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                      {item.response.slice(0, 80)}...
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
