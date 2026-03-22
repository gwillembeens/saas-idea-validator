import Anthropic from '@anthropic-ai/sdk'
import { pool } from '../db/init.js'
import stringSimilarity from 'string-similarity'

const VALID_NICHES = ['Fintech', 'Logistics', 'Creator Economy', 'PropTech', 'HealthTech', 'EdTech', 'HRTech', 'Other']

export function parseNiche(raw) {
  if (!raw || !raw.trim()) return 'Other'
  let parsed = raw.trim().split('\n')[0].trim()
  // Special-case two-word niche
  if (parsed.toLowerCase() === 'creator economy') return 'Creator Economy'
  // Try exact match first (case-insensitive)
  for (const niche of VALID_NICHES) {
    if (parsed.toLowerCase() === niche.toLowerCase()) return niche
  }
  return 'Other'
}

// POST /api/history — auto-save validation result
export async function saveResultRoute(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { idea_text, markdown_result, scores } = req.body
  if (!idea_text || !markdown_result || !scores) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    // Generate default title from first 6 words
    const defaultTitle = idea_text
      .split(' ')
      .slice(0, 6)
      .join(' ')
      .replace(/[^a-z0-9\s]/gi, '')
      .substring(0, 50)

    const { rows } = await pool.query(
      `INSERT INTO saved_results (user_id, title, idea_text, markdown_result, scores)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, created_at`,
      [req.user.id, defaultTitle, idea_text, markdown_result, JSON.stringify(scores)]
    )

    const result = rows[0]

    // Similarity detection — compare against all user's past ideas
    let similarTo = null
    const pastRows = await pool.query(
      `SELECT id, title, idea_text, scores FROM saved_results
       WHERE user_id = $1 AND id != $2 AND deleted_at IS NULL`,
      [req.user.id, result.id]
    )

    if (pastRows.rows.length > 0) {
      const pastTexts = pastRows.rows.map(r => r.idea_text)
      const match = stringSimilarity.findBestMatch(idea_text, pastTexts)
      if (match.bestMatch.rating >= 0.75) {
        const matchedRow = pastRows.rows[match.bestMatchIndex]
        similarTo = {
          id: matchedRow.id,
          title: matchedRow.title,
          scores: matchedRow.scores,
        }
        // Store suggested_parent_id so banner persists if user navigates away
        await pool.query(
          'UPDATE saved_results SET suggested_parent_id = $1 WHERE id = $2',
          [matchedRow.id, result.id]
        )
      }
    }

    // Fire async title generation via Claude (non-blocking)
    generateAITitle(result.id, idea_text, req.user.id).catch(err => {
      console.error('Title generation failed:', err)
    })

    // Fire async niche detection via Claude (non-blocking)
    generateNiche(result.id, idea_text, markdown_result, req.user.id).catch(err => {
      console.error('Niche generation failed:', err)
    })

    res.status(201).json({
      id: result.id,
      title: result.title,
      is_public: true,
      createdAt: result.created_at,
      similarTo,
    })
  } catch (err) {
    console.error('Save failed:', err)
    res.status(500).json({ error: 'Failed to save result' })
  }
}

async function generateAITitle(resultId, ideaText, userId) {
  const client = new Anthropic()
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 50,
      system: 'You are a naming expert. Generate a 3-4 word title for a startup idea. Return ONLY the title, no quotes or punctuation.',
      messages: [{ role: 'user', content: ideaText }],
    })
    const aiTitle = response.content[0].text.trim().substring(0, 100)
    await pool.query(
      'UPDATE saved_results SET title = $1, updated_at = now() WHERE id = $2 AND user_id = $3',
      [aiTitle, resultId, userId]
    )
  } catch (err) {
    console.error('generateAITitle error:', err)
  }
}

