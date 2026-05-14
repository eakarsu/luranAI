// Shared visual mappings for industries — used by voice-agents, chat playground, etc.
// Industry IDs match the keys in src/lib/industry-config.ts

export const INDUSTRY_EMOJIS: Record<string, string> = {
  dentistry: '\u{1F9B7}',
  restaurants: '\u{1F37D}',
  'health clinics': '\u{1F3E5}',
  'real estate': '\u{1F3E0}',
  'car dealerships': '\u{1F697}',
  hospitality: '\u{1F3E8}',
  'debt collection': '\u{1F4B0}',
  insurance: '\u{1F6E1}',
  legal: '\u{2696}',
  'home services': '\u{1F527}',
  pharmacy: '\u{1F48A}',
  fitness: '\u{1F4AA}',
  education: '\u{1F393}',
  'pet care': '\u{1F43E}',
  accounting: '\u{1F4CA}',
  salon: '\u{1F487}',
  'auto repair': '\u{1F6E0}',
  mortgage: '\u{1F3E6}',
  cleaning: '\u{1F9F9}',
  landscaping: '\u{1F33F}',
  therapy: '\u{1F9E0}',
  solar: '\u{2600}',
  childcare: '\u{1F476}',
  optometry: '\u{1F453}',
  funeral: '\u{1F54A}',
  banking: '\u{1F3E6}',
}

export const INDUSTRY_COLORS: Record<string, string> = {
  dentistry: 'border-blue-300 hover:border-blue-500 hover:bg-blue-50',
  restaurants: 'border-orange-300 hover:border-orange-500 hover:bg-orange-50',
  'health clinics': 'border-green-300 hover:border-green-500 hover:bg-green-50',
  'real estate': 'border-purple-300 hover:border-purple-500 hover:bg-purple-50',
  'car dealerships': 'border-red-300 hover:border-red-500 hover:bg-red-50',
  hospitality: 'border-cyan-300 hover:border-cyan-500 hover:bg-cyan-50',
  'debt collection': 'border-gray-300 hover:border-gray-500 hover:bg-gray-50',
  insurance: 'border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50',
  legal: 'border-slate-300 hover:border-slate-500 hover:bg-slate-50',
  'home services': 'border-yellow-300 hover:border-yellow-500 hover:bg-yellow-50',
  pharmacy: 'border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50',
  fitness: 'border-rose-300 hover:border-rose-500 hover:bg-rose-50',
  education: 'border-sky-300 hover:border-sky-500 hover:bg-sky-50',
  'pet care': 'border-amber-300 hover:border-amber-500 hover:bg-amber-50',
  accounting: 'border-teal-300 hover:border-teal-500 hover:bg-teal-50',
  salon: 'border-pink-300 hover:border-pink-500 hover:bg-pink-50',
  'auto repair': 'border-zinc-300 hover:border-zinc-500 hover:bg-zinc-50',
  mortgage: 'border-violet-300 hover:border-violet-500 hover:bg-violet-50',
  cleaning: 'border-cyan-300 hover:border-cyan-500 hover:bg-cyan-50',
  landscaping: 'border-lime-300 hover:border-lime-500 hover:bg-lime-50',
  therapy: 'border-fuchsia-300 hover:border-fuchsia-500 hover:bg-fuchsia-50',
  solar: 'border-yellow-300 hover:border-yellow-500 hover:bg-yellow-50',
  childcare: 'border-pink-300 hover:border-pink-500 hover:bg-pink-50',
  optometry: 'border-blue-300 hover:border-blue-500 hover:bg-blue-50',
  funeral: 'border-stone-300 hover:border-stone-500 hover:bg-stone-50',
  banking: 'border-green-300 hover:border-green-500 hover:bg-green-50',
}

export function getIndustryEmoji(industryId: string): string {
  return INDUSTRY_EMOJIS[industryId.toLowerCase()] || '\u{1F4BC}'
}

export function getIndustryColorClass(industryId: string): string {
  return INDUSTRY_COLORS[industryId.toLowerCase()] || 'border-gray-300 hover:border-gray-500 hover:bg-gray-50'
}
