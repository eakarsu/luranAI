import prisma from '@/lib/prisma'

export interface SalesforceRecordRef {
  id: string
  type: 'Lead' | 'Contact' | 'Account'
  name?: string
  company?: string
  email?: string
  phone?: string
  ownerId?: string
  accountId?: string
  accountName?: string
  status?: string
}

export interface SalesforceLookupResult {
  lead?: SalesforceRecordRef
  contact?: SalesforceRecordRef
  account?: SalesforceRecordRef
}

interface SalesforceConfig {
  instanceUrl?: string
  accessToken?: string
  refreshToken?: string
  clientId?: string
  clientSecret?: string
  loginUrl: string
  apiVersion: string
  leadSource: string
  campaignId?: string
  defaultOwnerId?: string
  handoffOwnerId?: string
  qualifiedLeadStatus: string
  contactedLeadStatus: string
}

export interface SalesforceCallOutcomeInput {
  orgId?: string | null
  phoneNumber: string
  email?: string | null
  company?: string | null
  callSid: string
  provider: string
  outcome: string
  duration: number
  transcript?: string | null
  conversationGoal?: string | null
  industry?: string | null
  agentName?: string | null
  existingContext?: SalesforceLookupResult
}

export interface SalesforceSyncResult {
  enabled: boolean
  qualified?: boolean
  leadId?: string
  contactId?: string
  accountId?: string
  taskId?: string
  campaignMemberId?: string
  routedOwnerId?: string
  error?: string
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function normalizeInstanceUrl(value?: string) {
  if (!value) return undefined
  return value.replace(/\/+$/, '')
}

async function getConfig(orgId?: string | null): Promise<SalesforceConfig | null> {
  const integration = orgId
    ? await prisma.integration.findFirst({
        where: { provider: 'salesforce', status: 'active', orgId },
        orderBy: { updatedAt: 'desc' },
      }) || await prisma.integration.findFirst({
        where: { provider: 'salesforce', status: 'active', orgId: null },
        orderBy: { updatedAt: 'desc' },
      })
    : await prisma.integration.findFirst({
        where: { provider: 'salesforce', status: 'active' },
        orderBy: { updatedAt: 'desc' },
      })

  const stored = (integration?.config || {}) as Record<string, unknown>
  const config: SalesforceConfig = {
    instanceUrl: normalizeInstanceUrl(process.env.SALESFORCE_INSTANCE_URL || asString(stored.instanceUrl)),
    accessToken: process.env.SALESFORCE_ACCESS_TOKEN || asString(stored.accessToken),
    refreshToken: process.env.SALESFORCE_REFRESH_TOKEN || asString(stored.refreshToken),
    clientId: process.env.SALESFORCE_CLIENT_ID || asString(stored.clientId),
    clientSecret: process.env.SALESFORCE_CLIENT_SECRET || asString(stored.clientSecret),
    loginUrl: normalizeInstanceUrl(process.env.SALESFORCE_LOGIN_URL || asString(stored.loginUrl)) || 'https://login.salesforce.com',
    apiVersion: process.env.SALESFORCE_API_VERSION || asString(stored.apiVersion) || 'v61.0',
    leadSource: process.env.SALESFORCE_LEAD_SOURCE || asString(stored.leadSource) || 'LuranAI Voice Agent',
    campaignId: process.env.SALESFORCE_CAMPAIGN_ID || asString(stored.campaignId),
    defaultOwnerId: process.env.SALESFORCE_DEFAULT_OWNER_ID || asString(stored.defaultOwnerId),
    handoffOwnerId: process.env.SALESFORCE_HANDOFF_OWNER_ID || asString(stored.handoffOwnerId),
    qualifiedLeadStatus: process.env.SALESFORCE_QUALIFIED_LEAD_STATUS || asString(stored.qualifiedLeadStatus) || 'Working - Contacted',
    contactedLeadStatus: process.env.SALESFORCE_CONTACTED_LEAD_STATUS || asString(stored.contactedLeadStatus) || 'Working - Contacted',
  }

  if (!config.instanceUrl || (!config.accessToken && !(config.refreshToken && config.clientId && config.clientSecret))) {
    return null
  }

  return config
}

async function getAccessToken(config: SalesforceConfig) {
  if (config.accessToken) return config.accessToken
  if (!config.refreshToken || !config.clientId || !config.clientSecret) return null

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: config.refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  })

  const response = await fetch(`${config.loginUrl}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Salesforce token refresh failed: ${response.status} ${detail.slice(0, 160)}`)
  }

  const json = await response.json()
  if (!json.access_token) throw new Error('Salesforce token refresh response did not include access_token')
  return json.access_token as string
}

