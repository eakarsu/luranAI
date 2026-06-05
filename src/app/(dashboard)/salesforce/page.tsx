'use client'

import { useMemo, useState } from 'react'
import Modal from '@/components/ui/Modal'

type CapabilityKey = 'lead' | 'contact' | 'account' | 'task' | 'notes' | 'status' | 'routing' | 'campaign'

type FeatureRecord = {
  id: string
  fields: Record<string, string>
}

const capabilities: {
  key: CapabilityKey
  label: string
  value: string
  action: string
}[] = [
  { key: 'lead', label: 'Lead creation', value: 'Create a Lead after a qualified call', action: 'Create and qualify' },
  { key: 'contact', label: 'Contact lookup', value: 'Find caller context by phone or email', action: 'Lookup records' },
  { key: 'account', label: 'Account lookup', value: 'Find account context from Contact or company', action: 'Lookup accounts' },
  { key: 'task', label: 'Task logging', value: 'Create completed Salesforce Tasks', action: 'Log activity' },
  { key: 'notes', label: 'Call summary notes', value: 'Attach transcript summary to Task notes', action: 'Sync notes' },
  { key: 'status', label: 'Lead status updates', value: 'Move Leads to contacted or qualified', action: 'Update status' },
  { key: 'routing', label: 'Owner routing', value: 'Assign Leads and Tasks to owners or queues', action: 'Review rules' },
  { key: 'campaign', label: 'Campaign source attribution', value: 'Apply LeadSource and CampaignMember values', action: 'Map source' },
]

const featureFields: Record<CapabilityKey, string[]> = {
  lead: ['Lead Name', 'Company', 'Phone', 'Email', 'Source', 'Status', 'Owner', 'Campaign', 'Last Call', 'Qualification Score'],
  contact: ['Contact Name', 'Account', 'Phone', 'Email', 'Status', 'Owner', 'Last Activity', 'Match Source', 'Salesforce ID'],
  account: ['Account Name', 'Industry', 'Phone', 'Website', 'Tier', 'Owner', 'Open Opportunities', 'Last Activity', 'Salesforce ID'],
  task: ['Subject', 'Who', 'Related To', 'Status', 'Priority', 'Due Date', 'Call SID', 'Owner', 'Outcome'],
  notes: ['Call SID', 'Linked Record', 'Summary', 'Sentiment', 'Next Step', 'Transcript Snippet', 'Created By', 'Note Status'],
  status: ['Lead', 'Company', 'Current Status', 'New Status', 'Reason', 'Updated By', 'Next Follow-up', 'Call Outcome'],
  routing: ['Rule', 'Trigger', 'Owner or Queue', 'Priority', 'Territory', 'Industry', 'Active', 'Fallback Owner'],
  campaign: ['Campaign', 'Lead Source', 'Member Status', 'Attribution', 'First Touch', 'Last Touch', 'Channel', 'Source Detail'],
}

