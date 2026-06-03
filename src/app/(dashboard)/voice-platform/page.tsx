import Link from 'next/link'

const stackLayers = [
  {
    layer: 'Channels',
    owner: 'Luran AI',
    role: 'Website voice button, phone calls, chat-to-voice toggle, and future SMS or WhatsApp entry points.',
    examples: ['Web widget', 'Phone number', 'Chat voice mode'],
  },
  {
    layer: 'Telephony',
    owner: 'Twilio or SIP provider',
    role: 'Phone numbers, PSTN routing, recording controls, SMS, and carrier reliability.',
    examples: ['Twilio Voice', 'SIP trunking', 'Call routing'],
  },
  {
    layer: 'Orchestration',
    owner: 'Vapi, Retell, or Luran backend',
    role: 'Turn taking, interruptions, tool calls, call state, QA, and agent workflow execution.',
    examples: ['Vapi', 'Retell', 'Custom workflow engine'],
  },
  {
    layer: 'Speech and Voice',
    owner: 'ElevenLabs, Deepgram, Whisper',
    role: 'Speech-to-text, text-to-speech, multilingual voices, voice quality, and low-latency streaming.',
    examples: ['ElevenLabs TTS', 'Deepgram STT', 'Whisper fallback'],
  },
  {
    layer: 'Brain',
    owner: 'OpenAI, Claude, model router',
    role: 'Intent detection, reasoning, response generation, policy checks, and multilingual conversation logic.',
    examples: ['Agent 0 router', 'Agent 1 expert', 'Agent 2 action'],
  },
  {
    layer: 'Business Systems',
    owner: 'Customer integrations',
    role: 'Shopify, SAP, CRM, calendars, product catalogs, order status, and appointment booking.',
    examples: ['Shopify', 'SAP', 'CRM', 'Calendar'],
  },
]

const vendorRows = [
  ['Twilio', 'Telephony infrastructure', 'Phone numbers, PSTN, SMS, SIP, routing', 'Not an AI brain; use it as carrier plumbing.'],
  ['ElevenLabs', 'Voice quality', 'Realistic voices, emotion, multilingual TTS', 'Great voice layer, not a workflow platform.'],
  ['Vapi', 'Developer voice agents', 'Flexible APIs, custom logic, fast prototyping', 'Best when you want modular control.'],
  ['Retell', 'Voice agent operations', 'Analytics, QA, enterprise readiness, call testing', 'Good fit for production monitoring.'],
  ['Bland AI', 'Ready call automation', 'Fast outbound MVP, simple agent setup', 'Less flexible for deep custom workflows.'],
]

const pricingPlans = [
  {
    name: 'Starter',
    price: '$99/mo',
    included: '200 minutes',
    fit: 'Website voice widget and one simple agent',
    features: ['Basic industry script', 'Lead capture', 'Call summary'],
  },
  {
    name: 'Growth',
    price: '$299/mo',
    included: '1,000 minutes',
    fit: 'Phone integration and CRM handoff',
    features: ['Twilio phone number', 'CRM or calendar integration', 'Conversion analytics'],
  },
  {
    name: 'Pro',
    price: '$799/mo',
    included: '5,000 minutes',
    fit: 'Multilingual workflows and advanced actions',
    features: ['Multi-language agents', 'Advanced workflows', 'Human handoff and QA'],
  },
]

const agentFlow = [
  {
    agent: 'Agent 0',
    title: 'Router',
    purpose: 'Detect intent, language, urgency, and route to the right workflow.',
    output: 'Product inquiry, appointment request, order status, or human handoff.',
  },
  {
    agent: 'Agent 1',
    title: 'Sales or Support Expert',
    purpose: 'Answer questions, recommend products, qualify the caller, and handle objections.',
    output: 'Helpful conversation with next best question and upsell opportunity.',
  },
  {
    agent: 'Agent 2',
    title: 'Action Agent',
    purpose: 'Book appointments, create orders, send payment links, update CRM, or open support cases.',
    output: 'Completed business action plus audit trail and follow-up task.',
  },
]

const mvpTimeline = [
  ['Week 1', 'Build one health retail agent template with router, sales support, and action flow.'],
  ['Week 2', 'Add website voice button and test multilingual voice quality.'],
  ['Week 3', 'Connect Twilio phone number and capture call logs.'],
  ['Week 4', 'Integrate product catalog or simple CRM records.'],
  ['Week 5-6', 'Pilot with 2-3 local stores and measure missed-call recovery.'],
]