async function generateNiche(resultId, ideaText, markdownResult, userId) {
  const client = new Anthropic()
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      system: 'You are a niche classifier for startup validation. Categorize the idea into exactly one of these 8 niches: Fintech, Logistics, Creator Economy, PropTech, HealthTech, EdTech, HRTech, Other. HRTech covers HR software, recruiting tools, employee engagement, meeting analytics, team productivity, and workplace tools. Return ONLY the niche name. No preamble, no explanation.',
      messages: [{
        role: 'user',
        content: `Idea: ${ideaText}\n\nResult summary:\n${markdownResult.substring(0, 2000)}\n\nReturn the niche name only:`
      }],
    })
    const niche = parseNiche(response.content[0].text)
    await pool.query(
      'UPDATE saved_results SET niche = $1, updated_at = now() WHERE id = $2 AND user_id = $3',
      [niche, resultId, userId]
    )
  } catch (err) {
    console.error('generateNiche error:', err)
    // Silent failure — niche remains column DEFAULT 'Other'
  }
}

// GET /api/history — list user's saved results
export async function listHistoryRoute(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { sort = 'date' } = req.query
  const LIMIT = 10

  try {
    let query, params

    if (sort === 'score') {
      query = `
        SELECT id, title, idea_text, scores, created_at, niche, is_public
        FROM saved_results
        WHERE user_id = $1 AND deleted_at IS NULL
        ORDER BY (scores->>'weighted')::float DESC, created_at DESC
        LIMIT $2
      `
      params = [req.user.id, LIMIT + 1]
    } else {
      // date (default)
      query = `
        SELECT id, title, idea_text, scores, created_at, niche, is_public
        FROM saved_results
        WHERE user_id = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT $2
      `
      params = [req.user.id, LIMIT + 1]
    }

    const { rows } = await pool.query(query, params)
    const hasMore = rows.length > LIMIT
    const items = rows.slice(0, LIMIT).map(r => ({
      id: r.id,
      title: r.title,
      idea_text: r.idea_text,
      scores: r.scores,
      created_at: r.created_at,
      niche: r.niche,
      is_public: r.is_public,
    }))

    // Lazy backfill: fire niche generation for items still at default 'Other'
    const needsNiche = items.filter(r => !r.niche || r.niche === 'Other')
    for (const r of needsNiche) {
      generateNiche(r.id, r.idea_text, '', req.user.id).catch(() => {})
    }

    res.json({ items, hasMore })
  } catch (err) {
    console.error('List history error:', err)
    res.status(500).json({ error: 'Failed to fetch history' })
  }
}

// GET /api/history/:id — public view with optionalAuth
export async function getResultRoute(req, res) {
  const { id } = req.params

  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, title, idea_text, markdown_result, scores, created_at, niche, is_public,
              parent_id, suggested_parent_id
       FROM saved_results
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    )

    if (!rows.length) {
      return res.status(404).json({ error: 'Result not found' })
    }

    const result = rows[0]
    const isOwner = req.user?.id === result.user_id

    // Lazy backfill: fire niche generation if still at default
    if ((!result.niche || result.niche === 'Other') && result.user_id) {
      generateNiche(result.id, result.idea_text, result.markdown_result || '', result.user_id).catch(() => {})
    }

    // Fetch parent scores if parent_id is set
    let parent_scores = null
    let parent_title = null
    if (result.parent_id) {
      const parentResult = await pool.query(
        'SELECT scores, title FROM saved_results WHERE id = $1 AND deleted_at IS NULL',
        [result.parent_id]
      )
      if (parentResult.rows.length) {
        parent_scores = parentResult.rows[0].scores
        parent_title = parentResult.rows[0].title
      }
    }

    // Fetch suggested parent title if suggested_parent_id is set
    let suggested_parent_title = null
    if (result.suggested_parent_id) {
      const suggestedResult = await pool.query(
        'SELECT title, scores FROM saved_results WHERE id = $1 AND deleted_at IS NULL',
        [result.suggested_parent_id]
      )
      if (suggestedResult.rows.length) {
        suggested_parent_title = suggestedResult.rows[0].title
      }
    }

    res.json({
      id: result.id,
      title: result.title,
      idea_text: result.idea_text,
      markdown_result: result.markdown_result,
      scores: result.scores,
      created_at: result.created_at,
      niche: result.niche,
      is_public: result.is_public,
      isOwner,
      parent_id: result.parent_id || null,
      parent_scores,
      parent_title,
      suggested_parent_id: result.suggested_parent_id || null,
      suggested_parent_title,
    })
  } catch (err) {
    console.error('Get result error:', err)
    res.status(500).json({ error: 'Failed to fetch result' })
  }
}

