// Order matters — first match wins. More specific niches before broader ones.
// Keywords must be unambiguous — avoid generic words that appear in unrelated ideas.
const NICHE_PATTERNS = {
  HRTech:           [/\bhr\s?tech\b/, /\bhrtech\b/, /\bhuman resources\b/, /\bhiring\b/, /\brecruiting\b/, /\bonboarding\b/, /\bemployee engagement\b/, /\bmeeting analytics\b/, /\bteam productivity\b/, /\bworkforce\b/, /\bperformance review\b/, /\bpeople ops\b/],
  Fintech:          [/\bfintech\b/, /\bpayment processing\b/, /\bpayments\b/, /\bneobank\b/, /\bcrypto\b/, /\bdefi\b/, /\blending platform\b/, /\binsurtech\b/, /\btrading platform\b/, /\bbanking\b/],
  Logistics:        [/\blogistics\b/, /\bsupply chain\b/, /\bshipping\b/, /\bfreight\b/, /\bwarehouse\b/, /\btrucking\b/],
  'Creator Economy':[/\bcreator economy\b/, /\bcontent creator\b/, /\binfluencer\b/, /\bnewsletter\b/, /\bpodcast\b/, /\baudience building\b/],
  PropTech:         [/\bproptech\b/, /\bprop tech\b/, /\breal estate\b/, /\brental property\b/, /\bmortgage\b/, /\blandlord\b/, /\btenant screening\b/],
  HealthTech:       [/\bhealthtech\b/, /\bhealth tech\b/, /\bclinical\b/, /\bpatient\b/, /\bhospital\b/, /\btelemedicine\b/, /\bhealthcare\b/],
  EdTech:           [/\bedtech\b/, /\bed tech\b/, /\be-learning\b/, /\belearning\b/, /\btutoring\b/, /\bcurriculum\b/, /\blms\b/, /\blearning management\b/],
}

// Infers niche from the raw idea text (NOT the validation markdown result)
export function inferNiche(ideaText) {
  if (!ideaText) return 'Other'
  const lower = ideaText.toLowerCase()
  for (const [niche, patterns] of Object.entries(NICHE_PATTERNS)) {
    if (patterns.some(p => p.test(lower))) return niche
  }
  return 'Other'
}
