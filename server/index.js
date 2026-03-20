import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import chatRoute from './routes/chat.js'

const app = express()
app.use(express.json())
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5174' }))

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'rate_limit', narrative: 'The narrator holds up a hand. "One moment. Too many voices at once."' },
})
app.use('/api', limiter)

app.post('/api/chat', chatRoute)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
  console.log(`The Depths server running on port ${PORT}`)
})
