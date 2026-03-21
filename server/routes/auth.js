import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import { Resend } from 'resend'
import { pool } from '../db/init.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js'
import { generateToken } from '../utils/crypto.js'

const resend = new Resend(process.env.RESEND_API_KEY)
const BCRYPT_ROUNDS = 12

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
}

// POST /api/auth/register
export async function registerRoute(req, res) {
  const { email, password } = req.body
  if (!email || !password || password.length < 8) {
    return res.status(400).json({ error: 'Email and password (min 8 chars) required.' })
  }
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Email already registered.' })
  }
  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS)
  const { rows } = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
    [email, password_hash]
  )
  const user = rows[0]
  const token = generateToken()
  await pool.query(
    'INSERT INTO email_verification_tokens (user_id, token) VALUES ($1, $2)',
    [user.id, token]
  )
  const verifyUrl = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${token}`
  await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to: email,
    subject: 'Verify your email',
    html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email. Link expires in 24 hours.</p>`,
  })
  res.status(201).json({ message: 'Registered. Check your email to verify your account.' })
}

// POST /api/auth/login
export async function loginRoute(req, res) {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required.' })
  }
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
  const user = rows[0]
  if (!user || !user.password_hash) {
    return res.status(401).json({ error: 'Invalid credentials.' })
  }
  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials.' })
  if (!user.email_verified) {
    return res.status(403).json({ error: 'Please verify your email before logging in.' })
  }
  const accessToken = signAccessToken({ id: user.id, email: user.email })
  const refreshToken = signRefreshToken({ id: user.id })
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)',
    [user.id, refreshToken]
  )
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
  res.json({ accessToken, user: { id: user.id, email: user.email } })
}

// POST /api/auth/logout
export async function logoutRoute(req, res) {
  const token = req.cookies?.refreshToken
  if (token) {
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token])
  }
  res.clearCookie('refreshToken', COOKIE_OPTIONS)
  res.json({ message: 'Logged out.' })
}

// POST /api/auth/refresh
export async function refreshRoute(req, res) {
  const token = req.cookies?.refreshToken
  if (!token) return res.status(401).json({ error: 'No refresh token.' })
  try {
    const payload = verifyRefreshToken(token)
    const { rows } = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > now()',
      [token]
    )
    if (!rows.length) return res.status(401).json({ error: 'Refresh token invalid or expired.' })
    // Rotate: delete old, issue new
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token])
    const newRefreshToken = signRefreshToken({ id: payload.id })
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)',
      [payload.id, newRefreshToken]
    )
    const userRes = await pool.query('SELECT id, email FROM users WHERE id = $1', [payload.id])
    const user = userRes.rows[0]
    const accessToken = signAccessToken({ id: user.id, email: user.email })
    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS)
    res.json({ accessToken, user: { id: user.id, email: user.email } })
  } catch {
    return res.status(401).json({ error: 'Refresh token invalid.' })
  }
}

// GET /api/auth/verify-email?token=...
export async function verifyEmailRoute(req, res) {
  const { token } = req.query
  if (!token) return res.status(400).json({ error: 'Token required.' })
  const { rows } = await pool.query(
    'SELECT * FROM email_verification_tokens WHERE token = $1 AND expires_at > now()',
    [token]
  )
  if (!rows.length) return res.status(400).json({ error: 'Token invalid or expired.' })
  const { user_id } = rows[0]
  await pool.query('UPDATE users SET email_verified = true WHERE id = $1', [user_id])
  await pool.query('DELETE FROM email_verification_tokens WHERE token = $1', [token])
  res.redirect(`${process.env.FRONTEND_URL}/?verified=true`)
}

// POST /api/auth/forgot-password
export async function forgotPasswordRoute(req, res) {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email required.' })
  const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email])
  // Always return 200 to prevent email enumeration
  if (!rows.length) return res.json({ message: 'If that email exists, a reset link was sent.' })
  const user = rows[0]
  const token = generateToken()
  await pool.query(
    'INSERT INTO password_reset_tokens (user_id, token) VALUES ($1, $2)',
    [user.id, token]
  )
  const resetUrl = `${process.env.FRONTEND_URL}/?reset=${token}`
  await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to: email,
    subject: 'Reset your password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`,
  })
  res.json({ message: 'If that email exists, a reset link was sent.' })
}

