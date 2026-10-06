// Sandboxed scripting for player-written verbs.
//
// Verbs are JavaScript, run inside QuickJS (WASM): no access to Node, the
// network or the file system; a CPU deadline; a memory cap. Scripts see the
// world through object proxies (`this`, `player`, `here`, `dobj`, `iobj`) whose
// reads come from the store and whose writes are buffered in a transaction.
// If the script finishes cleanly the transaction commits atomically; if it
// throws, nothing changes (Agora4's "proposed changes" model, MOO's feel).
import { newQuickJSWASMModuleFromVariant } from 'quickjs-emscripten-core'
import variant from '@jitl/quickjs-wasmfile-release-sync'
import store from '../store.js'
import { roomOf, playersIn, controls, canWrite, canRead, resolveRef, matchObjects, theName, article, objectQuotaUsed, playerQuota, isWizard, candidatesFor, exitsFor } from '../objects.js'
import { substitute } from '../messages.js'
import { tellPlayer, announceRoom, sessionsOf, isOnline } from '../session.js'
import { movePlayer, sendInventory, showRoom, passesLock } from '../actions.js'
import { scheduleTask, killTasksFor } from '../scheduler.js'
import { PRELUDE } from './prelude.js'

export const LIMITS = {
  cpuMs: 80, memoryBytes: 24 * 1024 * 1024, codeBytes: 8000, verbsPerObject: 30,
  maxEffects: 300, maxTells: 80, maxDepth: 5, maxCreates: 5, propBytes: 4000, propsPerObject: 120,
  maxForks: 10, maxAnnounces: 40,
}

const PROTECTED_PROPS = new Set(['tokens', 'passwordHash', 'flags', 'phase', 'registered', 'quota', 'dest', 'requiresFlag', 'seedKey', 'logbooks', 'mail', 'visited', 'lastSeen', 'home', 'passwordSource', 'programmerSince'])
const PLAYER_READABLE = new Set(['gender', 'description'])

let QuickJS = null
export async function initSandbox() {
  if (!QuickJS) QuickJS = await newQuickJSWASMModuleFromVariant(variant)
  return QuickJS
}

// ---------- compile check ----------
export async function compileCheck(code) {
  await initSandbox()
  const rt = QuickJS.newRuntime()
  const vm = rt.newContext()
  try {
    const r = vm.evalCode(`(function(args, argstr, dobj, iobj, caller){\n${code}\n})`, 'verb.js')
    if (r.error) {
      const e = vm.dump(r.error); r.error.dispose()
      return { ok: false, error: formatError(e) }
    }
    r.value.dispose()
    return { ok: true }
  } finally { vm.dispose(); rt.dispose() }
}

function formatError(e) {
  if (!e) return 'unknown error'
  if (typeof e === 'string') return e
  let msg = `${e.name || 'Error'}: ${e.message || ''}`.trim()
  const m = String(e.stack || '').match(/verb\.js:(\d+)/)
  if (m) msg += ` (line ${Math.max(1, Number(m[1]) - 1)})`
  return msg
}

// ---------- transaction ----------
class Tx {
  constructor(ctx) {
    this.ctx = ctx
    this.writes = new Map()    // id -> { props:{}, fields:{} }
    this.creates = []          // objects created (already in store? no: deferred)
    this.created = new Map()   // temp id -> spec
    this.moves = []            // { id, dest }
    this.removes = new Set()
    this.tells = []            // { to, text }
    this.announces = []        // { roomId, text, except }
    this.outbox = []           // tells and announces in the order they were made
    this.forks = []
    this.cancels = []
    this.effects = 0
    this.tempSeq = 0
  }
  effect() { if (++this.effects > LIMITS.maxEffects) throw new Error(`too many effects in one verb (max ${LIMITS.maxEffects})`) }
}

// Who the script acts as (the verb's owner), for permission checks.
function actor(ctx) {
  return store.get(ctx.verbDef?.owner) || store.get(ctx.thisObj?.owner) || ctx.player
}

