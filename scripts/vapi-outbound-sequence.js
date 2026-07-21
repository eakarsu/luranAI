#!/usr/bin/env node

/*
  Standalone Vapi outbound lead-call sequencer.

  Offline dry run (no credentials, database, or network calls):
    node scripts/vapi-outbound-sequence.js --sector dentistry --phones 8043601129

  Place live calls:
    node scripts/vapi-outbound-sequence.js --sector dentistry --phones 8043601129 --execute --confirm-live-calls --consent-basis express

  Multiple numbers:
    node scripts/vapi-outbound-sequence.js --sector restaurants --phones 8043601129,8045550101 --execute

  Create local Postgres leads and notify the team:
    node scripts/vapi-outbound-sequence.js --sector dentistry --phones 8043601129 --execute --create-lead --notify-email sales@example.com --notify-phone +18045550101 --twilio-from-number +18045550100
*/

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const VAPI_API_URL = 'https://api.vapi.ai'
const DEFAULT_AUDIT_FILE = 'data/vapi-outbound-audit.jsonl'
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000
const DEFAULT_WAIT_TIMEOUT_MS = 15 * 60 * 1000
const MAX_LIVE_TARGETS = 25
const CONSENT_BASES = new Set(['express', 'existing-business-relationship', 'manual-reviewed'])
let prisma

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

function readEnvFile(path) {
  const env = {}
  const text = fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : ''
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '')
  }
  return env
}

function readEnv() {
  return {
    ...readEnvFile('.env'),
    ...readEnvFile('.env.local'),
    ...process.env,
  }
}

function parseArgs(argv) {
  const args = { execute: false, wait: true }
  const valueOptions = new Set([
    '--sector', '--phones', '--area-code', '--lead-company', '--lead-first-name',
    '--lead-last-name', '--lead-email', '--org-id', '--consent-basis',
    '--notify-email', '--notify-phone', '--twilio-from-number', '--audit-file',
    '--request-timeout-seconds', '--wait-timeout-seconds',
  ])
  for (let i = 2; i < argv.length; i += 1) {
    const value = argv[i]
    if (value === '--execute') args.execute = true
    else if (value === '--no-wait') args.wait = false
    else if (value === '--create-lead') args.createLead = true
    else if (value === '--confirm-live-calls') args.confirmLiveCalls = true
    else if (value === '--help' || value === '-h') args.help = true
    else if (valueOptions.has(value)) {
      const next = argv[i + 1]
      if (!next || next.startsWith('--')) throw new Error(`${value} requires a value`)
      const key = value.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
      args[key] = next
      i += 1
    } else {
      throw new Error(`Unknown option: ${value}`)
    }
  }
  return args
}

function toE164(phone) {
  const raw = String(phone || '').trim()
  if (!raw || !/^\+?[0-9().\-\s]+$/.test(raw) || raw.slice(1).includes('+')) {
    throw new Error(`Invalid phone number: ${raw || '(empty)'}`)
  }
  const digits = raw.replace(/\D/g, '')
  if (raw.startsWith('+')) {
    if (digits.length < 8 || digits.length > 15) {
      throw new Error(`International phone number must contain 8 to 15 digits: ${raw}`)
    }
    return `+${digits}`
  }
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  throw new Error(`Use a 10-digit US number or an international number beginning with +: ${raw}`)
}

