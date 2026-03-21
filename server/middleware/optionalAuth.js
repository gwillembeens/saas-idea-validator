import { verifyAccessToken } from '../utils/jwt.js'

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      req.user = verifyAccessToken(token)
    } catch {
      req.user = null
    }
  } else {
    req.user = null
  }
  next()
}
