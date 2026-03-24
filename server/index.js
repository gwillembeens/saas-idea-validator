import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { validateRoute } from './routes/validate.js'
import {
  registerRoute, loginRoute, logoutRoute, refreshRoute,
  verifyEmailRoute, forgotPasswordRoute, resetPasswordRoute,
  googleAuthRoute, googleCallbackRoute, githubAuthRoute, githubCallbackRoute,
} from './routes/auth.js'
import { saveResultRoute, listHistoryRoute, getResultRoute, updateTitleRoute, updateVisibilityRoute, deleteResultRoute, setParentRoute, dismissRevisionRoute } from './routes/history.js'
import { leaderboardRoute, topPerNicheRoute } from './routes/leaderboard.js'
import { profileRoute } from './routes/profile.js'
import { getMeRoute, updateSettingsRoute } from './routes/settings.js'
import { toggleLikeRoute, getLikeStatusRoute, getCommentsRoute, postCommentRoute, postReplyRoute, deleteCommentRoute } from './routes/social.js'
import { getUnreadCountRoute, getNotificationsRoute, markReadRoute } from './routes/notifications.js'
import { requireAuth } from './middleware/requireAuth.js'
import { optionalAuth } from './middleware/optionalAuth.js'
import { runMigrations } from './db/init.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/validate', validateRoute)

// Mount auth routes
app.post('/api/auth/register', registerRoute)
app.post('/api/auth/login', loginRoute)
app.post('/api/auth/logout', logoutRoute)
app.post('/api/auth/refresh', refreshRoute)
app.get('/api/auth/verify-email', verifyEmailRoute)
app.post('/api/auth/forgot-password', forgotPasswordRoute)
app.post('/api/auth/reset-password', resetPasswordRoute)

// Mount OAuth routes
app.get('/api/auth/google', googleAuthRoute)
app.get('/api/auth/google/callback', googleCallbackRoute)
app.get('/api/auth/github', githubAuthRoute)
app.get('/api/auth/github/callback', githubCallbackRoute)

// Mount history routes
app.post('/api/history', requireAuth, saveResultRoute)
app.get('/api/history', requireAuth, listHistoryRoute)
app.get('/api/history/:id', optionalAuth, getResultRoute)
app.patch('/api/history/:id/title', requireAuth, updateTitleRoute)
app.patch('/api/history/:id/visibility', requireAuth, updateVisibilityRoute)
app.delete('/api/history/:id', requireAuth, deleteResultRoute)
app.patch('/api/history/:id/parent', requireAuth, setParentRoute)
app.patch('/api/history/:id/dismiss-revision', requireAuth, dismissRevisionRoute)

// Mount leaderboard routes
app.get('/api/leaderboard/top-per-niche', topPerNicheRoute)
app.get('/api/leaderboard', optionalAuth, leaderboardRoute)

// Mount social routes
app.post('/api/results/:id/like', requireAuth, toggleLikeRoute)
app.get('/api/results/:id/like-status', optionalAuth, getLikeStatusRoute)
app.get('/api/results/:id/comments', getCommentsRoute)
app.post('/api/results/:id/comments', requireAuth, postCommentRoute)
app.post('/api/comments/:id/replies', requireAuth, postReplyRoute)
app.delete('/api/comments/:id', requireAuth, deleteCommentRoute)

// Mount notification routes
app.get('/api/notifications/unread-count', requireAuth, getUnreadCountRoute)
app.get('/api/notifications', requireAuth, getNotificationsRoute)
app.post('/api/notifications/mark-read', requireAuth, markReadRoute)

// Mount profile routes
app.get('/api/profile/:username', profileRoute)
app.get('/api/me', requireAuth, getMeRoute)
app.patch('/api/me/settings', requireAuth, updateSettingsRoute)

runMigrations().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})

// Export app for testing
export { app }

// Start server if not in test mode
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
  })
}
