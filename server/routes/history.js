import Anthropic from '@anthropic-ai/sdk'
import { pool } from '../db/init.js'

const VALID_NICHES = ['Fintech', 'Logistics', 'Creator Economy', 'PropTech', 'HealthTech', 'EdTech', 'Other']

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
      createdAt: result.created_at,
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
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10,
      system: 'You are a niche classifier for startup validation. Categorize the idea into exactly one of these 7 niches: Fintech, Logistics, Creator Economy, PropTech, HealthTech, EdTech, Other. Return ONLY the niche name. No preamble, no explanation.',
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
        SELECT id, title, idea_text, scores, created_at, niche
        FROM saved_results
        WHERE user_id = $1 AND deleted_at IS NULL
        ORDER BY (scores->>'weighted')::float DESC, created_at DESC
        LIMIT $2
      `
      params = [req.user.id, LIMIT + 1]
    } else {
      // date (default)
      query = `
        SELECT id, title, idea_text, scores, created_at, niche
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
    }))

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
      `SELECT id, user_id, title, idea_text, markdown_result, scores, created_at, niche
       FROM saved_results
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    )

    if (!rows.length) {
      return res.status(404).json({ error: 'Result not found' })
    }

    const result = rows[0]
    const isOwner = req.user?.id === result.user_id

    res.json({
      id: result.id,
      title: result.title,
      idea_text: result.idea_text,
      markdown_result: result.markdown_result,
      scores: result.scores,
      created_at: result.created_at,
      niche: result.niche,
      isOwner,
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
