// World actions shared by builtin commands, scripts and puzzles: describing
// rooms, moving players, inventory/map updates, taking and dropping.
import store from './store.js'
import {
  roomOf, visibleIn, playersIn, exitsFor, theName, article, hasCopy, cloneForPlayer,
  playerFlag, setPlayerFlag, displayName, controls,
} from './objects.js'
import { substitute } from './messages.js'
import { tellPlayer, announceRoom, sendTo, sessionsOf, isOnline } from './session.js'

// Hooks run after a player enters a room (the vault uses this).
const enterHooks = []
export function registerEnterHook(fn) { enterHooks.push(fn) }

const CARDINAL = ['north', 'south', 'east', 'west', 'up', 'down', 'northeast', 'northwest', 'southeast', 'southwest', 'in', 'out']

export function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s }

export function listNames(objs, fn = o => o.name) {
  const names = objs.map(fn)
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1]
}

// ---------- describing ----------
export function roomHeader(room) {
  return { name: room.name.toUpperCase(), asciiArt: store.prop(room, 'asciiArt') || [] }
}

export function exitLabel(ex) {
  const dir = ex.props?.direction || ex.name
  if (CARDINAL.includes(dir)) return capitalize(dir)
  const dest = store.get(ex.props?.dest)
  return dest ? dest.name : capitalize(ex.name)
}

export function describeRoom(player, room, { brief = false } = {}) {
  const lines = []
  if (!brief) lines.push(...store.describe(room))
  if (room.kind !== 'room') {
    const outer = roomOf(store.get(room.location))
    lines.push('', `You are inside ${theName(room)}${outer ? `, which is in ${outer.name}` : ''}. ("exit" climbs out.)`)
  }
  const things = visibleIn(room.id, player).filter(o => o.kind !== 'player')
  const seedItems = things.filter(o => o.flags?.perPlayer && !o.flags?.scenery)
  const otherThings = things.filter(o => !o.flags?.perPlayer && !o.flags?.scenery && !o.props?.requiresFlag)
  const gatedScenery = things.filter(o => o.props?.requiresFlag && playerFlag(player, o.props.requiresFlag) && o.props?.reveal)
  const extra = []
  for (const it of seedItems) extra.push(`You notice ${article(it)} here.`)
  for (const sc of gatedScenery) extra.push(sc.props.reveal)
  if (otherThings.length > 0) extra.push(`You see ${listNames(otherThings, article)} here.`)
  const people = playersIn(room.id).filter(p => p.id !== player.id)
  if (people.length > 0) extra.push(`${listNames(people)} ${people.length > 1 ? 'are' : 'is'} here.`)
  if (extra.length) { lines.push(''); lines.push(...extra) }
  const exits = exitsFor(room, player)
  if (exits.length > 0) {
    lines.push('')
    const labels = [...new Set(exits.map(exitLabel))]
    lines.push(`Exits: ${labels.join(', ')}`)
  } else if (room.id !== '#vault' && room.kind === 'room') {
    lines.push('', 'There are no obvious exits.')
  }
  return { header: roomHeader(room), lines }
}

export function showRoom(player, room, { transition = false, brief = false } = {}) {
  const { header, lines } = describeRoom(player, room, { brief })
  for (const s of sessionsOf(player.id)) {
    if (transition) s.send({ t: 'transition' })
    s.send({ t: 'room', header, id: room.id })
    s.out(lines, 'output', { typewriter: true })
    s.recent = []
    if (s.historyRoom !== room.id) { s.history = []; s.historyRoom = room.id }
  }
  sendMap(player)
}

// ---------- inventory / map ----------
export function inventoryItems(player) {
  return store.contents(player.id).map(o => ({ id: o.id, name: o.name, icon: store.prop(o, 'icon') || '', description: store.describe(o).join(' ') }))
}

export function sendInventory(player) {
  sendTo(player.id, { t: 'inventory', items: inventoryItems(player) })
}

export function visitedRooms(player) {
  return player.props.visited || []
}

