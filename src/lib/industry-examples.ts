// Per-industry example user prompts for the chat playground.
// Clicking an example chip in the playground sends the message immediately
// so demos can quickly walk through common flows for each industry.

export interface IndustryExample {
  label: string  // short button label
  message: string  // full message sent to the agent
  emoji?: string
}

export const INDUSTRY_EXAMPLES: Record<string, IndustryExample[]> = {
  dentistry: [
    { emoji: '📅', label: 'Book cleaning', message: "Hi, I'd like to schedule a routine cleaning for next week if possible." },
    { emoji: '🆕', label: 'New patient', message: "I'm a new patient and want to set up a first visit." },
    { emoji: '🚨', label: 'Tooth pain', message: "I have severe tooth pain and some swelling — I think I need to be seen today." },
    { emoji: '💳', label: 'Insurance question', message: "Do you take Delta Dental insurance, and how much would a filling cost?" },
    { emoji: '🔁', label: 'Reschedule', message: "I need to reschedule my appointment that's on Thursday." },
    { emoji: '🦷', label: 'Procedure info', message: "Can you tell me what a root canal involves and how long it takes?" },
  ],

  restaurants: [
    { emoji: '🍽️', label: 'Reservation', message: "I'd like to book a table for 4 this Saturday at 7pm." },
    { emoji: '👥', label: 'Large party', message: "We're a group of 12 for a birthday dinner next Friday — do you have a private room?" },
    { emoji: '🥗', label: 'Dietary needs', message: "Do you have gluten-free and vegan options on the menu?" },
    { emoji: '🕗', label: 'Hours', message: "What time do you close on Sundays, and are you open for brunch?" },
    { emoji: '🚗', label: 'Takeout', message: "Can I place a takeout order for pickup in 30 minutes?" },
    { emoji: '🎉', label: 'Catering', message: "I'm interested in catering for an office event of 50 people." },
  ],

  'health clinics': [
    { emoji: '🩺', label: 'Annual physical', message: "I'd like to schedule my annual physical sometime next month." },
    { emoji: '🤒', label: 'Sick visit', message: "I've had a sore throat and fever for two days — can I be seen this week?" },
    { emoji: '💊', label: 'Prescription refill', message: "I need a refill for my blood pressure medication." },
    { emoji: '🆕', label: 'New patient', message: "I'm new to the area and looking for a primary care doctor." },
    { emoji: '🚑', label: 'Urgent symptoms', message: "My elderly mother is having chest pain — what should I do?" },
    { emoji: '📋', label: 'Lab results', message: "I had bloodwork done last week — can I get my results?" },
  ],

  'real estate': [
    { emoji: '🏠', label: 'Schedule showing', message: "I'd like to tour the listing on 123 Maple Street this weekend." },
    { emoji: '💰', label: 'Pricing', message: "What's the asking price and any recent price changes on that property?" },
    { emoji: '🔍', label: 'Search by criteria', message: "I'm looking for a 3-bedroom house under $500k with a yard, in a good school district." },
    { emoji: '🏦', label: 'Pre-approval', message: "I haven't been pre-approved yet — can you walk me through what I need?" },
    { emoji: '📝', label: 'Make an offer', message: "I love the property and want to put in an offer — what's the next step?" },
    { emoji: '📞', label: 'Listing agent', message: "Can I speak directly with the listing agent about disclosures?" },
  ],

  'car dealerships': [
    { emoji: '🚗', label: 'Test drive', message: "I'd like to schedule a test drive for the new RAV4 this weekend." },
    { emoji: '💵', label: 'Financing', message: "What financing options do you offer for someone with average credit?" },
    { emoji: '🔁', label: 'Trade-in', message: "I have a 2018 Honda Civic with 60k miles — what's it worth as a trade-in?" },
    { emoji: '📦', label: 'Inventory', message: "Do you have any silver SUVs in stock under $35k?" },
    { emoji: '🛠️', label: 'Service dept', message: "I need to book a 30,000-mile service for my Camry." },
    { emoji: '🚨', label: 'Recall', message: "I got a recall notice in the mail — how do I schedule that?" },
  ],

  hospitality: [
    { emoji: '🛏️', label: 'Book a room', message: "I'd like to book a king room for 2 nights starting next Friday." },
    { emoji: '🔁', label: 'Modify booking', message: "I need to change the dates of my existing reservation — confirmation 12345." },
    { emoji: '🌅', label: 'Amenities', message: "Does the hotel have a pool, gym, and free breakfast?" },
    { emoji: '🅿️', label: 'Parking', message: "Is there free parking on-site, and what's the daily rate if not?" },
    { emoji: '🐕', label: 'Pet policy', message: "Are you pet-friendly? I'd be traveling with a small dog." },
    { emoji: '⏰', label: 'Late check-in', message: "I'll be arriving around 1am — is late check-in available?" },
  ],

  'debt collection': [
    { emoji: '💳', label: 'Verify debt', message: "I got a letter saying I owe a debt — can you tell me what it's for?" },
    { emoji: '📅', label: 'Payment plan', message: "I want to pay but can't pay it all at once. Can we set up a plan?" },
    { emoji: '🤝', label: 'Settle account', message: "Would you accept a lump-sum settlement for less than the full balance?" },
    { emoji: '⚖️', label: 'Dispute', message: "I don't believe this debt is mine — how do I dispute it?" },
    { emoji: '📄', label: 'Written validation', message: "Please send me written validation of the debt before we go further." },
    { emoji: '🛑', label: 'Cease contact', message: "I'm requesting that you stop contacting me at this number." },
  ],

  insurance: [
    { emoji: '📋', label: 'Get a quote', message: "I'd like a quote for auto insurance — I have a clean driving record." },
    { emoji: '🚗', label: 'File a claim', message: "I was just in a fender bender — how do I file a claim?" },
    { emoji: '🏠', label: 'Add coverage', message: "I'd like to bundle home insurance with my existing auto policy." },
    { emoji: '💵', label: 'Lower premium', message: "My premium went up — what discounts could I qualify for?" },
    { emoji: '📑', label: 'Policy details', message: "What does my current policy cover for rental cars after an accident?" },
    { emoji: '🆔', label: 'ID card', message: "Can you send me a digital copy of my insurance ID card?" },
  ],

  legal: [
    { emoji: '⚖️', label: 'Consultation', message: "I'd like to schedule a consultation about a personal injury case." },
    { emoji: '📄', label: 'Will & estate', message: "I want to set up a will and need to know your fees." },
    { emoji: '🏢', label: 'Business law', message: "I'm starting an LLC and have questions about formation paperwork." },
    { emoji: '🚨', label: 'Urgent matter', message: "I was just served with court papers and need help right away." },
    { emoji: '👨‍👩‍👧', label: 'Family law', message: "I'm considering filing for divorce — what's the process?" },
    { emoji: '💵', label: 'Fee structure', message: "Do you charge hourly or work on contingency?" },
  ],

  'home services': [
    { emoji: '🚰', label: 'Plumbing', message: "I have a leaky kitchen faucet — can someone come fix it this week?" },
    { emoji: '⚡', label: 'Electrical', message: "Half my outlets in the living room stopped working." },
    { emoji: '🔥', label: 'HVAC', message: "My AC isn't cooling properly — can I get a service tech out?" },
    { emoji: '🚨', label: 'Emergency', message: "I have water gushing from a burst pipe — I need someone right now!" },
    { emoji: '💵', label: 'Estimate', message: "I'd like a free estimate for replacing my water heater." },
    { emoji: '🗓️', label: 'Maintenance', message: "I want to set up annual furnace maintenance." },
  ],

  pharmacy: [
    { emoji: '💊', label: 'Refill', message: "I need to refill my Lipitor prescription — last name Smith." },
    { emoji: '✅', label: 'Refill ready?', message: "Is my prescription ready for pickup?" },
    { emoji: '💉', label: 'Vaccine', message: "I'd like to schedule a flu shot this week." },
    { emoji: '🔄', label: 'Transfer Rx', message: "Can you transfer my prescriptions from CVS to your pharmacy?" },
    { emoji: '⚠️', label: 'Drug interaction', message: "I just got a new prescription — will it interact with my current meds?" },
    { emoji: '🛒', label: 'Stock check', message: "Do you carry generic Adderall in stock right now?" },
  ],

  fitness: [
    { emoji: '🏋️', label: 'Tour the gym', message: "I'd like to come in for a tour and learn about membership options." },
    { emoji: '💳', label: 'Pricing', message: "What are your membership tiers and any current promotions?" },
    { emoji: '🏃', label: 'Personal trainer', message: "I'm interested in personal training — how does that work?" },
    { emoji: '📅', label: 'Class schedule', message: "What yoga and HIIT classes do you offer in the evenings?" },
    { emoji: '⏸️', label: 'Pause membership', message: "I need to freeze my membership for a month while I travel." },
    { emoji: '❌', label: 'Cancel', message: "I'd like to cancel my membership — what's the process?" },
  ],

  education: [
    { emoji: '📚', label: 'Enrollment', message: "I'd like to enroll my child for the upcoming school year." },
    { emoji: '🎓', label: 'Tutoring', message: "I'm looking for SAT prep tutoring for my high schooler." },
    { emoji: '📝', label: 'Course info', message: "Can you tell me about the curriculum for the 5th grade program?" },
    { emoji: '💵', label: 'Tuition', message: "What's the tuition cost, and do you offer financial aid?" },
    { emoji: '🏫', label: 'Campus tour', message: "I'd like to schedule a campus tour with my family." },
    { emoji: '📅', label: 'Open house', message: "When is your next open house event?" },
  ],

  'pet care': [
    { emoji: '🐶', label: 'Annual checkup', message: "I'd like to book an annual checkup for my dog Max." },
    { emoji: '💉', label: 'Vaccinations', message: "My puppy needs her next round of shots — when should she come in?" },
    { emoji: '🚨', label: 'Emergency', message: "My dog ate something he shouldn't have and is throwing up — what should I do?" },
    { emoji: '✂️', label: 'Grooming', message: "I'd like to book a grooming appointment for my golden retriever." },
    { emoji: '🏨', label: 'Boarding', message: "Do you have boarding availability for the week of Thanksgiving?" },
    { emoji: '🆕', label: 'New patient', message: "We just adopted a kitten and need to set her up as a new patient." },
  ],

  accounting: [
    { emoji: '📊', label: 'Tax prep', message: "I need help filing my personal taxes for last year." },
    { emoji: '🏢', label: 'Small business', message: "I run a small business and need ongoing bookkeeping help." },
    { emoji: '📅', label: 'Consultation', message: "Can I schedule a consultation to discuss tax strategy?" },
    { emoji: '💵', label: 'Fees', message: "What are your fees for individual vs. business returns?" },
    { emoji: '🧾', label: 'Audit help', message: "I was notified of an IRS audit and need representation." },
    { emoji: '🆕', label: 'New client', message: "I'm switching CPAs — what do you need from me to get started?" },
  ],

  salon: [
    { emoji: '💇', label: 'Haircut', message: "I'd like to book a haircut and blowout for this weekend." },
    { emoji: '🎨', label: 'Color', message: "I want to go from brunette to blonde — can I get a consultation?" },
    { emoji: '💅', label: 'Mani-pedi', message: "Do you have any availability for a manicure and pedicure today?" },
    { emoji: '👰', label: 'Bridal', message: "I'm getting married in June and need bridal hair and makeup for me and 4 bridesmaids." },
    { emoji: '💵', label: 'Pricing', message: "What's the price range for highlights and a cut?" },
    { emoji: '🔁', label: 'Reschedule', message: "I need to reschedule my appointment that's tomorrow at 2pm." },
  ],

  'auto repair': [
    { emoji: '🛠️', label: 'Oil change', message: "I'd like to book an oil change this week — I drive a 2020 Honda Civic." },
    { emoji: '⚠️', label: 'Check engine', message: "My check engine light just came on — can someone take a look?" },
    { emoji: '🛞', label: 'Brakes', message: "My brakes are squeaking and feel soft — I think I need them replaced." },
    { emoji: '🚨', label: 'Towing', message: "My car broke down on the highway — do you offer towing?" },
    { emoji: '💵', label: 'Estimate', message: "Can I get an estimate for a transmission flush?" },
    { emoji: '📋', label: 'Diagnostic', message: "I'd like to bring my car in for a full diagnostic — it's making weird noises." },
  ],

  mortgage: [
    { emoji: '🏠', label: 'Pre-qualify', message: "I'm thinking about buying a home — how do I get pre-qualified?" },
    { emoji: '🔄', label: 'Refinance', message: "I want to refinance to lower my monthly payment — where do I start?" },
    { emoji: '💵', label: 'Rates', message: "What kind of rates are you seeing right now for a 30-year fixed?" },
    { emoji: '📋', label: 'FHA loan', message: "I have a smaller down payment — am I a good fit for an FHA loan?" },
    { emoji: '🎖️', label: 'VA loan', message: "I'm a veteran — I'd like to learn about VA loan options." },
    { emoji: '📊', label: 'Cash out', message: "Can I do a cash-out refinance to pay off some debt?" },
  ],

  cleaning: [
    { emoji: '🧽', label: 'One-time clean', message: "I'd like a one-time deep cleaning before guests arrive next weekend." },
    { emoji: '🔁', label: 'Recurring service', message: "Can you set up biweekly cleaning for a 3-bedroom house?" },
    { emoji: '📦', label: 'Move-out clean', message: "I'm moving out of my apartment Friday and need a move-out clean." },
    { emoji: '💵', label: 'Quote', message: "What does a standard cleaning cost for an 1800 sq ft home?" },
    { emoji: '🐕', label: 'Pet-friendly', message: "I have two big dogs — can your cleaners handle pet hair and dander?" },
    { emoji: '🏢', label: 'Office', message: "I need recurring cleaning for a small office — about 2,000 sq ft." },
  ],

  landscaping: [
    { emoji: '🌱', label: 'Weekly mowing', message: "I'd like to set up weekly lawn mowing for the season." },
    { emoji: '🍂', label: 'Fall cleanup', message: "Can I get a quote for a fall leaf cleanup on a quarter-acre lot?" },
    { emoji: '🌳', label: 'Tree removal', message: "I have a large dead oak in my backyard that needs to come down." },
    { emoji: '❄️', label: 'Snow removal', message: "Do you offer snow plowing for residential driveways this winter?" },
    { emoji: '🪴', label: 'Landscape design', message: "I'd like to redesign my front yard — can someone come give an estimate?" },
    { emoji: '💧', label: 'Sprinklers', message: "My sprinkler system isn't working properly — can you take a look?" },
  ],

  therapy: [
    { emoji: '🧠', label: 'New client', message: "I'm looking to start therapy — how does intake work?" },
    { emoji: '💵', label: 'Insurance', message: "Do you take BlueCross BlueShield, and what's the copay?" },
    { emoji: '👫', label: 'Couples', message: "My partner and I are interested in couples counseling." },
    { emoji: '💻', label: 'Telehealth', message: "Are virtual sessions available, or only in-person?" },
    { emoji: '🆘', label: 'In crisis', message: "I'm having a really hard time and I'm scared of what I might do." },
    { emoji: '📅', label: 'Reschedule', message: "I need to reschedule my session this Thursday." },
  ],

  solar: [
    { emoji: '☀️', label: 'Get a quote', message: "I'd like a quote on solar panels for my home." },
    { emoji: '💵', label: 'Savings', message: "How much could I save on my electric bill with solar?" },
    { emoji: '🏦', label: 'Financing', message: "What financing options do you offer — loan, lease, or PPA?" },
    { emoji: '🔋', label: 'Battery backup', message: "I'm interested in adding a Powerwall or battery backup — how does that work?" },
    { emoji: '🚗', label: 'EV charger', message: "I just got a Tesla — can you also install a home EV charger?" },
    { emoji: '🧾', label: 'Tax credit', message: "How does the federal solar tax credit work?" },
  ],

  childcare: [
    { emoji: '👶', label: 'Infant care', message: "I'm looking for infant care starting in August — do you have openings?" },
    { emoji: '🏫', label: 'Tour', message: "Can I schedule a tour of your center this week?" },
    { emoji: '📅', label: 'Part-time', message: "Do you offer part-time enrollment, like 3 days a week?" },
    { emoji: '💵', label: 'Tuition', message: "What's the monthly tuition for the toddler program?" },
    { emoji: '🍎', label: 'Meals & nap', message: "Do you provide meals, and what does the nap schedule look like?" },
    { emoji: '📋', label: 'Waitlist', message: "If you're full, can I get on the waitlist for January?" },
  ],

  optometry: [
    { emoji: '👓', label: 'Annual exam', message: "I'd like to schedule my annual eye exam." },
    { emoji: '👁️', label: 'Contacts fitting', message: "I want to start wearing contacts — can I get a fitting?" },
    { emoji: '💵', label: 'Insurance', message: "Do you accept VSP and EyeMed?" },
    { emoji: '🆕', label: 'New glasses', message: "I'd like to come in to pick out new glasses — do I need an appointment?" },
    { emoji: '🚨', label: 'Urgent', message: "I'm seeing flashes of light and a lot of new floaters today — should I be worried?" },
    { emoji: '🔄', label: 'Refill contacts', message: "I need to reorder my contact lenses." },
  ],

  funeral: [
    { emoji: '🕊️', label: 'At-need', message: "My father passed away last night — I'm not sure where to start." },
    { emoji: '📋', label: 'Pre-planning', message: "I'd like to pre-plan my own arrangements — can we schedule a meeting?" },
    { emoji: '🌹', label: 'Memorial', message: "We're hoping to plan a small memorial service in the next two weeks." },
    { emoji: '🔥', label: 'Cremation', message: "Could you tell me about your cremation options and pricing?" },
    { emoji: '✈️', label: 'Out of state', message: "My mom passed in another state — can you help arrange transportation?" },
    { emoji: '📜', label: 'Documents', message: "I need help getting death certificates and notifying Social Security." },
  ],
}

export function getIndustryExamples(industryId: string): IndustryExample[] {
  return INDUSTRY_EXAMPLES[industryId] || []
}