function toSlug(value) {
  return String(value || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function boundedSeconds(value, fallbackSeconds, label, maximumSeconds) {
  if (value === undefined) return fallbackSeconds * 1000
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximumSeconds) {
    throw new Error(`${label} must be an integer from 1 to ${maximumSeconds}`)
  }
  return parsed * 1000
}

function buildPlan(args) {
  const sector = toSlug(args.sector || 'dentistry')
  const config = sectorPrompts[sector]
  if (!config) throw new Error(`Unknown sector "${sector}". Available: ${Object.keys(sectorPrompts).join(', ')}`)

  const targets = String(args.phones || '')
    .split(/[\n,;]+/)
    .map((phone) => phone.trim())
    .filter(Boolean)
    .map(toE164)
  const phones = [...new Set(targets)]
  if (phones.length === 0) throw new Error('Provide --phones, for example: --phones 8043601129')
  if (phones.length > MAX_LIVE_TARGETS) {
    throw new Error(`A single run is limited to ${MAX_LIVE_TARGETS} unique phone numbers`)
  }

  if (args.execute && !args.confirmLiveCalls) {
    throw new Error('--execute also requires --confirm-live-calls')
  }
  if (args.execute && !CONSENT_BASES.has(args.consentBasis)) {
    throw new Error(`Live calls require --consent-basis with one of: ${[...CONSENT_BASES].join(', ')}`)
  }
  if (args.createLead && !args.execute) {
    throw new Error('--create-lead only runs with --execute, because it needs the live Vapi call id')
  }
  if (args.createLead && !args.orgId) {
    throw new Error('--create-lead requires --org-id so records cannot cross tenant boundaries')
  }
  if ((args.notifyEmail || args.notifyPhone) && !args.createLead) {
    throw new Error('Lead notifications require --create-lead')
  }

  return {
    args,
    config,
    sector,
    phones,
    requestTimeoutMs: boundedSeconds(args.requestTimeoutSeconds, 15, '--request-timeout-seconds', 120),
    waitTimeoutMs: boundedSeconds(args.waitTimeoutSeconds, 900, '--wait-timeout-seconds', 3600),
  }
}

function usage() {
  return [
    'Usage:',
    '  Dry run: node scripts/vapi-outbound-sequence.js --sector dentistry --phones 8043601129',
    '  Live:    node scripts/vapi-outbound-sequence.js --sector dentistry --phones 8043601129 --execute --confirm-live-calls --consent-basis express',
    '',
    `Live runs are sequential and limited to ${MAX_LIVE_TARGETS} unique targets.`,
    'Consent basis: express | existing-business-relationship | manual-reviewed',
    'Lead persistence additionally requires --create-lead --org-id <organization-id>.',
  ].join('\n')
}

function providerErrorSummary(data) {
  const raw = typeof data === 'string' ? data : JSON.stringify(data)
  return String(raw || 'no response body')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(/(token|secret|authorization|api[_-]?key)(["'\s]*[:=]["'\s]*)[^\s,}"']+/gi, '$1$2[redacted]')
    .slice(0, 240)
}

async function vapi(requestPath, options = {}, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${VAPI_API_URL}${requestPath}`, {
      ...options,
      signal: controller.signal,
    })
    const text = await response.text()
    let data = text
    try {
      data = text ? JSON.parse(text) : null
    } catch {}
    if (!response.ok) {
      throw new Error(`${options.method || 'GET'} ${requestPath} failed (${response.status}): ${providerErrorSummary(data)}`)
    }
    return data
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`${options.method || 'GET'} ${requestPath} timed out after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function required(value, message) {
  if (!value) throw new Error(message)
  return value
}

function appendAuditEvent(filePath, event) {
  const target = path.resolve(filePath)
  const directory = path.dirname(target)
  if (fs.existsSync(target)) {
    const targetStats = fs.lstatSync(target)
    if (targetStats.isSymbolicLink() || !targetStats.isFile()) {
      throw new Error(`Audit path must be a regular file, not a link or special file: ${target}`)
    }
  }
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 })
  if (fs.lstatSync(directory).isSymbolicLink()) {
    throw new Error(`Audit directory may not be a symbolic link: ${directory}`)
  }
  const descriptor = fs.openSync(target, 'a', 0o600)
  try {
    fs.fchmodSync(descriptor, 0o600)
    fs.writeSync(descriptor, `${JSON.stringify({ version: 1, at: new Date().toISOString(), ...event })}\n`)
    fs.fsyncSync(descriptor)
  } finally {
    fs.closeSync(descriptor)
  }
}

function getPrisma() {
  if (!prisma) {
    const { PrismaClient } = require('@prisma/client')
    prisma = new PrismaClient()
  }
  return prisma
}

async function createOrUpdateLocalLead(params, database) {
  const db = database || getPrisma()
  const organization = await db.organization.findUnique({
    where: { id: params.orgId },
    select: { id: true },
  })
  if (!organization) throw new Error(`Organization not found: ${params.orgId}`)

  const marker = `[vapi-call:${params.callId}]`
  const description = [
    marker,
    'LuranAI Vapi outbound call lead',
    `Sector: ${params.sector}`,
    `Phone: ${params.phone}`,
    `Vapi call id: ${params.callId}`,
    `Consent basis: ${params.consentBasis}`,
    `Created by: scripts/vapi-outbound-sequence.js`,
  ].join('\n')

  const existingLead = await db.contact.findFirst({
    where: { phone: params.phone, orgId: params.orgId },
    orderBy: { updatedAt: 'desc' },
  })
  if (existingLead?.notes?.includes(marker)) {
    return { id: existingLead.id, created: false, idempotent: true, contact: existingLead }
  }

  if (existingLead) {
    const existingTags = Array.isArray(existingLead.tags) ? existingLead.tags : []
    const contact = await db.contact.update({
      where: { id: existingLead.id },
      data: {
        firstName: params.firstName || existingLead.firstName,
        lastName: params.lastName || existingLead.lastName,
        company: params.company || existingLead.company,
        email: params.email || existingLead.email,
        industry: existingLead.industry || params.sector,
        source: existingLead.source || 'outbound-call',
        tags: [...new Set([...existingTags, 'vapi-outbound', params.sector])],
        notes: existingLead.notes ? `${existingLead.notes}\n\n${description}` : description,
      },
    })
    return { id: contact.id, created: false, idempotent: false, contact }
  }

  const contact = await db.contact.create({
    data: {
      firstName: params.firstName || 'Unknown',
      lastName: params.lastName || 'Caller',
      company: params.company,
      email: params.email,
      phone: params.phone,
      industry: params.sector,
      source: 'outbound-call',
      status: 'lead',
      tags: ['vapi-outbound', 'lead', params.sector],
      notes: description,
      orgId: params.orgId,
    },
  })
  return { id: contact.id, created: true, idempotent: false, contact }
}

function twilioFromNumber(env, args, sector) {
  const sectorKey = `TWILIO_FROM_NUMBER_${String(sector).toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`
  const from = args.twilioFromNumber || env[sectorKey] || env.TWILIO_FROM_NUMBER || env.TWILIO_PHONE_NUMBER || env.TWILIO_VOICE_NUMBER
  return toE164(required(from, `Twilio SMS requires --twilio-from-number, ${sectorKey}, TWILIO_FROM_NUMBER, TWILIO_PHONE_NUMBER, or TWILIO_VOICE_NUMBER`))
}

async function sendLeadTwilioSms(env, args, to, message, params) {
  const accountSid = required(env.TWILIO_ACCOUNT_SID, 'TWILIO_ACCOUNT_SID is missing')
  const authToken = required(env.TWILIO_AUTH_TOKEN, 'TWILIO_AUTH_TOKEN is missing')
  const from = twilioFromNumber(env, args, params.sector)
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: from,
      To: to,
      Body: message,
    }),
  })
  const text = await response.text()
  let data = text
  try {
    data = text ? JSON.parse(text) : null
  } catch {}
  if (!response.ok) {
    const detail = providerErrorSummary(data)
    if (data?.code === 20003) {
      throw new Error(`Twilio authentication failed. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env. Use the Account SID that starts with "AC" and its Auth Token from the Twilio Console. Detail: ${detail}`)
    }
    throw new Error(`Twilio SMS failed (${response.status}) from "${from}" to "${to}": ${detail}`)
  }
  return { from, data }
}

