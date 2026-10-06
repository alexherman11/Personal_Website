// Building: rooms, things, exits, descriptions, locks, messages, properties.
// Every refusal names the fix (Agora4's self-teaching refusals).
import store from '../store.js'
import { registerCommand } from '../registry.js'
import {
  roomOf, resolveRef, controls, canWrite, canFertilize, isWizard, isProgrammer, theName, article,
  objectQuotaUsed, playerQuota, WIZARD_ID,
} from '../objects.js'
import { showRoom, movePlayer, sendInventory, sendMap, exitLabel, capitalize, listNames } from '../actions.js'
import { enterEditor } from '../dispatch.js'
import { canonicalDirection } from '../parser.js'
import { substitute } from '../messages.js'

const DIR_OPPOSITE = { north: 'south', south: 'north', east: 'west', west: 'east', up: 'down', down: 'up', in: 'out', out: 'in', northeast: 'southwest', southwest: 'northeast', northwest: 'southeast', southeast: 'northwest' }
const DIR_SHORT = { north: 'n', south: 's', east: 'e', west: 'w', up: 'u', down: 'd', northeast: 'ne', northwest: 'nw', southeast: 'se', southwest: 'sw' }

export const MESSAGE_NAMES = {
  exit: ['leave', 'oleave', 'arrive', 'oarrive', 'nogo', 'onogo'],
  thing: ['take_succeeded', 'otake_succeeded', 'take_failed', 'otake_failed', 'drop_succeeded', 'odrop_succeeded', 'drop_failed', 'odrop_failed'],
  container: ['open', 'oopen', 'close', 'oclose', 'put', 'oput', 'put_fail', 'open_fail', 'remove_fail'],
  enterable: ['enter', 'oenter', 'exit', 'oexit', 'enter_failed'],
  room: ['oarrive_room'],
}
const ALL_MESSAGES = [...new Set(Object.values(MESSAGE_NAMES).flat())]

function quotaCheck(ctx, n = 1) {
  const used = objectQuotaUsed(ctx.player.id)
  const quota = playerQuota(ctx.player)
  if (used + n > quota) {
    ctx.tell(`You have used ${used} of your ${quota} objects. Recycle something you no longer need (@audit lists them, @recycle removes one), or ask Alex for more (mail alex ...).`, 'error')
    return false
  }
  return true
}

function parseName(raw) {
  // 'Pet Rock,rock,pr' -> name 'Pet Rock', aliases ['rock','pr']
  const parts = String(raw || '').replace(/^"|"$/g, '').split(',').map(s => s.trim()).filter(Boolean)
  return { name: parts[0] || '', aliases: parts.slice(1).map(a => a.toLowerCase()) }
}

function validName(name) {
  return name && name.length <= 60 && !/[\u0000-\u001f]/.test(name)
}

function mustControl(ctx, obj, what = 'change') {
  if (controls(ctx.player, obj)) return true
  const owner = store.get(obj.owner)
  ctx.tell(`${capitalize(theName(obj))} (${obj.id}) belongs to ${owner ? owner.name : 'someone else'}; you can't ${what} it. Build your own with @create, or ask them to "@chmod ${obj.id} +w".`, 'error')
  return false
}

function canDigFrom(ctx, room) {
  if (isWizard(ctx.player)) return true
  if (room.owner === ctx.player.id) return true
  if (room.props?.publicDig) return true
  return false
}

