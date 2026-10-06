// WebSocket client for The Depths. The browser keeps only a secret token in
// localStorage; everything else (rooms, inventory, progress) lives on the
// server, so the same visitor can return from any tab.
const TOKEN_KEY = 'depths-token'

function wsUrl() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${location.host}/ws`
}

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
export function setToken(t) {
  try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY) } catch {}
}

export default class DepthsClient {
  constructor() {
    this.ws = null
    this.listeners = new Set()
    this.connected = false
    this.retry = 0
    this.closedByUs = false
    this.queue = []
  }

  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn) }
  emit(msg) { for (const fn of this.listeners) { try { fn(msg) } catch (e) { console.error(e) } } }

  connect() {
    this.closedByUs = false
    try { this.ws = new WebSocket(wsUrl()) } catch { return this.scheduleRetry() }
    this.ws.onopen = () => {
      this.connected = true
      this.retry = 0
      this.ws.send(JSON.stringify({ t: 'hello', token: getToken() }))
      this.emit({ t: '_open' })
      for (const m of this.queue.splice(0)) this.ws.send(JSON.stringify(m))
    }
    this.ws.onmessage = (ev) => {
      let msg
      try { msg = JSON.parse(ev.data) } catch { return }
      if (msg.t === 'welcome' && msg.token) setToken(msg.token)
      if (msg.t === 'token') setToken(msg.token)
      this.emit(msg)
    }
    this.ws.onclose = () => {
      this.connected = false
      this.emit({ t: '_close' })
      if (!this.closedByUs) this.scheduleRetry()
    }
    this.ws.onerror = () => {}
  }

  scheduleRetry() {
    const delay = Math.min(15000, 500 * 2 ** this.retry++)
    setTimeout(() => this.connect(), delay)
  }

  reconnect() {
    this.closedByUs = true
    try { this.ws?.close() } catch {}
    setTimeout(() => this.connect(), 200)
  }

  send(msg) {
    if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(msg))
    else this.queue.push(msg)
  }

  command(text) { this.send({ t: 'cmd', text }) }
}
