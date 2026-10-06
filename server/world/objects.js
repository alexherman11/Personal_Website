// Helpers over the store: naming, matching, movement, visibility, ownership.
import store from './store.js'

export const WIZARD_ID = '#alex'
export const SYSTEM_ID = '#system'

// ---------- names ----------
export function namesOf(obj) {
  const out = [obj.name, ...(obj.aliases || [])]
  // inherit aliases from ancestors (e.g. per-player copies of seed items)
  for (const a of store.ancestors(obj)) {
    if (a.kind !== 'generic' || obj.flags?.copyOf) out.push(a.name, ...(a.aliases || []))
  }
  return out.filter(Boolean).map(n => String(n).toLowerCase())
}

export function displayName(obj) {
  if (!obj) return 'nothing'
  return obj.name
}

// "a golden compass" / "the Golden Compass" helpers
export function article(obj) {
  const name = obj.name
  if (obj.kind === 'player') return name
  if (obj.flags?.proper) return name
  return /^[aeiou]/i.test(name) ? `an ${name.toLowerCase()}` : `a ${name.toLowerCase()}`
}

export function theName(obj) {
  if (!obj) return 'it'
  if (obj.kind === 'player' || obj.flags?.proper) return obj.name
  return `the ${obj.name.toLowerCase()}`
}

const STOPWORDS = new Set(['the', 'a', 'an', 'some', 'my', 'that', 'this', 'at', 'to'])

export function normalizeRef(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9#$_\-\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w && !STOPWORDS.has(w))
    .join(' ')
    .trim()
}

// Score how well `ref` matches an object: 3 exact name/alias, 2 word-prefix
// match on every ref word, 1 substring. 0 = no match.
export function matchScore(obj, ref) {
  if (!ref) return 0
  const names = namesOf(obj)
  if (names.includes(ref)) return 3
  const refWords = ref.split(' ')
  for (const n of names) {
    const words = n.split(/\s+/)
    if (refWords.every(rw => words.some(w => w.startsWith(rw) || (rw.endsWith('s') && w.startsWith(rw.slice(0, -1)))))) return 2
  }
  for (const n of names) if (n.includes(ref)) return 1
  return 0
}

// Find the best matching objects among candidates. Returns { matches, best }.
export function matchObjects(ref, candidates) {
  const norm = normalizeRef(ref)
  if (!norm) return { matches: [], best: null }
  let best = 0
  const scored = []
  for (const obj of candidates) {
    const s = matchScore(obj, norm)
    if (s > 0) scored.push({ obj, s })
    if (s > best) best = s
  }
  let matches = scored.filter(x => x.s === best).map(x => x.obj)
  // Things and players outrank exits when a word fits both ("door").
  if (matches.length > 1 && matches.some(m => m.kind !== 'exit')) matches = matches.filter(m => m.kind !== 'exit')
  return { matches, best: matches.length === 1 ? matches[0] : null }
}

// ---------- visibility / location ----------
export function roomOf(obj) {
  let cur = obj
  const seen = new Set()
  while (cur && !seen.has(cur.id)) {
    if (cur.kind === 'room') return cur
    seen.add(cur.id)
    cur = cur.location ? store.get(cur.location) : null
  }
  return null
}

// Things a player can see in their room (excluding themselves and exits).
export function visibleIn(roomId, player) {
  return store.contents(roomId).filter(o => {
    if (o.kind === 'exit') return false
    if (player && o.id === player.id) return false
    if (o.kind === 'player' && !onlineCheck(o.id)) return false
    if (o.flags?.hidden) return false
    if (o.flags?.perPlayer && player && hasCopy(player, o)) return false
    return true
  })
}

export function hasCopy(player, seedItem) {
  return store.contents(player.id).some(i => i.flags?.copyOf === seedItem.id)
}

// Players present and awake (offline players are not shown; they are "asleep").
export function playersIn(roomId) {
  return store.contents(roomId).filter(o => o.kind === 'player' && onlineCheck(o.id))
}
let onlineCheck = () => true
export function setOnlineCheck(fn) { onlineCheck = fn }

// Exits usable by a player (seed exits may be gated on player flags).
export function exitsFor(room, player) {
  return store.exitsOf(room.id).filter(ex => exitVisible(ex, player))
}

export function exitVisible(ex, player) {
  if (ex.flags?.hidden) return false
  const needs = ex.props?.requiresFlag
  if (needs && !(player && playerFlag(player, needs))) return false
  return true
}