const initialRecords: Record<CapabilityKey, FeatureRecord[]> = {
  lead: [
    {
      id: 'lead-1001',
      fields: {
        'Lead Name': 'Maya Chen',
        Company: 'Northstar Dental Group',
        Phone: '+14155550118',
        Email: 'maya.chen@northstardental.example',
        Source: 'AI voice qualified call',
        Status: 'Qualified',
        Owner: 'Bay Area Sales Queue',
        Campaign: 'Dental Awareness Month',
        'Last Call': '2026-05-14 10:42',
        'Qualification Score': '92',
      },
    },
    {
      id: 'lead-1002',
      fields: {
        'Lead Name': 'Jordan Patel',
        Company: 'Patel Family Dental',
        Phone: '+14155550131',
        Email: 'jordan@pateldental.example',
        Source: 'Website callback',
        Status: 'Demo Scheduled',
        Owner: 'Avery Robinson',
        Campaign: 'Invisalign Special Offer',
        'Last Call': '2026-05-14 13:15',
        'Qualification Score': '86',
      },
    },
    {
      id: 'lead-1003',
      fields: {
        'Lead Name': 'Sofia Martinez',
        Company: 'Mission Orthodontics',
        Phone: '+14155550144',
        Email: 'sofia@missionortho.example',
        Source: 'Google Ads call extension',
        Status: 'Needs Follow-up',
        Owner: 'Dental SDR Queue',
        Campaign: 'Kids Dental Fun Day',
        'Last Call': '2026-05-15 09:20',
        'Qualification Score': '74',
      },
    },
  ],
  contact: [
    {
      id: 'contact-2001',
      fields: {
        'Contact Name': 'Elena Brooks',
        Account: 'Brooks Hospitality',
        Phone: '+14155550202',
        Email: 'elena@brookshotels.example',
        Status: 'Active customer',
        Owner: 'Morgan Ellis',
        'Last Activity': 'Task logged from voice call',
        'Match Source': 'Phone exact match',
        'Salesforce ID': '0038c00002LUR01',
      },
    },
    {
      id: 'contact-2002',
      fields: {
        'Contact Name': 'Noah Kim',
        Account: 'Kim Auto Group',
        Phone: '+14155550216',
        Email: 'noah@kimauto.example',
        Status: 'Open opportunity',
        Owner: 'Auto Sales Queue',
        'Last Activity': 'Requested financing follow-up',
        'Match Source': 'Email exact match',
        'Salesforce ID': '0038c00002LUR02',
      },
    },
    {
      id: 'contact-2003',
      fields: {
        'Contact Name': 'Priya Shah',
        Account: 'Shah Health Clinic',
        Phone: '+14155550228',
        Email: 'priya@shahclinic.example',
        Status: 'Needs follow-up',
        Owner: 'Healthcare Success Queue',
        'Last Activity': 'Asked about telehealth routing',
        'Match Source': 'Company and phone match',
        'Salesforce ID': '0038c00002LUR03',
      },
    },
  ],
  account: [
    {
      id: 'account-3001',
      fields: {
        'Account Name': 'Northstar Dental Group',
        Industry: 'Dentistry',
        Phone: '+14155550118',
        Website: 'https://northstardental.example',
        Tier: 'Growth',
        Owner: 'Avery Robinson',
        'Open Opportunities': '2',
        'Last Activity': 'Qualified call from Maya Chen',
        'Salesforce ID': '0018c00002LUR11',
      },
    },
    {
      id: 'account-3002',
      fields: {
        'Account Name': 'Brooks Hospitality',
        Industry: 'Hospitality',
        Phone: '+14155550202',
        Website: 'https://brookshotels.example',
        Tier: 'Enterprise',
        Owner: 'Morgan Ellis',
        'Open Opportunities': '1',
        'Last Activity': 'Upsell discussion logged',
        'Salesforce ID': '0018c00002LUR12',
      },
    },
    {
      id: 'account-3003',
      fields: {
        'Account Name': 'Kim Auto Group',
        Industry: 'Car dealerships',
        Phone: '+14155550216',
        Website: 'https://kimauto.example',
        Tier: 'Mid-market',
        Owner: 'Auto Sales Queue',
        'Open Opportunities': '4',
        'Last Activity': 'Financing workflow demo requested',
        'Salesforce ID': '0018c00002LUR13',
      },
    },
  ],
  task: [
    {
      id: 'task-4001',
      fields: {
        Subject: 'Voice call follow-up: Maya Chen',
        Who: 'Maya Chen',
        'Related To': 'Northstar Dental Group',
        Status: 'Completed',
        Priority: 'High',
        'Due Date': '2026-05-14',
        'Call SID': 'CA_luran_1001',
        Owner: 'Bay Area Sales Queue',
        Outcome: 'Qualified and routed',
      },
    },
    {
      id: 'task-4002',
      fields: {
        Subject: 'Send demo scheduler link',
        Who: 'Jordan Patel',
        'Related To': 'Patel Family Dental',
        Status: 'Open',
        Priority: 'Normal',
        'Due Date': '2026-05-15',
        'Call SID': 'CA_luran_1002',
        Owner: 'Avery Robinson',
        Outcome: 'Demo requested',
      },
    },
    {
      id: 'task-4003',
      fields: {
        Subject: 'Human handoff requested',
        Who: 'Priya Shah',
        'Related To': 'Shah Health Clinic',
        Status: 'Open',
        Priority: 'High',
        'Due Date': '2026-05-15',
        'Call SID': 'CA_luran_1003',
        Owner: 'Healthcare Success Queue',
        Outcome: 'Needs human follow-up',
      },
    },
  ],
  notes: [
    {
      id: 'note-5001',
      fields: {
        'Call SID': 'CA_luran_1001',
        'Linked Record': 'Lead: Maya Chen',
        Summary: 'Caller wants AI voice coverage for missed appointment calls and after-hours qualification.',
        Sentiment: 'Positive',
        'Next Step': 'Send dental workflow demo times',
        'Transcript Snippet': 'We need something that can qualify callers before the front desk opens.',
        'Created By': 'LuranAI Voice Agent',
        'Note Status': 'Synced',
      },
    },
    {
      id: 'note-5002',
      fields: {
        'Call SID': 'CA_luran_1002',
        'Linked Record': 'Lead: Jordan Patel',
        Summary: 'Interested in routing Invisalign inquiries and sending SMS reminders after calls.',
        Sentiment: 'Interested',
        'Next Step': 'Book demo with practice manager',
        'Transcript Snippet': 'Can the AI tell when someone is asking about insurance coverage?',
        'Created By': 'LuranAI Voice Agent',
        'Note Status': 'Draft',
      },
    },
    {
      id: 'note-5003',
      fields: {
        'Call SID': 'CA_luran_1003',
        'Linked Record': 'Contact: Priya Shah',
        Summary: 'Existing customer asked for telehealth call triage and owner escalation rules.',
        Sentiment: 'Neutral',
        'Next Step': 'Route to success manager',
        'Transcript Snippet': 'I want urgent medical calls to go straight to the clinic team.',
        'Created By': 'LuranAI Voice Agent',
        'Note Status': 'Needs review',
      },
    },
  ],
  status: [
    {
      id: 'status-6001',
      fields: {
        Lead: 'Maya Chen',
        Company: 'Northstar Dental Group',
        'Current Status': 'Contacted',
        'New Status': 'Qualified',
        Reason: 'Buyer confirmed timeline and budget',
        'Updated By': 'Call outcome sync',
        'Next Follow-up': '2026-05-15',
        'Call Outcome': 'Qualified call',
      },
    },
    {
      id: 'status-6002',
      fields: {
        Lead: 'Sofia Martinez',
        Company: 'Mission Orthodontics',
        'Current Status': 'New',
        'New Status': 'Needs Follow-up',
        Reason: 'Asked for pricing details before demo',
        'Updated By': 'Call outcome sync',
        'Next Follow-up': '2026-05-16',
        'Call Outcome': 'Information requested',
      },
    },
    {
      id: 'status-6003',
      fields: {
        Lead: 'Liam Nguyen',
        Company: 'Sunset Dental Studio',
        'Current Status': 'Demo Scheduled',
        'New Status': 'Not Interested',
        Reason: 'Already signed with another vendor',
        'Updated By': 'Sales manager',
        'Next Follow-up': '2026-08-01',
        'Call Outcome': 'Closed for now',
      },
    },
  ],
  routing: [
    {
      id: 'route-7001',
      fields: {
        Rule: 'Qualified dental buyer',
        Trigger: 'Qualification Score >= 85',
        'Owner or Queue': 'Bay Area Sales Queue',
        Priority: 'High',
        Territory: 'California',
        Industry: 'Dentistry',
        Active: 'Yes',
        'Fallback Owner': 'Dental SDR Queue',
      },
    },
    {
      id: 'route-7002',
      fields: {
        Rule: 'Human handoff requested',
        Trigger: 'AI handoff flag = true',
        'Owner or Queue': 'Customer Success Queue',
        Priority: 'Urgent',
        Territory: 'All',
        Industry: 'Any',
        Active: 'Yes',
        'Fallback Owner': 'Operations Manager',
      },
    },
    {
      id: 'route-7003',
      fields: {
        Rule: 'Healthcare escalation',
        Trigger: 'Industry = health clinics and urgency = high',
        'Owner or Queue': 'Healthcare Success Queue',
        Priority: 'High',
        Territory: 'West',
        Industry: 'Health clinics',
        Active: 'Yes',
        'Fallback Owner': 'Healthcare Lead',
      },
    },
  ],
  campaign: [
    {
      id: 'campaign-8001',
      fields: {
        Campaign: 'Dental Awareness Month',
        'Lead Source': 'AI Voice Call',
        'Member Status': 'Responded',
        Attribution: 'First touch',
        'First Touch': 'Google Ads call extension',
        'Last Touch': 'Voice qualification',
        Channel: 'Voice',
        'Source Detail': 'After-hours missed-call callback',
      },
    },
    {
      id: 'campaign-8002',
      fields: {
        Campaign: 'Invisalign Special Offer',
        'Lead Source': 'Website Callback',
        'Member Status': 'Demo Scheduled',
        Attribution: 'Multi-touch',
        'First Touch': 'Landing page',
        'Last Touch': 'AI voice call',
        Channel: 'Voice and SMS',
        'Source Detail': 'Practice manager requested follow-up',
      },
    },
    {
      id: 'campaign-8003',
      fields: {
        Campaign: 'Telehealth Launch Campaign',
        'Lead Source': 'Customer expansion call',
        'Member Status': 'Follow-up Needed',
        Attribution: 'Last touch',
        'First Touch': 'Email campaign',
        'Last Touch': 'Routing request call',
        Channel: 'Voice',
        'Source Detail': 'Existing account expansion',
      },
    },
  ],
}

