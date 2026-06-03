#!/usr/bin/env node

/*
  Standalone Vapi outbound lead-call sequencer.

  Dry run:
    node scripts/vapi-outbound-sequence.js --sector dentistry --phones 8043601129

  Place live calls:
    node scripts/vapi-outbound-sequence.js --sector dentistry --phones 8043601129 --execute

  Multiple numbers:
    node scripts/vapi-outbound-sequence.js --sector restaurants --phones 8043601129,8045550101 --execute
*/

const fs = require('fs')

const VAPI_API_URL = 'https://api.vapi.ai'

const sectorPrompts = {
  dentistry: {
    names: ['dental', 'dentistry'],
    assistantName: 'Luran Dentistry Outbound',
    firstMessage: 'Hi, this is the dental office assistant calling. We are reaching out to see if we can help with scheduling or dental care questions. Is now a good time?',
    prompt: 'You are a professional dental office outbound AI assistant. Introduce yourself, briefly explain the dental office reason for calling, then collect lead details one at a time: name, best callback phone, dental concern or appointment need, insurance provider if they are willing, preferred appointment date and time, and address only if needed for the office record. Never diagnose or provide treatment advice. If severe pain, swelling, bleeding, broken tooth, knocked-out tooth, or abscess is mentioned, prioritize urgent scheduling and recommend emergency care when appropriate. Keep responses concise.',
  },
  restaurants: {
    names: ['restaurants'],
    assistantName: 'Luran Restaurants Outbound',
    firstMessage: 'Hi, this is the restaurant host assistant calling. We are reaching out about reservations, catering, or event dining. Is now a good time?',
    prompt: 'You are a restaurant outbound AI assistant. Introduce yourself, explain the restaurant reason for calling, then collect lead details one at a time: name, best callback phone, reservation or catering need, party size, date, time, special requests, and email if they are willing. For allergy questions, recommend confirming with restaurant staff. Keep responses warm and concise.',
  },
  'health-clinics': {
    names: ['health-clinics'],
    assistantName: 'Luran Health Clinic Outbound',
    firstMessage: 'Hi, this is the clinic assistant calling. We are reaching out about appointment scheduling and clinic services. Is now a good time?',
    prompt: 'You are a health clinic outbound AI assistant. Introduce yourself, explain the clinic reason for calling, then collect lead details one at a time: name, best callback phone, reason for visit, insurance, preferred appointment time, and date of birth only if needed. Never diagnose, prescribe, or provide treatment advice. For emergencies, tell the person to call 911 or go to the nearest ER. Follow HIPAA and keep responses concise.',
  },
  'real-estate': {
    names: ['real-estate'],
    assistantName: 'Luran Real Estate Outbound',
    firstMessage: 'Hi, this is the real estate assistant calling. We are reaching out to see if you need help buying, selling, renting, or scheduling a showing. Is now a good time?',
    prompt: 'You are a real estate outbound AI assistant. Introduce yourself, explain the real estate reason for calling, then collect lead details one at a time: name, best callback phone, email, buy/sell/rent interest, preferred area, budget range, timeline, property address if selling, and preferred follow-up time. Do not make legal, lending, or valuation guarantees. Keep responses concise.',
  },
  'car-dealerships': {
    names: ['car-dealerships'],
    assistantName: 'Luran Car Dealership Outbound',
    firstMessage: 'Hi, this is the dealership assistant calling. We are reaching out about vehicle shopping, test drives, or service needs. Is now a good time?',
    prompt: 'You are a car dealership outbound AI assistant. Introduce yourself, explain the dealership reason for calling, then collect lead details one at a time: name, best callback phone, vehicle interest, new or used preference, trade-in details, budget range, financing interest, and preferred visit time. Do not quote final prices or guarantee financing approval. Keep responses concise.',
  },
  hospitality: {
    names: ['hospitality'],
    assistantName: 'Luran Hospitality Outbound',
    firstMessage: 'Hi, this is the hotel concierge assistant calling. We are reaching out about reservations, rooms, amenities, or events. Is now a good time?',
    prompt: 'You are a hospitality outbound AI assistant. Introduce yourself, explain the hotel or hospitality reason for calling, then collect lead details one at a time: name, best callback phone, dates, number of guests or rooms, event needs, special requests, and preferred follow-up time. Escalate complaints or urgent guest issues. Keep responses polished and concise.',
  },
  insurance: {
    names: ['insurance'],
    assistantName: 'Luran Insurance Outbound',
    firstMessage: 'Hi, this is the insurance assistant calling. We are reaching out about quotes, coverage, policies, or claims. Is now a good time?',
    prompt: 'You are an insurance agency outbound AI assistant. Introduce yourself, explain the insurance reason for calling, then collect lead details one at a time: name, best callback phone, policy type, current provider, property or vehicle address/details when relevant, desired coverage, claim concern if any, and preferred follow-up time. Do not make binding coverage decisions or legal guarantees. Keep responses concise.',
  },
  'legal-law-firms': {
    names: ['legal-law-firms'],
    assistantName: 'Luran Law Firm Outbound',
    firstMessage: 'Hi, this is the law firm intake assistant calling. We are reaching out to collect a few intake details. Is now a good time?',
    prompt: 'You are a law firm outbound intake assistant. Introduce yourself, explain the law firm reason for calling, then collect lead details one at a time: name, best callback phone, email, case type, opposing party names for conflict checks, urgency, brief summary, and preferred attorney callback time. Do not provide legal advice, opinions, or guarantees. Keep responses professional and concise.',
  },
  'home-services': {
    names: ['home-services'],
    assistantName: 'Luran Home Services Outbound',
    firstMessage: 'Hi, this is the home services assistant calling. We are reaching out about scheduling service or an estimate. Is now a good time?',
    prompt: 'You are a home services outbound AI assistant. Introduce yourself, explain the service reason for calling, then collect lead details one at a time: name, best callback phone, service address, service type, issue description, urgency, access notes, and preferred appointment time. For safety emergencies, advise emergency services or safe utility shutoff when appropriate. Keep responses concise.',
  },
}