function safeValue(v) {
  const s = JSON.stringify(v === undefined ? null : v)
  if (s.length > LIMITS.propBytes) throw new Error(`value too large (max ${LIMITS.propBytes} characters)`)
  return JSON.parse(s)
}

// Live view of an object with pending writes overlaid.
function view(tx, id) {
  if (tx.created.has(id)) return tx.created.get(id)
  const obj = store.get(id)
  if (!obj || tx.removes.has(id)) return null
  const w = tx.writes.get(id)
  if (!w) return obj
  return { ...obj, ...w.fields, props: { ...obj.props, ...w.props } }
}

function propOf(tx, obj, key) {
  const w = tx.writes.get(obj.id)
  if (w && key in w.props) return w.props[key]
  return store.prop(obj, key)
}

function locationOf(tx, id) {
  const mv = [...tx.moves].reverse().find(m => m.id === id)
  if (mv) return mv.dest
  return view(tx, id)?.location ?? null
}

function contentsOf(tx, id) {
  const out = []
  for (const o of store.all()) if (!tx.removes.has(o.id) && locationOf(tx, o.id) === id) out.push(o.id)
  for (const [tid, spec] of tx.created) if (locationOf(tx, tid) === id) out.push(tid)
  return out
}

// ---------- host operations ----------
function hostOps(tx) {
  const ctx = tx.ctx
  const me = actor(ctx)
  const player = ctx.player
  const refOut = id => ({ ref: id })

  function requireObj(id, what = 'object') {
    const o = view(tx, id)
    if (!o) throw new Error(`no such ${what}: ${id}`)
    return o
  }
  function requireWrite(o) {
    if (o.kind === 'player' && o.id !== me.id) throw new Error(`you can't change ${o.name}; use tell(${o.name}, ...) to talk to them`)
    if (!(controls(me, o) || o.perms?.w)) throw new Error(`${o.name} (${o.id}) is not yours to change`)
  }

  return {
    get({ id, key }) {
      const o = requireObj(id)
      switch (key) {
        case 'name': return { value: o.name }
        case 'aliases': return { value: o.aliases || [] }
        case 'description': return { value: store.describe(o).join('\n') }
        case 'kind': return { value: o.kind }
        case 'id': return { value: o.id }
        case 'owner': return o.owner ? refOut(o.owner) : { value: null }
        case 'parent': return o.parent ? refOut(o.parent) : { value: null }
        case 'location': { const l = locationOf(tx, o.id); return l ? refOut(l) : { value: null } }
        case 'contents': return { refs: contentsOf(tx, o.id).filter(cid => view(tx, cid)?.kind !== 'exit') }
        case 'players': return { refs: contentsOf(tx, o.id).filter(cid => view(tx, cid)?.kind === 'player') }
        case 'exits': return { value: store.exitsOf(o.id).map(e => ({ name: e.name, direction: e.props?.direction, dest: e.props?.dest, id: e.id })) }
        case 'isPlayer': return { value: o.kind === 'player' }
        case 'isRoom': return { value: o.kind === 'room' }
        case 'programmer': return { value: !!(o.flags?.programmer || o.flags?.wizard) }
        case 'online': return { value: o.kind === 'player' ? isOnline(o.id) : false }
        default: {
          if (o.kind === 'player' && !PLAYER_READABLE.has(key) && !controls(me, o)) return { value: undefined }
          if (PROTECTED_PROPS.has(key)) return { value: undefined }
          if (!canRead(me, o)) return { value: undefined }
          const v = propOf(tx, o, key)
          return { value: v === undefined ? undefined : v }
        }
      }
    },
    has({ id, key }) {
      const o = requireObj(id)
      return { value: propOf(tx, o, key) !== undefined }
    },
    set({ id, key, value }) {
      const o = requireObj(id)
      requireWrite(o)
      tx.effect()
      const w = tx.writes.get(id) || { props: {}, fields: {} }
      if (key === 'name') {
        const n = String(value).slice(0, 60).trim(); if (!n) throw new Error('name cannot be empty')
        if (o.kind === 'player') throw new Error('players rename themselves with @name')
        w.fields.name = n
      } else if (key === 'description') {
        w.fields.description = Array.isArray(value) ? value.map(String).slice(0, 40) : String(value).slice(0, 4000)
      } else if (key === 'aliases') {
        if (!Array.isArray(value)) throw new Error('aliases must be an array of strings')
        w.fields.aliases = value.map(v => String(v).toLowerCase().slice(0, 40)).slice(0, 20)
      } else if (['location', 'owner', 'parent', 'kind', 'id', 'contents', 'exits', 'players'].includes(key)) {
        throw new Error(`"${key}" can't be assigned; use move(thing, place) for location`)
      } else {
        if (PROTECTED_PROPS.has(key)) throw new Error(`"${key}" is managed by the house`)
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) throw new Error(`"${key}" is not a valid property name`)
        const count = Object.keys({ ...o.props, ...w.props }).length
        if (count >= LIMITS.propsPerObject && !(key in o.props)) throw new Error(`${o.name} has too many properties`)
        w.props[key] = safeValue(value)
      }
      tx.writes.set(id, w)
      return { value: true }
    },
    tell({ to, text }) {
      const o = requireObj(to)
      if (o.kind !== 'player') return { value: false }
      tx.effect()
      if (tx.tells.length >= LIMITS.maxTells) throw new Error('too many tells in one verb')
      const t = { to: o.id, text: String(text).slice(0, 2000) }
      tx.tells.push(t); tx.outbox.push({ kind: 'tell', ...t })
      return { value: true }
    },
    announce({ roomId, text, except, all }) {
      let rid = roomId
      if (!rid) { const r = roomOf(view(tx, ctx.thisObj.id) || ctx.thisObj) || ctx.room; rid = r?.id }
      if (!rid) return { value: false }
      const room = requireObj(rid, 'room')
      if (room.kind !== 'room') {
        // announce inside a container/vehicle: to players inside it
        const a = { roomId: room.id, text: String(text).slice(0, 2000), except: all ? [] : [...(except || []), player.id] }
        tx.announces.push(a); tx.outbox.push({ kind: 'announce', ...a })
        return { value: true }
      }
      tx.effect()
      if (tx.announces.length >= LIMITS.maxAnnounces) throw new Error('too many announces in one verb')
      const a = { roomId: rid, text: String(text).slice(0, 2000), except: all ? (except || []) : [...(except || []), player.id] }
      tx.announces.push(a); tx.outbox.push({ kind: 'announce', ...a })
      return { value: true }
    },
    move({ id, dest }) {
      const o = requireObj(id)
      const d = requireObj(dest, 'destination')
      tx.effect()
      if (o.kind === 'room' || o.kind === 'exit') throw new Error('rooms and exits cannot be moved')
      if (d.kind === 'exit') throw new Error('nothing can be moved into an exit')
      if (o.kind === 'player') {
        if (d.kind !== 'room' && !propOf(tx, d, 'enterable')) throw new Error('players can only be moved into rooms (or enterable things)')
        const triggered = o.id === player.id && !ctx.scheduled
        const hereRoom = roomOf(o)
        const ownsHere = hereRoom && controls(me, hereRoom)
        if (!(triggered || ownsHere || isWizard(me))) throw new Error(`you can't move ${o.name} from here`)
        if (d.props?.private && !controls(me, d) && d.id !== o.props?.home) throw new Error(`${d.name} is private`)
        if (d.props?.cluster === 'hidden' && !isWizard(me)) throw new Error('that place cannot be reached by script')
        if (o.props?.phase !== 'playing' && !isWizard(me)) throw new Error(`${o.name} has not come inside yet`)
      } else {
        if (!(controls(me, o) || o.perms?.w || (o.flags?.takeable && locationOf(tx, o.id) === ctx.room?.id))) throw new Error(`${o.name} is not yours to move`)
        if (d.kind === 'player' && d.id !== player.id && !controls(me, d)) throw new Error(`you can't put things in ${d.name}'s pack`)
        if (d.kind === 'room' && !(controls(me, d) || d.perms?.w || d.id === ctx.room?.id || d.props?.publicDig)) throw new Error(`${d.name} does not accept objects from scripts`)
        if (o.flags?.copyOf && d.kind !== 'player') throw new Error('that belongs to its finder and will not be moved')
      }
      // cycle check
      let cur = d.id; const seen = new Set()
      while (cur && !seen.has(cur)) { if (cur === o.id) throw new Error('that would put a thing inside itself'); seen.add(cur); cur = locationOf(tx, cur) }
      tx.moves.push({ id: o.id, dest: d.id })
      return { value: true }
    },
    create({ name, parent, description, aliases, where }) {
      tx.effect()
      if (tx.created.size >= LIMITS.maxCreates) throw new Error(`a verb may create at most ${LIMITS.maxCreates} things`)
      const n = String(name || '').trim().slice(0, 60); if (!n) throw new Error('create() needs a name')
      const used = objectQuotaUsed(me.id) + tx.created.size
      if (used >= playerQuota(me)) throw new Error(`quota exhausted (${used}/${playerQuota(me)}): recycle something first`)
      let p = store.get('#thing')
      if (parent) { p = view(tx, parent); if (!p) throw new Error(`no such parent ${parent}`); if (!(controls(me, p) || p.perms?.f)) throw new Error(`${p.name} is not fertile`) }
      if (p.kind === 'room') throw new Error('create rooms with @dig, not create()')
      const tid = `#tmp${++tx.tempSeq}`
      let loc = where || ctx.thisObj.id
      const spec = {
        id: tid, kind: 'thing', name: n, aliases: (aliases || []).map(String).slice(0, 10), parent: p.id, owner: me.id,
        location: loc, description: String(description || '').slice(0, 2000), props: {}, verbs: {}, messages: {}, perms: { r: true, w: false, f: false }, flags: { takeable: true, scripted: true },
      }
      tx.created.set(tid, spec)
      return refOut(tid)
    },
    recycle({ id }) {
      const o = requireObj(id)
      tx.effect()
      if (!controls(me, o)) throw new Error(`${o.name} is not yours to recycle`)
      if (o.kind === 'player' || o.kind === 'room' || o.flags?.seed) throw new Error('that cannot be recycled by script')
      if (tx.created.has(id)) tx.created.delete(id); else tx.removes.add(id)
      return { value: true }
    },
    find({ name, where }) {
      const scope = where ? contentsOf(tx, where).map(id => view(tx, id)).filter(Boolean) : candidatesFor(player, { includeExits: false, includeRoom: false })
      const { best, matches } = matchObjects(name, scope)
      const hit = best || matches[0]
      return hit ? refOut(hit.id) : { value: null }
    },
    fork({ seconds, verb, args, every }) {
      tx.effect()
      if (tx.forks.length >= LIMITS.maxForks) throw new Error('too many forks in one verb')
      if (!verb || typeof verb !== 'string') throw new Error('fork(seconds, "verbname", ...args): the verb name must be a string')
      tx.forks.push({ seconds: Number(seconds) || 1, verb, args: args || [], every: every ? Number(seconds) : null })
      return { value: true }
    },
    cancel({ verb }) { tx.cancels.push(verb || null); return { value: true } },
    sub({ text, thing }) {
      return { value: substitute(String(text), { player, thing: thing ? view(tx, thing) : view(tx, ctx.thisObj.id), dobj: ctx.dobj, iobj: ctx.iobj }) }
    },
    room({ id }) { const o = requireObj(id); const r = roomOf(o); return r ? refOut(r.id) : { value: null } },
    code({ id, verb }) {
      const o = requireObj(id)
      const found = store.findVerb(o, verb)
      if (!found || !found.verb.code) throw new Error(`${o.name} has no verb "${verb}"`)
      if (!(found.verb.perms?.x !== false || controls(me, o))) throw new Error(`${o.name}:${verb} is not callable`)
      return { value: { code: found.verb.code, thisId: o.id } }
    },
    locked({ id }) { const o = requireObj(id); return { value: !!o.props?.lock && !passesLock(player, o.props.lock) } },
    log({ text }) { const t = { to: me.id, text: `[${ctx.thisObj.name}:${ctx.verb}] ${String(text).slice(0, 500)}`, debug: true }; tx.tells.push(t); tx.outbox.push({ kind: 'tell', ...t }); return { value: true } },
  }
}

