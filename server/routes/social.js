import { pool } from '../db/init.js'

// POST /api/results/:id/like (requires auth)
export async function toggleLikeRoute(req, res) {
  const resultId = req.params.id
  const userId = req.user.id

  try {
    // Validate result exists and is public
    const resultCheck = await pool.query(
      'SELECT id FROM saved_results WHERE id = $1 AND is_public = true AND deleted_at IS NULL',
      [resultId]
    )
    if (!resultCheck.rows.length) {
      return res.status(404).json({ error: 'Result not found' })
    }

    // Check if like exists
    const existing = await pool.query(
      'SELECT 1 FROM likes WHERE user_id = $1 AND result_id = $2',
      [userId, resultId]
    )

    let liked
    if (existing.rows.length) {
      await pool.query('DELETE FROM likes WHERE user_id = $1 AND result_id = $2', [userId, resultId])
      liked = false
    } else {
      await pool.query('INSERT INTO likes (user_id, result_id) VALUES ($1, $2)', [userId, resultId])
      liked = true

      // Insert notification (like trigger)
      const resultOwnerResult = await pool.query(
        'SELECT user_id FROM saved_results WHERE id = $1',
        [resultId]
      )
      const resultOwner = resultOwnerResult.rows[0]?.user_id

      // Only notify if actor !== owner (no self-notifications)
      if (resultOwner && resultOwner !== userId) {
        await pool.query(
          `INSERT INTO notifications (recipient_id, actor_id, event_type, result_id)
           VALUES ($1, $2, 'like', $3)`,
          [resultOwner, userId, resultId]
        )
      }
    }

    const countResult = await pool.query(
      'SELECT COUNT(*)::int AS count FROM likes WHERE result_id = $1',
      [resultId]
    )
    return res.json({ liked, count: countResult.rows[0].count })
  } catch (err) {
    console.error('toggleLikeRoute error:', err)
    return res.status(500).json({ error: 'Failed to toggle like' })
  }
}

// GET /api/results/:id/like-status (auth optional)
export async function getLikeStatusRoute(req, res) {
  const resultId = req.params.id

  try {
    const resultCheck = await pool.query(
      'SELECT id FROM saved_results WHERE id = $1 AND deleted_at IS NULL',
      [resultId]
    )
    if (!resultCheck.rows.length) {
      return res.status(404).json({ error: 'Result not found' })
    }

    let liked = false
    if (req.user) {
      const existing = await pool.query(
        'SELECT 1 FROM likes WHERE user_id = $1 AND result_id = $2',
        [req.user.id, resultId]
      )
      liked = existing.rows.length > 0
    }

    const countResult = await pool.query(
      'SELECT COUNT(*)::int AS count FROM likes WHERE result_id = $1',
      [resultId]
    )
    return res.json({ liked, count: countResult.rows[0].count })
  } catch (err) {
    console.error('getLikeStatusRoute error:', err)
    return res.status(500).json({ error: 'Failed to get like status' })
  }
}

// GET /api/results/:id/comments (public)
export async function getCommentsRoute(req, res) {
  const resultId = req.params.id

  try {
    const resultCheck = await pool.query(
      'SELECT id FROM saved_results WHERE id = $1 AND deleted_at IS NULL',
      [resultId]
    )
    if (!resultCheck.rows.length) {
      return res.status(404).json({ error: 'Result not found' })
    }

    const rootResult = await pool.query(
      `SELECT c.id, c.user_id, u.username AS author_username, c.body, c.created_at
       FROM comments c LEFT JOIN users u ON c.user_id = u.id
       WHERE c.result_id = $1 AND c.parent_id IS NULL AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC`,
      [resultId]
    )

    const currentUserId = req.user?.id ?? null
    const comments = []
    for (const row of rootResult.rows) {
      const repliesResult = await pool.query(
        `SELECT c.id, c.user_id, u.username AS author_username, c.body, c.created_at
         FROM comments c LEFT JOIN users u ON c.user_id = u.id
         WHERE c.parent_id = $1 AND c.deleted_at IS NULL
         ORDER BY c.created_at ASC`,
        [row.id]
      )
      comments.push({
        id: row.id,
        author_username: row.author_username,
        body: row.body,
        created_at: row.created_at,
        is_own: currentUserId !== null ? row.user_id === currentUserId : null,
        replies: repliesResult.rows.map(r => ({
          id: r.id,
          author_username: r.author_username,
          body: r.body,
          created_at: r.created_at,
          is_own: currentUserId !== null ? r.user_id === currentUserId : null,
          replies: [],
        })),
      })
    }

    return res.json(comments)
  } catch (err) {
    console.error('getCommentsRoute error:', err)
    return res.status(500).json({ error: 'Failed to get comments' })
  }
}

