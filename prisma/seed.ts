import { PrismaClient, Channel, TemplateType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ─── Users ───────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("password123", 10);
  const demoPassword = await bcrypt.hash("demo123", 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@luranai.com",
        password: adminPassword,
        name: "Admin User",
        role: "admin",
      },
    }),
    prisma.user.create({
      data: {
        email: "demo@luranai.com",
        password: demoPassword,
        name: "Demo User",
        role: "user",
      },
    }),
  ]);
  console.log(`Created ${users.length} users`);

  // ─── Voice Agents ────────────────────────────────────────────────────────
  const voiceAgents = await Promise.all([
    prisma.voiceAgent.create({
      data: {
        name: "Dr. Smile Receptionist",
        language: "en-US",
        voice: "alloy",
        greeting: "Thank you for calling Dr. Smile Dental. How can I help you today?",
        industry: "dentistry",
        status: "active",
        systemPrompt: "You are a friendly dental office receptionist. Help patients schedule appointments, answer insurance questions, and provide office hours information.",
        maxCallDuration: 300,
        transferNumber: "+14155551001",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "Bella Italia Host",
        language: "en-US",
        voice: "nova",
        greeting: "Buongiorno! Thank you for calling Bella Italia Ristorante. How may I assist you?",
        industry: "restaurants",
        status: "active",
        systemPrompt: "You are a warm Italian restaurant host. Help guests make reservations, describe the menu, and handle special dietary requests.",
        maxCallDuration: 240,
        transferNumber: "+14155551002",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "HealthFirst Intake",
        language: "en-US",
        voice: "echo",
        greeting: "Welcome to HealthFirst Medical Clinic. How can I assist you today?",
        industry: "health clinics",
        status: "active",
        systemPrompt: "You are a medical clinic intake coordinator. Help patients schedule visits, verify insurance, and triage urgency of medical concerns.",
        maxCallDuration: 360,
        transferNumber: "+14155551003",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "Premier Realty Assistant",
        language: "en-US",
        voice: "shimmer",
        greeting: "Hello, thank you for calling Premier Realty Group. How can I help you find your dream home?",
        industry: "real estate",
        status: "active",
        systemPrompt: "You are a real estate assistant. Help callers schedule property viewings, provide listing details, and connect them with agents.",
        maxCallDuration: 300,
        transferNumber: "+14155551004",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "AutoMax Sales Line",
        language: "en-US",
        voice: "fable",
        greeting: "Welcome to AutoMax Dealership! Are you looking for a new or pre-owned vehicle today?",
        industry: "car dealerships",
        status: "active",
        systemPrompt: "You are a car dealership sales assistant. Help callers explore inventory, schedule test drives, and discuss financing options.",
        maxCallDuration: 360,
        transferNumber: "+14155551005",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "Grand Horizon Concierge",
        language: "en-US",
        voice: "alloy",
        greeting: "Thank you for calling Grand Horizon Hotel & Spa. How may I make your stay exceptional?",
        industry: "hospitality",
        status: "active",
        systemPrompt: "You are a luxury hotel concierge. Help guests with reservations, room upgrades, spa bookings, and local recommendations.",
        maxCallDuration: 300,
        transferNumber: "+14155551006",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "Resolve Financial Agent",
        language: "en-US",
        voice: "onyx",
        greeting: "Hello, this is Resolve Financial Services. I'm calling regarding your account. Is this a good time to speak?",
        industry: "debt collection",
        status: "active",
        systemPrompt: "You are a professional debt collection agent. Follow FDCPA guidelines strictly. Be respectful and empathetic while discussing payment arrangements.",
        maxCallDuration: 600,
        transferNumber: "+14155551007",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "Sonrisa Dental Recepcion",
        language: "es-MX",
        voice: "nova",
        greeting: "Gracias por llamar a Clínica Dental Sonrisa. ¿En qué puedo ayudarle?",
        industry: "dentistry",
        status: "active",
        systemPrompt: "Eres una recepcionista de clínica dental amable. Ayuda a los pacientes a programar citas y responder preguntas sobre seguros.",
        maxCallDuration: 300,
        transferNumber: "+14155551008",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "Le Petit Bistro Reservations",
        language: "fr-FR",
        voice: "shimmer",
        greeting: "Bonjour, merci d'appeler Le Petit Bistro. Comment puis-je vous aider?",
        industry: "restaurants",
        status: "active",
        systemPrompt: "You are a French bistro reservation agent. Help guests book tables, describe the prix fixe menu, and accommodate dietary preferences.",
        maxCallDuration: 240,
        transferNumber: "+14155551009",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "MedCare After Hours",
        language: "en-US",
        voice: "echo",
        greeting: "You've reached MedCare After Hours line. Please describe your concern and we'll assist you right away.",
        industry: "health clinics",
        status: "active",
        systemPrompt: "You are an after-hours medical triage agent. Assess symptom urgency, provide basic guidance, and route emergencies to 911.",
        maxCallDuration: 480,
        transferNumber: "+14155551010",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "Luxury Living Showings",
        language: "en-US",
        voice: "alloy",
        greeting: "Hello from Luxury Living Real Estate. Ready to explore exclusive properties?",
        industry: "real estate",
        status: "active",
        systemPrompt: "You are a luxury real estate concierge. Assist high-net-worth clients with premium property viewings and exclusive listings.",
        maxCallDuration: 360,
        transferNumber: "+14155551011",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "DriveTime Service Dept",
        language: "en-US",
        voice: "fable",
        greeting: "Thanks for calling DriveTime Service Department. How can we keep your vehicle running smoothly?",
        industry: "car dealerships",
        status: "active",
        systemPrompt: "You are a car dealership service advisor. Help customers schedule maintenance, explain service packages, and provide cost estimates.",
        maxCallDuration: 300,
        transferNumber: "+14155551012",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "Seaside Resort Bookings",
        language: "en-US",
        voice: "nova",
        greeting: "Aloha! Thank you for calling Seaside Resort & Spa. Let us help plan your perfect getaway.",
        industry: "hospitality",
        status: "active",
        systemPrompt: "You are a resort booking specialist. Assist guests with room reservations, activity bookings, and package deals.",
        maxCallDuration: 300,
        transferNumber: "+14155551013",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "ClearPath Collections",
        language: "en-US",
        voice: "onyx",
        greeting: "Hello, this is ClearPath Financial. We're reaching out about a matter on your account.",
        industry: "debt collection",
        status: "active",
        systemPrompt: "You are a compliant debt collection specialist. Follow all FDCPA and TCPA regulations. Offer payment plans and settlement options professionally.",
        maxCallDuration: 600,
        transferNumber: "+14155551014",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "BrightSmile Kids Dental",
        language: "en-US",
        voice: "shimmer",
        greeting: "Hi there! Welcome to BrightSmile Kids Dental. We love making little smiles shine!",
        industry: "dentistry",
        status: "active",
        systemPrompt: "You are a pediatric dental office receptionist. Be cheerful and help parents schedule their children's dental visits.",
        maxCallDuration: 240,
        transferNumber: "+14155551015",
      },
    }),
    // New industries
    prisma.voiceAgent.create({
      data: {
        name: "SafeGuard Insurance",
        language: "en-US",
        voice: "alloy",
        greeting: "Thank you for calling SafeGuard Insurance. I'm here to help with quotes, policies, or claims. How can I assist you?",
        industry: "insurance",
        status: "active",
        systemPrompt: "You are a professional insurance agency assistant. Help clients with policy inquiries, quotes for auto/home/life insurance, and claims assistance.",
        maxCallDuration: 360,
        transferNumber: "+14155552001",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "Parker & Associates Intake",
        language: "en-US",
        voice: "onyx",
        greeting: "Thank you for calling Parker & Associates Law Firm. How may I assist you today?",
        industry: "legal",
        status: "active",
        systemPrompt: "You are a law firm intake specialist. Collect case details, schedule attorney consultations, and answer general questions about practice areas.",
        maxCallDuration: 420,
        transferNumber: "+14155552002",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "ProFix Home Services",
        language: "en-US",
        voice: "echo",
        greeting: "Thanks for calling ProFix Home Services! Need a plumber, electrician, or HVAC tech? I can help schedule that.",
        industry: "home services",
        status: "active",
        systemPrompt: "You are a home services dispatcher. Help homeowners schedule plumbing, HVAC, electrical, and general repair appointments.",
        maxCallDuration: 300,
        transferNumber: "+14155552003",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "WellCare Pharmacy",
        language: "en-US",
        voice: "nova",
        greeting: "Hello, thank you for calling WellCare Pharmacy. How can I help you today?",
        industry: "pharmacy",
        status: "active",
        systemPrompt: "You are a pharmacy assistant. Help patients with prescription refills, pharmacy hours, insurance questions, and immunization scheduling.",
        maxCallDuration: 240,
        transferNumber: "+14155552004",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "FitLife Gym Concierge",
        language: "en-US",
        voice: "fable",
        greeting: "Welcome to FitLife! Ready to crush your fitness goals? How can I help you today?",
        industry: "fitness",
        status: "active",
        systemPrompt: "You are an energetic gym concierge. Help with membership sign-ups, class bookings, personal training sessions, and facility information.",
        maxCallDuration: 240,
        transferNumber: "+14155552005",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "Bright Horizons Academy",
        language: "en-US",
        voice: "shimmer",
        greeting: "Thank you for calling Bright Horizons Academy! Are you interested in learning about our programs?",
        industry: "education",
        status: "active",
        systemPrompt: "You are an education enrollment specialist. Help prospective students and parents with program information, enrollment, and campus tour scheduling.",
        maxCallDuration: 300,
        transferNumber: "+14155552006",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "Happy Paws Vet Clinic",
        language: "en-US",
        voice: "nova",
        greeting: "Hello from Happy Paws Veterinary Clinic! How can we help your furry friend today?",
        industry: "pet care",
        status: "active",
        systemPrompt: "You are a veterinary clinic receptionist. Help pet owners schedule appointments, answer service questions, and triage urgent pet health concerns.",
        maxCallDuration: 300,
        transferNumber: "+14155552007",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "Summit Tax & Accounting",
        language: "en-US",
        voice: "alloy",
        greeting: "Thank you for calling Summit Tax & Accounting. How can we help with your financial needs?",
        industry: "accounting",
        status: "active",
        systemPrompt: "You are an accounting firm receptionist. Help clients schedule tax prep appointments, answer service questions, and collect intake information.",
        maxCallDuration: 300,
        transferNumber: "+14155552008",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "Luxe Beauty Studio",
        language: "en-US",
        voice: "shimmer",
        greeting: "Welcome to Luxe Beauty Studio! Ready to look and feel amazing? How can I help?",
        industry: "salon",
        status: "active",
        systemPrompt: "You are a salon and spa booking specialist. Help clients book haircuts, coloring, nails, massage, and spa treatments with preferred stylists.",
        maxCallDuration: 240,
        transferNumber: "+14155552009",
      },
    }),
    prisma.voiceAgent.create({
      data: {
        name: "TrustMech Auto Repair",
        language: "en-US",
        voice: "echo",
        greeting: "Thanks for calling TrustMech Auto Repair. Having car trouble or need maintenance? I can help!",
        industry: "auto repair",
        status: "active",
        systemPrompt: "You are an auto repair shop service advisor. Help customers schedule repairs, oil changes, diagnostics, and provide general service information.",
        maxCallDuration: 300,
        transferNumber: "+14155552010",
      },
    }),
  ]);
  console.log(`Created ${voiceAgents.length} voice agents`);

  // ─── Contacts ────────────────────────────────────────────────────────────
  const contacts = await Promise.all([
    prisma.contact.create({ data: { firstName: "Sarah", lastName: "Mitchell", email: "sarah.mitchell@gmail.com", phone: "+14155552001", company: "Mitchell & Associates", industry: "real estate", tags: ["buyer", "first-time"], notes: "Looking for 3BR in downtown area", source: "website", status: "active" } }),
    prisma.contact.create({ data: { firstName: "James", lastName: "Rodriguez", email: "j.rodriguez@outlook.com", phone: "+14155552002", company: "Rodriguez Construction", industry: "real estate", tags: ["investor", "commercial"], notes: "Interested in commercial properties", source: "referral", status: "active" } }),
    prisma.contact.create({ data: { firstName: "Emily", lastName: "Chen", email: "emily.chen@yahoo.com", phone: "+14155552003", company: null, industry: "dentistry", tags: ["new-patient", "insurance-verified"], notes: "Needs wisdom teeth consultation", source: "google-ads", status: "active" } }),
    prisma.contact.create({ data: { firstName: "Michael", lastName: "Thompson", email: "mthompson@techcorp.com", phone: "+14155552004", company: "TechCorp Industries", industry: "restaurants", tags: ["corporate-events", "vip"], notes: "Regular corporate dinner bookings", source: "yelp", status: "active" } }),
    prisma.contact.create({ data: { firstName: "Lisa", lastName: "Patel", email: "lisa.patel@gmail.com", phone: "+14155552005", company: "Patel Family Practice", industry: "health clinics", tags: ["referring-physician"], notes: "Referring patients for specialist care", source: "professional-network", status: "active" } }),
    prisma.contact.create({ data: { firstName: "David", lastName: "Kim", email: "david.kim@gmail.com", phone: "+14155552006", company: null, industry: "car dealerships", tags: ["trade-in", "financing"], notes: "Looking to trade in 2020 Honda Accord", source: "walk-in", status: "active" } }),
    prisma.contact.create({ data: { firstName: "Jennifer", lastName: "Okafor", email: "j.okafor@hotmail.com", phone: "+14155552007", company: "Okafor Events LLC", industry: "hospitality", tags: ["event-planner", "repeat-client"], notes: "Books conference rooms quarterly", source: "referral", status: "active" } }),
    prisma.contact.create({ data: { firstName: "Robert", lastName: "Martinez", email: "r.martinez@protonmail.com", phone: "+14155552008", company: null, industry: "debt collection", tags: ["payment-plan", "cooperative"], notes: "Set up 12-month payment arrangement", source: "outbound-call", status: "active" } }),
    prisma.contact.create({ data: { firstName: "Amanda", lastName: "Foster", email: "amanda.foster@gmail.com", phone: "+14155552009", company: "Foster Design Studio", industry: "dentistry", tags: ["cosmetic", "whitening"], notes: "Interested in veneers consultation", source: "instagram", status: "active" } }),
    prisma.contact.create({ data: { firstName: "William", lastName: "Nguyen", email: "w.nguyen@gmail.com", phone: "+14155552010", company: "Nguyen Family Restaurant", industry: "restaurants", tags: ["owner", "catering"], notes: "Interested in POS integration", source: "trade-show", status: "active" } }),
    prisma.contact.create({ data: { firstName: "Rachel", lastName: "Green", email: "rachel.green@outlook.com", phone: "+14155552011", company: null, industry: "health clinics", tags: ["chronic-care", "telehealth"], notes: "Prefers telehealth appointments", source: "patient-portal", status: "active" } }),
    prisma.contact.create({ data: { firstName: "Thomas", lastName: "Wright", email: "twright@luxuryrealty.com", phone: "+14155552012", company: "Luxury Realty Partners", industry: "real estate", tags: ["seller", "luxury"], notes: "Listing $2.5M property in Pacific Heights", source: "zillow", status: "active" } }),
    prisma.contact.create({ data: { firstName: "Maria", lastName: "Santos", email: "maria.santos@gmail.com", phone: "+14155552013", company: null, industry: "car dealerships", tags: ["new-buyer", "suv"], notes: "Looking for family SUV, budget $45K", source: "autotrader", status: "active" } }),
    prisma.contact.create({ data: { firstName: "Kevin", lastName: "O'Brien", email: "kobrien@grandhotel.com", phone: "+14155552014", company: "O'Brien Hospitality Group", industry: "hospitality", tags: ["group-booking", "corporate"], notes: "Annual company retreat, 50+ rooms", source: "linkedin", status: "active" } }),
    prisma.contact.create({ data: { firstName: "Patricia", lastName: "Lawson", email: "p.lawson@aol.com", phone: "+14155552015", company: null, industry: "debt collection", tags: ["hardship", "review"], notes: "Requested hardship review for medical bills", source: "inbound-call", status: "active" } }),
    prisma.contact.create({ data: { firstName: "Daniel", lastName: "Park", email: "daniel.park@techmail.com", phone: "+14155552016", company: "Park Ventures", industry: "real estate", tags: ["investor", "multi-family"], notes: "Looking at multi-family units for portfolio", source: "cold-outreach", status: "active" } }),
    prisma.contact.create({ data: { firstName: "Sophia", lastName: "Adams", email: "sophia.adams@gmail.com", phone: "+14155552017", company: null, industry: "dentistry", tags: ["orthodontics", "teen"], notes: "Scheduling braces consultation for daughter", source: "facebook", status: "active" } }),
    prisma.contact.create({ data: { firstName: "Carlos", lastName: "Mendez", email: "carlos@taqueriamendez.com", phone: "+14155552018", company: "Taqueria Mendez", industry: "restaurants", tags: ["owner", "franchise"], notes: "Expanding to 3rd location", source: "referral", status: "active" } }),
    prisma.contact.create({ data: { firstName: "Jessica", lastName: "Taylor", email: "jtaylor@wellnessmd.com", phone: "+14155552019", company: "Wellness MD Clinic", industry: "health clinics", tags: ["practice-owner", "integration"], notes: "Wants to integrate EHR with AI system", source: "conference", status: "active" } }),
    prisma.contact.create({ data: { firstName: "Brian", lastName: "Cooper", email: "brian.cooper@gmail.com", phone: "+14155552020", company: null, industry: "car dealerships", tags: ["lease-return", "upgrade"], notes: "Lease ending next month, wants to upgrade", source: "crm-import", status: "active" } }),
    prisma.contact.create({ data: { firstName: "Natalie", lastName: "Russo", email: "natalie.russo@travelco.com", phone: "+14155552021", company: "TravelCo International", industry: "hospitality", tags: ["travel-agent", "bulk"], notes: "Books rooms in bulk for tour groups", source: "partnership", status: "active" } }),
    prisma.contact.create({ data: { firstName: "Gregory", lastName: "Hoffman", email: "g.hoffman@gmail.com", phone: "+14155552022", company: null, industry: "debt collection", tags: ["settled", "closed"], notes: "Account settled in full, March 2025", source: "outbound-call", status: "inactive" } }),
  ]);
  console.log(`Created ${contacts.length} contacts`);

  // ─── SMS Campaigns ───────────────────────────────────────────────────────
  const smsCampaigns = await Promise.all([
    prisma.smsCampaign.create({ data: { name: "Dental Cleaning Reminder Q1", messageTemplate: "Hi {{firstName}}, it's time for your 6-month cleaning at Dr. Smile Dental! Book online or reply YES to schedule. Reply STOP to opt out.", audience: "patients-due-cleaning", scheduledAt: new Date("2026-03-15T09:00:00Z"), status: "scheduled", sentCount: 0, deliveredCount: 0, responseCount: 0, industry: "dentistry" } }),
    prisma.smsCampaign.create({ data: { name: "Weekend Brunch Special", messageTemplate: "{{firstName}}, join us this weekend at Bella Italia for our new brunch menu! 20% off with code BRUNCH20. Reserve: {{link}}", audience: "diners-last-90-days", scheduledAt: new Date("2026-03-13T10:00:00Z"), status: "scheduled", sentCount: 0, deliveredCount: 0, responseCount: 0, industry: "restaurants" } }),
    prisma.smsCampaign.create({ data: { name: "Annual Wellness Check", messageTemplate: "Dear {{firstName}}, HealthFirst reminds you it's time for your annual wellness exam. Call us or reply BOOK to schedule.", audience: "patients-annual-due", scheduledAt: new Date("2026-03-10T08:00:00Z"), status: "sent", sentCount: 845, deliveredCount: 812, responseCount: 234, industry: "health clinics" } }),
    prisma.smsCampaign.create({ data: { name: "New Listing Alert - Downtown", messageTemplate: "{{firstName}}, a new 3BR/2BA just listed in Downtown at $589K! Virtual tour: {{link}}. Reply INFO for details.", audience: "buyers-downtown-3br", scheduledAt: new Date("2026-03-08T11:00:00Z"), status: "sent", sentCount: 320, deliveredCount: 305, responseCount: 89, industry: "real estate" } }),
    prisma.smsCampaign.create({ data: { name: "Spring Sales Event", messageTemplate: "{{firstName}}, AutoMax Spring Sales Event is HERE! 0% APR on select models + $2,000 bonus cash. Visit us this weekend! Details: {{link}}", audience: "all-prospects", scheduledAt: new Date("2026-03-20T09:00:00Z"), status: "draft", sentCount: 0, deliveredCount: 0, responseCount: 0, industry: "car dealerships" } }),
    prisma.smsCampaign.create({ data: { name: "Last-Minute Hotel Deals", messageTemplate: "Escape this weekend! Grand Horizon has rooms from $149/night. Book by midnight: {{link}}. Use code LASTMIN for extra 10% off.", audience: "newsletter-subscribers", scheduledAt: new Date("2026-03-12T14:00:00Z"), status: "sent", sentCount: 2100, deliveredCount: 1980, responseCount: 312, industry: "hospitality" } }),
    prisma.smsCampaign.create({ data: { name: "Payment Reminder - March", messageTemplate: "{{firstName}}, a friendly reminder: your payment of ${{amount}} is due on {{dueDate}}. Pay online: {{link}} or call us at 1-800-555-0199.", audience: "accounts-current-due", scheduledAt: new Date("2026-03-01T08:00:00Z"), status: "sent", sentCount: 1560, deliveredCount: 1498, responseCount: 567, industry: "debt collection" } }),
    prisma.smsCampaign.create({ data: { name: "Teeth Whitening Promo", messageTemplate: "Brighten your smile! BrightSmile is offering 30% off professional whitening this month. Book now: {{link}} or reply WHITEN.", audience: "cosmetic-interest", scheduledAt: new Date("2026-03-18T10:00:00Z"), status: "scheduled", sentCount: 0, deliveredCount: 0, responseCount: 0, industry: "dentistry" } }),
    prisma.smsCampaign.create({ data: { name: "Happy Hour Announcement", messageTemplate: "{{firstName}}, Le Petit Bistro now has Happy Hour! Mon-Fri 4-6pm: $8 cocktails & half-price appetizers. See menu: {{link}}", audience: "all-subscribers", scheduledAt: new Date("2026-03-05T15:00:00Z"), status: "sent", sentCount: 680, deliveredCount: 654, responseCount: 145, industry: "restaurants" } }),
    prisma.smsCampaign.create({ data: { name: "Flu Shot Availability", messageTemplate: "HealthFirst now has flu shots available - no appointment needed! Walk in Mon-Sat 8am-6pm. Insurance accepted. Info: {{link}}", audience: "all-patients", scheduledAt: new Date("2026-02-15T09:00:00Z"), status: "completed", sentCount: 3200, deliveredCount: 3050, responseCount: 890, industry: "health clinics" } }),
    prisma.smsCampaign.create({ data: { name: "Open House Weekend", messageTemplate: "{{firstName}}, 5 open houses this Sunday in your target area! View schedule: {{link}}. Reply RSVP to any listing.", audience: "active-buyers", scheduledAt: new Date("2026-03-14T08:00:00Z"), status: "scheduled", sentCount: 0, deliveredCount: 0, responseCount: 0, industry: "real estate" } }),
    prisma.smsCampaign.create({ data: { name: "Service Reminder 5K Miles", messageTemplate: "{{firstName}}, your {{vehicle}} is due for service at DriveTime! Oil change + inspection from $49.95. Book: {{link}}", audience: "service-due-5k", scheduledAt: new Date("2026-03-07T09:00:00Z"), status: "sent", sentCount: 450, deliveredCount: 432, responseCount: 178, industry: "car dealerships" } }),
    prisma.smsCampaign.create({ data: { name: "Summer Early Bird Rates", messageTemplate: "Book summer at Seaside Resort & save 25%! Early bird rates from $199/night. Limited availability. Reserve: {{link}}", audience: "past-guests", scheduledAt: new Date("2026-03-25T10:00:00Z"), status: "draft", sentCount: 0, deliveredCount: 0, responseCount: 0, industry: "hospitality" } }),
    prisma.smsCampaign.create({ data: { name: "Settlement Offer Notification", messageTemplate: "{{firstName}}, you may qualify for a reduced settlement on your account. Call 1-800-555-0199 or visit {{link}} by {{deadline}}.", audience: "eligible-settlement", scheduledAt: new Date("2026-03-03T10:00:00Z"), status: "sent", sentCount: 890, deliveredCount: 856, responseCount: 234, industry: "debt collection" } }),
    prisma.smsCampaign.create({ data: { name: "Kids Dental Month", messageTemplate: "March is Kids Dental Health Month! BrightSmile offers free exams for kids under 5. Schedule: {{link}} or reply KIDS.", audience: "families-with-children", scheduledAt: new Date("2026-03-01T09:00:00Z"), status: "sent", sentCount: 520, deliveredCount: 498, responseCount: 189, industry: "dentistry" } }),
    prisma.smsCampaign.create({ data: { name: "Catering Menu Launch", messageTemplate: "Taqueria Mendez now offers catering! Perfect for offices & events. View menu: {{link}}. Order 48hrs ahead. 10% off first order!", audience: "corporate-contacts", scheduledAt: new Date("2026-03-11T11:00:00Z"), status: "sent", sentCount: 340, deliveredCount: 325, responseCount: 67, industry: "restaurants" } }),
  ]);
  console.log(`Created ${smsCampaigns.length} SMS campaigns`);

  // ─── Chat Agents ─────────────────────────────────────────────────────────
  const chatAgents = await Promise.all([
    prisma.chatAgent.create({ data: { name: "DentaBot", welcomeMessage: "Hi! I'm DentaBot, your dental assistant. I can help you book appointments, check insurance, or answer questions about treatments.", personality: "friendly and reassuring", channels: ["website", "facebook"], status: "active", industry: "dentistry", responseTime: "instant" } }),
    prisma.chatAgent.create({ data: { name: "TableBot", welcomeMessage: "Welcome! I'm here to help you find the perfect table. What occasion are you celebrating?", personality: "warm and enthusiastic", channels: ["website", "instagram"], status: "active", industry: "restaurants", responseTime: "instant" } }),
    prisma.chatAgent.create({ data: { name: "HealthGuide", welcomeMessage: "Hello! I'm HealthGuide. I can help you schedule appointments, find a doctor, or answer general health questions.", personality: "professional and empathetic", channels: ["website", "patient-portal"], status: "active", industry: "health clinics", responseTime: "instant" } }),
    prisma.chatAgent.create({ data: { name: "HomeFinderBot", welcomeMessage: "Welcome to Premier Realty! Tell me what you're looking for - I'll find properties that match your dream home criteria.", personality: "knowledgeable and patient", channels: ["website", "zillow"], status: "active", industry: "real estate", responseTime: "instant" } }),
    prisma.chatAgent.create({ data: { name: "AutoAdvisor", welcomeMessage: "Hey there! Looking for your next ride? I can help you explore our inventory, compare models, and check financing options.", personality: "casual and helpful", channels: ["website", "facebook", "whatsapp"], status: "active", industry: "car dealerships", responseTime: "instant" } }),
    prisma.chatAgent.create({ data: { name: "ConciergeAI", welcomeMessage: "Welcome to Grand Horizon! I'm your virtual concierge. How can I enhance your stay or help plan your visit?", personality: "sophisticated and attentive", channels: ["website", "mobile-app"], status: "active", industry: "hospitality", responseTime: "instant" } }),
    prisma.chatAgent.create({ data: { name: "PayAssist", welcomeMessage: "Hello. I'm here to help you with your account. I can provide balance information, set up payment plans, or answer billing questions.", personality: "professional and respectful", channels: ["website", "sms"], status: "active", industry: "debt collection", responseTime: "under-30-seconds" } }),
    prisma.chatAgent.create({ data: { name: "SmilePlanner", welcomeMessage: "Hi! Want to plan your perfect smile? I can explain cosmetic procedures, show before/after photos, and get you scheduled!", personality: "upbeat and encouraging", channels: ["website", "instagram"], status: "active", industry: "dentistry", responseTime: "instant" } }),
    prisma.chatAgent.create({ data: { name: "MenuMaster", welcomeMessage: "Hungry? I know everything about our menu, ingredients, and allergens. Ask me anything!", personality: "enthusiastic foodie", channels: ["website", "uber-eats", "doordash"], status: "active", industry: "restaurants", responseTime: "instant" } }),
    prisma.chatAgent.create({ data: { name: "NurseBot", welcomeMessage: "Hi, I'm NurseBot. I can help with symptom assessment, medication questions, and scheduling follow-ups. How are you feeling?", personality: "calm and caring", channels: ["patient-portal", "sms"], status: "active", industry: "health clinics", responseTime: "instant" } }),
    prisma.chatAgent.create({ data: { name: "PropBot", welcomeMessage: "Hello! I have access to all current listings. Tell me your budget, preferred area, and must-haves!", personality: "data-driven and helpful", channels: ["website", "realtor-com"], status: "active", industry: "real estate", responseTime: "instant" } }),
    prisma.chatAgent.create({ data: { name: "ServiceBot", welcomeMessage: "Need to schedule service for your vehicle? I can book appointments, provide estimates, and track your repair status.", personality: "efficient and straightforward", channels: ["website", "sms"], status: "active", industry: "car dealerships", responseTime: "under-30-seconds" } }),
    prisma.chatAgent.create({ data: { name: "TravelMate", welcomeMessage: "Planning a getaway? I can help you find the perfect room, activities, and dining experiences at our resort!", personality: "adventurous and welcoming", channels: ["website", "tripadvisor"], status: "active", industry: "hospitality", responseTime: "instant" } }),
    prisma.chatAgent.create({ data: { name: "AccountHelper", welcomeMessage: "I can help you understand your account status and explore options. Your information is kept confidential and secure.", personality: "discreet and understanding", channels: ["website"], status: "active", industry: "debt collection", responseTime: "under-30-seconds" } }),
    prisma.chatAgent.create({ data: { name: "OrthoBot", welcomeMessage: "Thinking about braces or Invisalign? I can explain your options, show treatment timelines, and help you book a free consultation!", personality: "youthful and informative", channels: ["website", "tiktok", "instagram"], status: "active", industry: "dentistry", responseTime: "instant" } }),
    prisma.chatAgent.create({ data: { name: "EventBot", welcomeMessage: "Planning an event? From intimate dinners to large celebrations, I can help you find the perfect venue and menu.", personality: "organized and creative", channels: ["website", "facebook"], status: "active", industry: "restaurants", responseTime: "instant" } }),
  ]);
  console.log(`Created ${chatAgents.length} chat agents`);

  // ─── Email Agents ────────────────────────────────────────────────────────
  const emailAgents = await Promise.all([
    prisma.emailAgent.create({ data: { name: "Dental Office Manager", emailAddress: "office@drsmile-dental.com", autoResponseRules: { rules: [{ trigger: "appointment", action: "confirm_or_reschedule" }, { trigger: "insurance", action: "verify_and_respond" }, { trigger: "emergency", action: "escalate_immediately" }] }, confidenceThreshold: 0.85, signature: "Best regards,\nDr. Smile Dental Office\n(415) 555-1001\nwww.drsmile-dental.com", status: "active", industry: "dentistry" } }),
    prisma.emailAgent.create({ data: { name: "Bella Italia Reservations", emailAddress: "reservations@bellaitalia-sf.com", autoResponseRules: { rules: [{ trigger: "reservation", action: "check_availability" }, { trigger: "menu", action: "send_menu_pdf" }, { trigger: "event", action: "forward_to_events" }] }, confidenceThreshold: 0.80, signature: "Grazie!\nBella Italia Ristorante\n(415) 555-1002\nwww.bellaitalia-sf.com", status: "active", industry: "restaurants" } }),
    prisma.emailAgent.create({ data: { name: "HealthFirst Patient Services", emailAddress: "patients@healthfirst-clinic.com", autoResponseRules: { rules: [{ trigger: "appointment", action: "schedule_appointment" }, { trigger: "results", action: "secure_portal_link" }, { trigger: "prescription", action: "forward_to_pharmacy" }, { trigger: "billing", action: "forward_to_billing" }] }, confidenceThreshold: 0.90, signature: "HealthFirst Medical Clinic\nPatient Services Team\n(415) 555-1003\nwww.healthfirst-clinic.com", status: "active", industry: "health clinics" } }),
    prisma.emailAgent.create({ data: { name: "Premier Realty Inquiries", emailAddress: "info@premierrealty-group.com", autoResponseRules: { rules: [{ trigger: "listing", action: "send_property_details" }, { trigger: "showing", action: "schedule_viewing" }, { trigger: "offer", action: "forward_to_agent" }] }, confidenceThreshold: 0.82, signature: "Premier Realty Group\nYour Home, Our Mission\n(415) 555-1004\nwww.premierrealty-group.com", status: "active", industry: "real estate" } }),
    prisma.emailAgent.create({ data: { name: "AutoMax Internet Sales", emailAddress: "sales@automax-dealers.com", autoResponseRules: { rules: [{ trigger: "price", action: "send_pricing_sheet" }, { trigger: "test-drive", action: "schedule_test_drive" }, { trigger: "trade-in", action: "request_vehicle_info" }, { trigger: "financing", action: "send_application" }] }, confidenceThreshold: 0.80, signature: "AutoMax Dealership\nInternet Sales Department\n(415) 555-1005\nwww.automax-dealers.com", status: "active", industry: "car dealerships" } }),
    prisma.emailAgent.create({ data: { name: "Grand Horizon Guest Services", emailAddress: "concierge@grandhorizon-hotel.com", autoResponseRules: { rules: [{ trigger: "booking", action: "check_room_availability" }, { trigger: "spa", action: "send_spa_menu" }, { trigger: "complaint", action: "escalate_to_manager" }, { trigger: "checkout", action: "process_checkout" }] }, confidenceThreshold: 0.85, signature: "Grand Horizon Hotel & Spa\nGuest Services\n(415) 555-1006\nwww.grandhorizon-hotel.com", status: "active", industry: "hospitality" } }),
    prisma.emailAgent.create({ data: { name: "Resolve Financial Correspondence", emailAddress: "accounts@resolve-financial.com", autoResponseRules: { rules: [{ trigger: "dispute", action: "open_dispute_case" }, { trigger: "payment", action: "send_payment_link" }, { trigger: "hardship", action: "forward_to_hardship_team" }, { trigger: "cease", action: "flag_and_comply" }] }, confidenceThreshold: 0.92, signature: "Resolve Financial Services\nCorrespondence Department\n1-800-555-0199\nwww.resolve-financial.com\nThis is an attempt to collect a debt.", status: "active", industry: "debt collection" } }),
    prisma.emailAgent.create({ data: { name: "BrightSmile Cosmetic Inquiries", emailAddress: "cosmetic@brightsmile-kids.com", autoResponseRules: { rules: [{ trigger: "whitening", action: "send_whitening_info" }, { trigger: "veneers", action: "send_veneer_brochure" }, { trigger: "pricing", action: "send_price_guide" }] }, confidenceThreshold: 0.83, signature: "BrightSmile Dental\nCosmetic Dentistry\n(415) 555-1008\nwww.brightsmile-dental.com", status: "active", industry: "dentistry" } }),
    prisma.emailAgent.create({ data: { name: "Le Petit Bistro Events", emailAddress: "events@lepetitbistro.com", autoResponseRules: { rules: [{ trigger: "private-dining", action: "send_event_packages" }, { trigger: "catering", action: "send_catering_menu" }, { trigger: "wedding", action: "forward_to_event_coordinator" }] }, confidenceThreshold: 0.80, signature: "Le Petit Bistro\nEvents & Private Dining\n(415) 555-1009\nwww.lepetitbistro.com", status: "active", industry: "restaurants" } }),
    prisma.emailAgent.create({ data: { name: "MedCare Billing Support", emailAddress: "billing@medcare-clinic.com", autoResponseRules: { rules: [{ trigger: "statement", action: "send_statement_copy" }, { trigger: "insurance", action: "verify_coverage" }, { trigger: "payment-plan", action: "setup_payment_plan" }] }, confidenceThreshold: 0.88, signature: "MedCare Clinic\nBilling Department\n(415) 555-1010\nwww.medcare-clinic.com", status: "active", industry: "health clinics" } }),
    prisma.emailAgent.create({ data: { name: "Luxury Living VIP Concierge", emailAddress: "vip@luxuryliving-realty.com", autoResponseRules: { rules: [{ trigger: "exclusive", action: "send_off_market_listings" }, { trigger: "viewing", action: "schedule_private_viewing" }, { trigger: "valuation", action: "schedule_appraisal" }] }, confidenceThreshold: 0.85, signature: "Luxury Living Real Estate\nVIP Client Services\n(415) 555-1011\nwww.luxuryliving-realty.com", status: "active", industry: "real estate" } }),
    prisma.emailAgent.create({ data: { name: "DriveTime Service Notifications", emailAddress: "service@drivetime-auto.com", autoResponseRules: { rules: [{ trigger: "recall", action: "send_recall_notice" }, { trigger: "service-due", action: "send_service_reminder" }, { trigger: "ready", action: "send_pickup_notification" }] }, confidenceThreshold: 0.80, signature: "DriveTime Auto\nService Department\n(415) 555-1012\nwww.drivetime-auto.com", status: "active", industry: "car dealerships" } }),
    prisma.emailAgent.create({ data: { name: "Seaside Resort Bookings", emailAddress: "bookings@seaside-resort.com", autoResponseRules: { rules: [{ trigger: "availability", action: "check_dates" }, { trigger: "package", action: "send_package_options" }, { trigger: "cancel", action: "process_cancellation" }] }, confidenceThreshold: 0.82, signature: "Seaside Resort & Spa\nReservations Team\n(415) 555-1013\nwww.seaside-resort.com", status: "active", industry: "hospitality" } }),
    prisma.emailAgent.create({ data: { name: "ClearPath Account Services", emailAddress: "accounts@clearpath-financial.com", autoResponseRules: { rules: [{ trigger: "validate", action: "send_debt_validation" }, { trigger: "settle", action: "send_settlement_offer" }, { trigger: "attorney", action: "flag_and_cease" }] }, confidenceThreshold: 0.93, signature: "ClearPath Financial Services\nAccount Services\n1-800-555-0200\nwww.clearpath-financial.com\nThis communication is from a debt collector.", status: "active", industry: "debt collection" } }),
    prisma.emailAgent.create({ data: { name: "Sonrisa Dental Citas", emailAddress: "citas@sonrisa-dental.com", autoResponseRules: { rules: [{ trigger: "cita", action: "programar_cita" }, { trigger: "seguro", action: "verificar_seguro" }, { trigger: "urgencia", action: "escalar_inmediatamente" }] }, confidenceThreshold: 0.85, signature: "Clínica Dental Sonrisa\nRecepción\n(415) 555-1008\nwww.sonrisa-dental.com", status: "active", industry: "dentistry" } }),
  ]);
  console.log(`Created ${emailAgents.length} email agents`);

  // ─── Conversations ───────────────────────────────────────────────────────
  const conversations = await Promise.all([
    prisma.conversation.create({ data: { channel: Channel.VOICE, contactId: contacts[2].id, agentName: "Dr. Smile Receptionist", transcript: [{ role: "agent", text: "Thank you for calling Dr. Smile Dental. How can I help you today?" }, { role: "customer", text: "Hi, I need to schedule a wisdom teeth consultation." }, { role: "agent", text: "I'd be happy to help! Dr. Smile has openings next Tuesday at 10am or Thursday at 2pm. Which works better?" }, { role: "customer", text: "Tuesday at 10am works great." }, { role: "agent", text: "Perfect! You're all set for Tuesday at 10am. We'll send a confirmation text." }], sentiment: "positive", status: "completed", summary: "Patient scheduled wisdom teeth consultation for Tuesday 10am.", duration: 145 } }),
    prisma.conversation.create({ data: { channel: Channel.CHAT, contactId: contacts[3].id, agentName: "TableBot", transcript: [{ role: "agent", text: "Welcome! I'm here to help you find the perfect table." }, { role: "customer", text: "I need a table for 12 for a corporate dinner next Friday." }, { role: "agent", text: "For 12 guests, I'd recommend our private dining room. We have availability at 7pm and 8pm next Friday." }, { role: "customer", text: "8pm please. Any prix fixe options?" }, { role: "agent", text: "Yes! Our corporate prix fixe is $85/person with 3 courses and wine pairing. Shall I reserve?" }, { role: "customer", text: "Yes, book it." }], sentiment: "positive", status: "completed", summary: "Corporate dinner for 12 booked, private dining room, Friday 8pm, prix fixe menu.", duration: null } }),
    prisma.conversation.create({ data: { channel: Channel.EMAIL, contactId: contacts[4].id, agentName: "HealthFirst Patient Services", transcript: [{ role: "customer", text: "I'd like to refer my patient Maria Santos for a cardiology consultation." }, { role: "agent", text: "Thank you Dr. Patel. We've received the referral for Maria Santos. Our cardiology department has availability next week. We'll contact her directly to schedule." }], sentiment: "neutral", status: "completed", summary: "Physician referral received for cardiology consultation.", duration: null } }),
    prisma.conversation.create({ data: { channel: Channel.SMS, contactId: contacts[5].id, agentName: "AutoAdvisor", transcript: [{ role: "agent", text: "Hi David! Thanks for your interest in trading in your 2020 Honda Accord. Would you like to schedule an appraisal?" }, { role: "customer", text: "Yes, what times are available this week?" }, { role: "agent", text: "We have slots open Wed 3pm, Thu 11am, or Sat 10am. Which works best?" }, { role: "customer", text: "Saturday 10am" }], sentiment: "positive", status: "completed", summary: "Trade-in appraisal scheduled for Saturday 10am.", duration: null } }),
    prisma.conversation.create({ data: { channel: Channel.VOICE, contactId: contacts[6].id, agentName: "Grand Horizon Concierge", transcript: [{ role: "agent", text: "Thank you for calling Grand Horizon Hotel. How may I make your stay exceptional?" }, { role: "customer", text: "I need to book a conference room for 50 people on April 15th." }, { role: "agent", text: "Our Grand Ballroom seats up to 80 and is available April 15th. Rates start at $2,500 for a full day. Shall I prepare a proposal?" }, { role: "customer", text: "Yes, and include catering options." }], sentiment: "positive", status: "completed", summary: "Conference room inquiry for 50 people. Sending Grand Ballroom proposal with catering.", duration: 210 } }),
    prisma.conversation.create({ data: { channel: Channel.VOICE, contactId: contacts[7].id, agentName: "Resolve Financial Agent", transcript: [{ role: "agent", text: "Hello, this is Resolve Financial. I'm calling about your account balance of $4,200." }, { role: "customer", text: "I know about it. I've been having some financial difficulties." }, { role: "agent", text: "I understand. We have flexible payment options. Would a 12-month plan at $350/month work for you?" }, { role: "customer", text: "That's still tight. Could we do 18 months?" }, { role: "agent", text: "I can offer 18 months at approximately $233/month. Would you like to set that up?" }, { role: "customer", text: "Yes, that would help a lot." }], sentiment: "neutral", status: "completed", summary: "18-month payment plan established at $233/month for $4,200 balance.", duration: 380 } }),
    prisma.conversation.create({ data: { channel: Channel.CHAT, contactId: contacts[8].id, agentName: "SmilePlanner", transcript: [{ role: "agent", text: "Hi! Want to plan your perfect smile?" }, { role: "customer", text: "I'm interested in veneers. What does the process look like?" }, { role: "agent", text: "Great choice! Veneers typically require 2-3 visits. First a consultation, then prep, and finally placement. Our porcelain veneers start at $1,200 per tooth." }, { role: "customer", text: "Can I see some before and after photos?" }, { role: "agent", text: "Of course! Here's our gallery: [link]. Would you like to book a free consultation?" }], sentiment: "positive", status: "open", summary: "Prospective patient interested in veneers, shared gallery, consultation pending.", duration: null } }),
    prisma.conversation.create({ data: { channel: Channel.EMAIL, contactId: contacts[9].id, agentName: "Bella Italia Reservations", transcript: [{ role: "customer", text: "We'd like to discuss catering for our restaurant's grand opening next month. Can you provide Italian cuisine for 200 guests?" }, { role: "agent", text: "Congratulations on your new location! We'd love to cater your grand opening. I'm attaching our catering packages. Our event coordinator will follow up within 24 hours." }], sentiment: "positive", status: "completed", summary: "Catering inquiry for 200-guest grand opening. Event coordinator to follow up.", duration: null } }),
    prisma.conversation.create({ data: { channel: Channel.VOICE, contactId: contacts[10].id, agentName: "MedCare After Hours", transcript: [{ role: "agent", text: "MedCare After Hours line. Please describe your concern." }, { role: "customer", text: "I've been having chest tightness and shortness of breath for about an hour." }, { role: "agent", text: "Those symptoms need immediate attention. I'm transferring you to our on-call physician right away. If symptoms worsen, please call 911 immediately." }], sentiment: "negative", status: "escalated", summary: "URGENT: Patient reporting chest tightness and shortness of breath. Transferred to on-call physician.", duration: 65 } }),
    prisma.conversation.create({ data: { channel: Channel.CHAT, contactId: contacts[11].id, agentName: "HomeFinderBot", transcript: [{ role: "agent", text: "Welcome to Premier Realty! Tell me what you're looking for." }, { role: "customer", text: "I'm listing my Pacific Heights property. It's a 4BR Victorian, $2.5M." }, { role: "agent", text: "Wonderful! Pacific Heights Victorians are in high demand. I'll connect you with our luxury listing specialist, Sarah Thompson, who can schedule a walkthrough and discuss our marketing strategy." }], sentiment: "positive", status: "completed", summary: "Luxury listing inquiry - 4BR Victorian in Pacific Heights at $2.5M. Connected to listing specialist.", duration: null } }),
    prisma.conversation.create({ data: { channel: Channel.SMS, contactId: contacts[12].id, agentName: "AutoAdvisor", transcript: [{ role: "customer", text: "What SUVs do you have under 45K?" }, { role: "agent", text: "Great question! We have several options: 2026 Toyota Highlander ($42,500), 2026 Honda Pilot ($43,800), and 2025 Hyundai Palisade ($41,200). Want to schedule test drives?" }, { role: "customer", text: "I'd like to test drive the Highlander and Palisade" }, { role: "agent", text: "Perfect! How about Saturday morning? I can set up both test drives back to back starting at 10am." }], sentiment: "positive", status: "completed", summary: "Test drives scheduled for Toyota Highlander and Hyundai Palisade, Saturday 10am.", duration: null } }),
    prisma.conversation.create({ data: { channel: Channel.VOICE, contactId: contacts[13].id, agentName: "Seaside Resort Bookings", transcript: [{ role: "agent", text: "Aloha! Thank you for calling Seaside Resort." }, { role: "customer", text: "I need to book 50 rooms for a corporate retreat July 10-13." }, { role: "agent", text: "For 50 rooms over 3 nights, I can offer our corporate rate of $175/night per room. That includes breakfast and access to meeting facilities." }, { role: "customer", text: "Do you have team-building activities?" }, { role: "agent", text: "Absolutely! We offer kayaking, beach volleyball tournaments, cooking classes, and an escape room. I'll email you our full activities brochure." }], sentiment: "positive", status: "completed", summary: "Corporate retreat: 50 rooms July 10-13 at $175/night. Sending activities brochure.", duration: 290 } }),
    prisma.conversation.create({ data: { channel: Channel.EMAIL, contactId: contacts[14].id, agentName: "Resolve Financial Correspondence", transcript: [{ role: "customer", text: "I'm requesting a hardship review due to medical expenses. I've attached my documentation." }, { role: "agent", text: "We've received your hardship application and documentation. Your case has been assigned to our hardship review team (Case #HR-2026-0891). You'll receive a determination within 10 business days. During review, no collection activity will occur on your account." }], sentiment: "neutral", status: "open", summary: "Hardship review requested due to medical expenses. Case #HR-2026-0891 opened.", duration: null } }),
    prisma.conversation.create({ data: { channel: Channel.CHAT, contactId: contacts[15].id, agentName: "PropBot", transcript: [{ role: "agent", text: "Hello! Tell me your budget, preferred area, and must-haves!" }, { role: "customer", text: "Budget $800K-1.2M, East Bay, multi-family, at least 4 units." }, { role: "agent", text: "I found 7 multi-family properties in the East Bay within your range. The best match is a 6-unit building in Oakland at $995K with a 6.2% cap rate. Want details?" }, { role: "customer", text: "Yes send me the listings" }], sentiment: "positive", status: "completed", summary: "Investor looking for multi-family 4+ units in East Bay, $800K-1.2M. Sent 7 matching listings.", duration: null } }),
    prisma.conversation.create({ data: { channel: Channel.VOICE, contactId: contacts[16].id, agentName: "BrightSmile Kids Dental", transcript: [{ role: "agent", text: "Hi there! Welcome to BrightSmile Kids Dental!" }, { role: "customer", text: "Hi, I need to schedule a braces consultation for my 13-year-old daughter." }, { role: "agent", text: "We love helping teens get beautiful smiles! Dr. Kim is our orthodontic specialist. She has openings next Monday at 3:30pm or Wednesday at 4pm after school." }, { role: "customer", text: "Wednesday at 4 is perfect." }], sentiment: "positive", status: "completed", summary: "Braces consultation scheduled for teen patient, Wednesday 4pm with Dr. Kim.", duration: 120 } }),
  ]);
  console.log(`Created ${conversations.length} conversations`);

  // ─── Campaigns ───────────────────────────────────────────────────────────
  const campaigns = await Promise.all([
    prisma.campaign.create({ data: { name: "Dental Awareness Month", type: "multi-channel", channels: ["sms", "email", "chat"], audience: "all-dental-patients", scheduledAt: new Date("2026-03-01T09:00:00Z"), status: "active", sentCount: 2400, openCount: 1680, responseCount: 520, conversionCount: 145 } }),
    prisma.campaign.create({ data: { name: "Restaurant Week Promotion", type: "promotional", channels: ["sms", "email", "social"], audience: "restaurant-subscribers", scheduledAt: new Date("2026-03-15T10:00:00Z"), status: "scheduled", sentCount: 0, openCount: 0, responseCount: 0, conversionCount: 0 } }),
    prisma.campaign.create({ data: { name: "Annual Health Checkup Drive", type: "outreach", channels: ["voice", "sms", "email"], audience: "patients-overdue-annual", scheduledAt: new Date("2026-02-01T08:00:00Z"), status: "completed", sentCount: 5200, openCount: 3640, responseCount: 1890, conversionCount: 945 } }),
    prisma.campaign.create({ data: { name: "Spring Real Estate Showcase", type: "lead-generation", channels: ["email", "sms", "social"], audience: "prospective-buyers", scheduledAt: new Date("2026-04-01T09:00:00Z"), status: "draft", sentCount: 0, openCount: 0, responseCount: 0, conversionCount: 0 } }),
    prisma.campaign.create({ data: { name: "Memorial Day Auto Sale", type: "promotional", channels: ["voice", "sms", "email", "social"], audience: "all-auto-leads", scheduledAt: new Date("2026-05-23T08:00:00Z"), status: "draft", sentCount: 0, openCount: 0, responseCount: 0, conversionCount: 0 } }),
    prisma.campaign.create({ data: { name: "Summer Getaway Packages", type: "seasonal", channels: ["email", "sms"], audience: "past-hotel-guests", scheduledAt: new Date("2026-04-15T10:00:00Z"), status: "draft", sentCount: 0, openCount: 0, responseCount: 0, conversionCount: 0 } }),
    prisma.campaign.create({ data: { name: "Q1 Collections Outreach", type: "outreach", channels: ["voice", "sms", "email"], audience: "accounts-30-60-days", scheduledAt: new Date("2026-01-05T09:00:00Z"), status: "completed", sentCount: 8900, openCount: 4450, responseCount: 2670, conversionCount: 1780 } }),
    prisma.campaign.create({ data: { name: "Invisalign Special Offer", type: "promotional", channels: ["email", "chat", "social"], audience: "orthodontic-inquiries", scheduledAt: new Date("2026-03-10T09:00:00Z"), status: "active", sentCount: 1200, openCount: 890, responseCount: 234, conversionCount: 67 } }),
    prisma.campaign.create({ data: { name: "Valentine's Dinner Special", type: "seasonal", channels: ["sms", "email"], audience: "couples-segment", scheduledAt: new Date("2026-02-07T10:00:00Z"), status: "completed", sentCount: 1800, openCount: 1440, responseCount: 680, conversionCount: 320 } }),
    prisma.campaign.create({ data: { name: "Telehealth Launch Campaign", type: "announcement", channels: ["email", "sms", "voice"], audience: "all-clinic-patients", scheduledAt: new Date("2026-02-15T08:00:00Z"), status: "completed", sentCount: 6700, openCount: 4690, responseCount: 2010, conversionCount: 890 } }),
    prisma.campaign.create({ data: { name: "First-Time Buyer Webinar", type: "educational", channels: ["email", "social"], audience: "first-time-buyer-leads", scheduledAt: new Date("2026-03-22T17:00:00Z"), status: "scheduled", sentCount: 0, openCount: 0, responseCount: 0, conversionCount: 0 } }),
    prisma.campaign.create({ data: { name: "Certified Pre-Owned Event", type: "promotional", channels: ["sms", "email", "voice"], audience: "budget-buyers", scheduledAt: new Date("2026-03-28T09:00:00Z"), status: "scheduled", sentCount: 0, openCount: 0, responseCount: 0, conversionCount: 0 } }),
    prisma.campaign.create({ data: { name: "Loyalty Rewards Program", type: "retention", channels: ["email", "sms"], audience: "repeat-hotel-guests", scheduledAt: new Date("2026-01-15T10:00:00Z"), status: "active", sentCount: 3400, openCount: 2720, responseCount: 1360, conversionCount: 680 } }),
    prisma.campaign.create({ data: { name: "Hardship Program Awareness", type: "informational", channels: ["email", "sms"], audience: "accounts-90-plus-days", scheduledAt: new Date("2026-02-20T09:00:00Z"), status: "completed", sentCount: 4200, openCount: 2520, responseCount: 1260, conversionCount: 630 } }),
    prisma.campaign.create({ data: { name: "Kids Dental Fun Day", type: "community", channels: ["sms", "email", "social"], audience: "families-with-children", scheduledAt: new Date("2026-04-05T09:00:00Z"), status: "draft", sentCount: 0, openCount: 0, responseCount: 0, conversionCount: 0 } }),
    prisma.campaign.create({ data: { name: "Mother's Day Brunch", type: "seasonal", channels: ["email", "sms", "social"], audience: "all-restaurant-contacts", scheduledAt: new Date("2026-05-01T10:00:00Z"), status: "draft", sentCount: 0, openCount: 0, responseCount: 0, conversionCount: 0 } }),
  ]);
  console.log(`Created ${campaigns.length} campaigns`);

  // ─── Integrations ────────────────────────────────────────────────────────
  const integrations = await Promise.all([
    prisma.integration.create({ data: { name: "Twilio Voice", type: "telephony", provider: "twilio", status: "active", config: { accountSid: "AC_PLACEHOLDER", authToken: "PLACEHOLDER", phoneNumbers: ["+14155559001", "+14155559002"] }, lastSyncAt: new Date("2026-03-06T01:00:00Z") } }),
    prisma.integration.create({ data: { name: "Twilio SMS", type: "messaging", provider: "twilio", status: "active", config: { accountSid: "AC_PLACEHOLDER", messagingServiceSid: "MG_PLACEHOLDER" }, lastSyncAt: new Date("2026-03-06T01:00:00Z") } }),
    prisma.integration.create({ data: { name: "SendGrid Email", type: "email", provider: "sendgrid", status: "active", config: { apiKey: "SG_PLACEHOLDER", senderDomain: "mail.luranai.com" }, lastSyncAt: new Date("2026-03-06T00:30:00Z") } }),
    prisma.integration.create({ data: { name: "OpenAI GPT-4", type: "ai-engine", provider: "openai", status: "active", config: { apiKey: "sk_PLACEHOLDER", model: "gpt-4-turbo", maxTokens: 4096 }, lastSyncAt: new Date("2026-03-06T02:00:00Z") } }),
    prisma.integration.create({ data: { name: "Google Calendar", type: "scheduling", provider: "google", status: "active", config: { clientId: "PLACEHOLDER", clientSecret: "PLACEHOLDER", calendarIds: ["primary", "appointments"] }, lastSyncAt: new Date("2026-03-05T23:00:00Z") } }),
    prisma.integration.create({ data: { name: "Salesforce CRM", type: "crm", provider: "salesforce", status: "active", config: { instanceUrl: "https://luranai.my.salesforce.com", clientId: "PLACEHOLDER", clientSecret: "PLACEHOLDER" }, lastSyncAt: new Date("2026-03-06T00:00:00Z") } }),
    prisma.integration.create({ data: { name: "Stripe Payments", type: "payments", provider: "stripe", status: "active", config: { publishableKey: "pk_PLACEHOLDER", secretKey: "sk_PLACEHOLDER", webhookSecret: "whsec_PLACEHOLDER" }, lastSyncAt: new Date("2026-03-06T01:30:00Z") } }),
    prisma.integration.create({ data: { name: "HubSpot Marketing", type: "marketing", provider: "hubspot", status: "active", config: { apiKey: "PLACEHOLDER", portalId: "12345678" }, lastSyncAt: new Date("2026-03-05T22:00:00Z") } }),
    prisma.integration.create({ data: { name: "Zendesk Support", type: "helpdesk", provider: "zendesk", status: "inactive", config: { subdomain: "luranai", apiToken: "PLACEHOLDER" }, lastSyncAt: new Date("2026-02-15T10:00:00Z") } }),
    prisma.integration.create({ data: { name: "Slack Notifications", type: "notifications", provider: "slack", status: "active", config: { webhookUrl: "https://hooks.slack.com/services/PLACEHOLDER", channels: ["#alerts", "#sales-notifications"] }, lastSyncAt: new Date("2026-03-06T02:00:00Z") } }),
    prisma.integration.create({ data: { name: "ElevenLabs TTS", type: "voice-synthesis", provider: "elevenlabs", status: "active", config: { apiKey: "PLACEHOLDER", defaultVoiceId: "21m00Tcm4TlvDq8ikWAM" }, lastSyncAt: new Date("2026-03-06T01:45:00Z") } }),
    prisma.integration.create({ data: { name: "Zapier Workflows", type: "automation", provider: "zapier", status: "active", config: { apiKey: "PLACEHOLDER", activeZaps: 15 }, lastSyncAt: new Date("2026-03-06T00:15:00Z") } }),
  ]);
  console.log(`Created ${integrations.length} integrations`);

  // ─── Knowledge Base ──────────────────────────────────────────────────────
  const knowledgeBase = await Promise.all([
    prisma.knowledgeBase.create({ data: { title: "Common Dental Procedures FAQ", content: "Root canals remove infected pulp from inside a tooth. Crowns cover damaged teeth. Bridges replace missing teeth by anchoring to adjacent teeth. Implants are titanium posts surgically placed in the jawbone. Veneers are thin shells bonded to the front of teeth for cosmetic improvement.", category: "procedures", industry: "dentistry", tags: ["faq", "procedures", "patient-education"] } }),
    prisma.knowledgeBase.create({ data: { title: "Dental Insurance Guide", content: "Most PPO plans cover preventive care at 100%, basic procedures at 80%, and major procedures at 50%. Annual maximums typically range from $1,000-$2,000. Waiting periods for major work are usually 6-12 months. We accept Delta Dental, Cigna, Aetna, MetLife, and most PPO plans.", category: "insurance", industry: "dentistry", tags: ["insurance", "billing", "coverage"] } }),
    prisma.knowledgeBase.create({ data: { title: "Restaurant Allergen Guide", content: "Common allergens in our menu: Gluten (pasta, bread, sauces), Dairy (cheese, cream sauces, butter), Nuts (pesto, desserts), Shellfish (seafood risotto, linguine), Eggs (pasta, desserts). Always ask about daily specials. We can accommodate most dietary restrictions with advance notice.", category: "menu", industry: "restaurants", tags: ["allergens", "dietary", "safety"] } }),
    prisma.knowledgeBase.create({ data: { title: "Wine Pairing Recommendations", content: "Antipasti: Prosecco or Pinot Grigio. Pasta with red sauce: Chianti or Sangiovese. Seafood: Vermentino or Sauvignon Blanc. Grilled meats: Barolo or Brunello. Desserts: Moscato d'Asti or Vin Santo. Our sommelier can provide personalized recommendations for any dish.", category: "beverages", industry: "restaurants", tags: ["wine", "pairing", "sommelier"] } }),
    prisma.knowledgeBase.create({ data: { title: "Patient Intake Process", content: "New patients should arrive 15 minutes early to complete paperwork. Required documents: photo ID, insurance card, medication list, medical history form. Co-pays are collected at time of visit. We offer translation services in Spanish, Mandarin, and Vietnamese.", category: "operations", industry: "health clinics", tags: ["intake", "new-patient", "process"] } }),
    prisma.knowledgeBase.create({ data: { title: "Telehealth Visit Guidelines", content: "Telehealth visits are available for follow-ups, medication management, mental health, and minor acute concerns. Patients need a stable internet connection, camera-enabled device, and a private space. Insurance coverage for telehealth varies by plan. Technical support is available at (415) 555-1010.", category: "telehealth", industry: "health clinics", tags: ["telehealth", "virtual", "technology"] } }),
    prisma.knowledgeBase.create({ data: { title: "Home Buying Process Guide", content: "Step 1: Get pre-approved for a mortgage. Step 2: Define your criteria (location, size, budget). Step 3: Tour properties with your agent. Step 4: Make an offer. Step 5: Home inspection and appraisal. Step 6: Review and sign closing documents. Step 7: Get your keys! Average timeline: 30-60 days from offer to close.", category: "buyer-guide", industry: "real estate", tags: ["buying", "process", "first-time"] } }),
    prisma.knowledgeBase.create({ data: { title: "San Francisco Market Report Q1 2026", content: "Median home price: $1.45M (+3.2% YoY). Average days on market: 28. Inventory: 1,450 active listings. Most active neighborhoods: Mission District, SOMA, Pacific Heights. Condo market showing signs of recovery with 5.1% price increase. Interest rates averaging 5.8% for 30-year fixed.", category: "market-data", industry: "real estate", tags: ["market-report", "san-francisco", "statistics"] } }),
    prisma.knowledgeBase.create({ data: { title: "Vehicle Financing Options", content: "New vehicle rates: 0-4.9% APR for qualified buyers. Used vehicle rates: 3.9-7.9% APR. Lease options: 24, 36, or 48 months with $0-$2,999 due at signing. We work with 15+ lenders. First-time buyer programs available. Trade-in values based on KBB fair market assessment.", category: "financing", industry: "car dealerships", tags: ["financing", "apr", "leasing"] } }),
    prisma.knowledgeBase.create({ data: { title: "Vehicle Maintenance Schedule", content: "Every 5,000 miles: Oil change, tire rotation. Every 15,000 miles: Cabin air filter, engine air filter. Every 30,000 miles: Transmission fluid, brake fluid, coolant flush. Every 60,000 miles: Spark plugs, timing belt inspection. Every 100,000 miles: Major service including all fluids, belts, and comprehensive inspection.", category: "service", industry: "car dealerships", tags: ["maintenance", "service", "schedule"] } }),
    prisma.knowledgeBase.create({ data: { title: "Hotel Amenities & Services", content: "Room amenities: High-speed WiFi, 55-inch smart TV, Nespresso machine, luxury linens, rainfall shower. Hotel facilities: Infinity pool, full-service spa, fitness center, business center, 3 restaurants, rooftop bar. Services: 24-hour room service, valet parking ($45/night), airport shuttle ($35), concierge, laundry/dry cleaning.", category: "amenities", industry: "hospitality", tags: ["amenities", "services", "facilities"] } }),
    prisma.knowledgeBase.create({ data: { title: "Event & Conference Packages", content: "Meeting rooms: 5 rooms for 10-200 guests. Equipment: Projectors, screens, microphones, video conferencing. Catering: Continental breakfast ($25/person), lunch buffet ($45/person), dinner ($65-95/person). AV support: $500/day. Event coordinator: Complimentary for groups 50+. Special corporate rates for recurring bookings.", category: "events", industry: "hospitality", tags: ["events", "conference", "corporate"] } }),
    prisma.knowledgeBase.create({ data: { title: "FDCPA Compliance Guidelines", content: "Cannot call before 8am or after 9pm local time. Must identify as debt collector on every call. Must send written validation notice within 5 days of first contact. Must cease communication if consumer sends written request. Cannot discuss debt with third parties except spouse or attorney. Cannot use threatening, obscene, or abusive language.", category: "compliance", industry: "debt collection", tags: ["fdcpa", "compliance", "regulations"] } }),
    prisma.knowledgeBase.create({ data: { title: "Payment Plan Options", content: "Standard plan: 6-12 months, no interest. Extended plan: 12-24 months, may include administrative fee. Hardship plan: Reduced payments based on income verification. Settlement: Lump-sum payment for reduced balance (typically 40-60% of total). All plans require signed agreement. Auto-pay discount of $10/month available.", category: "payment-options", industry: "debt collection", tags: ["payment-plan", "settlement", "options"] } }),
    prisma.knowledgeBase.create({ data: { title: "Dental Emergency Protocols", content: "Knocked-out tooth: Keep moist, reimplant within 1 hour if possible. Severe toothache: Rinse with warm salt water, take OTC pain reliever. Broken tooth: Save pieces, apply gauze to bleeding. Lost filling/crown: Use dental cement from pharmacy as temporary fix. Abscess: Seek immediate care, do not pop. After-hours emergency line: (415) 555-1099.", category: "emergency", industry: "dentistry", tags: ["emergency", "protocol", "urgent"] } }),
    prisma.knowledgeBase.create({ data: { title: "Restaurant Health & Safety Standards", content: "All staff must have valid food handler certification. Temperature danger zone: 40-140F. Hot holding: minimum 135F. Cold holding: maximum 41F. Handwashing: minimum 20 seconds with soap. Sanitizer concentration: 50-100 ppm chlorine. FIFO inventory management. Daily temperature logs required for all refrigeration units.", category: "safety", industry: "restaurants", tags: ["health", "safety", "compliance"] } }),
  ]);
  console.log(`Created ${knowledgeBase.length} knowledge base entries`);

  // ─── Call Logs ────────────────────────────────────────────────────────────
  const callLogs = await Promise.all([
    prisma.callLog.create({ data: { voiceAgentId: voiceAgents[0].id, contactId: contacts[2].id, duration: 145, outcome: "appointment-booked", recordingUrl: "https://storage.luranai.com/recordings/call-001.mp3", transcript: "Patient called to schedule wisdom teeth consultation. Booked for Tuesday 10am.", sentiment: "positive", createdAt: new Date("2026-03-05T14:30:00Z") } }),
    prisma.callLog.create({ data: { voiceAgentId: voiceAgents[1].id, contactId: contacts[3].id, duration: 98, outcome: "reservation-made", recordingUrl: "https://storage.luranai.com/recordings/call-002.mp3", transcript: "Guest booked private dining room for 12 on Friday at 8pm with prix fixe menu.", sentiment: "positive", createdAt: new Date("2026-03-05T11:15:00Z") } }),
    prisma.callLog.create({ data: { voiceAgentId: voiceAgents[2].id, contactId: contacts[4].id, duration: 210, outcome: "referral-processed", recordingUrl: "https://storage.luranai.com/recordings/call-003.mp3", transcript: "Dr. Patel referred patient Maria Santos for cardiology consultation.", sentiment: "neutral", createdAt: new Date("2026-03-04T09:45:00Z") } }),
    prisma.callLog.create({ data: { voiceAgentId: voiceAgents[3].id, contactId: contacts[0].id, duration: 320, outcome: "showing-scheduled", recordingUrl: "https://storage.luranai.com/recordings/call-004.mp3", transcript: "First-time buyer looking for 3BR downtown. Scheduled 3 property viewings for Saturday.", sentiment: "positive", createdAt: new Date("2026-03-04T13:20:00Z") } }),
    prisma.callLog.create({ data: { voiceAgentId: voiceAgents[4].id, contactId: contacts[5].id, duration: 180, outcome: "test-drive-scheduled", recordingUrl: "https://storage.luranai.com/recordings/call-005.mp3", transcript: "Customer wants to trade in 2020 Accord. Appraisal and test drive scheduled for Saturday 10am.", sentiment: "positive", createdAt: new Date("2026-03-03T15:00:00Z") } }),
    prisma.callLog.create({ data: { voiceAgentId: voiceAgents[5].id, contactId: contacts[6].id, duration: 210, outcome: "proposal-requested", recordingUrl: "https://storage.luranai.com/recordings/call-006.mp3", transcript: "Conference room inquiry for 50 people April 15th. Sending Grand Ballroom proposal.", sentiment: "positive", createdAt: new Date("2026-03-03T10:30:00Z") } }),
    prisma.callLog.create({ data: { voiceAgentId: voiceAgents[6].id, contactId: contacts[7].id, duration: 380, outcome: "payment-plan-established", recordingUrl: "https://storage.luranai.com/recordings/call-007.mp3", transcript: "Debtor agreed to 18-month payment plan at $233/month for $4,200 balance.", sentiment: "neutral", createdAt: new Date("2026-03-02T14:00:00Z") } }),
    prisma.callLog.create({ data: { voiceAgentId: voiceAgents[9].id, contactId: contacts[10].id, duration: 65, outcome: "escalated-to-physician", recordingUrl: "https://storage.luranai.com/recordings/call-008.mp3", transcript: "URGENT: Patient reporting chest tightness. Transferred to on-call physician immediately.", sentiment: "negative", createdAt: new Date("2026-03-05T22:15:00Z") } }),
    prisma.callLog.create({ data: { voiceAgentId: voiceAgents[12].id, contactId: contacts[13].id, duration: 290, outcome: "booking-confirmed", recordingUrl: "https://storage.luranai.com/recordings/call-009.mp3", transcript: "Corporate retreat booking: 50 rooms July 10-13 at $175/night. Activities brochure to be sent.", sentiment: "positive", createdAt: new Date("2026-03-04T11:00:00Z") } }),
    prisma.callLog.create({ data: { voiceAgentId: voiceAgents[14].id, contactId: contacts[16].id, duration: 120, outcome: "appointment-booked", recordingUrl: "https://storage.luranai.com/recordings/call-010.mp3", transcript: "Parent scheduling braces consultation for 13-year-old daughter. Wednesday 4pm with Dr. Kim.", sentiment: "positive", createdAt: new Date("2026-03-05T16:45:00Z") } }),
    prisma.callLog.create({ data: { voiceAgentId: voiceAgents[13].id, contactId: contacts[14].id, duration: 240, outcome: "hardship-review-initiated", recordingUrl: "https://storage.luranai.com/recordings/call-011.mp3", transcript: "Debtor requesting hardship consideration due to medical bills. Documentation to be submitted via email.", sentiment: "neutral", createdAt: new Date("2026-03-01T10:30:00Z") } }),
    prisma.callLog.create({ data: { voiceAgentId: voiceAgents[0].id, contactId: contacts[8].id, duration: 185, outcome: "consultation-booked", recordingUrl: "https://storage.luranai.com/recordings/call-012.mp3", transcript: "Patient interested in veneers. Free cosmetic consultation booked for next Thursday 2pm.", sentiment: "positive", createdAt: new Date("2026-03-05T09:20:00Z") } }),
    prisma.callLog.create({ data: { voiceAgentId: voiceAgents[4].id, contactId: contacts[12].id, duration: 250, outcome: "test-drive-scheduled", recordingUrl: "https://storage.luranai.com/recordings/call-013.mp3", transcript: "Family looking for SUV under $45K. Test drives scheduled for Highlander and Palisade Saturday 10am.", sentiment: "positive", createdAt: new Date("2026-03-04T14:15:00Z") } }),
    prisma.callLog.create({ data: { voiceAgentId: voiceAgents[10].id, contactId: contacts[11].id, duration: 400, outcome: "listing-meeting-scheduled", recordingUrl: "https://storage.luranai.com/recordings/call-014.mp3", transcript: "Luxury listing: 4BR Victorian in Pacific Heights at $2.5M. Listing presentation meeting scheduled.", sentiment: "positive", createdAt: new Date("2026-03-03T16:00:00Z") } }),
    prisma.callLog.create({ data: { voiceAgentId: voiceAgents[7].id, contactId: contacts[2].id, duration: 95, outcome: "voicemail-left", recordingUrl: "https://storage.luranai.com/recordings/call-015.mp3", transcript: "Llamada para recordar cita dental mañana a las 10am. Se dejó mensaje de voz.", sentiment: "neutral", createdAt: new Date("2026-03-04T17:00:00Z") } }),
    prisma.callLog.create({ data: { voiceAgentId: voiceAgents[11].id, contactId: contacts[19].id, duration: 155, outcome: "service-scheduled", recordingUrl: "https://storage.luranai.com/recordings/call-016.mp3", transcript: "Lease return customer wants to upgrade. Service appointment for final inspection scheduled Friday 9am.", sentiment: "positive", createdAt: new Date("2026-03-05T12:30:00Z") } }),
  ]);
  console.log(`Created ${callLogs.length} call logs`);

  // ─── Appointments ────────────────────────────────────────────────────────
  const appointments = await Promise.all([
    prisma.appointment.create({ data: { contactId: contacts[2].id, dateTime: new Date("2026-03-10T10:00:00Z"), type: "wisdom-teeth-consultation", status: "confirmed", reminderSent: true, notes: "Patient may need extraction. Review X-rays before visit.", location: "Dr. Smile Dental, Suite 200" } }),
    prisma.appointment.create({ data: { contactId: contacts[0].id, dateTime: new Date("2026-03-08T10:00:00Z"), type: "property-viewing", status: "confirmed", reminderSent: true, notes: "3 properties in downtown area. Budget $550-600K.", location: "Meeting at 123 Market St" } }),
    prisma.appointment.create({ data: { contactId: contacts[5].id, dateTime: new Date("2026-03-08T10:00:00Z"), type: "trade-in-appraisal", status: "confirmed", reminderSent: true, notes: "2020 Honda Accord, ~45K miles. Interested in SUV upgrade.", location: "AutoMax Dealership" } }),
    prisma.appointment.create({ data: { contactId: contacts[8].id, dateTime: new Date("2026-03-13T14:00:00Z"), type: "cosmetic-consultation", status: "confirmed", reminderSent: false, notes: "Interested in porcelain veneers. Bring before/after portfolio.", location: "BrightSmile Dental" } }),
    prisma.appointment.create({ data: { contactId: contacts[16].id, dateTime: new Date("2026-03-12T16:00:00Z"), type: "orthodontic-consultation", status: "confirmed", reminderSent: true, notes: "13-year-old daughter, braces evaluation. Dr. Kim.", location: "BrightSmile Kids Dental" } }),
    prisma.appointment.create({ data: { contactId: contacts[10].id, dateTime: new Date("2026-03-09T09:00:00Z"), type: "telehealth-followup", status: "confirmed", reminderSent: true, notes: "Follow-up on blood pressure medication. Check recent lab results.", location: "Telehealth - Video Call" } }),
    prisma.appointment.create({ data: { contactId: contacts[12].id, dateTime: new Date("2026-03-08T10:00:00Z"), type: "test-drive", status: "confirmed", reminderSent: true, notes: "Test driving Toyota Highlander and Hyundai Palisade. Budget $45K.", location: "AutoMax Dealership" } }),
    prisma.appointment.create({ data: { contactId: contacts[6].id, dateTime: new Date("2026-04-15T09:00:00Z"), type: "venue-walkthrough", status: "scheduled", reminderSent: false, notes: "Conference for 50 people. Grand Ballroom tour and catering tasting.", location: "Grand Horizon Hotel" } }),
    prisma.appointment.create({ data: { contactId: contacts[11].id, dateTime: new Date("2026-03-09T14:00:00Z"), type: "listing-presentation", status: "confirmed", reminderSent: true, notes: "4BR Victorian, Pacific Heights, $2.5M. Bring CMA and marketing plan.", location: "Property at 456 Pacific Ave" } }),
    prisma.appointment.create({ data: { contactId: contacts[18].id, dateTime: new Date("2026-03-11T10:00:00Z"), type: "system-demo", status: "confirmed", reminderSent: true, notes: "EHR integration demo. Wellness MD wants to connect their Epic system.", location: "Wellness MD Clinic, Conference Room B" } }),
    prisma.appointment.create({ data: { contactId: contacts[3].id, dateTime: new Date("2026-03-13T20:00:00Z"), type: "dinner-reservation", status: "confirmed", reminderSent: false, notes: "Corporate dinner for 12. Private dining room. Prix fixe menu at $85/person.", location: "Bella Italia Ristorante" } }),
    prisma.appointment.create({ data: { contactId: contacts[19].id, dateTime: new Date("2026-03-07T09:00:00Z"), type: "lease-return-inspection", status: "confirmed", reminderSent: true, notes: "Final lease inspection. Customer interested in upgrading to new model.", location: "DriveTime Auto Service Center" } }),
    prisma.appointment.create({ data: { contactId: contacts[15].id, dateTime: new Date("2026-03-15T11:00:00Z"), type: "property-viewing", status: "scheduled", reminderSent: false, notes: "Viewing 6-unit building in Oakland. Investor client, cap rate focus.", location: "789 Oak Street, Oakland" } }),
    prisma.appointment.create({ data: { contactId: contacts[20].id, dateTime: new Date("2026-03-18T14:00:00Z"), type: "group-booking-meeting", status: "scheduled", reminderSent: false, notes: "Tour group bookings for summer season. 200+ rooms across 4 properties.", location: "Seaside Resort, Sales Office" } }),
    prisma.appointment.create({ data: { contactId: contacts[7].id, dateTime: new Date("2026-04-01T10:00:00Z"), type: "payment-review", status: "scheduled", reminderSent: false, notes: "3-month check-in on payment plan progress. Review for possible adjustment.", location: "Phone Call" } }),
    prisma.appointment.create({ data: { contactId: contacts[17].id, dateTime: new Date("2026-03-20T12:00:00Z"), type: "catering-tasting", status: "scheduled", reminderSent: false, notes: "Menu tasting for new location grand opening catering.", location: "Taqueria Mendez, Main Location" } }),
  ]);
  console.log(`Created ${appointments.length} appointments`);

  // ─── Templates ───────────────────────────────────────────────────────────
  const templates = await Promise.all([
    prisma.template.create({ data: { name: "Appointment Reminder SMS", type: TemplateType.SMS, content: "Hi {{firstName}}, this is a reminder about your appointment at {{location}} on {{date}} at {{time}}. Reply C to confirm or R to reschedule.", variables: ["firstName", "location", "date", "time"], industry: "dentistry", category: "reminders" } }),
    prisma.template.create({ data: { name: "Reservation Confirmation SMS", type: TemplateType.SMS, content: "{{firstName}}, your reservation at {{restaurant}} is confirmed for {{date}} at {{time}}, party of {{partySize}}. Reply CHANGE to modify.", variables: ["firstName", "restaurant", "date", "time", "partySize"], industry: "restaurants", category: "confirmations" } }),
    prisma.template.create({ data: { name: "Lab Results Ready", type: TemplateType.SMS, content: "{{firstName}}, your lab results are now available on the patient portal. Log in at {{portalLink}} to view. Questions? Call (415) 555-1003.", variables: ["firstName", "portalLink"], industry: "health clinics", category: "notifications" } }),
    prisma.template.create({ data: { name: "New Listing Alert", type: TemplateType.EMAIL, content: "Dear {{firstName}},\n\nA new property matching your criteria has just been listed!\n\n{{propertyAddress}}\n{{beds}} beds | {{baths}} baths | {{sqft}} sq ft\nListed at {{price}}\n\nView details: {{listingLink}}\n\nWould you like to schedule a viewing?\n\nBest regards,\n{{agentName}}", variables: ["firstName", "propertyAddress", "beds", "baths", "sqft", "price", "listingLink", "agentName"], industry: "real estate", category: "alerts" } }),
    prisma.template.create({ data: { name: "Test Drive Follow-Up", type: TemplateType.EMAIL, content: "Hi {{firstName}},\n\nThank you for test driving the {{vehicleName}} today! We hope you enjoyed the experience.\n\nHere's a summary:\n- Vehicle: {{vehicleName}}\n- MSRP: {{price}}\n- Your estimated monthly payment: {{monthlyPayment}}\n\nReady to take the next step? Reply to this email or call us at (415) 555-1005.\n\n{{salespersonName}}\nAutoMax Dealership", variables: ["firstName", "vehicleName", "price", "monthlyPayment", "salespersonName"], industry: "car dealerships", category: "follow-up" } }),
    prisma.template.create({ data: { name: "Booking Confirmation", type: TemplateType.EMAIL, content: "Dear {{firstName}},\n\nYour reservation at Grand Horizon Hotel is confirmed!\n\nConfirmation #: {{confirmationNumber}}\nCheck-in: {{checkIn}}\nCheck-out: {{checkOut}}\nRoom Type: {{roomType}}\nRate: {{rate}}/night\n\nNeed anything before your stay? Our concierge team is here to help.\n\nWarm regards,\nGrand Horizon Hotel & Spa", variables: ["firstName", "confirmationNumber", "checkIn", "checkOut", "roomType", "rate"], industry: "hospitality", category: "confirmations" } }),
    prisma.template.create({ data: { name: "Payment Reminder Notice", type: TemplateType.EMAIL, content: "Dear {{firstName}} {{lastName}},\n\nThis is a reminder regarding your account #{{accountNumber}}.\n\nCurrent Balance: ${{balance}}\nPayment Due: {{dueDate}}\nMinimum Payment: ${{minimumPayment}}\n\nPay online: {{paymentLink}}\n\nIf you've already made this payment, please disregard this notice.\n\nResolve Financial Services\nThis is an attempt to collect a debt.", variables: ["firstName", "lastName", "accountNumber", "balance", "dueDate", "minimumPayment", "paymentLink"], industry: "debt collection", category: "reminders" } }),
    prisma.template.create({ data: { name: "Welcome New Patient", type: TemplateType.EMAIL, content: "Welcome to {{clinicName}}, {{firstName}}!\n\nWe're excited to have you as a patient. Here's what to bring to your first visit:\n\n- Photo ID\n- Insurance card\n- List of current medications\n- Completed intake form: {{formLink}}\n\nYour appointment: {{date}} at {{time}}\nLocation: {{address}}\n\nSee you soon!\n{{clinicName}} Team", variables: ["clinicName", "firstName", "formLink", "date", "time", "address"], industry: "health clinics", category: "onboarding" } }),
    prisma.template.create({ data: { name: "Chat Welcome - Dental", type: TemplateType.CHAT, content: "Hi {{firstName}}! Welcome to {{practiceName}}. I can help you with:\n\n1. Schedule an appointment\n2. Check insurance coverage\n3. Learn about our services\n4. Get directions\n\nWhat would you like help with?", variables: ["firstName", "practiceName"], industry: "dentistry", category: "welcome" } }),
    prisma.template.create({ data: { name: "Chat Welcome - Restaurant", type: TemplateType.CHAT, content: "Welcome to {{restaurantName}}! I can help you with:\n\n1. Make a reservation\n2. View our menu\n3. Dietary & allergen info\n4. Private events\n5. Gift cards\n\nHow can I help?", variables: ["restaurantName"], industry: "restaurants", category: "welcome" } }),
    prisma.template.create({ data: { name: "Outbound Call Script - Collections", type: TemplateType.VOICE, content: "Hello, may I speak with {{firstName}} {{lastName}}? ... This is {{agentName}} calling from {{companyName}}. This is an attempt to collect a debt and any information obtained will be used for that purpose. I'm calling about your account ending in {{lastFour}}. Your current balance is ${{balance}}. I'd like to discuss payment options that work for your situation.", variables: ["firstName", "lastName", "agentName", "companyName", "lastFour", "balance"], industry: "debt collection", category: "outbound-script" } }),
    prisma.template.create({ data: { name: "Inbound Call Script - Real Estate", type: TemplateType.VOICE, content: "Thank you for calling {{companyName}}! My name is {{agentName}}. Are you looking to buy, sell, or rent a property today? ... Great! Can I get your name and the best number to reach you? ... What area are you interested in, and what's your price range?", variables: ["companyName", "agentName"], industry: "real estate", category: "inbound-script" } }),
    prisma.template.create({ data: { name: "Service Reminder SMS", type: TemplateType.SMS, content: "{{firstName}}, your {{vehicle}} is due for its {{mileage}}-mile service! Book at DriveTime for ${{price}}. Schedule: {{link}} or reply BOOK.", variables: ["firstName", "vehicle", "mileage", "price", "link"], industry: "car dealerships", category: "reminders" } }),
    prisma.template.create({ data: { name: "Post-Stay Review Request", type: TemplateType.EMAIL, content: "Dear {{firstName}},\n\nThank you for staying at {{hotelName}}! We hope you had a wonderful experience.\n\nWould you take a moment to share your feedback? Your review helps us serve you better.\n\nLeave a review: {{reviewLink}}\n\nAs a thank you, enjoy 15% off your next stay with code: THANKYOU15\n\nWe look forward to welcoming you back!\n\n{{hotelName}} Team", variables: ["firstName", "hotelName", "reviewLink"], industry: "hospitality", category: "follow-up" } }),
    prisma.template.create({ data: { name: "Missed Call Follow-Up SMS", type: TemplateType.SMS, content: "Hi {{firstName}}, we noticed we missed your call at {{clinicName}}. We're sorry about that! Reply CALLBACK and we'll call you back, or book online: {{link}}", variables: ["firstName", "clinicName", "link"], industry: "health clinics", category: "follow-up" } }),
    prisma.template.create({ data: { name: "Special Offer SMS - Dental", type: TemplateType.SMS, content: "{{firstName}}, {{practiceName}} is offering {{discount}}% off {{service}} this month! Limited spots available. Book now: {{link}} or call {{phone}}. Reply STOP to opt out.", variables: ["firstName", "practiceName", "discount", "service", "link", "phone"], industry: "dentistry", category: "promotions" } }),
  ]);
  console.log(`Created ${templates.length} templates`);

  console.log("\nSeeding complete!");
  console.log("─".repeat(50));
  console.log(`Users:          ${users.length}`);
  console.log(`Voice Agents:   ${voiceAgents.length}`);
  console.log(`SMS Campaigns:  ${smsCampaigns.length}`);
  console.log(`Chat Agents:    ${chatAgents.length}`);
  console.log(`Email Agents:   ${emailAgents.length}`);
  console.log(`Contacts:       ${contacts.length}`);
  console.log(`Conversations:  ${conversations.length}`);
  console.log(`Campaigns:      ${campaigns.length}`);
  console.log(`Integrations:   ${integrations.length}`);
  console.log(`Knowledge Base: ${knowledgeBase.length}`);
  console.log(`Call Logs:      ${callLogs.length}`);
  console.log(`Appointments:   ${appointments.length}`);
  console.log(`Templates:      ${templates.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