export function playerFlag(player, key) {
  return !!(player.props?.flags && player.props.flags[key])
}

export function setPlayerFlag(player, key, value = true) {
  player.props.flags = player.props.flags || {}
  player.props.flags[key] = value
  store.save(player)
}

// Candidate objects for resolving a reference typed by a player.
export function candidatesFor(player, { includeExits = true, includeRoom = true, includePlayers = true } = {}) {
  const room = roomOf(player)
  const out = [...store.contents(player.id)]
  const here = store.get(player.location)
  if (here && room && here.id !== room.id) {
    out.push(here)
    for (const o of store.contents(here.id)) if (o.id !== player.id && o.kind !== 'exit') out.push(o)
  }
  if (room) {
    for (const o of store.contents(room.id)) {
      if (o.id === player.id) continue
      if (o.kind === 'exit') { if (includeExits && exitVisible(o, player)) out.push(o); continue }
      if (o.kind === 'player' && !includePlayers) continue
      if (o.flags?.perPlayer && hasCopy(player, o)) continue
      out.push(o)
    }
    if (includeRoom) out.push(room)
  }
  return out
}

// Resolve a typed reference: "me", "here", "#12", "$thing", "my rock", names.
export function resolveRef(player, ref, opts = {}) {
  const raw = String(ref || '').trim().toLowerCase()
  if (!raw) return { obj: null, reason: 'empty' }
  if (raw === 'me' || raw === 'myself' || raw === 'self') return { obj: player }
  if (raw === 'here' || raw === 'room' || raw === 'this room') return { obj: roomOf(player) }
  if (raw.startsWith('#')) {
    const obj = store.get(raw)
    return obj ? { obj } : { obj: null, reason: 'noid' }
  }
  if (raw.startsWith('$')) {
    const obj = store.get('#' + raw.slice(1)) || store.get('#$' + raw.slice(1))
    return obj ? { obj } : { obj: null, reason: 'noid' }
  }
  let candidates
  if (raw.startsWith('my ')) {
    candidates = store.contents(player.id)
    ref = raw.slice(3)
  } else {
    candidates = candidatesFor(player, opts)
  }
  const { matches, best } = matchObjects(ref, candidates)
  if (best) return { obj: best }
  if (matches.length > 1) return { obj: null, reason: 'ambiguous', matches }
  // fall back: anything the player owns anywhere (builders referencing their stuff)
  if (opts.allowOwned !== false) {
    const owned = matchObjects(ref, store.ownedBy(player.id))
    if (owned.best) return { obj: owned.best }
    if (owned.matches.length > 1) return { obj: null, reason: 'ambiguous', matches: owned.matches }
  }
  return { obj: null, reason: 'none' }
}

// ---------- ownership / permissions ----------
export function isWizard(player) { return !!player?.flags?.wizard }
export function isProgrammer(player) { return !!(player?.flags?.programmer || player?.flags?.wizard) }

export function controls(player, obj) {
  if (!player || !obj) return false
  if (isWizard(player)) return true
  if (obj.owner === player.id) return true
  if (obj.id === player.id) return true
  return false
}

export function canWrite(player, obj) {
  return controls(player, obj) || !!obj.perms?.w
}

export function canRead(player, obj) {
  return controls(player, obj) || obj.perms?.r !== false
}

export function canFertilize(player, obj) {
  return controls(player, obj) || !!obj.perms?.f
}

// ---------- movement ----------
export function moveObject(obj, destId) {
  obj.location = destId
  store.save(obj)
}

// Clone a per-player seed item into a player's inventory.
export function cloneForPlayer(seedItem, player) {
  return store.create({
    kind: 'thing',
    name: seedItem.name,
    aliases: seedItem.aliases,
    parent: seedItem.id,
    owner: player.id,
    location: player.id,
    description: seedItem.description,
    props: { icon: seedItem.props?.icon, realLink: seedItem.props?.realLink, logbook: seedItem.props?.logbook },
    flags: { copyOf: seedItem.id, takeable: true },
    perms: { r: true, w: false, f: false },
  })
}

export function objectQuotaUsed(playerId) {
  let n = 0
  for (const o of store.all()) if (o.owner === playerId && !o.flags?.copyOf && o.kind !== 'player') n++
  return n
}

export function playerQuota(player) {
  if (isWizard(player)) return Infinity
  return player.props?.quota ?? 60
}
