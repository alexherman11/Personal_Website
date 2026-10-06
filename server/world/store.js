// The world store: every room, thing, exit and player is an object record kept
// in memory and persisted with an append-only journal plus periodic snapshots
// (the same shape as Agora4's event journal, and the same spirit as a MOO
// checkpoint). No native dependencies: plain JSON files under server/data/world.
//
// Object record shape:
// {
//   id: '#12' | '#grand_hall',  kind: 'room'|'thing'|'exit'|'player'|'generic',
//   name, aliases: [], parent: '#thing'|null, owner: '#player'|null,
//   location: '#room'|'#player'|null,
//   description: string | string[],
//   props: {}, verbs: { name: { names:[], args:[dobj,prep,iobj], code, owner, perms } },
//   messages: {}, perms: { r, w, f }, flags: {}, created, updated
// }

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.WORLD_DATA_DIR || path.join(__dirname, '..', 'data', 'world')
const SNAPSHOT = path.join(DATA_DIR, 'snapshot.json')
const JOURNAL = path.join(DATA_DIR, 'journal.jsonl')

export class WorldStore {
  constructor() {
    this.objects = new Map()
    this.meta = { nextId: 1, tasks: [], mail: [] }
    this.dirty = false
    this.journalLines = 0
    this.listeners = new Set()
  }

  // ---------- persistence ----------
  load() {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    if (fs.existsSync(SNAPSHOT)) {
      try {
        const snap = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'))
        for (const obj of snap.objects || []) this.objects.set(obj.id, obj)
        this.meta = { ...this.meta, ...(snap.meta || {}) }
      } catch (err) {
        console.error('[world] snapshot unreadable, starting from journal only:', err.message)
      }
    }
    if (fs.existsSync(JOURNAL)) {
      const raw = fs.readFileSync(JOURNAL, 'utf8')
      for (const line of raw.split('\n')) {
        const t = line.trim()
        if (!t) continue
        try { this.applyEntry(JSON.parse(t)) } catch { /* partial last line */ }
        this.journalLines++
      }
    }
    // Compact on boot: fresh snapshot, empty journal.
    this.snapshot()
    return this
  }

  applyEntry(entry) {
    if (entry.op === 'put') this.objects.set(entry.obj.id, entry.obj)
    else if (entry.op === 'del') this.objects.delete(entry.id)
    else if (entry.op === 'meta') this.meta = { ...this.meta, ...entry.meta }
  }

  journal(entry) {
    try {
      fs.appendFileSync(JOURNAL, JSON.stringify(entry) + '\n', 'utf8')
      this.journalLines++
      if (this.journalLines > 5000) this.snapshot()
    } catch (err) {
      console.error('[world] journal write failed:', err.message)
    }
  }

  snapshot() {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    const tmp = SNAPSHOT + '.tmp'
    const data = { savedAt: new Date().toISOString(), meta: this.meta, objects: [...this.objects.values()] }
    fs.writeFileSync(tmp, JSON.stringify(data), 'utf8')
    fs.renameSync(tmp, SNAPSHOT)
    fs.writeFileSync(JOURNAL, '', 'utf8')
    this.journalLines = 0
    this.dirty = false
  }

  startAutosave(ms = 5 * 60 * 1000) {
    this.autosave = setInterval(() => { if (this.dirty) this.snapshot() }, ms)
    const stop = () => { try { this.snapshot() } catch {} process.exit(0) }
    process.on('SIGTERM', stop)
    process.on('SIGINT', stop)
  }

  // ---------- object access ----------
  get(id) {
    if (!id) return null
    return this.objects.get(id) || null
  }

  has(id) { return this.objects.has(id) }

  all() { return this.objects.values() }

  allocId() {
    let id
    do { id = '#' + this.meta.nextId++ } while (this.objects.has(id))
    this.journal({ op: 'meta', meta: { nextId: this.meta.nextId } })
    return id
  }

  // Create a new object. `spec.id` may be given for seed objects.
  create(spec) {
    const id = spec.id || this.allocId()
    const now = Date.now()
    const obj = {
      id,
      kind: spec.kind || 'thing',
      name: spec.name || 'thing',
      aliases: spec.aliases || [],
      parent: spec.parent ?? null,
      owner: spec.owner ?? null,
      location: spec.location ?? null,
      description: spec.description ?? '',
      props: spec.props || {},
      verbs: spec.verbs || {},
      messages: spec.messages || {},
      perms: { r: true, w: false, f: false, ...(spec.perms || {}) },
      flags: spec.flags || {},
      created: spec.created || now,
      updated: now,
    }
    this.objects.set(id, obj)
    this.journal({ op: 'put', obj })
    this.dirty = true
    this.emit('create', obj)
    return obj
  }

