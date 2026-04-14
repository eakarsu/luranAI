'use client'

import { useRouter } from 'next/navigation'

const industries = [
  {
    name: 'Dentistry',
    id: 'dentistry',
    emoji: '\uD83E\uDDB7',
    description: 'AI-powered patient engagement for dental practices. Automate appointment reminders, follow-ups, and patient communications.',
    features: [
      'Appointment scheduling & reminders',
      'Patient follow-up automation',
      'Treatment plan communication',
      'Insurance verification assistance',
      'Post-procedure check-ins',
    ],
  },
  {
    name: 'Restaurants',
    id: 'restaurants',
    emoji: '\uD83C\uDF7D\uFE0F',
    description: 'Streamline restaurant operations with AI. Handle reservations, customer feedback, and promotional campaigns effortlessly.',
    features: [
      'Reservation management',
      'Customer feedback collection',
      'Promotional SMS campaigns',
      'Menu inquiry handling',
      'Loyalty program communication',
    ],
  },
  {
    name: 'Health Clinics',
    id: 'health clinics',
    emoji: '\uD83C\uDFE5',
    description: 'Enhance patient care with intelligent communication. Manage appointments, prescription reminders, and health check-ups.',
    features: [
      'Patient appointment management',
      'Prescription refill reminders',
      'Health check-up scheduling',
      'Lab result notifications',
      'Telehealth follow-ups',
    ],
  },
  {
    name: 'Real Estate',
    id: 'real estate',
    emoji: '\uD83C\uDFE0',
    description: 'Convert more leads with AI-driven engagement. Qualify prospects, schedule viewings, and maintain client relationships.',
    features: [
      'Lead qualification & scoring',
      'Property viewing scheduling',
      'Market update newsletters',
      'Follow-up automation',
      'Virtual tour coordination',
    ],
  },
  {
    name: 'Car Dealerships',
    id: 'car dealerships',
    emoji: '\uD83D\uDE97',
    description: 'Drive sales with intelligent customer engagement. Manage test drives, service appointments, and promotional outreach.',
    features: [
      'Test drive scheduling',
      'Service reminder automation',
      'Inventory inquiry handling',
      'Financing pre-qualification',
      'Post-sale follow-up',
    ],
  },
  {
    name: 'Hospitality',
    id: 'hospitality',
    emoji: '\uD83C\uDFE8',
    description: 'Deliver exceptional guest experiences with AI. Handle bookings, concierge services, and guest feedback seamlessly.',
    features: [
      'Booking confirmation & management',
      'Concierge service automation',
      'Guest feedback collection',
      'Upsell & cross-sell suggestions',
      'Check-in/check-out assistance',
    ],
  },
  {
    name: 'Debt Collection',
    id: 'debt collection',
    emoji: '\uD83D\uDCB0',
    description: 'Improve collection rates with compliant AI communication. Automate payment reminders and negotiate payment plans.',
    features: [
      'Payment reminder automation',
      'Payment plan negotiation',
      'Compliance-aware messaging',
      'Multi-channel outreach',
      'Account status updates',
    ],
  },
  {
    name: 'Insurance',
    id: 'insurance',
    emoji: '\uD83D\uDEE1\uFE0F',
    description: 'Streamline policy management and claims processing. AI agents handle quotes, policy questions, and claims intake.',
    features: [
      'Quote generation & follow-up',
      'Policy renewal reminders',
      'Claims intake & status updates',
      'Coverage question handling',
      'Document collection automation',
    ],
  },
  {
    name: 'Legal / Law Firms',
    id: 'legal',
    emoji: '\u2696\uFE0F',
    description: 'Automate client intake and case management communications. Handle consultations, document requests, and follow-ups.',
    features: [
      'Client intake & screening',
      'Consultation scheduling',
      'Document request automation',
      'Case status updates',
      'Billing inquiry handling',
    ],
  },
  {
    name: 'Home Services',
    id: 'home services',
    emoji: '\uD83D\uDD27',
    description: 'Manage service requests, scheduling, and follow-ups for plumbing, electrical, HVAC, and more.',
    features: [
      'Service request intake',
      'Technician scheduling',
      'Emergency dispatch triage',
      'Quote & estimate follow-up',
      'Post-service feedback',
    ],
  },
  {
    name: 'Healthcare / Pharmacy',
    id: 'pharmacy',
    emoji: '\uD83D\uDC8A',
    description: 'Automate prescription management, refill reminders, and patient consultations with AI-powered communication.',
    features: [
      'Prescription refill reminders',
      'Medication consultation',
      'Insurance verification',
      'Delivery scheduling',
      'Drug interaction alerts',
    ],
  },
  {
    name: 'Fitness / Gym',
    id: 'fitness',
    emoji: '\uD83C\uDFCB\uFE0F',
    description: 'Boost membership retention and engagement. Handle sign-ups, class bookings, and personal training scheduling.',
    features: [
      'Membership sign-up & renewal',
      'Class & session booking',
      'Personal training scheduling',
      'Attendance follow-up',
      'Promotional campaigns',
    ],
  },
  {
    name: 'Education',
    id: 'education',
    emoji: '\uD83C\uDF93',
    description: 'Manage admissions, enrollment, and student communications. AI handles inquiries, scheduling, and follow-ups.',
    features: [
      'Admissions inquiry handling',
      'Campus tour scheduling',
      'Enrollment assistance',
      'Financial aid questions',
      'Student support routing',
    ],
  },
  {
    name: 'Pet Care / Veterinary',
    id: 'pet care',
    emoji: '\uD83D\uDC3E',
    description: 'Automate appointment booking, vaccination reminders, and pet owner communications for veterinary clinics.',
    features: [
      'Appointment scheduling',
      'Vaccination reminders',
      'Emergency triage',
      'Prescription refills',
      'Post-visit follow-ups',
    ],
  },
  {
    name: 'Accounting / Tax',
    id: 'accounting',
    emoji: '\uD83D\uDCCA',
    description: 'Streamline client communications during tax season and year-round. Handle document collection and deadline reminders.',
    features: [
      'Tax appointment scheduling',
      'Document collection automation',
      'Deadline reminders',
      'Billing & payment follow-up',
      'New client intake',
    ],
  },
  {
    name: 'Salon / Spa',
    id: 'salon',
    emoji: '\uD83D\uDC87',
    description: 'Manage bookings, stylist assignments, and client preferences. AI handles scheduling, confirmations, and promotions.',
    features: [
      'Appointment booking & reminders',
      'Stylist/therapist matching',
      'Service menu inquiries',
      'Loyalty program management',
      'Promotional campaigns',
    ],
  },
  {
    name: 'Auto Repair / Body Shop',
    id: 'auto repair',
    emoji: '\uD83D\uDD29',
    description: 'Streamline service scheduling, repair updates, and customer communications for auto repair shops.',
    features: [
      'Service appointment booking',
      'Repair status updates',
      'Estimate & quote follow-up',
      'Warranty claim handling',
      'Post-service feedback',
    ],
  },
]

export default function IndustriesPage() {
  const router = useRouter()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Industries</h1>
        <p className="text-sm text-gray-500 mt-1">
          Luran AI serves {industries.length} industries with tailored AI workflows for customer engagement
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {industries.map((industry) => (
          <div
            key={industry.name}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-primary-200 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                {industry.emoji}
              </div>
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                {industry.name}
              </h2>
            </div>

            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              {industry.description}
            </p>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                AI Features
              </h3>
              <ul className="space-y-1.5">
                {industry.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => router.push(`/workflows?industry=${industry.id}`)}
                className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700 py-2 rounded-lg hover:bg-primary-50 transition-colors"
              >
                View Workflow &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
