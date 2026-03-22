export const VERDICT_SCORES = {
  strong: { min: 4.5, emoji: '🟢', label: 'Strong Signal', bg: '#d1fae5', border: '#6ee7b7' },
  promising: { min: 3.5, emoji: '🟡', label: 'Promising', bg: '#fef9c3', border: '#fde047' },
  needs_work: { min: 2.5, emoji: '🟠', label: 'Needs Work', bg: '#ffedd5', border: '#fdba74' },
  too_vague: { min: 0, emoji: '🔴', label: 'Too Vague', bg: '#fee2e2', border: '#fca5a5' },
}

export function getVerdict(weighted) {
  if (weighted >= 4.5) return VERDICT_SCORES.strong
  if (weighted >= 3.5) return VERDICT_SCORES.promising
  if (weighted >= 2.5) return VERDICT_SCORES.needs_work
  return VERDICT_SCORES.too_vague
}