function readEnv() {
  const env = {}
  const text = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : ''
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '')
  }
  return env
}

function parseArgs(argv) {
  const args = { execute: false, wait: true }
  for (let i = 2; i < argv.length; i += 1) {
    const value = argv[i]
    if (value === '--execute') args.execute = true
    else if (value === '--no-wait') args.wait = false
    else if (value === '--sector') args.sector = argv[++i]
    else if (value === '--phones') args.phones = argv[++i]
    else if (value === '--area-code') args.areaCode = argv[++i]
  }
  return args
}

function toE164(phone) {
  const digits = String(phone).replace(/\D/g, '')
  if (String(phone).trim().startsWith('+')) return `+${digits}`
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return `+${digits}`
}

function toSlug(value) {
  return String(value || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function vapi(path, options = {}) {
  const response = await fetch(`${VAPI_API_URL}${path}`, options)
  const text = await response.text()
  let data = text
  try {
    data = text ? JSON.parse(text) : null
  } catch {}
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path} failed (${response.status}): ${typeof data === 'string' ? data : JSON.stringify(data)}`)
  }
  return data
}

async function getPhoneNumberId(apiKey, sector, fallbackId) {
  const config = sectorPrompts[sector]
  const names = config?.names || [sector]
  const raw = await vapi('/phone-number', {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  const phoneNumbers = Array.isArray(raw) ? raw : (raw.results || raw.data || [])
  const match = phoneNumbers.find((phone) =>
    phone.provider === 'vapi' &&
    names.includes(String(phone.name || '').toLowerCase()) &&
    phone.id
  )
  return match?.id || fallbackId
}

async function waitForCallEnd(apiKey, callId) {
  for (;;) {
    const call = await vapi(`/call/${callId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const status = call.status || 'unknown'
    process.stdout.write(`  status: ${status}\r`)
    if (['ended', 'completed', 'failed'].includes(status)) {
      process.stdout.write('\n')
      return call
    }
    await sleep(5000)
  }
}

async function main() {
  const env = readEnv()
  const args = parseArgs(process.argv)
  const apiKey = env.VAPI_API_KEY
  const fallbackPhoneNumberId = env.VAPI_PHONE_NUMBER_ID
  const sector = toSlug(args.sector || 'dentistry')
  const config = sectorPrompts[sector]
  const phones = String(args.phones || '')
    .split(/[\n,;]+/)
    .map((phone) => phone.trim())
    .filter(Boolean)

  if (!apiKey) throw new Error('VAPI_API_KEY is missing in .env')
  if (!fallbackPhoneNumberId) throw new Error('VAPI_PHONE_NUMBER_ID is missing in .env')
  if (!config) throw new Error(`Unknown sector "${sector}". Available: ${Object.keys(sectorPrompts).join(', ')}`)
  if (phones.length === 0) throw new Error('Provide --phones, for example: --phones 8043601129')

  const phoneNumberId = await getPhoneNumberId(apiKey, sector, fallbackPhoneNumberId)

  console.log(`Sector: ${sector}`)
  console.log(`Vapi phoneNumberId: ${phoneNumberId}`)
  console.log(`Targets: ${phones.map(toE164).join(', ')}`)

  if (!args.execute) {
    console.log('Dry run only. Add --execute to place live calls.')
    return
  }

  for (const target of phones) {
    const customerNumber = toE164(target)
    console.log(`Calling ${customerNumber}...`)

    const call = await vapi('/call', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumberId,
        customer: { number: customerNumber },
        assistant: {
          name: config.assistantName,
          firstMessage: config.firstMessage,
          model: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: config.prompt }],
          },
          voice: {
            provider: 'azure',
            voiceId: 'en-US-EmmaNeural',
          },
        },
      }),
    })

    console.log(`  call id: ${call.id}`)
    if (args.wait) await waitForCallEnd(apiKey, call.id)
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