export function markVisited(player, roomId) {
  const v = player.props.visited || []
  if (!v.includes(roomId)) { player.props.visited = [...v, roomId]; store.save(player) }
}

export function mapData(player) {
  const visited = new Set(visitedRooms(player))
  const current = player.location
  visited.add(current)
  const nodes = []
  const edges = []
  for (const id of visited) {
    const room = store.get(id)
    if (!room || room.kind !== 'room') continue
    if (room.props?.cluster === 'hidden' && id !== current) continue
    nodes.push({ id, name: room.name, cluster: room.props?.cluster || 'indoor', current: id === current, owner: room.owner })
    for (const ex of exitsFor(room, player)) {
      if (ex.props?.mapHidden) continue
      const dest = store.get(ex.props?.dest)
      if (!dest) continue
      const known = visited.has(dest.id)
      if (!known && dest.props?.cluster === 'hidden') continue
      edges.push({ from: id, to: dest.id, dir: ex.props?.direction || ex.name, known, toName: known ? dest.name : '???', toCluster: dest.props?.cluster || 'indoor' })
    }
  }
  return { nodes, edges, current }
}

export function sendMap(player) {
  sendTo(player.id, { t: 'map', map: mapData(player) })
}

// ---------- movement ----------
export function movePlayer(player, dest, { exit = null, quiet = false, transition = true, arriveMsg = null, leaveMsg = null } = {}) {
  const from = roomOf(player)
  const name = player.name
  if (from && !quiet) {
    const msg = leaveMsg || (exit && store.message(exit, 'oleave')) || (exit ? `${name} leaves ${exitVerbPhrase(exit)}.` : `${name} leaves.`)
    announceRoom(from.id, substitute(msg, { player, thing: exit }), { except: player, style: 'dim' })
  }
  player.location = dest.id
  store.save(player)
  markVisited(player, dest.id)
  if (!quiet) {
    const msg = arriveMsg || (exit && store.message(exit, 'oarrive')) || `${name} arrives.`
    announceRoom(dest.id, substitute(msg, { player, thing: exit }), { except: player, style: 'dim' })
  }
  showRoom(player, dest, { transition })
  for (const fn of enterHooks) { try { fn(player, dest, from) } catch (err) { console.error('[enter hook]', err) } }
  return dest
}

function exitVerbPhrase(exit) {
  const dir = exit.props?.direction || exit.name
  if (['up', 'down'].includes(dir)) return dir + 'ward'
  if (['in', 'out'].includes(dir)) return dir
  if (CARDINAL.includes(dir)) return dir
  const dest = store.get(exit.props?.dest)
  return dest ? `toward ${dest.name}` : `through ${exit.name}`
}

// Try to use an exit. Returns true if the player moved.
export function useExit(player, exit) {
  const dest = store.get(exit.props?.dest)
  if (!dest) { tellPlayer(player.id, 'That way leads nowhere. The exit is broken.', 'error'); return false }
  const lock = exit.props?.lock
  if (lock && !passesLock(player, lock)) {
    const msg = store.message(exit, 'nogo') || exit.props?.nogo || 'You can\'t go that way.'
    tellPlayer(player.id, substitute(msg, { player, thing: exit }), 'output')
    const onogo = store.message(exit, 'onogo')
    if (onogo) announceRoom(player.location, substitute(onogo, { player, thing: exit }), { except: player, style: 'dim' })
    return false
  }
  const leave = store.message(exit, 'leave')
  if (leave) tellPlayer(player.id, substitute(leave, { player, thing: exit }))
  movePlayer(player, dest, { exit })
  const arrive = store.message(exit, 'arrive')
  if (arrive) tellPlayer(player.id, substitute(arrive, { player, thing: exit }))
  return true
}

