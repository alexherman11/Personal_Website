import { appendSubmission } from '../db/submissions.js'

const MAX = {
  major: 200,
  questions: 4000,
  contact: 500,
}

// Strip ASCII control chars (except \t \n \r) and clamp length.
const CTRL_CHARS = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g

function sanitize(value, max) {
  if (typeof value !== 'string') return ''
  return value.replace(CTRL_CHARS, '').trim().slice(0, max)
}

export default function flyerSubmit(req, res) {
  const body = req.body || {}
  const major = sanitize(body.major, MAX.major)
  const questions = sanitize(body.questions, MAX.questions)
  const contact = sanitize(body.contact, MAX.contact)

  if (!major && !questions && !contact) {
    res.status(400).json({ error: 'empty', message: 'No fields provided.' })
    return
  }

  const ua = sanitize(req.headers['user-agent'] || '', 500)
  const ip = req.ip || req.socket?.remoteAddress || ''

  try {
    const entry = appendSubmission({ major, questions, contact, ua, ip })
    res.json({ ok: true, id: entry.id })
  } catch (err) {
    console.error('flyer submit failed:', err)
    res.status(500).json({ error: 'internal', message: 'Could not save submission.' })
  }
}