// POST /api/results/:id/comments (requires auth)
export async function postCommentRoute(req, res) {
  const resultId = req.params.id
  const userId = req.user.id
  const { body } = req.body

  if (!body || body.length < 1 || body.length > 500) {
    return res.status(400).json({ error: 'Comment body must be 1–500 characters' })
  }

  try {
    const resultCheck = await pool.query(
      'SELECT id FROM saved_results WHERE id = $1 AND is_public = true AND deleted_at IS NULL',
      [resultId]
    )
    if (!resultCheck.rows.length) {
      return res.status(404).json({ error: 'Result not found' })
    }

    const { rows } = await pool.query(
      `INSERT INTO comments (user_id, result_id, parent_id, body)
       VALUES ($1, $2, NULL, $3) RETURNING id, user_id, body, created_at`,
      [userId, resultId, body]
    )
    const comment = rows[0]

    const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [userId])
    return res.status(201).json({
      id: comment.id,
      author_username: userResult.rows[0]?.username ?? null,
      body: comment.body,
      created_at: comment.created_at,
      is_own: true,
      replies: [],
    })
  } catch (err) {
    console.error('postCommentRoute error:', err)
    return res.status(500).json({ error: 'Failed to post comment' })
  }
}

// POST /api/comments/:id/replies (requires auth)
export async function postReplyRoute(req, res) {
  const parentId = parseInt(req.params.id, 10)  // comments.id is SERIAL (integer)
  const userId = req.user.id
  const { body } = req.body

  if (!body || body.length < 1 || body.length > 500) {
    return res.status(400).json({ error: 'Reply body must be 1–500 characters' })
  }

  try {
    // Validate parent comment exists
    const parentResult = await pool.query(
      'SELECT parent_id, result_id FROM comments WHERE id = $1 AND deleted_at IS NULL',
      [parentId]
    )
    if (!parentResult.rows.length) {
      return res.status(404).json({ error: 'Parent comment not found' })
    }
    const parent = parentResult.rows[0]

    // No replies-to-replies
    if (parent.parent_id !== null) {
      return res.status(400).json({ error: 'Cannot reply to a reply' })
    }

    // Validate parent result is public
    const resultCheck = await pool.query(
      'SELECT id FROM saved_results WHERE id = $1 AND is_public = true AND deleted_at IS NULL',
      [parent.result_id]
    )
    if (!resultCheck.rows.length) {
      return res.status(404).json({ error: 'Result not found' })
    }

    const { rows } = await pool.query(
      `INSERT INTO comments (user_id, result_id, parent_id, body)
       VALUES ($1, $2, $3, $4) RETURNING id, user_id, body, created_at`,
      [userId, parent.result_id, parentId, body]
    )
    const reply = rows[0]

    const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [userId])
    return res.status(201).json({
      id: reply.id,
      author_username: userResult.rows[0]?.username ?? null,
      body: reply.body,
      created_at: reply.created_at,
      is_own: true,
      replies: [],
    })
  } catch (err) {
    console.error('postReplyRoute error:', err)
    return res.status(500).json({ error: 'Failed to post reply' })
  }
}

// DELETE /api/comments/:id (requires auth)
export async function deleteCommentRoute(req, res) {
  const commentId = parseInt(req.params.id, 10)  // comments.id is SERIAL (integer)
  const userId = req.user.id

  try {
    const commentResult = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1',
      [commentId]
    )
    if (!commentResult.rows.length) {
      return res.status(404).json({ error: 'Comment not found' })
    }
    if (commentResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await pool.query('UPDATE comments SET deleted_at = NOW() WHERE id = $1', [commentId])
    return res.status(204).send()
  } catch (err) {
    console.error('deleteCommentRoute error:', err)
    return res.status(500).json({ error: 'Failed to delete comment' })
  }
}
