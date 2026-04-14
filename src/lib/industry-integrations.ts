// Industry-specific integration connectors
// Each connector provides a standardized interface for common operations

export interface IntegrationConnector {
  id: string
  name: string
  provider: string
  type: string
  industry: string[]
  description: string
  features: string[]
  configFields: ConfigField[]
  logoColor: string
}

interface ConfigField {
  key: string
  label: string
  type: 'text' | 'password' | 'url'
  placeholder: string
  required: boolean
}

export const industryIntegrations: IntegrationConnector[] = [
  // ─── Restaurant Integrations ───────────────────────────────────────────────
  {
    id: 'square',
    name: 'Square POS',
    provider: 'Square',
    type: 'payment',
    industry: ['restaurants', 'salon-spa', 'fitness'],
    description: 'Connect Square POS for payments, appointments, and customer data sync',
    features: [
      'Sync customer profiles and purchase history',
      'Create and manage appointments from AI calls',
      'Process payments and send receipts',
      'Pull menu/service catalog for AI knowledge',
    ],
    configFields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'sq0atp-...', required: true },
      { key: 'locationId', label: 'Location ID', type: 'text', placeholder: 'L...', required: true },
      { key: 'environment', label: 'Environment', type: 'text', placeholder: 'sandbox or production', required: true },
    ],
    logoColor: '#006AFF',
  },
  {
    id: 'toast',
    name: 'Toast POS',
    provider: 'Toast',
    type: 'payment',
    industry: ['restaurants'],
    description: 'Connect Toast POS for restaurant orders, reservations, and menu sync',
    features: [
      'Pull live menu with prices and availability',
      'Create takeout and delivery orders via AI calls',
      'Sync reservation data with AI booking agent',
      'Access customer order history for personalized service',
    ],
    configFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Your Toast API client ID', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Your Toast API client secret', required: true },
      { key: 'restaurantGuid', label: 'Restaurant GUID', type: 'text', placeholder: 'Your restaurant GUID', required: true },
      { key: 'apiUrl', label: 'API URL', type: 'url', placeholder: 'https://api.toasttab.com', required: true },
    ],
    logoColor: '#FF6600',
  },
  // ─── Dental Integrations ───────────────────────────────────────────────────
  {
    id: 'dentrix',
    name: 'Dentrix',
    provider: 'Henry Schein One',
    type: 'practice-management',
    industry: ['dentistry'],
    description: 'Connect Dentrix for patient scheduling, records, and treatment plans',
    features: [
      'Real-time appointment availability for AI booking',
      'Patient record lookup during AI calls',
      'Create new patient profiles from AI intake calls',
      'Sync treatment plans and insurance info',
    ],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your Dentrix API key', required: true },
      { key: 'practiceId', label: 'Practice ID', type: 'text', placeholder: 'Your practice identifier', required: true },
      { key: 'serverUrl', label: 'Server URL', type: 'url', placeholder: 'https://your-dentrix-server.com', required: true },
    ],
    logoColor: '#0072CE',
  },
  {
    id: 'opendental',
    name: 'Open Dental',
    provider: 'Open Dental Software',
    type: 'practice-management',
    industry: ['dentistry'],
    description: 'Connect Open Dental for scheduling, patient management, and billing',
    features: [
      'Check appointment slots from AI receptionist',
      'Create and confirm appointments via voice/SMS',
      'Pull patient insurance and balance info',
      'Send appointment reminders through AI channels',
    ],
    configFields: [
      { key: 'developerKey', label: 'Developer Key', type: 'password', placeholder: 'Your Open Dental developer key', required: true },
      { key: 'customerKey', label: 'Customer Key', type: 'password', placeholder: 'Your customer key', required: true },
      { key: 'serverUrl', label: 'Server URL', type: 'url', placeholder: 'https://api.opendental.com', required: true },
    ],
    logoColor: '#2E7D32',
  },
  // ─── Fitness & Wellness Integrations ───────────────────────────────────────
  {
    id: 'mindbody',
    name: 'Mindbody',
    provider: 'Mindbody',
    type: 'booking',
    industry: ['fitness', 'salon-spa'],
    description: 'Connect Mindbody for class bookings, memberships, and client management',
    features: [
      'Book classes and sessions from AI calls',
      'Check membership status during conversations',
      'Sync client contact info and preferences',
      'Pull class schedules for AI knowledge base',
    ],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your Mindbody API key', required: true },
      { key: 'siteId', label: 'Site ID', type: 'text', placeholder: 'Your Mindbody site ID', required: true },
      { key: 'sourceName', label: 'Source Name', type: 'text', placeholder: 'Your source name', required: true },
    ],
    logoColor: '#00B0B9',
  },
  // ─── Real Estate Integrations ──────────────────────────────────────────────
  {
    id: 'followupboss',
    name: 'Follow Up Boss',
    provider: 'Follow Up Boss',
    type: 'crm',
    industry: ['real-estate'],
    description: 'Connect Follow Up Boss CRM for lead management and follow-ups',
    features: [
      'Create leads from AI qualification calls',
      'Update lead status after conversations',
      'Pull property interest data for personalized calls',
      'Trigger automated follow-up sequences',
    ],
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your Follow Up Boss API key', required: true },
      { key: 'teamId', label: 'Team ID', type: 'text', placeholder: 'Your team identifier', required: false },
    ],
    logoColor: '#FF5722',
  },
  // ─── Healthcare Integrations ───────────────────────────────────────────────
  {
    id: 'athenahealth',
    name: 'athenahealth',
    provider: 'athenahealth',
    type: 'practice-management',
    industry: ['health-clinics'],
    description: 'Connect athenahealth for patient scheduling and EHR integration',
    features: [
      'Check provider availability for AI booking',
      'Create patient appointments via AI calls',
      'Verify insurance eligibility during intake calls',
      'Send visit summaries and follow-up reminders',
    ],
    configFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Your athenahealth client ID', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Your client secret', required: true },
      { key: 'practiceId', label: 'Practice ID', type: 'text', placeholder: 'Your practice ID', required: true },
    ],
    logoColor: '#7B1FA2',
  },
  // ─── Auto Integrations ────────────────────────────────────────────────────
  {
    id: 'dealertrack',
    name: 'DealerTrack',
    provider: 'Cox Automotive',
    type: 'crm',
    industry: ['car-dealerships'],
    description: 'Connect DealerTrack for vehicle inventory and customer management',
    features: [
      'Pull live vehicle inventory for AI sales calls',
      'Create customer leads from AI conversations',
      'Check financing pre-qualification status',
      'Schedule test drives via AI booking',
    ],
    configFields: [
      { key: 'dealerId', label: 'Dealer ID', type: 'text', placeholder: 'Your DealerTrack dealer ID', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your API key', required: true },
      { key: 'apiUrl', label: 'API URL', type: 'url', placeholder: 'https://api.dealertrack.com', required: true },
    ],
    logoColor: '#1565C0',
  },
  // ─── General Integrations ─────────────────────────────────────────────────
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    provider: 'Google',
    type: 'calendar',
    industry: ['dentistry', 'restaurants', 'health-clinics', 'real-estate', 'salon-spa', 'fitness', 'legal', 'accounting-tax'],
    description: 'Sync appointments with Google Calendar for real-time availability',
    features: [
      'Check real-time availability during AI calls',
      'Create calendar events when booking appointments',
      'Send calendar invites to customers',
      'Avoid double-booking with live sync',
    ],
    configFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Your Google OAuth client ID', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Your Google OAuth client secret', required: true },
      { key: 'calendarId', label: 'Calendar ID', type: 'text', placeholder: 'primary or calendar ID', required: true },
    ],
    logoColor: '#4285F4',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    provider: 'Zapier',
    type: 'automation',
    industry: ['dentistry', 'restaurants', 'health-clinics', 'real-estate', 'car-dealerships', 'hospitality', 'insurance', 'legal', 'home-services', 'fitness', 'education', 'salon-spa', 'accounting-tax', 'auto-repair', 'pet-care', 'pharmacy'],
    description: 'Connect to 5,000+ apps through Zapier automation workflows',
    features: [
      'Trigger workflows from AI call outcomes',
      'Sync contacts to any CRM via Zapier',
      'Send notifications to Slack, Teams, or email',
      'Create records in any connected app',
    ],
    configFields: [
      { key: 'webhookUrl', label: 'Webhook URL', type: 'url', placeholder: 'https://hooks.zapier.com/...', required: true },
    ],
    logoColor: '#FF4A00',
  },
]

export function getIntegrationsForIndustry(industry: string): IntegrationConnector[] {
  return industryIntegrations.filter((i) =>
    i.industry.includes(industry)
  )
}

export function getIntegrationById(id: string): IntegrationConnector | undefined {
  return industryIntegrations.find((i) => i.id === id)
}