const seedPeople = [
  'Maya Chen',
  'Jordan Patel',
  'Sofia Martinez',
  'Elena Brooks',
  'Noah Kim',
  'Priya Shah',
  'Liam Nguyen',
  'Ava Thompson',
  'Ethan Rivera',
  'Isabella Moore',
  'Lucas Brown',
  'Mia Wilson',
  'Daniel Park',
  'Grace Lee',
  'Henry Adams',
]

const seedCompanies = [
  'Northstar Dental Group',
  'Patel Family Dental',
  'Mission Orthodontics',
  'Brooks Hospitality',
  'Kim Auto Group',
  'Shah Health Clinic',
  'Sunset Dental Studio',
  'Golden Gate Realty',
  'Harbor Collections',
  'Civic Health Partners',
  'Oceanview Hotels',
  'Pacific Auto Mall',
  'Bay Area Dental Care',
  'Market Street Bistro',
  'Valley Wellness Clinic',
]

const seedIndustries = [
  'Dentistry',
  'Dentistry',
  'Dentistry',
  'Hospitality',
  'Car dealerships',
  'Health clinics',
  'Dentistry',
  'Real estate',
  'Debt collection',
  'Health clinics',
  'Hospitality',
  'Car dealerships',
  'Dentistry',
  'Restaurants',
  'Health clinics',
]

