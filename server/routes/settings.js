import { pool } from '../db/init.js'

// GET /api/me — return current user's settings data
export async function getMeRoute(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, email, username, display_name FROM users WHERE id = $1',
      [req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'User not found' })

    res.json({
      id: rows[0].id,
      email: rows[0].email,
      username: rows[0].username || null,
      display_name: rows[0].display_name || null,
    })
  } catch (err) {
    console.error('getMeRoute error:', err)
    res.status(500).json({ error: 'Failed to fetch user data' })
  }
}

// PATCH /api/me/settings — update display_name and/or username
export async function updateSettingsRoute(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { display_name, username } = req.body

  // Validate display_name if provided
  if (display_name !== undefined && typeof display_name !== 'string') {
    return res.status(400).json({ error: 'display_name must be a string' })
  }
  if (display_name && display_name.trim().length > 100) {
    return res.status(400).json({ error: 'display_name must be 100 characters or fewer' })
  }

  // Validate username if provided
  if (username !== undefined) {
    if (typeof username !== 'string') {
      return res.status(400).json({ error: 'username must be a string' })
    }
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username.trim())) {
      return res.status(400).json({ error: 'username must be 3–30 characters, letters/numbers/underscore/hyphen only' })
    }
  }

  try {
    // Check current state — username is locked once set
    const { rows: current } = await pool.query(
      'SELECT username, display_name FROM users WHERE id = $1',
      [req.user.id]
    )
    if (!current.length) return res.status(404).json({ error: 'User not found' })

    const updates = {}
    const params = []
    let idx = 1

    // display_name is always updatable
    if (display_name !== undefined) {
      updates.display_name = `display_name = $${idx++}`
      params.push(display_name.trim() || null)
    }

    // username only updatable if currently null
    if (username !== undefined) {
      if (current[0].username !== null) {
        return res.status(409).json({ error: 'Username is already set and cannot be changed' })
      }
      updates.username = `username = $${idx++}`
      params.push(username.trim().toLowerCase())
    }

    if (!params.length) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    params.push(req.user.id)
    const setClauses = Object.values(updates).join(', ')

    const { rows } = await pool.query(
      `UPDATE users SET ${setClauses} WHERE id = $${idx} RETURNING id, email, username, display_name`,
      params
    )

    res.json({
      id: rows[0].id,
      email: rows[0].email,
      username: rows[0].username || null,
      display_name: rows[0].display_name || null,
    })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already taken' })
    }
    console.error('updateSettingsRoute error:', err)
    res.status(500).json({ error: 'Failed to update settings' })
  }
}
