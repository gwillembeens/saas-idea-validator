import { pool } from '../db/init.js'

// GET /api/notifications/unread-count
export async function getUnreadCountRoute(req, res) {
  const userId = req.user.id
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM notifications
       WHERE recipient_id = $1 AND is_read = false`,
      [userId]
    )
    return res.json({ count: result.rows[0].count ?? 0 })
  } catch (err) {
    console.error('getUnreadCountRoute error:', err)
    return res.status(500).json({ error: 'Failed to fetch unread count' })
  }
}

// GET /api/notifications
export async function getNotificationsRoute(req, res) {
  const userId = req.user.id
  try {
    const { rows } = await pool.query(
      `SELECT
         n.event_type,
         n.result_id,
         sr.title AS validation_title,
         COUNT(DISTINCT n.actor_id)::int AS actor_count,
         MAX(n.created_at) AS most_recent_at,
         (SELECT u.username FROM notifications n2
          LEFT JOIN users u ON u.id = n2.actor_id
          WHERE n2.recipient_id = $1
            AND n2.event_type = n.event_type
            AND n2.result_id = n.result_id
          ORDER BY n2.created_at DESC
          LIMIT 1) AS most_recent_actor_username,
         bool_or(NOT n.is_read) AS is_unread
       FROM notifications n
       LEFT JOIN saved_results sr ON n.result_id = sr.id
       WHERE n.recipient_id = $1
         AND n.created_at > NOW() - INTERVAL '30 days'
       GROUP BY n.event_type, n.result_id, sr.title
       ORDER BY MAX(n.created_at) DESC
       LIMIT 50`,
      [userId]
    )
    return res.json(rows)
  } catch (err) {
    console.error('getNotificationsRoute error:', err)
    return res.status(500).json({ error: 'Failed to fetch notifications' })
  }
}

// POST /api/notifications/mark-read
export async function markReadRoute(req, res) {
  const userId = req.user.id
  try {
    await pool.query(
      `UPDATE notifications SET is_read = true
       WHERE recipient_id = $1 AND is_read = false`,
      [userId]
    )
    return res.json({ success: true })
  } catch (err) {
    console.error('markReadRoute error:', err)
    return res.status(500).json({ error: 'Failed to mark notifications as read' })
  }
}