// ---------- commit ----------
function commit(tx) {
  const ctx = tx.ctx
  const me = actor(ctx)
  const idMap = new Map()
  // creates
  for (const [tid, spec] of tx.created) {
    const { id: _ignored, ...rest } = spec
    const obj = store.create(rest)
    idMap.set(tid, obj.id)
  }
  const real = id => idMap.get(id) || id
  // fix locations of created objects that point at temp ids
  for (const [tid, spec] of tx.created) {
    const obj = store.get(real(tid))
    if (obj && idMap.has(spec.location)) { obj.location = idMap.get(spec.location); store.save(obj) }
  }
  // writes
  for (const [id, w] of tx.writes) {
    const obj = store.get(real(id)); if (!obj) continue
    Object.assign(obj, w.fields)
    obj.props = { ...obj.props, ...w.props }
    store.save(obj)
  }
  // moves (in order)
  const movedPlayers = []
  for (const mv of tx.moves) {
    const obj = store.get(real(mv.id)); const dest = store.get(real(mv.dest))
    if (!obj || !dest) continue
    if (obj.kind === 'player') {
      if (obj.location === dest.id) continue
      movePlayer(obj, dest, { leaveMsg: `%N ${obj.id === ctx.player.id ? 'is whisked away' : 'is whisked away'}.`, arriveMsg: '%N arrives.' })
      movedPlayers.push(obj.id)
    } else {
      const before = obj.location
      obj.location = dest.id; store.save(obj)
      for (const pid of [before, dest.id]) { const p = store.get(pid); if (p?.kind === 'player') sendInventory(p) }
    }
  }
  // removes
  for (const id of tx.removes) {
    const obj = store.get(id); if (!obj) continue
    for (const inner of store.contents(id)) { inner.location = obj.location; store.save(inner) }
    killTasksFor(id)
    store.remove(id)
  }
  // messages, in the order the script produced them
  for (const m of tx.outbox) {
    if (m.kind === 'tell') tellPlayer(m.to, m.text, m.debug ? 'dim' : 'output')
    else announceRoom(real(m.roomId), m.text, { except: m.except, style: 'output' })
  }
  // tasks
  for (const verb of tx.cancels) {
    const tasks = (store.meta.tasks || []).filter(t => !(t.obj === ctx.thisObj.id && (!verb || t.verb === verb)))
    store.setMeta({ tasks })
  }
  for (const f of tx.forks) {
    scheduleTask({ owner: me.id, player: ctx.player.id, obj: ctx.thisObj.id, verb: f.verb, args: f.args, delay: f.seconds, every: f.every })
  }
  return idMap
}