const seedOwners = [
  'Bay Area Sales Queue',
  'Avery Robinson',
  'Dental SDR Queue',
  'Morgan Ellis',
  'Auto Sales Queue',
  'Healthcare Success Queue',
  'Dental SDR Queue',
  'Real Estate Sales Queue',
  'Collections Specialist Queue',
  'Healthcare Success Queue',
  'Hospitality Success Queue',
  'Auto Sales Queue',
  'Avery Robinson',
  'Restaurant Success Queue',
  'Healthcare Lead',
]

const seedCampaigns = [
  'Dental Awareness Month',
  'Invisalign Special Offer',
  'Kids Dental Fun Day',
  'Summer Getaway Packages',
  'Certified Pre-Owned Event',
  'Telehealth Launch Campaign',
  'Dental Awareness Month',
  'First-Time Buyer Webinar',
  'Hardship Program Awareness',
  'Telehealth Launch Campaign',
  'Loyalty Rewards Program',
  'Memorial Day Auto Sale',
  'Kids Dental Fun Day',
  "Mother's Day Brunch",
  'Annual Health Checkup Drive',
]

const statusCycle = ['New', 'Contacted', 'Qualified', 'Demo Scheduled', 'Needs Follow-up', 'Not Interested']
const priorityCycle = ['High', 'Normal', 'Urgent']
const sentimentCycle = ['Positive', 'Interested', 'Neutral', 'Concerned']
const sourceCycle = ['AI Voice Call', 'Website Callback', 'Google Ads call extension', 'Email campaign', 'Customer expansion call']