  // Persist an object after in-place mutation.
  save(obj) {
    obj.updated = Date.now()
    this.objects.set(obj.id, obj)
    this.journal({ op: 'put', obj })
    this.dirty = true
    this.emit('update', obj)
    return obj
  }

  remove(id) {
    const obj = this.objects.get(id)
    if (!obj) return false
    this.objects.delete(id)
    this.journal({ op: 'del', id })
    this.dirty = true
    this.emit('delete', obj)
    return true
  }

  setMeta(patch) {
    this.meta = { ...this.meta, ...patch }
    this.journal({ op: 'meta', meta: patch })
    this.dirty = true
  }

  // ---------- queries ----------
  contents(locationId) {
    const out = []
    for (const obj of this.objects.values()) {
      if (obj.location === locationId) out.push(obj)
    }
    return out
  }

  ownedBy(ownerId) {
    const out = []
    for (const obj of this.objects.values()) if (obj.owner === ownerId) out.push(obj)
    return out
  }

  exitsOf(roomId) {
    return this.contents(roomId).filter(o => o.kind === 'exit')
  }

  // Ancestor chain (nearest first), guarding against cycles.
  ancestors(obj) {
    const out = []
    let cur = obj?.parent ? this.get(obj.parent) : null
    const seen = new Set()
    while (cur && !seen.has(cur.id)) {
      out.push(cur)
      seen.add(cur.id)
      cur = cur.parent ? this.get(cur.parent) : null
    }
    return out
  }

  isDescendantOf(obj, ancestorId) {
    return this.ancestors(obj).some(a => a.id === ancestorId)
  }

  // Property lookup with inheritance.
  prop(obj, key) {
    if (!obj) return undefined
    if (obj.props && key in obj.props) return obj.props[key]
    for (const a of this.ancestors(obj)) {
      if (a.props && key in a.props) return a.props[key]
    }
    return undefined
  }

  // Message lookup with inheritance.
  message(obj, key) {
    if (!obj) return undefined
    if (obj.messages && key in obj.messages) return obj.messages[key]
    for (const a of this.ancestors(obj)) {
      if (a.messages && key in a.messages) return a.messages[key]
    }
    return undefined
  }

  // Verb lookup with inheritance: returns { verb, holder } for the first
  // ancestor (or the object itself) defining a verb matching `name`.
  findVerb(obj, name) {
    const chain = [obj, ...this.ancestors(obj)]
    for (const holder of chain) {
      for (const [vname, verb] of Object.entries(holder.verbs || {})) {
        const names = verb.names && verb.names.length ? verb.names : [vname]
        if (names.some(n => verbNameMatches(n, name))) return { verb: { ...verb, key: vname }, holder, defined: holder }
      }
    }
    return null
  }

  // All verbs visible on an object (own + inherited), deduplicated by key.
  allVerbs(obj) {
    const seen = new Map()
    for (const holder of [obj, ...this.ancestors(obj)]) {
      for (const [vname, verb] of Object.entries(holder.verbs || {})) {
        if (!seen.has(vname)) seen.set(vname, { ...verb, key: vname, holder })
      }
    }
    return [...seen.values()]
  }

  describe(obj) {
    const d = obj.description
    if (Array.isArray(d)) return d
    if (!d) return []
    return String(d).split('\n')
  }

  // ---------- events ----------
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn) }
  emit(type, obj) { for (const fn of this.listeners) { try { fn(type, obj) } catch {} } }
}

// MOO-style verb name matching: "pu*sh" matches "pu", "pus", "push"; "*" is
// a wildcard; plain names must match exactly.
export function verbNameMatches(pattern, name) {
  pattern = pattern.toLowerCase(); name = name.toLowerCase()
  if (pattern === '*') return true
  const star = pattern.indexOf('*')
  if (star === -1) return pattern === name
  const head = pattern.slice(0, star)
  const full = pattern.replace('*', '')
  if (star === pattern.length - 1) return name.startsWith(head)
  return name.length >= head.length && full.startsWith(name) && name.startsWith(head)
}

export const store = new WorldStore()
export default store