// Lock expressions: an object id or name the player must be or carry;
// "me" means the owner; "!x" negation; "a && b", "a || b".
export function passesLock(player, lock) {
  if (!lock) return true
  const expr = String(lock).trim()
  if (!expr) return true
  const or = expr.split('||')
  if (or.length > 1) return or.some(e => passesLock(player, e))
  const and = expr.split('&&')
  if (and.length > 1) return and.every(e => passesLock(player, e))
  let e = expr.trim()
  if (e.startsWith('!')) return !passesLock(player, e.slice(1))
  if (e.startsWith('(') && e.endsWith(')')) return passesLock(player, e.slice(1, -1))
  if (e === 'nobody' || e === 'none') return false
  if (e === 'anyone' || e === 'everyone') return true
  if (e === 'programmer') return !!(player.flags?.programmer || player.flags?.wizard)
  if (e.startsWith('flag:')) return playerFlag(player, e.slice(5))
  if (e.startsWith('#')) return player.id === e || store.contents(player.id).some(o => o.id === e || o.flags?.copyOf === e || o.parent === e)
  // a name: the player themself or something they carry
  const lower = e.toLowerCase()
  if (player.name.toLowerCase() === lower) return true
  return store.contents(player.id).some(o => [o.name, ...(o.aliases || [])].some(n => String(n).toLowerCase() === lower))
}

// ---------- taking / dropping ----------
export function takeObject(player, obj) {
  if (obj.kind === 'player') return { ok: false, msg: `${obj.name} would object to being picked up.` }
  if (obj.kind === 'room' || obj.kind === 'exit') return { ok: false, msg: 'That is part of the architecture.' }
  if (obj.flags?.perPlayer) {
    if (hasCopy(player, obj)) return { ok: false, msg: 'You already have that in your pack.' }
    const copy = cloneForPlayer(obj, player)
    sendInventory(player)
    return { ok: true, obj: copy, msg: store.prop(obj, 'takeText') || `You take ${theName(obj)}.` }
  }
  if (obj.flags?.scenery) return { ok: false, msg: `${capitalize(theName(obj))} is not something you can take.` }
  if (obj.flags?.fixture && !controls(player, obj)) return { ok: false, msg: `${capitalize(theName(obj))} is bolted to the bench. Make your own: @create ${'$' + obj.id.slice(1)} named "..."` }
  if (obj.location === player.id) return { ok: false, msg: 'You already have that.' }
  if (!obj.flags?.takeable && !controls(player, obj)) {
    return { ok: false, msg: `${capitalize(theName(obj))} stays where it is.` }
  }
  const lock = obj.props?.lock
  if (lock && !passesLock(player, lock)) {
    return { ok: false, msg: substitute(store.message(obj, 'take_failed') || `You can't pick up %t.`, { player, thing: obj }) }
  }
  obj.location = player.id
  store.save(obj)
  sendInventory(player)
  const msg = substitute(store.message(obj, 'take_succeeded') || `You take %t.`, { player, thing: obj })
  const omsg = substitute(store.message(obj, 'otake_succeeded') || `%N takes %t.`, { player, thing: obj })
  announceRoom(player.location, omsg, { except: player, style: 'dim' })
  return { ok: true, obj, msg }
}

export function dropObject(player, obj) {
  if (obj.location !== player.id) return { ok: false, msg: "You aren't carrying that." }
  const room = roomOf(player)
  if (!room) return { ok: false, msg: 'There is nowhere to drop it.' }
  if (obj.flags?.copyOf) {
    // Seed-item copies evaporate rather than littering shared rooms.
    store.remove(obj.id)
    sendInventory(player)
    return { ok: true, msg: `You set ${theName(obj)} down. It settles back into the place it came from, as such things do here.` }
  }
  obj.location = room.id
  store.save(obj)
  sendInventory(player)
  const msg = substitute(store.message(obj, 'drop_succeeded') || `You drop %t.`, { player, thing: obj })
  const omsg = substitute(store.message(obj, 'odrop_succeeded') || `%N drops %t.`, { player, thing: obj })
  announceRoom(room.id, omsg, { except: player, style: 'dim' })
  return { ok: true, msg }
}

export { playerFlag, setPlayerFlag, theName, article, displayName }
