const DEFAULT_FOREMAN_API_BASE = 'https://foreman.agoraserver.com'
const DEFAULT_REPO_HINT = '/mnt/c/Projects/Anima'
const FOREMAN_TIMEOUT_MS = 45_000

function foremanApiBase() {
  return (process.env.FOREMAN_API_BASE || DEFAULT_FOREMAN_API_BASE).replace(/\/+$/, '')
}

function foremanToken() {
  return process.env.FOREMAN_MCP_TOKEN || ''
}

function cleanString(value, maxLength) {
  if (value == null) return ''
  return String(value).trim().slice(0, maxLength)
}

function configured() {
  return Boolean(foremanToken())
}

function sendNotConfigured(res) {
  res.status(503).json({
    error: 'foreman_not_configured',
    message: 'Set FOREMAN_MCP_TOKEN in the website server environment.',
  })
}

function sendUpstreamError(res, err) {
  if (err.name === 'AbortError') {
    res.status(504).json({
      error: 'foreman_timeout',
      message: 'Foreman did not respond before the proxy timeout.',
    })
    return
  }

  if (err.status === 401) {
    res.status(502).json({
      error: 'foreman_token_rejected',
      message: 'Foreman rejected the configured bearer token.',
    })
    return
  }

  if (err.status) {
    res.status(502).json({
      error: 'foreman_upstream_error',
      message: `Foreman returned HTTP ${err.status}.`,
      upstream: err.body,
    })
    return
  }

  res.status(502).json({
    error: 'foreman_unreachable',
    message: 'Could not reach Foreman.',
  })
}

async function callForeman(pathname, { method = 'POST', body } = {}) {
  if (!configured()) {
    const err = new Error('Foreman token is not configured.')
    err.notConfigured = true
    throw err
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FOREMAN_TIMEOUT_MS)

  try {
    const headers = {
      Authorization: `Bearer ${foremanToken()}`,
    }
    const options = {
      method,
      headers,
      signal: controller.signal,
    }

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${foremanApiBase()}${pathname}`, options)
    const text = await response.text()
    let parsed = null
    if (text) {
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = { raw: text }
      }
    }

    if (!response.ok) {
      const err = new Error('Foreman upstream error.')
      err.status = response.status
      err.body = parsed
      throw err
    }

    return parsed
  } finally {
    clearTimeout(timeout)
  }
}

export function foremanConfig(req, res) {
  res.set('Cache-Control', 'no-store')
  res.json({
    configured: configured(),
    apiBase: foremanApiBase(),
    defaultRepoHint: process.env.FOREMAN_DEFAULT_REPO_HINT || DEFAULT_REPO_HINT,
  })
}

export async function foremanSubmit(req, res) {
  try {
    const spec = cleanString(req.body?.spec_markdown, 40_000)
    if (!spec) {
      res.status(400).json({
        error: 'missing_spec',
        message: 'Mission text is required.',
      })
      return
    }

    const repoHint = cleanString(req.body?.repo_hint, 500)
    const priority = Number.isFinite(Number(req.body?.priority))
      ? Math.max(0, Math.min(9, Number(req.body.priority)))
      : 0

    const body = {
      spec_markdown: spec,
      repo_hint: repoHint || undefined,
      priority,
      auto_confirm: req.body?.auto_confirm !== false,
    }

    const data = await callForeman('/submit_mission', { body })
    res.set('Cache-Control', 'no-store')
    res.json(data)
  } catch (err) {
    if (err.notConfigured) return sendNotConfigured(res)
    sendUpstreamError(res, err)
  }
}

export async function foremanList(req, res) {
  try {
    const filter = req.body?.filter && typeof req.body.filter === 'object'
      ? req.body.filter
      : {}
    const cleanFilter = {}

    if (filter.status) cleanFilter.status = cleanString(filter.status, 80)
    if (filter.parent_mission_id) {
      cleanFilter.parent_mission_id = cleanString(filter.parent_mission_id, 160)
    }
    if (filter.awaiting_only) cleanFilter.awaiting_only = true

    const body = Object.keys(cleanFilter).length ? { filter: cleanFilter } : {}
    const data = await callForeman('/list_missions', { body })
    res.set('Cache-Control', 'no-store')
    res.json(data)
  } catch (err) {
    if (err.notConfigured) return sendNotConfigured(res)
    sendUpstreamError(res, err)
  }
}

export async function foremanDemo(req, res) {
  try {
    const missionId = cleanString(req.params?.missionId, 160)
    if (!missionId) {
      res.status(400).json({
        error: 'missing_mission_id',
        message: 'Mission id is required.',
      })
      return
    }

    const data = await callForeman(`/demo/${encodeURIComponent(missionId)}`, {
      method: 'GET',
    })
    res.set('Cache-Control', 'no-store')
    res.json(data)
  } catch (err) {
    if (err.notConfigured) return sendNotConfigured(res)
    sendUpstreamError(res, err)
  }
}

export async function foremanDecide(req, res) {
  try {
    const decisionId = cleanString(req.body?.decision_id, 160)
    const answer = cleanString(req.body?.answer, 4_000)

    if (!decisionId) {
      res.status(400).json({
        error: 'missing_decision_id',
        message: 'Decision id is required.',
      })
      return
    }

    if (!answer) {
      res.status(400).json({
        error: 'missing_answer',
        message: 'Decision answer is required.',
      })
      return
    }

    const data = await callForeman('/decide', {
      body: {
        decision_id: decisionId,
        answer,
      },
    })
    res.set('Cache-Control', 'no-store')
    res.json(data)
  } catch (err) {
    if (err.notConfigured) return sendNotConfigured(res)
    sendUpstreamError(res, err)
  }
}