// ---------- @dig ----------
registerCommand({
  name: '@dig', usage: '@dig <dir>[|<back>] to "<Room Name>"   |   @dig "<Room Name>"', category: 'building', requires: 'programmer', protected: true,
  summary: 'Make a new room, with an exit from here and one back. e.g. @dig north to "The Lantern Room"',
  async handler(ctx) {
    const player = ctx.player
    const here = ctx.room
    let spec = ctx.dobjstr.trim()
    let nameRaw = ctx.prepstr === 'to' ? ctx.iobjstr : ''
    if (!nameRaw && spec.startsWith('"')) { nameRaw = spec; spec = '' }
    if (!nameRaw && !spec) return ctx.tell('Usage: @dig north to "Room Name"   (or   @dig "Room Name" for a room with no exits yet)', 'error')
    if (!nameRaw) { nameRaw = spec; spec = '' }
    const dest = resolveTargetRoom(nameRaw)
    let room = dest
    const { name, aliases } = parseName(nameRaw)
    if (!room) {
      if (!validName(name)) return ctx.tell('Give the room a name of up to 60 characters, in quotes: @dig north to "The Lantern Room"', 'error')
      if (!quotaCheck(ctx, spec ? 3 : 1)) return
    } else if (!controls(player, room) && !room.perms?.w) {
      return ctx.tell(`${room.name} (${room.id}) is not yours to dig into. Dig to a new room by name instead: @dig ${spec || 'north'} to "A New Room"`, 'error')
    }
    let out = null, back = null
    if (spec) {
      if (!canDigFrom(ctx, here)) {
        return ctx.tell(`${here.name} is Alex's; new passages can't be cut here. Dig from a room you own, or from The Annex (east of the Workshop), where building is welcome.`, 'error')
      }
      if (!quotaCheck(ctx, room ? 2 : 3)) return
      const [outSpec, backSpec] = spec.split('|').map(s => s.trim())
      out = parseExitSpec(outSpec)
      back = backSpec ? parseExitSpec(backSpec) : defaultBack(out)
      const clash = findExit(here, out.names)
      if (clash) return ctx.tell(`There is already an exit "${clash.name}" here (to ${store.get(clash.props?.dest)?.name || '?'}). Pick another direction, or @unlink ${clash.name} first.`, 'error')
    }
    if (!room) {
      room = store.create({
        kind: 'room', name, aliases, parent: '#room', owner: player.id, location: null,
        description: ['An unfinished room. Its builder has not described it yet.'],
        props: { cluster: 'indoor', asciiArt: [], builtBy: player.name },
        perms: { r: true, w: false, f: false },
      })
      ctx.tell(`Dug ${room.name} (${room.id}).`, 'system')
    }
    if (spec) {
      makeExit(player, here, room, out)
      if (back && !findExit(room, back.names)) makeExit(player, room, here, back)
      ctx.tell(`Exit ${out.names[0]} leads to ${room.name}${back ? `; ${back.names[0]} leads back` : ''}.`, 'system')
      ctx.tell(`Next: go ${out.names[0]}, then @describe here as "..." and @create things for it.`, 'dim')
      ctx.announce(`${player.name} opens a new passage: ${out.names[0]}.`)
      sendMap(player)
    } else if (!dest) {
      ctx.tell(`It floats unattached. Connect it with: @dig <direction> to ${room.id}  (or @teleport me to ${room.id})`, 'dim')
    }
  },
})

