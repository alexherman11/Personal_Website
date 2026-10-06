// A Session is one connected terminal for one player. Players may have several
// sessions (tabs). All output to a player fans out to every session.
import crypto from 'crypto'
import store from './store.js'
import { roomOf, playersIn, setOnlineCheck } from './objects.js'

export const sessionsByPlayer = new Map() // playerId -> Set<Session>
export const allSessions = new Set()
setOnlineCheck(id => sessionsByPlayer.has(id))

export class Session {
  constructor(ws, player) {
    this.id = crypto.randomUUID()
    this.ws = ws
    this.player = player
    this.mode = 'normal'      // normal | editor | name | password
    this.modeData = null
    this.recent = []          // recent room events (for narrator context)
    this.history = []         // narrator conversation history (per room)
    this.historyRoom = null
    this.narratorBusy = false
    this.narratorCalls = []   // timestamps for rate limiting
    this.cmdTimes = []
    this.connectedAt = Date.now()
    allSessions.add(this)
    if (!sessionsByPlayer.has(player.id)) sessionsByPlayer.set(player.id, new Set())
    sessionsByPlayer.get(player.id).add(this)
  }

  close() {
    allSessions.delete(this)
    const set = sessionsByPlayer.get(this.player.id)
    if (set) { set.delete(this); if (set.size === 0) sessionsByPlayer.delete(this.player.id) }
  }

  // Re-read the player record (it may have been replaced in the store).
  get p() {
    const fresh = store.get(this.player.id)
    if (fresh) this.player = fresh
    return this.player
  }

  send(msg) {
    try { if (this.ws.readyState === 1) this.ws.send(JSON.stringify(msg)) } catch {}
  }

  // Text output. `style` is a hint for the client: output | system | chat | emote | dim | error | heading
  out(text, style = 'output', opts = {}) {
    const lines = Array.isArray(text) ? text : String(text ?? '').split('\n')
    this.send({ t: 'out', lines: lines.map(l => (typeof l === 'string' ? { text: l, style } : l)), ...opts })
  }

  remember(text) {
    this.recent.push(text)
    if (this.recent.length > 12) this.recent.shift()
  }
}

export function sessionsOf(playerId) {
  return [...(sessionsByPlayer.get(playerId) || [])]
}

export function isOnline(playerId) {
  return sessionsByPlayer.has(playerId)
}

export function onlinePlayers() {
  return [...sessionsByPlayer.keys()].map(id => store.get(id)).filter(Boolean)
}

// Send text to one player (every session they have open).
export function tellPlayer(playerId, text, style = 'output', opts = {}) {
  for (const s of sessionsOf(playerId)) { s.out(text, style, opts); if (opts.remember !== false) s.remember(firstLine(text)) }
}

// Send text to everyone in a room, optionally excluding some players.
export function announceRoom(roomId, text, { except = [], style = 'output' } = {}) {
  const skip = new Set((Array.isArray(except) ? except : [except]).filter(Boolean).map(p => (typeof p === 'string' ? p : p.id)))
  for (const pl of playersIn(roomId)) {
    if (skip.has(pl.id)) continue
    tellPlayer(pl.id, text, style)
  }
}

export function broadcast(text, style = 'system') {
  for (const s of allSessions) s.out(text, style)
}

export function sendTo(playerId, msg) {
  for (const s of sessionsOf(playerId)) s.send(msg)
}

function firstLine(text) {
  const t = Array.isArray(text) ? text[0] : String(text)
  return typeof t === 'string' ? t : t?.text || ''
}

export function roomOfPlayer(player) { return roomOf(player) }