export default function VoicePlatformPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Voice AI platform blueprint</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">Composable sectoral voice agents for web, phone, and chat.</h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Luran AI should be positioned as a workflow platform, not a single vendor wrapper. Use Twilio for phone plumbing,
              ElevenLabs for voice quality, Vapi or Retell for orchestration when useful, and Luran workflows for the industry logic.
            </p>
          </div>
          <div className="grid min-w-72 grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-950 p-4 text-white">
              <p className="text-xs text-gray-300">Target latency</p>
              <p className="mt-1 text-2xl font-bold">&lt;500ms</p>
            </div>
            <div className="rounded-xl bg-primary-50 p-4 text-primary-900">
              <p className="text-xs text-primary-700">Gross margin target</p>
              <p className="mt-1 text-2xl font-bold">5x-10x</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 text-emerald-900">
              <p className="text-xs text-emerald-700">First niche</p>
              <p className="mt-1 text-lg font-semibold">Health retail</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4 text-amber-900">
              <p className="text-xs text-amber-700">MVP window</p>
              <p className="mt-1 text-lg font-semibold">4-6 weeks</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-950">MVP Architecture</h2>
              <p className="mt-1 text-sm text-gray-500">Vendor-neutral layers so each client can use the right phone, voice, and workflow stack.</p>
            </div>
            <Link href="/integrations" className="rounded-lg bg-gray-950 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800">
              Configure integrations
            </Link>
          </div>
          <div className="space-y-3">
            {stackLayers.map((item, index) => (
              <div key={item.layer} className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 p-4 md:grid-cols-[48px_1fr]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-sm font-bold text-primary-700">
                  {index + 1}
                </div>
                <div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="font-semibold text-gray-950">{item.layer}</h3>
                    <span className="text-xs font-medium text-gray-500">{item.owner}</span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-gray-600">{item.role}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.examples.map((example) => (
                      <span key={example} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-950">Agent 0 to Agent 2 Demo</h2>
          <p className="mt-1 text-sm text-gray-500">The reusable flow for every sectoral AI solution.</p>
          <div className="mt-5 space-y-4">
            {agentFlow.map((step) => (
              <div key={step.agent} className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">{step.agent}</p>
                <h3 className="mt-1 font-semibold text-gray-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{step.purpose}</p>
                <p className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">{step.output}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-950">Vendor Difference Map</h2>
        <div className="mt-5 overflow-hidden rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Layer</th>
                <th className="px-4 py-3">Use it for</th>
                <th className="px-4 py-3">Decision note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {vendorRows.map(([vendor, layer, use, note]) => (
                <tr key={vendor}>
                  <td className="px-4 py-4 font-semibold text-gray-950">{vendor}</td>
                  <td className="px-4 py-4 text-gray-700">{layer}</td>
                  <td className="px-4 py-4 text-gray-600">{use}</td>
                  <td className="px-4 py-4 text-gray-600">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-950">Pricing and Money Model</h2>
          <p className="mt-1 text-sm text-gray-500">Keep the offer simple: subscription, included minutes, setup fee, and profitable overages.</p>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className="rounded-xl border border-gray-200 p-5">
                <h3 className="text-lg font-semibold text-gray-950">{plan.name}</h3>
                <p className="mt-2 text-3xl font-bold text-gray-950">{plan.price}</p>
                <p className="mt-1 text-sm text-gray-500">{plan.included}</p>
                <p className="mt-4 text-sm leading-6 text-gray-600">{plan.fit}</p>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
            Estimated cost is about $0.05-$0.10 per minute. Sell usage at $0.50-$1.50 per minute or bundle it into plans.
            Add $500-$2,000 setup fees for custom integrations and onboarding.
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-950">Sales Approach</h2>
          <div className="mt-5 space-y-4 text-sm text-gray-600">
            <div className="rounded-xl bg-primary-50 p-4 text-primary-900">
              <p className="font-semibold">Primary pitch</p>
              <p className="mt-1">Missed calls are lost sales. Luran AI answers, qualifies, recommends, and books 24/7.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-950">Start with</p>
              <p className="mt-1">Health retail stores, vitamin shops, small clinics, home services, and appointment-heavy SMBs.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-950">ROI example</p>
              <p className="mt-1">20 missed calls per day, 5 recovered sales, $30 average order value, about $4,500 monthly recovered revenue.</p>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-950">Implementation Roadmap</h2>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-5">
          {mvpTimeline.map(([week, work]) => (
            <div key={week} className="rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-semibold text-primary-700">{week}</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">{work}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