// POST /api/auth/reset-password
export async function resetPasswordRoute(req, res) {
  const { token, password } = req.body
  if (!token || !password || password.length < 8) {
    return res.status(400).json({ error: 'Token and new password (min 8 chars) required.' })
  }
  const { rows } = await pool.query(
    'SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > now() AND used = false',
    [token]
  )
  if (!rows.length) return res.status(400).json({ error: 'Token invalid or expired.' })
  const { user_id, id: tokenId } = rows[0]
  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS)
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, user_id])
  await pool.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [tokenId])
  // Invalidate all refresh tokens for security
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [user_id])
  res.json({ message: 'Password updated. Please log in.' })
}

// GET /api/auth/google — initiate OAuth
export function googleAuthRoute(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.BACKEND_URL}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  })
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}

// GET /api/auth/google/callback — handle OAuth callback
export async function googleCallbackRoute(req, res) {
  const { code } = req.query
  if (!code) return res.redirect(`${process.env.FRONTEND_URL}/?auth_error=missing_code`)

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.BACKEND_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok) throw new Error('Token exchange failed')

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const googleUser = await userRes.json()

    // Upsert user
    const { rows: existingUsers } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [googleUser.email]
    )
    let user
    if (existingUsers.length > 0) {
      user = existingUsers[0]
      if (!user.email_verified) {
        await pool.query('UPDATE users SET email_verified = true WHERE id = $1', [user.id])
      }
    } else {
      const { rows } = await pool.query(
        'INSERT INTO users (email, email_verified) VALUES ($1, true) RETURNING *',
        [googleUser.email]
      )
      user = rows[0]
    }

    // Upsert oauth_account
    await pool.query(
      `INSERT INTO oauth_accounts (user_id, provider, provider_account_id)
       VALUES ($1, 'google', $2)
       ON CONFLICT (provider, provider_account_id) DO NOTHING`,
      [user.id, String(googleUser.id)]
    )

    // Issue tokens
    const accessToken = signAccessToken({ id: user.id, email: user.email })
    const refreshToken = signRefreshToken({ id: user.id })
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)',
      [user.id, refreshToken]
    )
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
    res.redirect(`${process.env.FRONTEND_URL}/?accessToken=${accessToken}`)
  } catch (err) {
    console.error('Google OAuth error:', err)
    res.redirect(`${process.env.FRONTEND_URL}/?auth_error=google_failed`)
  }
}

// GET /api/auth/github — initiate OAuth
export function githubAuthRoute(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${process.env.BACKEND_URL}/api/auth/github/callback`,
    scope: 'read:user user:email',
  })
  res.redirect(`https://github.com/login/oauth/authorize?${params}`)
}

// GET /api/auth/github/callback — handle OAuth callback
export async function githubCallbackRoute(req, res) {
  const { code } = req.query
  if (!code) return res.redirect(`${process.env.FRONTEND_URL}/?auth_error=missing_code`)

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.BACKEND_URL}/api/auth/github/callback`,
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error('Token exchange failed')

    // Get user info
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'SaasValidator' },
    })
    const githubUser = await userRes.json()

    // Get primary email (may not be public)
    const emailRes = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'SaasValidator' },
    })
    const emails = await emailRes.json()
    const primaryEmail = emails.find(e => e.primary && e.verified)?.email
    if (!primaryEmail) throw new Error('No verified email on GitHub account')

    // Upsert user
    const { rows: existingUsers } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [primaryEmail]
    )
    let user
    if (existingUsers.length > 0) {
      user = existingUsers[0]
      if (!user.email_verified) {
        await pool.query('UPDATE users SET email_verified = true WHERE id = $1', [user.id])
      }
    } else {
      const { rows } = await pool.query(
        'INSERT INTO users (email, email_verified) VALUES ($1, true) RETURNING *',
        [primaryEmail]
      )
      user = rows[0]
    }

    // Upsert oauth_account
    await pool.query(
      `INSERT INTO oauth_accounts (user_id, provider, provider_account_id)
       VALUES ($1, 'github', $2)
       ON CONFLICT (provider, provider_account_id) DO NOTHING`,
      [user.id, String(githubUser.id)]
    )

    // Issue tokens
    const accessToken = signAccessToken({ id: user.id, email: user.email })
    const refreshToken = signRefreshToken({ id: user.id })
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)',
      [user.id, refreshToken]
    )
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
    res.redirect(`${process.env.FRONTEND_URL}/?accessToken=${accessToken}`)
  } catch (err) {
    console.error('GitHub OAuth error:', err)
    res.redirect(`${process.env.FRONTEND_URL}/?auth_error=github_failed`)
  }
}
