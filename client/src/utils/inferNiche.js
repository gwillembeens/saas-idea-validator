// Order matters — first match wins. More specific niches before broader ones.
const NICHE_KEYWORDS = {
  Fintech:          ['fintech', 'finance', 'payment', 'banking', 'crypto', 'defi', 'lending', 'insurance', 'trading', 'invest'],
  Logistics:        ['logistics', 'supply chain', 'shipping', 'delivery', 'warehouse', 'inventory', 'freight', 'trucking'],
  'Creator Economy':['creator economy', 'content creator', 'influencer', 'newsletter', 'podcast', 'monetize', 'audience building'],
  PropTech:         ['proptech', 'prop tech', 'real estate', 'rental property', 'apartment', 'mortgage', 'landlord', 'tenant screening'],
  HealthTech:       ['healthtech', 'health tech', 'medical', 'clinical', 'patient', 'hospital', 'telemedicine', 'healthcare'],
  EdTech:           ['edtech', 'ed tech', 'e-learning', 'elearning', 'tutoring', 'curriculum', 'lms', 'learning management'],
  HRTech:           ['hr tech', 'hrtech', 'hr team', 'human resources', 'hiring', 'recruiting', 'onboarding', 'employee', 'meeting analytics', 'team productivity', 'workforce', 'performance review', 'engagement', 'people ops'],
}

// Infers niche from the raw idea text (NOT the validation markdown result)
export function inferNiche(ideaText) {
  if (!ideaText) return 'Other'
  const lower = ideaText.toLowerCase()
  for (const [niche, keywords] of Object.entries(NICHE_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return niche
  }
  return 'Other'
}
