// Returns { phase1: 4, phase2: 3, phase3: 4, phase4: 3, weighted: 3.7 } or null on failure
export function parseScores(markdown) {
  try {
    const rows = markdown.match(/\|\s*([\d.]+)\/5\s*\|/g)
    if (!rows || rows.length < 4) return null
    const scores = rows.slice(0, 4).map(r => parseFloat(r.match(/[\d.]+/)[0]))
    const weighted = +(scores[0] * 0.30 + scores[1] * 0.25 + scores[2] * 0.35 + scores[3] * 0.10).toFixed(1)
    return { phase1: scores[0], phase2: scores[1], phase3: scores[2], phase4: scores[3], weighted }
  } catch {
    return null
  }
}