function resolveTargetRoom(raw) {
  const t = String(raw).trim()
  if (/^#/.test(t)) { const o = store.get(t); return o && o.kind === 'room' ? o : null }
  return null
}

function parseExitSpec(spec) {
  const names = String(spec).replace(/^"|"$/g, '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  const canon = canonicalDirection(names[0])
  if (canon) {
    const all = [canon, ...names.slice(1)]
    if (DIR_SHORT[canon] && !all.includes(DIR_SHORT[canon])) all.push(DIR_SHORT[canon])
    return { names: [...new Set(all)], direction: canon }
  }
  return { names: [...new Set(names)], direction: names[0] }
}

function defaultBack(out) {
  const opp = DIR_OPPOSITE[out.direction]
  if (!opp) return { names: ['back', 'out'], direction: 'back' }
  return parseExitSpec(opp)
}

function findExit(room, names) {
  const set = new Set(names.map(n => n.toLowerCase()))
  return store.exitsOf(room.id).find(e => [e.name, e.props?.direction, ...(e.aliases || [])].filter(Boolean).some(n => set.has(String(n).toLowerCase()))) || null
}

export function makeExit(player, from, to, spec) {
  return store.create({
    kind: 'exit', name: spec.names[0], aliases: spec.names.slice(1), parent: '#exit', owner: player.id, location: from.id,
    description: '', props: { dest: to.id, direction: spec.direction },
  })
}

// ---------- @create ----------
registerCommand({
  name: '@create', usage: '@create [$parent] named "<Name>,<alias>,..."', category: 'building', requires: 'programmer', protected: true,
  summary: 'Make a new thing in your pack. e.g. @create $thing named "Pet Rock,rock"   or   @create "Lantern"',
  async handler(ctx) {
    let parentRef = '$thing'
    let nameRaw = ''
    const m = ctx.argstr.match(/^(\S+)\s+named\s+(.+)$/i) || ctx.argstr.match(/^(\S+)\s+called\s+(.+)$/i)
    if (m) { parentRef = m[1]; nameRaw = m[2] }
    else nameRaw = ctx.argstr
    if (!nameRaw) return ctx.tell('Usage: @create $thing named "Pet Rock,rock"   ($thing, $note, $container, or any fertile object; "@classes" lists them)', 'error')
    const pres = resolveRef(ctx.player, parentRef)
    const parent = pres.obj
    if (!parent) return ctx.tell(`There is no parent "${parentRef}". "@classes" lists what you can build from.`, 'error')
    if (!canFertilize(ctx.player, parent)) return ctx.tell(`${parent.name} (${parent.id}) isn't fertile; its owner would need to "@chmod ${parent.id} +f". "@classes" lists what you can build from.`, 'error')
    if (parent.kind === 'player') return ctx.tell('Players cannot be parents of things.', 'error')
    const { name, aliases } = parseName(nameRaw)
    if (!validName(name)) return ctx.tell('Give it a name of up to 60 characters, in quotes.', 'error')
    if (!quotaCheck(ctx)) return
    const kind = parent.kind === 'room' ? 'room' : parent.kind === 'exit' ? 'exit' : 'thing'
    const obj = store.create({
      kind, name, aliases, parent: parent.id, owner: ctx.player.id,
      location: kind === 'thing' ? ctx.player.id : null,
      description: '',
      props: {}, flags: { takeable: true },
      perms: { r: true, w: false, f: false },
    })
    sendInventory(ctx.player)
    ctx.tell(`You now have ${article(obj)} (${obj.id}), a child of ${parent.name}.`, 'system')
    ctx.tell(`Next: @describe ${obj.id} as "..."    then maybe    @verb ${obj.id}:poke this none none    and    @program ${obj.id}:poke`, 'dim')
  },
})

// ---------- @describe ----------
registerCommand({
  name: '@describe', aliases: ['@desc'], usage: '@describe <thing> as "<text>"', category: 'building', protected: true,
  summary: 'Set what people see when they look at something (or at you: @describe me as "...").',
  async handler(ctx) {
    const ref = ctx.dobjstr
    const text = ctx.prepstr === 'as' ? ctx.iobjstr : ''
    if (!ref) return ctx.tell('Usage: @describe me as "A traveler with mud on their boots."   (or @describe <thing> with no text to open the editor)', 'error')
    const res = resolveRef(ctx.player, ref)
    if (!res.obj) return ctx.noSuch(ref, res)
    const obj = res.obj
    if (obj.kind === 'player' && obj.id !== ctx.player.id && !isWizard(ctx.player)) return ctx.tell('You may describe only yourself.', 'error')
    if (obj.kind !== 'player' && !mustControl(ctx, obj, 'describe')) return
    if (!text) {
      return enterEditor(ctx.session, {
        title: `description of ${obj.name}`, lines: store.describe(obj),
        onDone: body => { obj.description = body.split('\n').map(l => l.slice(0, 500)).slice(0, 40); store.save(obj); ctx.tell(`Description of ${obj.name} saved.`, 'system') },
      })
    }
    obj.description = text.replace(/^"|"$/g, '').slice(0, 2000)
    store.save(obj)
    ctx.tell(`Description of ${obj.name} set.`, 'system')
  },
})

registerCommand({
  name: '@rename', usage: '@rename <thing> to "<Name>,<alias>,..."', category: 'building', requires: 'programmer', protected: true,
  summary: 'Rename something you own (aliases after commas).',
  async handler(ctx) {
    if (ctx.prepstr !== 'to' || !ctx.iobjstr) return ctx.tell('Usage: @rename rock to "Lucky Rock,rock,lucky"', 'error')
    const res = resolveRef(ctx.player, ctx.dobjstr)
    if (!res.obj) return ctx.noSuch(ctx.dobjstr, res)
    const obj = res.obj
    if (obj.kind === 'player') return ctx.tell('Use @name to rename yourself.', 'error')
    if (!mustControl(ctx, obj, 'rename')) return
    const { name, aliases } = parseName(ctx.iobjstr)
    if (!validName(name)) return ctx.tell('Names are up to 60 characters.', 'error')
    const old = obj.name
    obj.name = name; obj.aliases = aliases
    if (obj.kind === 'exit') obj.props.direction = canonicalDirection(name) || name.toLowerCase()
    store.save(obj)
    ctx.tell(`${old} is now ${name}${aliases.length ? ` (also: ${aliases.join(', ')})` : ''}.`, 'system')
  },
})

registerCommand({
  name: '@recycle', aliases: ['@destroy', '@delete'], usage: '@recycle <thing>', category: 'building', requires: 'programmer', protected: true,
  summary: 'Destroy something you own, utterly. Contents fall to the room.',
  async handler(ctx) {
    const res = resolveRef(ctx.player, ctx.argstr)
    if (!res.obj) return ctx.noSuch(ctx.argstr, res)
    const obj = res.obj
    if (obj.kind === 'player') return ctx.tell('People are not recyclable.', 'error')
    if (obj.flags?.seed) return ctx.tell(`${obj.name} is part of the house itself.`, 'error')
    if (!mustControl(ctx, obj, 'recycle')) return
    const here = roomOf(ctx.player)
    // evict contents and players
    for (const inner of store.contents(obj.id)) {
      if (inner.kind === 'player') movePlayer(inner, here || store.get('#grand_hall'), { arriveMsg: '%N tumbles out of a recycled space.' })
      else if (inner.kind === 'exit') store.remove(inner.id)
      else { inner.location = here ? here.id : null; store.save(inner) }
    }
    // remove exits pointing at a recycled room
    if (obj.kind === 'room') for (const o of [...store.all()]) if (o.kind === 'exit' && o.props?.dest === obj.id) store.remove(o.id)
    // re-parent children to our parent
    for (const o of [...store.all()]) if (o.parent === obj.id) { o.parent = obj.parent; store.save(o) }
    const name = obj.name
    store.remove(obj.id)
    sendInventory(ctx.player); sendMap(ctx.player)
    ctx.tell(`${name} is gone. Quota: ${objectQuotaUsed(ctx.player.id)}/${playerQuota(ctx.player)}.`, 'system')
  },
})

// ---------- exits ----------
registerCommand({
  name: '@exit', aliases: ['@add-exit', '@link'], usage: '@exit <dir>[,alias...] to <#room>', category: 'building', requires: 'programmer', protected: true,
  summary: 'Make a one-way exit from here to a room (yours, or one that allows it).',
  async handler(ctx) {
    if (ctx.prepstr !== 'to' || !ctx.iobjstr) return ctx.tell('Usage: @exit north,n to #123', 'error')
    const here = ctx.room
    if (!canDigFrom(ctx, here)) return ctx.tell(`${here.name} is not yours; exits can only be added to rooms you own (or The Annex).`, 'error')
    const dest = resolveTargetRoom(ctx.iobjstr) || resolveRef(ctx.player, ctx.iobjstr).obj
    if (!dest || dest.kind !== 'room') return ctx.tell(`"${ctx.iobjstr}" is not a room. Use its #id (your rooms are listed by @audit).`, 'error')
    if (!controls(ctx.player, dest) && !dest.perms?.w && !dest.props?.publicDig) return ctx.tell(`${dest.name} does not accept new entrances. Its owner can "@chmod ${dest.id} +w".`, 'error')
    const spec = parseExitSpec(ctx.dobjstr)
    const clash = findExit(here, spec.names)
    if (clash) return ctx.tell(`There is already an exit "${clash.name}" here. @unlink it first, or choose another name.`, 'error')
    if (!quotaCheck(ctx)) return
    makeExit(ctx.player, here, dest, spec)
    sendMap(ctx.player)
    ctx.tell(`Exit ${spec.names[0]} now leads to ${dest.name}.`, 'system')
  },
})

registerCommand({
  name: '@unlink', aliases: ['@remove-exit', '@rmexit'], usage: '@unlink <exit>', category: 'building', requires: 'programmer', protected: true,
  summary: 'Remove an exit you own from this room.',
  async handler(ctx) {
    const ex = findExit(ctx.room, [ctx.argstr.toLowerCase()])
    if (!ex) return ctx.tell(`No exit "${ctx.argstr}" here. "exits" lists them.`, 'error')
    if (!mustControl(ctx, ex, 'remove')) return
    store.remove(ex.id); sendMap(ctx.player)
    ctx.tell(`Exit ${ex.name} removed.`, 'system')
  },
})

// ---------- locks ----------
registerCommand({
  name: '@lock', usage: '@lock <thing> with <key>', category: 'building', requires: 'programmer', protected: true,
  summary: 'Lock an exit, container or thing. Keys: a thing\'s name, "me", "programmer", "nobody", combined with && || !',
  async handler(ctx) {
    if (ctx.prepstr !== 'with' || !ctx.iobjstr) return ctx.tell('Usage: @lock north with "brass key"   |   @lock box with me || "brass key"', 'error')
    const res = resolveRef(ctx.player, ctx.dobjstr, { includeExits: true })
    if (!res.obj) return ctx.noSuch(ctx.dobjstr, res)
    if (!mustControl(ctx, res.obj, 'lock')) return
    const key = ctx.iobjstr.replace(/"/g, '').slice(0, 200)
    const which = res.obj.kind === 'exit' ? 'lock' : store.prop(res.obj, 'container') ? 'lock_open' : 'lock'
    res.obj.props[which] = key
    store.save(res.obj)
    ctx.tell(`${capitalize(theName(res.obj))} is locked: only those who are, or carry, "${key}" may pass. (Set the refusal text with @nogo ${res.obj.id} is "...")`, 'system')
  },
})

registerCommand({
  name: '@unlock', usage: '@unlock <thing>', category: 'building', requires: 'programmer', protected: true,
  summary: 'Remove a lock.',
  async handler(ctx) {
    const res = resolveRef(ctx.player, ctx.argstr, { includeExits: true })
    if (!res.obj) return ctx.noSuch(ctx.argstr, res)
    if (!mustControl(ctx, res.obj, 'unlock')) return
    delete res.obj.props.lock; delete res.obj.props.lock_open
    store.save(res.obj)
    ctx.tell(`${capitalize(theName(res.obj))} is unlocked.`, 'system')
  },
})

// ---------- messages ----------
registerCommand({
  name: '@messages', aliases: ['@msgs'], usage: '@messages <thing>', category: 'building', requires: 'programmer', protected: true,
  summary: 'List the messages you can customise on a thing (and how).',
  async handler(ctx) {
    const res = resolveRef(ctx.player, ctx.argstr, { includeExits: true })
    if (!res.obj) return ctx.noSuch(ctx.argstr, res)
    const obj = res.obj
    const names = obj.kind === 'exit' ? MESSAGE_NAMES.exit
      : obj.kind === 'room' ? [] : [...MESSAGE_NAMES.thing, ...(store.prop(obj, 'container') ? MESSAGE_NAMES.container : []), ...(store.prop(obj, 'enterable') ? MESSAGE_NAMES.enterable : [])]
    if (!names.length) return ctx.tell(`${obj.name} has no customisable messages.`)
    const lines = [`Messages on ${obj.name} (${obj.id}). Set one with: @<name> ${obj.id} is "text".  %N = actor, %t = this, %s/%o/%p pronouns.`]
    for (const n of names) lines.push(`  @${n.padEnd(18)} ${store.message(obj, n) ?? '(default)'}`)
    ctx.tell(lines)
  },
})

for (const msg of ALL_MESSAGES) {
  registerCommand({
    name: `@${msg}`, usage: `@${msg} <thing> is "<text>"`, category: 'building', requires: 'programmer', protected: true, hidden: true,
    summary: `Set the ${msg} message.`,
    async handler(ctx) { return setMessage(ctx, msg) },
  })
}

async function setMessage(ctx, msg) {
  if (ctx.prepstr !== 'is') return ctx.tell(`Usage: @${msg} <thing> is "text"`, 'error')
  const res = resolveRef(ctx.player, ctx.dobjstr, { includeExits: true })
  if (!res.obj) return ctx.noSuch(ctx.dobjstr, res)
  if (!mustControl(ctx, res.obj, 'change')) return
  res.obj.messages[msg] = ctx.iobjstr.replace(/^"|"$/g, '').slice(0, 400)
  store.save(res.obj)
  ctx.tell(`${msg} on ${res.obj.name} is now: ${substitute(res.obj.messages[msg], { player: ctx.player, thing: res.obj })}`, 'system')
}

// ---------- properties ----------
function parseValue(raw) {
  const t = String(raw ?? '').trim()
  if (t === '') return ''
  try { return JSON.parse(t) } catch {}
  if (t === 'true') return true
  if (t === 'false') return false
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t)
  return t.replace(/^"|"$/g, '')
}

function splitObjProp(ref) {
  const m = String(ref || '').match(/^(.+?)\.([A-Za-z_][A-Za-z0-9_]*)$/)
  return m ? { objRef: m[1], prop: m[2] } : null
}

const PROTECTED_PROPS = new Set(['tokens', 'passwordHash', 'flags', 'phase', 'registered', 'quota', 'dest', 'requiresFlag', 'seedKey', 'logbooks', 'mail', 'visited'])

registerCommand({
  name: '@set', aliases: ['@prop', '@property'], usage: '@set <thing>.<prop> to <value>', category: 'building', requires: 'programmer', protected: true,
  summary: 'Set a property on something you own. Values can be text, numbers, true/false or JSON. e.g. @set rock.color to "grey"',
  async handler(ctx) {
    const m = ctx.argstr.match(/^(.+?)\s+(?:to|=)\s+([\s\S]+)$/)
    if (!m) return ctx.tell('Usage: @set rock.mood to "sleepy"   |   @set here.private to true   |   @set box.container to true', 'error')
    const sp = splitObjProp(m[1])
    if (!sp) return ctx.tell('Name the property as thing.prop, e.g. rock.color', 'error')
    const res = resolveRef(ctx.player, sp.objRef, { includeExits: true })
    if (!res.obj) return ctx.noSuch(sp.objRef, res)
    const obj = res.obj
    if (!(controls(ctx.player, obj) || obj.perms?.w)) return mustControl(ctx, obj, 'change')
    if (PROTECTED_PROPS.has(sp.prop) && !isWizard(ctx.player)) return ctx.tell(`"${sp.prop}" is managed by the house itself.`, 'error')
    const value = parseValue(m[2])
    if (JSON.stringify(value).length > 4000) return ctx.tell('That value is too large (4000 characters max).', 'error')
    obj.props[sp.prop] = value
    store.save(obj)
    ctx.tell(`${obj.name}.${sp.prop} = ${JSON.stringify(value)}`, 'system')
  },
})

registerCommand({
  name: '@rmprop', aliases: ['@unset'], usage: '@rmprop <thing>.<prop>', category: 'building', requires: 'programmer', protected: true, hidden: true,
  summary: 'Remove a property.',
  async handler(ctx) {
    const sp = splitObjProp(ctx.argstr)
    if (!sp) return ctx.tell('Usage: @rmprop rock.color', 'error')
    const res = resolveRef(ctx.player, sp.objRef, { includeExits: true })
    if (!res.obj) return ctx.noSuch(sp.objRef, res)
    if (!mustControl(ctx, res.obj, 'change')) return
    if (PROTECTED_PROPS.has(sp.prop)) return ctx.tell('That property is managed by the house.', 'error')
    delete res.obj.props[sp.prop]; store.save(res.obj)
    ctx.tell(`Removed ${res.obj.name}.${sp.prop}.`, 'system')
  },
})

// ---------- inspection ----------
registerCommand({
  name: '@examine', aliases: ['@show', '@display'], usage: '@examine <thing>', category: 'building', requires: 'programmer', protected: true,
  summary: 'The technical view: id, parent, owner, location, properties, messages, verbs.',
  async handler(ctx) {
    const res = resolveRef(ctx.player, ctx.argstr || 'here', { includeExits: true })
    if (!res.obj) return ctx.noSuch(ctx.argstr, res)
    const o = res.obj
    const owner = store.get(o.owner); const parent = store.get(o.parent); const loc = store.get(o.location)
    const lines = [
      `${o.name} (${o.id})  kind: ${o.kind}  parent: ${parent ? `${parent.name} (${parent.id})` : 'none'}`,
      `  owner: ${owner ? owner.name : 'nobody'}  location: ${loc ? `${loc.name} (${loc.id})` : 'nowhere'}  perms: ${['r', 'w', 'f'].filter(k => o.perms?.[k]).join('') || '-'}${o.flags?.seed ? '  [seed]' : ''}`,
      `  aliases: ${(o.aliases || []).join(', ') || '-'}`,
    ]
    const props = Object.entries(o.props || {}).filter(([k]) => !['asciiArt', 'tokens', 'passwordHash', 'logbooks', 'senses', 'hidden'].includes(k))
    if (props.length) { lines.push('  properties:'); for (const [k, v] of props) lines.push(`    .${k} = ${JSON.stringify(v).slice(0, 120)}`) }
    const msgs = Object.entries(o.messages || {})
    if (msgs.length) { lines.push('  messages:'); for (const [k, v] of msgs) lines.push(`    @${k} = "${v}"`) }
    const verbs = store.allVerbs(o)
    if (verbs.length) { lines.push('  verbs:'); for (const v of verbs) lines.push(`    :${(v.names || [v.key]).join(' ')}  ${(v.args || []).join(' ')}${v.holder.id !== o.id ? `  (from ${v.holder.name})` : ''}${v.code ? '' : '  [builtin]'}`) }
    if (o.kind === 'room') {
      const exits = store.exitsOf(o.id)
      if (exits.length) lines.push(`  exits: ${exits.map(e => `${e.name}→${store.get(e.props?.dest)?.name || '?'} (${e.id})`).join(', ')}`)
    }
    const inside = store.contents(o.id).filter(x => x.kind !== 'exit')
    if (inside.length) lines.push(`  contents: ${inside.map(x => `${x.name} (${x.id})`).join(', ')}`)
    ctx.tell(lines, 'dim')
  },
})

registerCommand({
  name: '@audit', usage: '@audit [player]', category: 'building', requires: 'programmer', protected: true,
  summary: 'List everything you own, with ids and where it is.',
  async handler(ctx) {
    let who = ctx.player
    if (ctx.argstr) {
      const r = resolveRef(ctx.player, ctx.argstr)
      if (!r.obj || r.obj.kind !== 'player') return ctx.tell(`No player "${ctx.argstr}".`, 'error')
      who = r.obj
    }
    const owned = store.ownedBy(who.id).filter(o => o.kind !== 'player' && !o.flags?.copyOf)
    const lines = [`${who.name} owns ${owned.length} object${owned.length === 1 ? '' : 's'} (quota ${playerQuota(who) === Infinity ? '∞' : playerQuota(who)}):`]
    for (const o of owned.sort((a, b) => a.created - b.created).slice(0, 200)) {
      const loc = store.get(o.location)
      lines.push(`  ${o.id.padEnd(8)} ${o.kind.padEnd(5)} ${o.name}${loc ? `  @ ${loc.name}` : ''}`)
    }
    ctx.tell(lines, 'dim')
  },
})

registerCommand({
  name: '@quota', usage: '@quota', category: 'building', requires: 'programmer', protected: true,
  summary: 'How many objects you may still build.',
  async handler(ctx) {
    const used = objectQuotaUsed(ctx.player.id); const q = playerQuota(ctx.player)
    ctx.tell(`You have built ${used} of ${q === Infinity ? 'unlimited' : q} objects. Rooms, things and exits all count; recycling gives them back.`)
  },
})

registerCommand({
  name: '@classes', aliases: ['@generics', '@parents-list'], usage: '@classes', category: 'building', requires: 'programmer', protected: true,
  summary: 'List the fertile objects you can build children from (generics and examples).',
  async handler(ctx) {
    const fertile = [...store.all()].filter(o => o.perms?.f && o.kind !== 'player' && (o.kind === 'generic' || o.flags?.example || o.owner === ctx.player.id))
    const lines = ['You can @create children of:']
    for (const o of fertile) lines.push(`  ${('$' + o.id.slice(1)).padEnd(16)} ${o.name}${o.props?.help ? ' — ' + o.props.help : ''}`)
    lines.push('e.g.  @create $note named "Guestbook"      @create $pet_rock named "Pebble,pebble"')
    ctx.tell(lines)
  },
})

registerCommand({
  name: '@chparent', usage: '@chparent <thing> to <parent>', category: 'building', requires: 'programmer', protected: true,
  summary: 'Change what something inherits from.',
  async handler(ctx) {
    if (ctx.prepstr !== 'to') return ctx.tell('Usage: @chparent rock to $pet_rock', 'error')
    const res = resolveRef(ctx.player, ctx.dobjstr); if (!res.obj) return ctx.noSuch(ctx.dobjstr, res)
    const pres = resolveRef(ctx.player, ctx.iobjstr); if (!pres.obj) return ctx.noSuch(ctx.iobjstr, pres)
    if (!mustControl(ctx, res.obj, 'reparent')) return
    if (!canFertilize(ctx.player, pres.obj)) return ctx.tell(`${pres.obj.name} isn't fertile.`, 'error')
    if (pres.obj.id === res.obj.id || store.isDescendantOf(pres.obj, res.obj.id)) return ctx.tell('That would make a loop in the family tree.', 'error')
    res.obj.parent = pres.obj.id; store.save(res.obj)
    ctx.tell(`${res.obj.name} now descends from ${pres.obj.name}.`, 'system')
  },
})

registerCommand({
  name: '@parents', usage: '@parents <thing>', category: 'building', requires: 'programmer', protected: true, hidden: true,
  summary: 'Show the ancestry of a thing.',
  async handler(ctx) {
    const res = resolveRef(ctx.player, ctx.argstr || 'me', { includeExits: true }); if (!res.obj) return ctx.noSuch(ctx.argstr, res)
    ctx.tell([res.obj, ...store.ancestors(res.obj)].map(o => `${o.name} (${o.id})`).join(' → '))
  },
})

registerCommand({
  name: '@chmod', usage: '@chmod <thing> +w | -w | +f | -f | +r | -r', category: 'building', requires: 'programmer', protected: true,
  summary: 'Let others write to (+w) or build children of (+f) your thing.',
  async handler(ctx) {
    const [ref, ...flags] = ctx.args
    const res = resolveRef(ctx.player, ref, { includeExits: true }); if (!res.obj) return ctx.noSuch(ref, res)
    if (!mustControl(ctx, res.obj, 'change')) return
    for (const f of flags) {
      const m = f.match(/^([+-])([rwf])$/)
      if (!m) return ctx.tell('Flags look like +w, -w, +f, -f, +r, -r', 'error')
      res.obj.perms[m[2]] = m[1] === '+'
    }
    store.save(res.obj)
    ctx.tell(`${res.obj.name} perms: ${['r', 'w', 'f'].filter(k => res.obj.perms[k]).join('') || '-'}`, 'system')
  },
})

registerCommand({
  name: '@teleport', aliases: ['@move', '@tp'], usage: '@teleport <thing|me> to <room>', category: 'building', requires: 'programmer', protected: true,
  summary: 'Move yourself to a room you own (or any room by #id if you are allowed in), or move a thing you own.',
  async handler(ctx) {
    if (ctx.prepstr !== 'to') return ctx.tell('Usage: @teleport me to #123   |   @teleport rock to here', 'error')
    const res = resolveRef(ctx.player, ctx.dobjstr); if (!res.obj) return ctx.noSuch(ctx.dobjstr, res)
    const dres = resolveRef(ctx.player, ctx.iobjstr); if (!dres.obj) return ctx.noSuch(ctx.iobjstr, dres)
    const obj = res.obj, dest = dres.obj
    if (obj.kind === 'player' && obj.id !== ctx.player.id && !isWizard(ctx.player)) return ctx.tell('You can only teleport yourself.', 'error')
    if (obj.kind === 'player') {
      if (dest.kind !== 'room') return ctx.tell('You can only teleport into rooms.', 'error')
      if (dest.props?.private && !controls(ctx.player, dest)) return ctx.tell(`${dest.name} is private.`, 'error')
      if (ctx.player.props.phase !== 'playing' && !isWizard(ctx.player)) return ctx.tell('Find your way through the door first.', 'error')
      if (dest.props?.cluster === 'hidden' && !isWizard(ctx.player) && !ctx.player.props.visited?.includes(dest.id)) return ctx.tell('You have not found that place yet.', 'error')
      ctx.tell(`You will yourself to ${dest.name}.`)
      return movePlayer(ctx.player, dest, { leaveMsg: '%N vanishes in a swirl of amber light.', arriveMsg: '%N appears in a swirl of amber light.' })
    }
    if (!mustControl(ctx, obj, 'move')) return
    if (!(controls(ctx.player, dest) || dest.perms?.w || dest.id === ctx.room.id || dest.id === ctx.player.id)) return ctx.tell(`${dest.name} is not yours to put things in.`, 'error')
    obj.location = dest.id; store.save(obj)
    sendInventory(ctx.player)
    ctx.tell(`${obj.name} is now in ${dest.name}.`, 'system')
  },
})

registerCommand({
  name: '@go', usage: '@go <room name or #id>', category: 'building', requires: 'programmer', protected: true, hidden: true,
  summary: 'Teleport yourself to one of your rooms by name.',
  async handler(ctx) {
    const mine = store.ownedBy(ctx.player.id).filter(o => o.kind === 'room')
    const t = ctx.argstr.toLowerCase()
    const dest = store.get(t) || mine.find(r => r.name.toLowerCase() === t || r.name.toLowerCase().includes(t))
    if (!dest || dest.kind !== 'room') return ctx.tell(`No room of yours matches "${ctx.argstr}". @audit lists them.`, 'error')
    if (!controls(ctx.player, dest) && dest.props?.private) return ctx.tell(`${dest.name} is private.`, 'error')
    ctx.tell(`You will yourself to ${dest.name}.`)
    movePlayer(ctx.player, dest, { leaveMsg: '%N vanishes in a swirl of amber light.', arriveMsg: '%N appears in a swirl of amber light.' })
  },
})

registerCommand({
  name: '@art', usage: '@art <room>', category: 'building', requires: 'programmer', protected: true,
  summary: 'Draw the ASCII art shown above a room you own (opens the line editor; 60 columns wide at most).',
  async handler(ctx) {
    const res = resolveRef(ctx.player, ctx.argstr || 'here'); if (!res.obj) return ctx.noSuch(ctx.argstr, res)
    const room = res.obj
    if (room.kind !== 'room') return ctx.tell('Only rooms have art above their description.', 'error')
    if (!mustControl(ctx, room, 'decorate')) return
    enterEditor(ctx.session, {
      title: `art for ${room.name} (each line up to 60 chars, up to 16 lines)`, lines: room.props.asciiArt || [],
      onDone: body => { room.props.asciiArt = body.split('\n').map(l => l.slice(0, 60)).slice(0, 16); store.save(room); ctx.tell('Art saved.', 'system'); showRoom(ctx.player, room) },
    })
  },
})

export default {}
