import { listSubmissions } from '../db/submissions.js'
import { renderPrivateDashboard } from '../views/privateDashboard.js'

export function privatePage(req, res) {
  res.set('Cache-Control', 'no-store')
  res.type('html').send(renderPrivateDashboard(listSubmissions()))
}

export function privateJson(req, res) {
  res.set('Cache-Control', 'no-store')
  res.json({ submissions: listSubmissions() })
}

export function privateCsv(req, res) {
  const submissions = listSubmissions()
  const esc = (value) => {
    if (value == null) return ''
    const str = String(value)
    return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
  }
  const header = ['ts', 'id', 'major', 'questions', 'contact', 'ua', 'ip']
  const lines = [header.join(',')]
  for (const submission of submissions) {
    lines.push(header.map((key) => esc(submission[key])).join(','))
  }
  res.set('Cache-Control', 'no-store')
  res.set('Content-Disposition', 'attachment; filename="flyer-submissions.csv"')
  res.type('text/csv').send(lines.join('\n'))
}