async function salesforceFetch<T>(
  config: SalesforceConfig,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken(config)
  if (!token) throw new Error('Salesforce is not configured with an access token or refresh token')

  const response = await fetch(`${config.instanceUrl}/services/data/${config.apiVersion}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Salesforce request failed: ${response.status} ${detail.slice(0, 220)}`)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

function soql(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function phoneTerms(phone?: string | null) {
  const raw = asString(phone || '')
  if (!raw) return []
  const digits = raw.replace(/\D/g, '')
  const terms = [raw]
  if (digits.length >= 7) terms.push(digits.slice(-10))
  return Array.from(new Set(terms))
}

async function query<T>(config: SalesforceConfig, soqlQuery: string): Promise<T[]> {
  const result = await salesforceFetch<{ records?: T[] }>(
    config,
    `/query?q=${encodeURIComponent(soqlQuery)}`
  )
  return result.records || []
}

function personWhere(phone?: string | null, email?: string | null) {
  const clauses: string[] = []
  for (const term of phoneTerms(phone)) {
    clauses.push(`Phone LIKE '%${soql(term)}%'`)
    clauses.push(`MobilePhone LIKE '%${soql(term)}%'`)
  }
  if (email) clauses.push(`Email = '${soql(email)}'`)
  return clauses.length ? clauses.join(' OR ') : null
}

export async function lookupSalesforceRecords(params: {
  orgId?: string | null
  phone?: string | null
  email?: string | null
  company?: string | null
}): Promise<SalesforceLookupResult | null> {
  const config = await getConfig(params.orgId)
  if (!config) return null

  const result: SalesforceLookupResult = {}
  const where = personWhere(params.phone, params.email)

  if (where) {
    const contacts = await query<any>(
      config,
      `SELECT Id, Name, FirstName, LastName, Email, Phone, MobilePhone, OwnerId, AccountId, Account.Name FROM Contact WHERE ${where} LIMIT 1`
    )
    const contact = contacts[0]
    if (contact) {
      result.contact = {
        id: contact.Id,
        type: 'Contact',
        name: contact.Name,
        email: contact.Email,
        phone: contact.Phone || contact.MobilePhone,
        ownerId: contact.OwnerId,
        accountId: contact.AccountId,
        accountName: contact.Account?.Name,
      }
      if (contact.AccountId) {
        result.account = {
          id: contact.AccountId,
          type: 'Account',
          name: contact.Account?.Name,
        }
      }
    }

    const leads = await query<any>(
      config,
      `SELECT Id, Name, FirstName, LastName, Company, Email, Phone, MobilePhone, Status, OwnerId FROM Lead WHERE IsConverted = false AND (${where}) LIMIT 1`
    )
    const lead = leads[0]
    if (lead) {
      result.lead = {
        id: lead.Id,
        type: 'Lead',
        name: lead.Name,
        company: lead.Company,
        email: lead.Email,
        phone: lead.Phone || lead.MobilePhone,
        ownerId: lead.OwnerId,
        status: lead.Status,
      }
    }
  }

  if (!result.account && params.company) {
    const accounts = await query<any>(
      config,
      `SELECT Id, Name, Phone, OwnerId FROM Account WHERE Name LIKE '%${soql(params.company)}%' LIMIT 1`
    )
    const account = accounts[0]
    if (account) {
      result.account = {
        id: account.Id,
        type: 'Account',
        name: account.Name,
        phone: account.Phone,
        ownerId: account.OwnerId,
      }
    }
  }

  return result.lead || result.contact || result.account ? result : null
}

export function formatSalesforceContextForPrompt(context?: SalesforceLookupResult | null) {
  if (!context) return ''
  const lines = ['Salesforce CRM context for this caller:']
  if (context.contact) {
    lines.push(`- Existing Contact: ${context.contact.name || context.contact.id}${context.contact.accountName ? ` at ${context.contact.accountName}` : ''}`)
  }
  if (context.lead) {
    lines.push(`- Existing Lead: ${context.lead.name || context.lead.id}${context.lead.status ? ` (${context.lead.status})` : ''}`)
  }
  if (context.account) {
    lines.push(`- Account: ${context.account.name || context.account.id}`)
  }
  lines.push('- Use this context naturally; do not mention internal record IDs to the caller.')
  return lines.join('\n')
}

function hasQualifiedIntent(text: string) {
  return /\b(qualified|demo|book|schedule|appointment|interested|pricing|quote|proposal|trial|buy|purchase|order|sign up|follow[- ]?up|call me|contact me|sales rep|handoff|transfer)\b/i.test(text)
}

function needsHumanOwner(text: string) {
  return /\b(handoff|transfer|sales rep|human|agent|demo|proposal|pricing|quote|contract|urgent|escalat)\b/i.test(text)
}

function summarizeForSalesforce(input: SalesforceCallOutcomeInput, qualified: boolean) {
  const transcript = input.transcript?.trim()
  const header = [
    `LuranAI voice call`,
    `Call SID: ${input.callSid}`,
    `Provider: ${input.provider}`,
    `Outcome: ${input.outcome}`,
    `Duration: ${input.duration}s`,
    input.conversationGoal ? `Goal: ${input.conversationGoal}` : null,
    qualified ? 'Qualification: qualified intent detected' : 'Qualification: no qualified intent detected',
  ].filter(Boolean).join('\n')

  return transcript
    ? `${header}\n\nCall summary notes:\n${transcript.slice(0, 24000)}`
    : header
}

async function createSalesforceRecord(config: SalesforceConfig, objectName: string, fields: Record<string, unknown>) {
  return salesforceFetch<{ id: string; success: boolean; errors: unknown[] }>(
    config,
    `/sobjects/${objectName}`,
    { method: 'POST', body: JSON.stringify(fields) }
  )
}

async function updateSalesforceRecord(config: SalesforceConfig, objectName: string, id: string, fields: Record<string, unknown>) {
  await salesforceFetch<void>(
    config,
    `/sobjects/${objectName}/${id}`,
    { method: 'PATCH', body: JSON.stringify(fields) }
  )
}

export async function syncSalesforceCallOutcome(input: SalesforceCallOutcomeInput): Promise<SalesforceSyncResult> {
  const config = await getConfig(input.orgId)
  if (!config) return { enabled: false }

  try {
    const context = input.existingContext || await lookupSalesforceRecords({
      orgId: input.orgId,
      phone: input.phoneNumber,
      email: input.email,
      company: input.company,
    }) || {}

    const transcript = input.transcript || ''
    const qualified = input.outcome === 'completed' && hasQualifiedIntent(`${input.conversationGoal || ''}\n${transcript}`)
    const routedOwnerId = needsHumanOwner(`${input.conversationGoal || ''}\n${transcript}`)
      ? (config.handoffOwnerId || config.defaultOwnerId)
      : config.defaultOwnerId

    let leadId = context.lead?.id
    const contactId = context.contact?.id
    const accountId = context.account?.id || context.contact?.accountId
    const description = summarizeForSalesforce(input, qualified)
    let campaignMemberId: string | undefined

    if (leadId) {
      await updateSalesforceRecord(config, 'Lead', leadId, {
        Status: qualified ? config.qualifiedLeadStatus : config.contactedLeadStatus,
        ...(routedOwnerId ? { OwnerId: routedOwnerId } : {}),
        Description: description.slice(0, 32000),
      })
    } else if (!contactId && qualified) {
      const lead = await createSalesforceRecord(config, 'Lead', {
        FirstName: 'Unknown',
        LastName: 'Caller',
        Company: input.company || 'Unknown Company',
        Phone: input.phoneNumber,
        Email: input.email || undefined,
        Status: config.qualifiedLeadStatus,
        LeadSource: config.leadSource,
        Description: description.slice(0, 32000),
        ...(routedOwnerId ? { OwnerId: routedOwnerId } : {}),
      })
      leadId = lead.id

      if (config.campaignId) {
        try {
          const campaignMember = await createSalesforceRecord(config, 'CampaignMember', {
            CampaignId: config.campaignId,
            LeadId: leadId,
            Status: 'Responded',
          })
          campaignMemberId = campaignMember.id
        } catch (error) {
          console.warn('Salesforce CampaignMember creation failed:', error)
        }
      }
    }

    const taskTargetId = contactId || leadId
    let taskId: string | undefined
    if (taskTargetId) {
      const task = await createSalesforceRecord(config, 'Task', {
        WhoId: taskTargetId,
        WhatId: accountId || undefined,
        Subject: `LuranAI call ${input.outcome}`,
        Status: 'Completed',
        Priority: qualified ? 'High' : 'Normal',
        ActivityDate: new Date().toISOString().slice(0, 10),
        Description: description.slice(0, 32000),
        ...(routedOwnerId ? { OwnerId: routedOwnerId } : {}),
      })
      taskId = task.id
    }

    return {
      enabled: true,
      qualified,
      leadId,
      contactId,
      accountId,
      taskId,
      campaignMemberId,
      routedOwnerId,
    }
  } catch (error: any) {
    console.error('Salesforce call outcome sync failed:', error)
    return { enabled: true, error: error.message || 'Salesforce sync failed' }
  }
}

export async function testSalesforceConnection(orgId?: string | null) {
  const config = await getConfig(orgId)
  if (!config) return { connected: false, configured: false }
  const identity = await salesforceFetch<any>(config, '/')
  return {
    connected: true,
    configured: true,
    instanceUrl: config.instanceUrl,
    apiVersion: config.apiVersion,
    resources: Object.keys(identity || {}),
  }
}