function dryReport(tx) {
  const lines = ['-- dry run: nothing was changed --']
  for (const t of tx.tells) lines.push(`tell ${store.get(t.to)?.name || t.to}: ${t.text}`)
  for (const a of tx.announces) lines.push(`announce in ${store.get(a.roomId)?.name || a.roomId}: ${a.text}`)
  for (const [id, w] of tx.writes) for (const [k, v] of Object.entries({ ...w.fields, ...w.props })) lines.push(`set ${store.get(id)?.name || id}.${k} = ${JSON.stringify(v)}`)
  for (const m of tx.moves) lines.push(`move ${store.get(m.id)?.name || m.id} -> ${store.get(m.dest)?.name || m.dest}`)
  for (const [tid, s] of tx.created) lines.push(`create "${s.name}" (${tid})`)
  for (const id of tx.removes) lines.push(`recycle ${store.get(id)?.name || id}`)
  for (const f of tx.forks) lines.push(`fork ${f.verb} in ${f.seconds}s${f.every ? ' (repeating)' : ''}`)
  if (lines.length === 1) lines.push('(no effects)')
  return lines
}

// ---------- running ----------
export async function runVerb(ctx) {
  await initSandbox()
  const { thisObj, verbDef, player } = ctx
  const code = verbDef.code
  if (!code) return false
  const tx = new Tx(ctx)
  const ops = hostOps(tx)
  const rt = QuickJS.newRuntime()
  rt.setMemoryLimit(LIMITS.memoryBytes)
  rt.setMaxStackSize(512 * 1024)
  const deadline = Date.now() + LIMITS.cpuMs
  rt.setInterruptHandler(() => Date.now() > deadline)
  const vm = rt.newContext()
  let result = { ok: true, returned: undefined }
  try {
    const host = vm.newFunction('__host', (opH, argH) => {
      const op = vm.dump(opH); const arg = JSON.parse(vm.dump(argH) || '{}')
      let out
      try {
        const fn = ops[op]
        if (!fn) throw new Error(`unknown host op ${op}`)
        out = fn(arg)
      } catch (err) { out = { error: err.message } }
      return vm.newString(JSON.stringify(out ?? {}))
    })
    vm.setProp(vm.global, '__host', host); host.dispose()
    const env = {
      thisId: thisObj.id, playerId: player.id, hereId: (ctx.room || roomOf(thisObj) || roomOf(player))?.id || null,
      dobjId: ctx.dobj?.id || null, iobjId: ctx.iobj?.id || null,
      args: ctx.args || [], argstr: ctx.argstr || '', dobjstr: ctx.dobjstr || '', prepstr: ctx.prepstr || '', iobjstr: ctx.iobjstr || '',
      verb: ctx.verb || verbDef.key, scheduled: !!ctx.scheduled, maxDepth: LIMITS.maxDepth,
    }
    const envH = vm.newString(JSON.stringify(env)); vm.setProp(vm.global, '__env', envH); envH.dispose()
    const pre = vm.evalCode(PRELUDE, 'prelude.js')
    if (pre.error) { const e = vm.dump(pre.error); pre.error.dispose(); throw new Error('prelude failed: ' + formatError(e)) }
    pre.value.dispose()
    const mainR = vm.evalCode(`(function(args, argstr, dobj, iobj, caller){\n${code}\n})`, 'verb.js')
    if (mainR.error) { const e = vm.dump(mainR.error); mainR.error.dispose(); throw new Error(formatError(e)) }
    vm.setProp(vm.global, '__main', mainR.value); mainR.value.dispose()
    const r = vm.evalCode(`__runMain()`, 'run.js')
    if (r.error) {
      const e = vm.dump(r.error); r.error.dispose()
      result = { ok: false, error: formatError(e) }
    } else {
      result.returned = vm.dump(r.value); r.value.dispose()
    }
  } catch (err) {
    result = { ok: false, error: err.message }
  } finally {
    vm.dispose(); rt.dispose()
  }

  if (ctx.dryRun) {
    const rep = dryReport(tx)
    if (!result.ok) rep.push(`ERROR: ${result.error}`)
    return { report: rep }
  }
  if (!result.ok) {
    reportCrash(ctx, result.error)
    return true // handled (crashed), don't fall through to narrator
  }
  try { commit(tx) } catch (err) {
    console.error('[sandbox commit]', err)
    reportCrash(ctx, 'commit failed: ' + err.message)
    return true
  }
  if (result.returned === false) return false
  return true
}