// PATCH /api/history/:id/title — rename with ownership check
export async function updateTitleRoute(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.params
  const { title } = req.body

  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title cannot be empty' })
  }

  try {
    const { rows } = await pool.query(
      'SELECT user_id FROM saved_results WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )

    if (!rows.length) {
      return res.status(404).json({ error: 'Result not found' })
    }

    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const truncatedTitle = title.trim().substring(0, 255)
    const updateRows = await pool.query(
      'UPDATE saved_results SET title = $1, updated_at = now() WHERE id = $2 RETURNING title, updated_at',
      [truncatedTitle, id]
    )

    res.json({
      id,
      title: updateRows.rows[0].title,
      updated_at: updateRows.rows[0].updated_at,
    })
  } catch (err) {
    console.error('Update title error:', err)
    res.status(500).json({ error: 'Failed to update title' })
  }
}

// PATCH /api/history/:id/visibility — toggle public/private with ownership check
export async function updateVisibilityRoute(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.params
  const { is_public } = req.body

  if (typeof is_public !== 'boolean') {
    return res.status(400).json({ error: 'is_public must be a boolean' })
  }

  try {
    const { rows } = await pool.query(
      'SELECT user_id FROM saved_results WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )

    if (!rows.length) {
      return res.status(404).json({ error: 'Result not found' })
    }

    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const updateRows = await pool.query(
      'UPDATE saved_results SET is_public = $1, updated_at = now() WHERE id = $2 RETURNING id, is_public',
      [is_public, id]
    )

    res.json({
      id: updateRows.rows[0].id,
      is_public: updateRows.rows[0].is_public,
    })
  } catch (err) {
    console.error('Update visibility error:', err)
    res.status(500).json({ error: 'Failed to update visibility' })
  }
}

// DELETE /api/history/:id — soft delete with ownership check
export async function deleteResultRoute(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.params

  try {
    const { rows } = await pool.query(
      'SELECT user_id FROM saved_results WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )

    if (!rows.length) {
      return res.status(404).json({ error: 'Result not found' })
    }

    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await pool.query(
      'UPDATE saved_results SET deleted_at = now() WHERE id = $1',
      [id]
    )

    res.json({ message: 'Result deleted' })
  } catch (err) {
    console.error('Delete error:', err)
    res.status(500).json({ error: 'Failed to delete result' })
  }
}

// PATCH /api/history/:id/parent — confirm revision link
export async function setParentRoute(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.params
  const { parent_id } = req.body

  if (!parent_id || typeof parent_id !== 'number') {
    return res.status(400).json({ error: 'parent_id must be a number' })
  }

  try {
    // Verify ownership
    const { rows } = await pool.query(
      'SELECT user_id FROM saved_results WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Result not found' })
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

    // Verify parent also belongs to this user
    const parentRows = await pool.query(
      'SELECT id FROM saved_results WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [parent_id, req.user.id]
    )
    if (!parentRows.rows.length) return res.status(404).json({ error: 'Parent not found' })

    await pool.query(
      'UPDATE saved_results SET parent_id = $1, suggested_parent_id = NULL, updated_at = now() WHERE id = $2',
      [parent_id, id]
    )

    res.json({ id: parseInt(id), parent_id })
  } catch (err) {
    console.error('setParent error:', err)
    res.status(500).json({ error: 'Failed to set parent' })
  }
}

// PATCH /api/history/:id/dismiss-revision — dismiss suggestion
export async function dismissRevisionRoute(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.params

  try {
    // Verify ownership
    const { rows } = await pool.query(
      'SELECT user_id FROM saved_results WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Result not found' })
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

    await pool.query(
      'UPDATE saved_results SET suggested_parent_id = NULL, updated_at = now() WHERE id = $1',
      [id]
    )

    res.json({ id: parseInt(id), suggested_parent_id: null })
  } catch (err) {
    console.error('dismissRevision error:', err)
    res.status(500).json({ error: 'Failed to dismiss revision' })
  }
}
