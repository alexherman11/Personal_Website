import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { fileURLToPath } from 'url'
import path from 'path'
import chatRoute from './routes/chat.js'
import flyerSubmit from './routes/flyer.js'
import { privatePage, privateJson, privateCsv } from './routes/private.js'
import { basicAuth } from './auth/basicAuth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

// Trust the first proxy hop so req.ip reflects the real client when deployed
// behind a reverse proxy (Cloudflare, Render, etc.) — needed for rate limits
// and per-IP lockout to work correctly.
app.set('trust proxy', 1)

app.use(express.json({ limit: '64kb' }))
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5174' }))

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'rate_limit', narrative: 'The narrator holds up a hand. "One moment. Too many voices at once."' },
})
app.use('/api', limiter)

// Stricter limiter just for flyer submits — keep it generous enough for
// honest event traffic but tight enough to discourage abuse.
const flyerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limit', message: 'Too many submissions. Try again later.' },
})

// Strict limiter for the private admin endpoints — slows down credential
// guessing even before basicAuth's lockout kicks in.
const privateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests.',
})

app.post('/api/chat', chatRoute)
app.post('/api/flyer/submit', flyerLimiter, flyerSubmit)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// Private admin routes — basic auth + rate limit, mounted BEFORE the SPA
// catch-all so they intercept first.
app.get('/private', privateLimiter, basicAuth, privatePage)
app.get('/private/data.json', privateLimiter, basicAuth, privateJson)
app.get('/private/data.csv', privateLimiter, basicAuth, privateCsv)

// Serve built frontend in production
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get('{*path}', (req, res) => {
  // Let requests for actual files (e.g. .pdf, .png) 404 instead of serving index.html
  if (path.extname(req.path)) {
    return res.status(404).end()
  }
  res.sendFile(path.join(distPath, 'index.html'))
})

const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
  console.log(`The Depths server running on port ${PORT}`)
})