async function sendLeadEmail(env, to, subject, text) {
  if (env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.LEAD_NOTIFY_EMAIL_FROM || env.EMAIL_FROM || 'LuranAI <onboarding@resend.dev>',
        to: [to],
        subject,
        text,
      }),
    })
    const body = await response.text()
    if (!response.ok) throw new Error(`Resend email failed (${response.status}): ${providerErrorSummary(body)}`)
    return body ? JSON.parse(body) : null
  }

  if (env.SENDGRID_API_KEY) {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: required(env.LEAD_NOTIFY_EMAIL_FROM || env.EMAIL_FROM, 'SendGrid email requires LEAD_NOTIFY_EMAIL_FROM or EMAIL_FROM') },
        subject,
        content: [{ type: 'text/plain', value: text }],
      }),
    })
    const body = await response.text()
    if (!response.ok) throw new Error(`SendGrid email failed (${response.status}): ${providerErrorSummary(body)}`)
    return { success: true }
  }

  throw new Error('Email notification requires RESEND_API_KEY or SENDGRID_API_KEY')
}

async function notifyLeadCreated(env, args, params) {
  const subject = `New lead: ${params.phone}`
  const message = [
    `New Postgres lead ${params.created ? 'created' : 'updated'} for ${params.phone}.`,
    `Sector: ${params.sector}`,
    `Lead ID: ${params.leadId}`,
    `Vapi call ID: ${params.callId}`,
  ].join('\n')

  if (args.notifyPhone) {
    const sms = await sendLeadTwilioSms(env, args, toE164(args.notifyPhone), message, params)
    console.log(`  Twilio SMS notification sent from ${sms.from} to ${toE164(args.notifyPhone)}`)
  }
  if (args.notifyEmail) {
    await sendLeadEmail(env, args.notifyEmail, subject, message)
    console.log(`  email notification sent to ${args.notifyEmail}`)
  }
}

