// In-world mail: letters between players, and the direct line to Alex.
// Stored in the world meta so it survives restarts and shows in /private.
import store from './store.js'

export function addMail({ from, to, text, kind = 'mail' }) {
  const mail = store.meta.mail || []
  const entry = {
    id: (store.meta.nextMailId || 1),
    ts: Date.now(),
    from: from.id, fromName: from.name,
    to: to.id, toName: to.name,
    kind, text, read: false,
  }
  mail.push(entry)
  store.setMeta({ mail: mail.slice(-2000), nextMailId: entry.id + 1 })
  return entry
}

export function mailFor(playerId) {
  return (store.meta.mail || []).filter(m => m.to === playerId)
}

export function unreadCount(playerId) {
  return mailFor(playerId).filter(m => !m.read).length
}

export function markRead(playerId) {
  let changed = false
  for (const m of store.meta.mail || []) if (m.to === playerId && !m.read) { m.read = true; changed = true }
  if (changed) store.setMeta({ mail: store.meta.mail })
}

export function allMail() {
  return [...(store.meta.mail || [])]
}
