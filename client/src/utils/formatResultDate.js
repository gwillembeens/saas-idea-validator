/**
 * Format an ISO date string for display on result pages.
 * Returns "Month Day, Year" format (e.g., "March 22, 2026").
 */
export function formatResultDate(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
