import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { validateRoute } from './routes/validate.js'
import {
  registerRoute, loginRoute, logoutRoute, refreshRoute,
  verifyEmailRoute, forgotPasswordRoute, resetPasswordRoute
} from './routes/auth.js'

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

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
