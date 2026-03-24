import { pool } from '../db/init.js'

// Tunable constants — adjust without touching the formula
const LIKE_WEIGHT = 1
const COMMENT_WEIGHT = 2
const DECAY_EXPONENT = 0.8
const NICHE_BOOST = 1.2
const PAGE_SIZE = 20

function truncateIdeaText(text, maxLen = 150) {
  if (!text || text.length <= maxLen) return text
  return text.slice(0, maxLen).trimEnd() + '...'
}

export async function feedRoute(req, res) {
  try {
    const userId = req.user?.id || null
    const pageNum = Math.max(0, parseInt(req.query.page) || 0)
    const offset = pageNum * PAGE_SIZE

    // Build feed_score expression with constants inlined
    const feedScoreExpr = `
      (
        (SELECT COUNT(*)::int FROM likes l2 WHERE l2.result_id = sr.id) * ${LIKE_WEIGHT} +
        (SELECT COUNT(*)::int FROM comments c2 WHERE c2.result_id = sr.id AND c2.deleted_at IS NULL) * ${COMMENT_WEIGHT}
      )::float
      / POWER(EXTRACT(EPOCH FROM (NOW() - sr.created_at)) / 3600.0 + 2, ${DECAY_EXPONENT})
      * CASE
          WHEN $1::uuid IS NOT NULL AND sr.niche IN (
            SELECT sr2.niche
            FROM saved_results sr2
            WHERE sr2.user_id = $1 AND sr2.deleted_at IS NULL
            GROUP BY sr2.niche
            ORDER BY COUNT(*) DESC
            LIMIT 3
          )
          THEN ${NICHE_BOOST}
          ELSE 1
        END
    `

    const dataQuery = `
      SELECT
        sr.id,
        sr.idea_text,
        sr.scores,
        sr.niche,
        sr.user_id,
        u.username AS author_username,
        sr.created_at,
        (SELECT COUNT(*)::int FROM likes l WHERE l.result_id = sr.id) AS like_count,
        (SELECT COUNT(*)::int FROM comments c WHERE c.result_id = sr.id AND c.deleted_at IS NULL) AS comment_count
      FROM saved_results sr
      LEFT JOIN users u ON sr.user_id = u.id
      WHERE sr.is_public = true
        AND sr.deleted_at IS NULL
      ORDER BY (${feedScoreExpr}) DESC
      LIMIT $2 OFFSET $3
    `

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM saved_results
      WHERE is_public = true AND deleted_at IS NULL
    `

    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, [userId, PAGE_SIZE, offset]),
      pool.query(countQuery),
    ])

    const total = parseInt(countResult.rows[0].total)
    const entries = dataResult.rows.map(row => ({
      id: row.id,
      idea_text: truncateIdeaText(row.idea_text),
      scores: row.scores,
      niche: row.niche,
      user_id: row.user_id,
      author_username: row.author_username || null,
      created_at: row.created_at,
      like_count: row.like_count,
      comment_count: row.comment_count,
    }))

    res.json({
      entries,
      total,
      page: pageNum,
      hasMore: offset + entries.length < total,
    })
  } catch (err) {
    console.error('feedRoute error:', err)
    res.status(500).json({ error: 'Failed to load feed' })
  }
}