function seedEmail(name: string) {
  return `${name.toLowerCase().replace(/ /g, '.')}@example-crm.test`
}

function seedPhone(index: number) {
  return `+1415555${String(1000 + index).slice(-4)}`
}

function buildSeedRecord(key: CapabilityKey, index: number): FeatureRecord {
  const person = seedPeople[index]
  const company = seedCompanies[index]
  const industry = seedIndustries[index]
  const owner = seedOwners[index]
  const campaign = seedCampaigns[index]
  const phone = seedPhone(index)
  const email = seedEmail(person)
  const date = `2026-05-${String(14 + (index % 12)).padStart(2, '0')}`
  const score = String(68 + (index % 29))
  const salesforceId = `${key.toUpperCase().slice(0, 3)}8c00002LUR${String(index + 1).padStart(2, '0')}`
  const id = `${key}-${String(index + 1).padStart(4, '0')}`

  switch (key) {
    case 'lead':
      return {
        id,
        fields: {
          'Lead Name': person,
          Company: company,
          Phone: phone,
          Email: email,
          Source: sourceCycle[index % sourceCycle.length],
          Status: statusCycle[index % statusCycle.length],
          Owner: owner,
          Campaign: campaign,
          'Last Call': `${date} ${String(9 + (index % 8)).padStart(2, '0')}:15`,
          'Qualification Score': score,
        },
      }
    case 'contact':
      return {
        id,
        fields: {
          'Contact Name': person,
          Account: company,
          Phone: phone,
          Email: email,
          Status: index % 3 === 0 ? 'Active customer' : index % 3 === 1 ? 'Open opportunity' : 'Needs follow-up',
          Owner: owner,
          'Last Activity': `${statusCycle[index % statusCycle.length]} call logged on ${date}`,
          'Match Source': index % 2 === 0 ? 'Phone exact match' : 'Email exact match',
          'Salesforce ID': salesforceId,
        },
      }
    case 'account':
      return {
        id,
        fields: {
          'Account Name': company,
          Industry: industry,
          Phone: phone,
          Website: `https://${company.toLowerCase().replace(/[^a-z0-9]+/g, '')}.example`,
          Tier: index % 3 === 0 ? 'Enterprise' : index % 3 === 1 ? 'Growth' : 'Mid-market',
          Owner: owner,
          'Open Opportunities': String((index % 5) + 1),
          'Last Activity': `${person} call context refreshed`,
          'Salesforce ID': salesforceId,
        },
      }
    case 'task':
      return {
        id,
        fields: {
          Subject: `Voice call follow-up: ${person}`,
          Who: person,
          'Related To': company,
          Status: index % 4 === 0 ? 'Completed' : 'Open',
          Priority: priorityCycle[index % priorityCycle.length],
          'Due Date': date,
          'Call SID': `CA_luran_${String(1000 + index)}`,
          Owner: owner,
          Outcome: statusCycle[index % statusCycle.length],
        },
      }
    case 'notes':
      return {
        id,
        fields: {
          'Call SID': `CA_luran_${String(1000 + index)}`,
          'Linked Record': `${index % 2 === 0 ? 'Lead' : 'Contact'}: ${person}`,
          Summary: `${person} from ${company} discussed ${industry.toLowerCase()} call routing and follow-up needs.`,
          Sentiment: sentimentCycle[index % sentimentCycle.length],
          'Next Step': index % 2 === 0 ? 'Send demo times' : 'Route to owner for follow-up',
          'Transcript Snippet': `Caller asked how LuranAI handles ${industry.toLowerCase()} calls and Salesforce updates.`,
          'Created By': 'LuranAI Voice Agent',
          'Note Status': index % 3 === 0 ? 'Synced' : index % 3 === 1 ? 'Draft' : 'Needs review',
        },
      }
    case 'status':
      return {
        id,
        fields: {
          Lead: person,
          Company: company,
          'Current Status': statusCycle[index % statusCycle.length],
          'New Status': statusCycle[(index + 2) % statusCycle.length],
          Reason: index % 2 === 0 ? 'Buyer confirmed timeline and next step' : 'Caller requested more information',
          'Updated By': index % 2 === 0 ? 'Call outcome sync' : owner,
          'Next Follow-up': date,
          'Call Outcome': index % 2 === 0 ? 'Qualified call' : 'Follow-up requested',
        },
      }
    case 'routing':
      return {
        id,
        fields: {
          Rule: `${industry} ${index % 2 === 0 ? 'qualified buyer' : 'handoff'} routing`,
          Trigger: index % 2 === 0 ? 'Qualification Score >= 80' : 'AI handoff flag = true',
          'Owner or Queue': owner,
          Priority: priorityCycle[index % priorityCycle.length],
          Territory: index % 3 === 0 ? 'California' : index % 3 === 1 ? 'West' : 'All',
          Industry: industry,
          Active: index % 5 === 0 ? 'No' : 'Yes',
          'Fallback Owner': index % 2 === 0 ? 'Operations Manager' : 'Sales Manager',
        },
      }
    case 'campaign':
      return {
        id,
        fields: {
          Campaign: campaign,
          'Lead Source': sourceCycle[index % sourceCycle.length],
          'Member Status': index % 3 === 0 ? 'Responded' : index % 3 === 1 ? 'Demo Scheduled' : 'Follow-up Needed',
          Attribution: index % 3 === 0 ? 'First touch' : index % 3 === 1 ? 'Multi-touch' : 'Last touch',
          'First Touch': index % 2 === 0 ? 'Landing page' : 'Email campaign',
          'Last Touch': 'AI voice call',
          Channel: index % 2 === 0 ? 'Voice' : 'Voice and SMS',
          'Source Detail': `${company} ${industry.toLowerCase()} campaign call`,
        },
      }
  }
}