function reportCrash(ctx, error) {
  const { thisObj, verbDef, player } = ctx
  const ownerId = verbDef.owner || thisObj.owner
  const msg = `Verb ${thisObj.name}:${verbDef.key} crashed — ${error}`
  if (player && player.id === ownerId) tellPlayer(player.id, msg, 'error')
  else {
    if (player && !ctx.scheduled) tellPlayer(player.id, `${theName(thisObj)[0].toUpperCase()}${theName(thisObj).slice(1)} sputters and does nothing. (Its builder has been told.)`, 'error')
    if (ownerId && isOnline(ownerId)) tellPlayer(ownerId, msg + (player ? ` [triggered by ${player.name}]` : ''), 'error')
  }
}

export async function evalSnippet(ctx, code) {
  const wrapped = /^\s*(let|const|var|if|for|while|try|function|return|\{)/.test(code) || code.includes(';') ? code : `return (${code})`
  const verbDef = { key: 'eval', names: ['eval'], args: ['any', 'any', 'any'], code: wrapped, owner: ctx.player.id }
  const tx = { lastReturn: undefined }
  await initSandbox()
  // Run through runVerb with a capture of the return value via a special host op: simpler to inline a small runner.
  const res = await runVerbCapture({ ...ctx, thisObj: ctx.player, verbDef, verbHolder: ctx.player, dobj: null, iobj: null, args: [], argstr: '', verb: 'eval' })
  return res
}

async function runVerbCapture(ctx) {
  // Same as runVerb but returns a printable result.
  const { thisObj, verbDef, player } = ctx
  const tx = new Tx(ctx)
  const ops = hostOps(tx)
  const rt = QuickJS.newRuntime()
  rt.setMemoryLimit(LIMITS.memoryBytes)
  const deadline = Date.now() + LIMITS.cpuMs
  rt.setInterruptHandler(() => Date.now() > deadline)
  const vm = rt.newContext()
  let out
  try {
    const host = vm.newFunction('__host', (opH, argH) => {
      const op = vm.dump(opH); const arg = JSON.parse(vm.dump(argH) || '{}')
      let o; try { const fn = ops[op]; if (!fn) throw new Error(`unknown host op ${op}`); o = fn(arg) } catch (err) { o = { error: err.message } }
      return vm.newString(JSON.stringify(o ?? {}))
    })
    vm.setProp(vm.global, '__host', host); host.dispose()
    const env = { thisId: thisObj.id, playerId: player.id, hereId: ctx.room?.id || null, dobjId: null, iobjId: null, args: [], argstr: '', dobjstr: '', prepstr: '', iobjstr: '', verb: 'eval', scheduled: false, maxDepth: LIMITS.maxDepth }
    const envH = vm.newString(JSON.stringify(env)); vm.setProp(vm.global, '__env', envH); envH.dispose()
    const pre = vm.evalCode(PRELUDE, 'prelude.js'); if (pre.error) { pre.error.dispose(); throw new Error('prelude failed') } pre.value.dispose()
    const mainR = vm.evalCode(`(function(args, argstr, dobj, iobj, caller){\n${verbDef.code}\n})`, 'verb.js')
    if (mainR.error) { const e = vm.dump(mainR.error); mainR.error.dispose(); throw new Error(formatError(e)) }
    vm.setProp(vm.global, '__main', mainR.value); mainR.value.dispose()
    const r = vm.evalCode(`__show(__runMain())`, 'run.js')
    if (r.error) { const e = vm.dump(r.error); r.error.dispose(); out = `Error: ${formatError(e)}` }
    else { out = vm.dump(r.value); r.value.dispose(); commit(tx) }
  } catch (err) { out = `Error: ${err.message}` } finally { vm.dispose(); rt.dispose() }
  return `=> ${typeof out === 'string' ? out : JSON.stringify(out)}`
}
