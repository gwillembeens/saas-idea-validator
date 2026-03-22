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
import { saveResultRoute, listHistoryRoute, getResultRoute, updateTitleRoute, updateVisibilityRoute, deleteResultRoute } from './routes/history.js'
import { requireAuth } from './middleware/requireAuth.js'
import { optionalAuth } from './middleware/optionalAuth.js'

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

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