function expandRecords(key: CapabilityKey, records: FeatureRecord[]) {
  const generated = Array.from({ length: 15 }, (_, index) => buildSeedRecord(key, index))
  return records.length >= 15 ? records : generated
}

const seededRecords: Record<CapabilityKey, FeatureRecord[]> = {
  lead: expandRecords('lead', initialRecords.lead),
  contact: expandRecords('contact', initialRecords.contact),
  account: expandRecords('account', initialRecords.account),
  task: expandRecords('task', initialRecords.task),
  notes: expandRecords('notes', initialRecords.notes),
  status: expandRecords('status', initialRecords.status),
  routing: expandRecords('routing', initialRecords.routing),
  campaign: expandRecords('campaign', initialRecords.campaign),
}

function isLongField(field: string) {
  return ['Summary', 'Transcript Snippet', 'Reason', 'Source Detail'].includes(field)
}

function getColumnWidth(field: string, index: number) {
  if (index === 0) return 14
  if (field.includes('Email')) return 18
  if (field.includes('Owner') || field.includes('Queue') || field === 'Campaign') return 17
  if (field.includes('Source') || field.includes('Activity') || field.includes('Summary')) return 18
  if (field.includes('Transcript')) return 22
  if (field.includes('Status') || field.includes('Outcome')) return 12
  if (field.includes('Score') || field === 'Priority' || field === 'Active') return 8
  if (field.includes('Date') || field.includes('Call') || field.includes('Follow-up')) return 12
  return 13
}

