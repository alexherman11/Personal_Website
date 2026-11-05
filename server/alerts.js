// Narrator outage alerting. Event-driven: runs only when a narrator call fails.
// POSTs to a Claude Code scheduled task's API trigger, which starts a Claude
// session that investigates. Inert unless NARRATOR_ALERT_URL and
// NARRATOR_ALERT_TOKEN are set.

// Auth failures can't heal themselves, so they alert on the first occurrence.
const IMMEDIATE = new Set([401, 403])
const MAX_RECENT = 5

let consecutive = 0
let warnedDisabled = false
const recent = []
const lastSent = new Map()

export function describeError(err) {
  return `status=${err.status ?? '-'} type=${err.error?.error?.type ?? err.name} request_id=${err.requestID ?? err.headers?.get?.('request-id') ?? '-'} msg=${err.message}`
}

export function narratorOk() {
  consecutive = 0
  recent.length = 0
}

export async function narratorFailed(err, model) {
  try {
    const url = process.env.NARRATOR_ALERT_URL
    const token = process.env.NARRATOR_ALERT_TOKEN
    const threshold = Number(process.env.NARRATOR_ALERT_THRESHOLD) || 3
    const cooldownMs = (Number(process.env.NARRATOR_ALERT_COOLDOWN_MIN) || 360) * 60_000

    consecutive++
    recent.push(`${new Date().toISOString()} ${describeError(err)}`)
    if (recent.length > MAX_RECENT) recent.shift()

    if (!url || !token) {
      if (!warnedDisabled) { warnedDisabled = true; console.warn('[alert] NARRATOR_ALERT_URL/TOKEN not set; outage alerts disabled') }
      return
    }
    if (!IMMEDIATE.has(err.status) && consecutive < threshold) return

    const signature = `${err.status ?? 'none'}:${err.error?.error?.type ?? err.name}`
    if (Date.now() - (lastSent.get(signature) || 0) < cooldownMs) return

    const text = [
      'The Depths narrator is failing in production.',
      `Time: ${new Date().toISOString()}`,
      `Consecutive failures: ${consecutive}`,
      `Model: ${model}`,
      `Latest error: ${describeError(err)}`,
      `Deployment: commit=${process.env.RAILWAY_GIT_COMMIT_SHA || '-'} deployment=${process.env.RAILWAY_DEPLOYMENT_ID || '-'} env=${process.env.RAILWAY_ENVIRONMENT_NAME || '-'} domain=${process.env.RAILWAY_PUBLIC_DOMAIN || '-'}`,
      'Recent failures (oldest first):',
      ...recent.map(l => `- ${l}`),
    ].join('\n').slice(0, 8000)

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'anthropic-beta': 'experimental-cc-routine-2026-04-01',
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      console.error(`[alert] fire endpoint answered ${res.status}`)
      return
    }
    lastSent.set(signature, Date.now())
    console.warn(`[alert] sent outage alert (${signature})`)
  } catch (e) {
    console.error(`[alert] could not send alert: ${e.message}`)
  }
}
