import { pool } from '../db/init.js'

export async function profileRoute(req, res) {
  const { username } = req.params

  try {
    // Look up user by username
    const userResult = await pool.query(
      'SELECT id, username, display_name FROM users WHERE username = $1',
      [username]
    )
    if (!userResult.rows.length) {
      return res.status(404).json({ error: 'Profile not found' })
    }
    const user = userResult.rows[0]

    // Fetch all public non-deleted results for this user
    const { rows: validations } = await pool.query(
      `SELECT id, title, idea_text, scores, niche, created_at, parent_id
       FROM saved_results
       WHERE user_id = $1 AND is_public = true AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [user.id]
    )

    // Available years with activity
    const { rows: yearRows } = await pool.query(
      `SELECT DISTINCT EXTRACT(YEAR FROM created_at)::int AS year
       FROM saved_results
       WHERE user_id = $1 AND is_public = true AND deleted_at IS NULL
       ORDER BY year DESC`,
      [user.id]
    )
    const availableYears = yearRows.map(r => r.year)

    // Heatmap date range: specific year or last 365 days
    const requestedYear = req.query.year ? parseInt(req.query.year, 10) : null
    const currentYear = new Date().getFullYear()
    let heatmapStart, heatmapEnd

    if (requestedYear && !isNaN(requestedYear)) {
      heatmapStart = `${requestedYear}-01-01`
      heatmapEnd = requestedYear === currentYear
        ? new Date().toISOString().slice(0, 10)
        : `${requestedYear}-12-31`
    } else {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      heatmapEnd = today.toISOString().slice(0, 10)
      const startD = new Date(today)
      startD.setDate(today.getDate() - 364)
      heatmapStart = startD.toISOString().slice(0, 10)
    }

    // Fetch heatmap for computed date range
    const { rows: heatmapRows } = await pool.query(
      `SELECT DATE(created_at) AS day, COUNT(*)::int AS count
       FROM saved_results
       WHERE user_id = $1
         AND is_public = true
         AND deleted_at IS NULL
         AND DATE(created_at) >= $2
         AND DATE(created_at) <= $3
       GROUP BY DATE(created_at)
       ORDER BY day ASC`,
      [user.id, heatmapStart, heatmapEnd]
    )

    // Build heatmap: full date-range array with filled gaps
    const heatmap = buildHeatmapArray(heatmapRows, heatmapStart, heatmapEnd)

    // Calculate streaks from heatmap
    const streaks = calculateStreaks(heatmap)

    // Score trend: last 20 validations, oldest → newest
    const scoreTrend = validations
      .slice(0, 20)
      .reverse()
      .map(v => ({
        title: v.title || 'Untitled',
        score: v.scores?.weighted ?? 0,
        created_at: v.created_at,
      }))

    // Compute stats
    const totalPublic = validations.length
    let avgScore = null
    let topNiche = null
    let personalBest = null

    if (totalPublic > 0) {
      const weighted = validations.map(v => v.scores?.weighted ?? 0)
      avgScore = parseFloat((weighted.reduce((a, b) => a + b, 0) / weighted.length).toFixed(2))
      personalBest = parseFloat(Math.max(...weighted).toFixed(2))

      // Top niche by frequency
      const nicheCounts = {}
      for (const v of validations) {
        const n = v.niche || 'Other'
        nicheCounts[n] = (nicheCounts[n] || 0) + 1
      }
      topNiche = Object.entries(nicheCounts).sort((a, b) => b[1] - a[1])[0][0]

      // Niche breakdown: all niches sorted by count descending
      var nicheBreakdown = Object.entries(nicheCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([niche, count]) => ({ niche, count }))
    }

    // Build revision chains from public validations
    // Find roots: public results whose parent_id is either null, or not in the public set
    const publicIds = new Set(validations.map(v => v.id))
    const roots = validations.filter(v => !v.parent_id || !publicIds.has(v.parent_id))

    // Build a children map
    const childrenMap = {}
    for (const v of validations) {
      if (v.parent_id && publicIds.has(v.parent_id)) {
        if (!childrenMap[v.parent_id]) childrenMap[v.parent_id] = []
        childrenMap[v.parent_id].push(v)
      }
    }

    // Build chain sequences (only include chains with >1 version)
    function buildChain(root) {
      const chain = [root]
      let current = root
      while (childrenMap[current.id]?.length) {
        current = childrenMap[current.id][0] // follow first child for linear chain
        chain.push(current)
      }
      return chain
    }

    const chains = roots
      .map(root => {
        const versions = buildChain(root)
        if (versions.length < 2) return null
        // Add score delta to each version (relative to previous)
        return {
          lineage_title: versions[0].title || 'Untitled',
          versions: versions.map((v, i) => ({
            id: v.id,
            title: v.title,
            scores: v.scores,
            delta: i === 0
              ? null
              : parseFloat(((v.scores?.weighted ?? 0) - (versions[i - 1].scores?.weighted ?? 0)).toFixed(2)),
          })),
        }
      })
      .filter(Boolean)

    // Format validations for grid (truncate idea_text)
    const formattedValidations = validations.map(v => ({
      id: v.id,
      title: v.title,
      idea_text: truncateText(v.idea_text, 150),
      scores: v.scores,
      niche: v.niche,
      created_at: v.created_at,
    }))

    res.json({
      username: user.username,
      display_name: user.display_name || null,
      stats: {
        total_public: totalPublic,
        avg_score: avgScore,
        top_niche: topNiche,
        personal_best: personalBest,
      },
      validations: formattedValidations,
      chains,
      analytics: {
        heatmap,
        scoreTrend,
        nicheBreakdown,
        streaks,
        availableYears,
      },
    })
  } catch (err) {
    console.error('profileRoute error:', err)
    res.status(500).json({ error: 'Failed to load profile' })
  }
}

function truncateText(text, maxLen) {
  if (!text) return ''
  const cleaned = text.replace(/\n/g, ' ')
  if (cleaned.length <= maxLen) return cleaned
  const cut = cleaned.substring(0, maxLen)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > maxLen * 0.7 ? cut.substring(0, lastSpace) : cut) + '…'
}

function buildHeatmapArray(heatmapRows, startDate, endDate) {
  // Build a lookup map: ISO date string → count
  const lookup = {}
  for (const row of heatmapRows) {
    const iso = row.day instanceof Date
      ? row.day.toISOString().slice(0, 10)
      : String(row.day).slice(0, 10)
    lookup[iso] = row.count
  }

  // Default range: 365 days ending today
  if (!startDate || !endDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    endDate = today.toISOString().slice(0, 10)
    const startD = new Date(today)
    startD.setDate(today.getDate() - 364)
    startDate = startD.toISOString().slice(0, 10)
  }

  const result = []
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10)
    result.push({ date: iso, count: lookup[iso] ?? 0 })
  }
  return result
}

function calculateStreaks(heatmap) {
  // Extract sorted array of active ISO date strings
  const activeDays = heatmap
    .filter(d => d.count > 0)
    .map(d => d.date) // already ISO strings, already sorted oldest→newest

  if (activeDays.length === 0) return { current: 0, longest: 0 }

  // Longest streak
  let longest = 1
  let run = 1
  for (let i = 1; i < activeDays.length; i++) {
    const prev = new Date(activeDays[i - 1])
    const curr = new Date(activeDays[i])
    const diffDays = Math.round((curr - prev) / 86400000)
    if (diffDays === 1) {
      run++
      if (run > longest) longest = run
    } else {
      run = 1
    }
  }

  // Current streak: consecutive days ending on today or yesterday
  const todayStr = new Date().toISOString().slice(0, 10)
  const yesterdayStr = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toISOString().slice(0, 10)
  })()

  const lastActive = activeDays[activeDays.length - 1]
  // If last active day is neither today nor yesterday, current streak is 0
  if (lastActive !== todayStr && lastActive !== yesterdayStr) {
    return { current: 0, longest }
  }

  // Walk backwards counting consecutive days
  let current = 1
  for (let i = activeDays.length - 2; i >= 0; i--) {
    const later = new Date(activeDays[i + 1])
    const earlier = new Date(activeDays[i])
    const diff = Math.round((later - earlier) / 86400000)
    if (diff === 1) {
      current++
    } else {
      break
    }
  }

  return { current, longest }
}

export { calculateStreaks, buildHeatmapArray }
