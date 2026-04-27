import { listSubmissions } from '../db/submissions.js'

function escapeHtml(str) {
  if (str == null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function fmtTs(iso) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export function privatePage(req, res) {
  const subs = listSubmissions().sort((a, b) => (a.ts < b.ts ? 1 : -1))

  const rows = subs
    .map((s) => {
      const major = escapeHtml(s.major) || '<span class="dim">—</span>'
      const questions =
        escapeHtml(s.questions) || '<span class="dim">—</span>'
      const contact = escapeHtml(s.contact) || '<span class="dim">—</span>'
      return `
      <article class="entry">
        <header>
          <span class="ts">${escapeHtml(fmtTs(s.ts))}</span>
          <span class="id">${escapeHtml(s.id)}</span>
        </header>
        <dl>
          <dt>Major</dt><dd>${major}</dd>
          <dt>Questions</dt><dd class="multiline">${questions}</dd>
          <dt>Contact</dt><dd>${contact}</dd>
          <dt class="meta">UA</dt><dd class="meta">${escapeHtml(s.ua || '')}</dd>
          <dt class="meta">IP</dt><dd class="meta">${escapeHtml(s.ip || '')}</dd>
        </dl>
      </article>`
    })
    .join('\n')

  const empty = `<p class="empty">No submissions yet.</p>`

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="robots" content="noindex,nofollow,noarchive" />
  <title>Private — Flyer Submissions</title>
  <style>
    :root {
      --primary: #FFB000;
      --dim: #805800;
      --bg: #0A0A0A;
      --panel: #141008;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--primary);
      font-family: 'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace;
      padding: 24px 16px 60px;
      line-height: 1.5;
    }
    .wrap { max-width: 880px; margin: 0 auto; }
    h1 {
      font-size: 20px;
      letter-spacing: 0.1em;
      margin: 0 0 4px;
      text-shadow: 0 0 8px rgba(255,176,0,0.4);
    }
    .sub { color: var(--dim); font-size: 12px; margin: 0 0 20px; letter-spacing: .06em; }
    .count { color: var(--primary); }
    .entry {
      border: 1px solid var(--dim);
      padding: 14px 16px;
      margin-bottom: 14px;
      background: rgba(255,176,0,0.02);
    }
    .entry header {
      display: flex; justify-content: space-between; gap: 12px;
      font-size: 12px; color: var(--dim);
      border-bottom: 1px dashed var(--dim);
      padding-bottom: 6px; margin-bottom: 8px;
      word-break: break-all;
    }
    .ts { color: var(--primary); }
    dl { margin: 0; display: grid; grid-template-columns: 110px 1fr; gap: 4px 12px; font-size: 14px; }
    dt { color: var(--dim); letter-spacing: .04em; }
    dd { margin: 0; word-break: break-word; }
    dd.multiline { white-space: pre-wrap; }
    .dim { color: var(--dim); opacity: .6; }
    .meta { font-size: 11px; color: var(--dim); opacity: .65; }
    .empty {
      text-align: center; color: var(--dim);
      border: 1px dashed var(--dim); padding: 40px;
    }
    .actions { display: flex; gap: 12px; font-size: 12px; margin-bottom: 18px; }
    .actions a {
      color: var(--primary); border: 1px solid var(--dim);
      padding: 4px 10px; text-decoration: none; letter-spacing: .06em;
    }
    .actions a:hover { border-color: var(--primary); box-shadow: 0 0 6px rgba(255,176,0,.2); }
    @media (max-width: 520px) {
      dl { grid-template-columns: 1fr; }
      dt { margin-top: 6px; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>FLYER SUBMISSIONS</h1>
    <p class="sub">private · <span class="count">${subs.length}</span> total · ordered newest first</p>
    <div class="actions">
      <a href="/private/data.json">[ raw JSON ]</a>
      <a href="/private/data.csv">[ csv ]</a>
      <a href="/">[ site ]</a>
    </div>
    ${subs.length === 0 ? empty : rows}
  </div>
</body>
</html>`
  res.set('Cache-Control', 'no-store')
  res.type('html').send(html)
}

export function privateJson(req, res) {
  res.set('Cache-Control', 'no-store')
  res.json({ submissions: listSubmissions() })
}

export function privateCsv(req, res) {
  const subs = listSubmissions()
  const esc = (v) => {
    if (v == null) return ''
    const s = String(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = ['ts', 'id', 'major', 'questions', 'contact', 'ua', 'ip']
  const lines = [header.join(',')]
  for (const s of subs) {
    lines.push(header.map((k) => esc(s[k])).join(','))
  }
  res.set('Cache-Control', 'no-store')
  res.set('Content-Disposition', 'attachment; filename="flyer-submissions.csv"')
  res.type('text/csv').send(lines.join('\n'))
}