export default function SalesforcePage() {
  const [selectedCapability, setSelectedCapability] = useState<CapabilityKey>('contact')
  const [records, setRecords] = useState<Record<CapabilityKey, FeatureRecord[]>>(seededRecords)
  const [search, setSearch] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<FeatureRecord | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [isEditingRecord, setIsEditingRecord] = useState(false)

  const selectedMeta = capabilities.find((item) => item.key === selectedCapability) || capabilities[1]
  const selectedFields = featureFields[selectedCapability]
  const columnWidths = selectedFields.map(getColumnWidth)
  const tableMinWidth = 9 + columnWidths.reduce((sum, width) => sum + width, 0)
  const filteredRecords = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return records[selectedCapability]
    return records[selectedCapability].filter((record) => {
      const haystack = [record.id, ...Object.keys(record.fields), ...Object.values(record.fields)].join(' ').toLowerCase()
      return haystack.includes(normalized)
    })
  }, [records, search, selectedCapability])

  function openFeature(key: CapabilityKey) {
    setSelectedCapability(key)
    setSearch('')
    setSelectedRecord(null)
    setDraft({})
    setIsEditingRecord(false)
  }

  function openRecord(record: FeatureRecord) {
    setSelectedRecord(record)
    setDraft({ ...record.fields })
    setIsEditingRecord(false)
  }

  function addRecord() {
    const nextId = `${selectedCapability}-${Date.now().toString(36)}`
    const fields = Object.fromEntries(selectedFields.map((field) => [field, field === selectedFields[0] ? `New ${selectedMeta.label}` : '']))
    const record = { id: nextId, fields }
    setRecords((prev) => ({
      ...prev,
      [selectedCapability]: [record, ...prev[selectedCapability]],
    }))
    setSelectedRecord(record)
    setDraft({ ...record.fields })
    setIsEditingRecord(true)
  }

  function saveRecord() {
    if (!selectedRecord) return
    const updatedRecord = { ...selectedRecord, fields: { ...draft } }
    setRecords((prev) => ({
      ...prev,
      [selectedCapability]: prev[selectedCapability].map((record) =>
        record.id === selectedRecord.id ? updatedRecord : record
      ),
    }))
    setSelectedRecord(updatedRecord)
    setIsEditingRecord(false)
  }

  function deleteRecord() {
    if (!selectedRecord) return
    setRecords((prev) => ({
      ...prev,
      [selectedCapability]: prev[selectedCapability].filter((record) => record.id !== selectedRecord.id),
    }))
    setSelectedRecord(null)
    setDraft({})
    setIsEditingRecord(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salesforce</h1>
          <p className="mt-1 text-sm text-gray-500">CRM actions connected to voice call outcomes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {capabilities.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => openFeature(item.key)}
            className={`rounded-lg border p-4 text-left shadow-sm transition ${
              selectedCapability === item.key
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100'
                : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
            }`}
          >
            <div className="text-sm font-semibold text-gray-900">{item.label}</div>
            <div className="mt-1 min-h-8 text-xs text-gray-500">{item.value}</div>
            <div className="mt-3 text-xs font-semibold text-primary-700">{item.action}</div>
          </button>
        ))}
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{selectedMeta.label} Records</h2>
            <p className="mt-1 text-sm text-gray-500">
              Search the shown fields, click a record to view all details in a centered popup, then edit or delete it.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${selectedMeta.label.toLowerCase()} fields`}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 xl:w-80"
            />
            <button
              type="button"
              onClick={addRecord}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Add Record
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed divide-y divide-gray-200 text-sm" style={{ minWidth: `${tableMinWidth}rem` }}>
              <colgroup>
                <col style={{ width: '9rem' }} />
                {columnWidths.map((width, index) => (
                  <col key={selectedFields[index]} style={{ width: `${width}rem` }} />
                ))}
              </colgroup>
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="sticky left-0 z-20 whitespace-nowrap bg-gray-50 px-4 py-3">Record ID</th>
                  {selectedFields.map((field, fieldIndex) => (
                    <th
                      key={field}
                      className={`whitespace-nowrap bg-gray-50 px-4 py-3 ${
                        fieldIndex === 0 ? 'sticky left-36 z-20 shadow-[1px_0_0_0_rgba(229,231,235,1)]' : ''
                      }`}
                    >
                      {field}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredRecords.map((record, index) => {
                  const rowBg = index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  return (
                    <tr
                      key={record.id}
                      onClick={() => openRecord(record)}
                      className={`cursor-pointer transition hover:bg-primary-50 ${rowBg}`}
                    >
                      <td className={`sticky left-0 z-10 whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500 ${rowBg}`}>
                        {record.id}
                      </td>
                      {selectedFields.map((field, fieldIndex) => {
                        const value = record.fields[field] || '-'
                        return (
                          <td
                            key={field}
                            title={value}
                            className={`whitespace-nowrap px-4 py-3 text-gray-700 ${
                              fieldIndex === 0 ? `sticky left-36 z-10 font-semibold text-gray-900 shadow-[1px_0_0_0_rgba(229,231,235,1)] ${rowBg}` : ''
                            }`}
                          >
                            <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{value}</span>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={selectedFields.length + 1} className="px-4 py-10 text-center text-sm text-gray-500">
                      No Salesforce records match this search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-500">
          Showing {filteredRecords.length} of {records[selectedCapability].length} rows
        </p>
      </section>

      <Modal
        isOpen={Boolean(selectedRecord)}
        onClose={() => {
          setSelectedRecord(null)
          setDraft({})
          setIsEditingRecord(false)
        }}
        title={selectedRecord ? `${selectedMeta.label}: ${selectedRecord.id}` : selectedMeta.label}
        maxWidthClass="max-w-4xl"
      >
        <div className="space-y-4">
          {isEditingRecord ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {selectedFields.map((field) => (
                <label key={field} className={`block ${isLongField(field) ? 'md:col-span-2' : ''}`}>
                  <span className="text-xs font-medium text-gray-600">{field}</span>
                  {isLongField(field) ? (
                    <textarea
                      value={draft[field] || ''}
                      onChange={(event) => setDraft((prev) => ({ ...prev, [field]: event.target.value }))}
                      rows={4}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    />
                  ) : (
                    <input
                      type="text"
                      value={draft[field] || ''}
                      onChange={(event) => setDraft((prev) => ({ ...prev, [field]: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    />
                  )}
                </label>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {selectedFields.map((field) => (
                <div key={field} className={`rounded-lg border border-gray-200 bg-gray-50 p-3 ${isLongField(field) ? 'md:col-span-2' : ''}`}>
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{field}</div>
                  <div className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-900">
                    {selectedRecord?.fields[field] || '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={deleteRecord}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isEditingRecord && selectedRecord) {
                    setDraft({ ...selectedRecord.fields })
                    setIsEditingRecord(false)
                  } else {
                    setSelectedRecord(null)
                    setDraft({})
                    setIsEditingRecord(false)
                  }
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {isEditingRecord ? 'Cancel' : 'Close'}
              </button>
              {isEditingRecord ? (
                <button
                  type="button"
                  onClick={saveRecord}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Save
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingRecord(true)}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
