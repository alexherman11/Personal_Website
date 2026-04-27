// HTTP Basic Auth middleware with constant-time compare and per-IP
// brute-force lockout. Credentials live in env vars only — never in source.

import crypto from 'crypto'

const REALM = 'Alex Herman - Private'

// Per-IP failed-attempt tracking. After MAX_FAILS within WINDOW_MS,
// the IP is locked out for LOCKOUT_MS regardless of correctness.
const MAX_FAILS = 8
const WINDOW_MS = 15 * 60 * 1000      // 15 min
const LOCKOUT_MS = 30 * 60 * 1000     // 30 min lockout
const failures = new Map()            // ip -> { count, firstAt, lockedUntil }

function clientIp(req) {
  // Express's req.ip honors trust-proxy if set; fall back to socket address.
  return req.ip || req.socket?.remoteAddress || 'unknown'
}

function recordFailure(ip) {
  const now = Date.now()
  const rec = failures.get(ip) || { count: 0, firstAt: now, lockedUntil: 0 }
  if (now - rec.firstAt > WINDOW_MS) {
    rec.count = 0
    rec.firstAt = now
  }
  rec.count += 1
  if (rec.count >= MAX_FAILS) {
    rec.lockedUntil = now + LOCKOUT_MS
  }
  failures.set(ip, rec)
}

function isLocked(ip) {
  const rec = failures.get(ip)
  if (!rec) return false
  if (rec.lockedUntil && Date.now() < rec.lockedUntil) return true
  return false
}

function clearFailures(ip) {
  failures.delete(ip)
}

// Constant-time compare via SHA-256 of both sides — protects against length
// leaks and timing attacks even if the buffers differ in size.
function safeEqual(a, b) {
  const ah = crypto.createHash('sha256').update(a, 'utf8').digest()
  const bh = crypto.createHash('sha256').update(b, 'utf8').digest()
  return crypto.timingSafeEqual(ah, bh)
}

function unauthorized(res, message = 'Authentication required') {
  res.set('WWW-Authenticate', `Basic realm="${REALM}", charset="UTF-8"`)
  res.status(401).type('text/plain').send(message)
}

export function basicAuth(req, res, next) {
  const expectedUser = process.env.PRIVATE_ADMIN_USER
  const expectedPass = process.env.PRIVATE_ADMIN_PASSWORD

  if (!expectedUser || !expectedPass) {
    // Fail closed — never serve the private route without credentials set.
    res
      .status(503)
      .type('text/plain')
      .send('Private area is not configured. Set PRIVATE_ADMIN_USER and PRIVATE_ADMIN_PASSWORD.')
    return
  }

  const ip = clientIp(req)
  if (isLocked(ip)) {
    res.status(429).type('text/plain').send('Too many failed attempts. Try again later.')
    return
  }

  const header = req.headers.authorization || ''
  if (!header.toLowerCase().startsWith('basic ')) {
    return unauthorized(res)
  }

  let decoded
  try {
    decoded = Buffer.from(header.slice(6).trim(), 'base64').toString('utf8')
  } catch {
    recordFailure(ip)
    return unauthorized(res)
  }

  const idx = decoded.indexOf(':')
  if (idx === -1) {
    recordFailure(ip)
    return unauthorized(res)
  }
  const user = decoded.slice(0, idx)
  const pass = decoded.slice(idx + 1)

  // Always compute both compares so total time is independent of which side mismatched.
  const userOk = safeEqual(user, expectedUser)
  const passOk = safeEqual(pass, expectedPass)

  if (userOk && passOk) {
    clearFailures(ip)
    return next()
  }

  recordFailure(ip)
  return unauthorized(res, 'Invalid credentials')
}