async function getPhoneNumberId(apiKey, sector, fallbackId, timeoutMs) {
  const config = sectorPrompts[sector]
  const names = config?.names || [sector]
  const raw = await vapi('/phone-number', {
    headers: { Authorization: `Bearer ${apiKey}` },
  }, timeoutMs)
  const phoneNumbers = Array.isArray(raw) ? raw : (raw?.results || raw?.data || [])
  const match = phoneNumbers.find((phone) =>
    phone.provider === 'vapi' &&
    names.includes(String(phone.name || '').toLowerCase()) &&
    phone.id
  )
  if (match?.id) return match.id
  if (fallbackId) return fallbackId

  const available = phoneNumbers
    .filter((phone) => phone.provider === 'vapi' && phone.name)
    .map((phone) => phone.name)
    .join(', ')
  throw new Error(
    `No Vapi phone number matched sector "${sector}". Set VAPI_PHONE_NUMBER_ID or rename a Vapi phone number to one of: ${names.join(', ')}${available ? `. Available Vapi names: ${available}` : ''}`
  )
}

async function waitForCallEnd(apiKey, callId, waitTimeoutMs, requestTimeoutMs) {
  const deadline = Date.now() + waitTimeoutMs
  for (;;) {
    if (Date.now() >= deadline) {
      process.stdout.write('\n')
      throw new Error(`Call ${callId} did not reach a terminal status within ${waitTimeoutMs / 1000} seconds. Verify or cancel it in Vapi before starting another run.`)
    }
    const call = await vapi(`/call/${callId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    }, requestTimeoutMs)
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
  const args = parseArgs(process.argv)
  if (args.help) {
    console.log(usage())
    return
  }

  const plan = buildPlan(args)
  console.log(`Sector: ${plan.sector}`)
  console.log(`Targets (${plan.phones.length}): ${plan.phones.join(', ')}`)
  if (!args.execute) {
    console.log('Offline dry run only: no credentials, database, or network were accessed.')
    console.log('Add --execute --confirm-live-calls --consent-basis <basis> to place live calls.')
    return plan
  }

  const env = readEnv()
  Object.assign(process.env, env)
  const apiKey = required(env.VAPI_API_KEY, 'VAPI_API_KEY is missing from the environment or an ignored local env file')
  const fallbackPhoneNumberId = env.VAPI_PHONE_NUMBER_ID
  if (args.createLead && !env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing. Postgres lead creation requires DATABASE_URL in the environment or an ignored local env file')
  }

  const auditFile = args.auditFile || env.VAPI_AUDIT_FILE || DEFAULT_AUDIT_FILE
  const runId = crypto.randomUUID()
  const phoneNumberId = await getPhoneNumberId(
    apiKey,
    plan.sector,
    fallbackPhoneNumberId,
    plan.requestTimeoutMs
  )
  console.log(`Vapi phoneNumberId: ${phoneNumberId}`)
  console.log(`Consent basis: ${args.consentBasis}`)
  console.log(`Operational audit: ${path.resolve(auditFile)}`)
  if (args.createLead) console.log(`Tenant-scoped Postgres lead creation: enabled for ${args.orgId}`)

  for (const customerNumber of plan.phones) {
    console.log(`Calling ${customerNumber}...`)

    appendAuditEvent(auditFile, {
      event: 'call_requested', runId, phone: customerNumber,
      sector: plan.sector, consentBasis: args.consentBasis,
    })

    let call
    try {
      call = await vapi('/call', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumberId,
          customer: { number: customerNumber },
          assistant: {
            name: plan.config.assistantName,
            firstMessage: plan.config.firstMessage,
            model: {
              provider: 'openai',
              model: 'gpt-4o-mini',
              messages: [{ role: 'system', content: plan.config.prompt }],
            },
            voice: {
              provider: 'azure',
              voiceId: 'en-US-EmmaNeural',
            },
          },
        }),
      }, plan.requestTimeoutMs)
    } catch (error) {
      appendAuditEvent(auditFile, {
        event: 'call_failed', runId, phone: customerNumber,
        sector: plan.sector, reason: providerErrorSummary(error?.message),
      })
      throw error
    }

    if (!call?.id || typeof call.id !== 'string') {
      appendAuditEvent(auditFile, {
        event: 'call_failed', runId, phone: customerNumber,
        sector: plan.sector, reason: 'Vapi response did not include a call id',
      })
      throw new Error('Vapi response did not include a call id; stopping before the next target')
    }

    console.log(`  call id: ${call.id}`)
    appendAuditEvent(auditFile, {
      event: 'call_created', runId, phone: customerNumber,
      sector: plan.sector, callId: call.id,
    })
    if (args.createLead) {
      let lead
      try {
        lead = await createOrUpdateLocalLead({
          sector: plan.sector,
          phone: customerNumber,
          callId: call.id,
          consentBasis: args.consentBasis,
          orgId: args.orgId,
          company: args.leadCompany,
          firstName: args.leadFirstName,
          lastName: args.leadLastName,
          email: args.leadEmail,
        })
      } catch (error) {
        appendAuditEvent(auditFile, {
          event: 'lead_persistence_failed', runId, phone: customerNumber,
          sector: plan.sector, callId: call.id, reason: providerErrorSummary(error?.message),
        })
        throw new Error(`Call ${call.id} was created, but tenant-scoped lead persistence failed. Reconcile this call before retrying: ${error.message}`)
      }
      console.log(`  Postgres lead ${lead.created ? 'created' : 'updated'}: ${lead.id}`)
      appendAuditEvent(auditFile, {
        event: 'lead_persisted', runId, phone: customerNumber,
        sector: plan.sector, callId: call.id, leadId: lead.id,
        orgId: args.orgId, created: lead.created, idempotent: lead.idempotent,
      })
      if (args.notifyEmail || args.notifyPhone) {
        try {
          await notifyLeadCreated(env, args, {
            sector: plan.sector,
            phone: customerNumber,
            callId: call.id,
            leadId: lead.id,
            created: lead.created,
          })
        } catch (error) {
          console.warn(`  notification failed: ${error.message}`)
          appendAuditEvent(auditFile, {
            event: 'notification_failed', runId, phone: customerNumber,
            sector: plan.sector, callId: call.id, reason: providerErrorSummary(error?.message),
          })
        }
      }
    }
    if (args.wait) {
      try {
        const terminalCall = await waitForCallEnd(
          apiKey,
          call.id,
          plan.waitTimeoutMs,
          plan.requestTimeoutMs
        )
        appendAuditEvent(auditFile, {
          event: 'call_terminal', runId, phone: customerNumber,
          sector: plan.sector, callId: call.id, status: terminalCall.status,
        })
      } catch (error) {
        appendAuditEvent(auditFile, {
          event: 'status_polling_failed', runId, phone: customerNumber,
          sector: plan.sector, callId: call.id, reason: providerErrorSummary(error?.message),
        })
        throw error
      }
    }
  }

  return plan
}

async function runCli() {
  try {
    await main()
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  } finally {
    if (prisma) await prisma.$disconnect()
  }
}

if (require.main === module) runCli()

module.exports = {
  CONSENT_BASES,
  MAX_LIVE_TARGETS,
  appendAuditEvent,
  buildPlan,
  createOrUpdateLocalLead,
  parseArgs,
  providerErrorSummary,
  readEnvFile,
  toE164,
  toSlug,
  usage,
}
