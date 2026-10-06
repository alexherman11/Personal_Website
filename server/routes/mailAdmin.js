// /private/mail — every in-world letter, newest first (Alex's inbox).
import { allMail } from '../world/mail.js'

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export function mailJson(req, res) {
  res.json(allMail().slice().reverse())
}

export function mailPage(req, res) {
  const mail = allMail().slice().reverse()
  const rows = mail.map(m => `<tr><td>${esc(new Date(m.ts).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))}</td><td>${esc(m.fromName)}<br><small>${esc(m.from)}</small></td><td>${esc(m.toName)}</td><td>${esc(m.kind)}</td><td class="t">${esc(m.text)}</td></tr>`).join('')
  res.type('html').send(`<!doctype html><html><head><meta charset="utf-8"><title>Depths mail</title>
<style>body{font-family:ui-monospace,Menlo,monospace;background:#0b0b0b;color:#f0b429;padding:24px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #3a2e10;padding:8px;vertical-align:top;text-align:left}th{background:#1a1408}.t{white-space:pre-wrap;color:#ffd978}a{color:#f0b429}small{color:#8a6a1f}</style></head>
<body><h1>Letters from The Depths (${mail.length})</h1><p><a href="/private">← submissions</a> · <a href="/private/mail.json">json</a></p>
<table><tr><th>when</th><th>from</th><th>to</th><th>kind</th><th>text</th></tr>${rows || '<tr><td colspan=5>No mail yet.</td></tr>'}</table></body></html>`)
}
