import { pool } from '../db/init.js'

const VALID_NICHES = ['Fintech', 'Logistics', 'Creator Economy', 'PropTech', 'HealthTech', 'EdTech', 'HRTech', 'Other']

export async function topPerNicheRoute(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        sr.niche,
        MAX((sr.scores->>'weighted')::float) AS top_score,
        COUNT(*) AS total_public
      FROM saved_results sr
      WHERE sr.is_public = true
        AND sr.deleted_at IS NULL
      GROUP BY sr.niche
      ORDER BY sr.niche
    `)

    // Build a map of niche -> data from DB rows
    const dbMap = {}
    for (const row of result.rows) {
      dbMap[row.niche] = {
        niche: row.niche,
        score: row.top_score !== null ? parseFloat(row.top_score) : null,
        count: parseInt(row.total_public, 10),
      }
    }

    // Ensure all 8 VALID_NICHES are present (even if no entries in DB)
    const topScores = VALID_NICHES.map(niche => dbMap[niche] || {
      niche,
      score: null,
      count: 0,
    })

    res.json({ topScores })
  } catch (err) {
    console.error('topPerNicheRoute error:', err)
    res.status(500).json({ error: 'Failed to fetch top scores per niche' })
  }
}

export async function leaderboardRoute(req, res) {
  const { niche, page } = req.query
  const pageNum = parseInt(page) || 0
  const LIMIT = 20
  const OFFSET = pageNum * LIMIT

  // Validate niche if provided
  if (niche && niche !== 'All' && !VALID_NICHES.includes(niche)) {
    return res.status(400).json({ error: `Invalid niche: ${niche}` })
  }

  try {
    const nicheFilter = niche && niche !== 'All' ? niche : null
    let params = []
    let nicheClause = ''

    if (nicheFilter) {
      params.push(nicheFilter)
      nicheClause = ' AND sr.niche = $1'
    }

    // Count total matching entries
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM saved_results sr
      WHERE sr.is_public = true
        AND sr.deleted_at IS NULL
        ${nicheClause}
    `
    const countResult = await pool.query(countQuery, params)
    const total = parseInt(countResult.rows[0].total)

    // Fetch paginated entries
    const dataQuery = `
      SELECT
        sr.id,
        sr.idea_text,
        sr.scores,
        sr.niche,
        sr.user_id,
        u.username AS author_username,
        sr.created_at
      FROM saved_results sr
      LEFT JOIN users u ON sr.user_id = u.id
      WHERE sr.is_public = true
        AND sr.deleted_at IS NULL
        ${nicheClause}
      ORDER BY (sr.scores->>'weighted')::float DESC, sr.created_at DESC
      LIMIT ${LIMIT} OFFSET ${OFFSET}
    `
    const { rows } = await pool.query(dataQuery, params)

    const entries = rows.map(row => ({
      id: row.id,
      idea_text: truncateIdeaText(row.idea_text),
      scores: row.scores,
      niche: row.niche,
      user_id: row.user_id,
      author_username: row.author_username || null,
      created_at: row.created_at,
    }))

    res.json({
      entries,
      total,
      page: pageNum,
      hasMore: OFFSET + LIMIT < total,
    })
  } catch (err) {
    console.error('Leaderboard error:', err)
    res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
}

// Exported for testing
export { VALID_NICHES }
export function truncateIdeaText(text) {
  const cleaned = text.replace(/\n/g, ' ')
  if (cleaned.length <= 150) return cleaned
  const cut = cleaned.substring(0, 150)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 100 ? cut.substring(0, lastSpace) : cut) + '…'
}
