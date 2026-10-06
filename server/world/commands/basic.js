// Getting around and handling things: look, examine, go, take, drop, put,
// inventory, map, read, use, open/close, senses, exits, home.
import store from '../store.js'
import { registerCommand } from '../registry.js'
import { roomOf, visibleIn, playersIn, exitsFor, theName, article, isProgrammer, resolveRef, controls, playerFlag, setPlayerFlag } from '../objects.js'
import { describeRoom, showRoom, useExit, takeObject, dropObject, sendInventory, inventoryItems, sendMap, exitLabel, capitalize, listNames, movePlayer, passesLock } from '../actions.js'
import { matchExit } from '../dispatch.js'
import { substitute } from '../messages.js'
import { narrate } from '../narrator.js'
import { entranceHooks } from '../entrance.js'
import { vaultHooks } from '../vault.js'
import { SYSTEM_ID } from '../objects.js'
import * as objectsApi from '../objects.js'

// ---------- look ----------
registerCommand({
  name: 'look', aliases: ['l', 'look around'], usage: 'look [thing]', category: 'basics', protected: false,
  summary: 'Look around the room, or at one thing ("look at compass").',
  async handler(ctx) {
    let target = ctx.argstr.replace(/^(at|around|in|inside|into)\s+/i, '').trim()
    if (ctx.prepstr === 'in' || ctx.prepstr === 'inside' || ctx.prepstr === 'into') return lookIn(ctx, ctx.iobjstr)
    if (!target || target === 'around' || target === 'here' || target === 'room') {
      const place = ctx.here || ctx.room
      const { header, lines } = describeRoom(ctx.player, place)
      ctx.send({ t: 'room', header, id: place.id })
      return ctx.tell(lines)
    }
    return examine(ctx, target)
  },
})

registerCommand({
  name: 'examine', aliases: ['x', 'inspect', 'look at', 'study'], usage: 'examine <thing>', category: 'things',
  summary: 'Inspect something closely. Books and logbooks open when examined.',
  async handler(ctx) { return examine(ctx, ctx.argstr) },
})

registerCommand({
  name: 'read', usage: 'read <thing>', category: 'things',
  summary: 'Read a book, note, sign, inscription or logbook.',
  async handler(ctx) { return examine(ctx, ctx.argstr, { reading: true }) },
})

export async function examine(ctx, targetRaw, { reading = false } = {}) {
  const { player, room } = ctx
  const target = String(targetRaw || '').trim().toLowerCase()
  if (!target) return ctx.tell('Examine what? Name something in the room or in your pack.', 'error')

  if (tryHidden(ctx, target)) return
  if (await entranceHooks.examine?.(ctx, target)) return
  if (await vaultHooks.examine?.(ctx, target)) return

  const res = resolveRef(player, target, { includeExits: true })
  if (!res.obj) {
    if (res.reason === 'ambiguous') return ctx.noSuch(target, res)
    // Scenery mentioned only in prose: let the narrator describe it.
    return narrate(ctx, { intent: reading ? 'read' : 'examine', target })
  }
  const obj = res.obj
  // Logbooks
  const lb = store.prop(obj, 'logbook')
  if (lb) {
    const book = (store.get(SYSTEM_ID)?.props?.logbooks || {})[lb]
    if (book) {
      if (lb === 'tree_journal') setPlayerFlag(player, 'read_tree_journal', true)
      ctx.tell('You open the volume and begin to read...')
      return ctx.send({ t: 'logbook', id: lb, title: book.title, pages: book.pages })
    }
  }
  // Notes: readable text
  const noteText = store.prop(obj, 'text')
  if (Array.isArray(noteText) && (reading || store.isDescendantOf(obj, '#note') || obj.id === '#note')) {
    const lines = store.describe(obj).filter(Boolean)
    if (lines.length) lines.push('')
    if (noteText.length === 0) return ctx.tell([...lines, `${capitalize(theName(obj))} is blank. (write <text> on ${obj.name.toLowerCase()})`])
    return ctx.tell([...lines, ...noteText])
  }
  if (obj.kind === 'player') return describePlayer(ctx, obj)
  if (obj.kind === 'exit') {
    const dest = store.get(obj.props?.dest)
    const d = store.describe(obj)
    return ctx.tell(d.length ? d : [`${exitLabel(obj)} leads ${dest ? 'to ' + dest.name : 'nowhere'}.`])
  }
  if (obj.kind === 'room') {
    const { lines } = describeRoom(player, obj)
    return ctx.tell(lines)
  }
  const lines = store.describe(obj)
  if (lines.length === 0 || (lines.length === 1 && !lines[0])) lines.splice(0, lines.length, `You see nothing special about ${theName(obj)}.`)
  // containers show contents
  if (store.prop(obj, 'container')) {
    const inside = store.contents(obj.id)
    if (!store.prop(obj, 'opened')) lines.push(`${capitalize(theName(obj))} is closed.`)
    else if (inside.length) lines.push(`Inside: ${listNames(inside, article)}.`)
    else lines.push(`${capitalize(theName(obj))} is empty.`)
  }
  const link = store.prop(obj, 'realLink')
  if (link) lines.push(`[Download: ${link}]`)
  // Obvious verbs: scripted verbs others may use (Yib's "obvious_verbs")
  const obvious = store.allVerbs(obj).filter(v => v.code && !v.hidden && !(v.args?.[0] === 'this' && v.args?.[1] === 'none' && v.args?.[2] === 'this') && (v.args?.[0] === 'this' || v.args?.[2] === 'this' || (v.args?.[0] === 'none' && v.args?.[1] === 'none')))
  if (obvious.length) lines.push(`(You could: ${obvious.map(v => verbUsage(v, obj)).join(', ')})`)
  const isOwner = controls(player, obj) && obj.owner === player.id
  if (isOwner && obj.kind !== 'player' && !obj.flags?.copyOf) lines.push(`[Yours: ${obj.id}]`)
  ctx.tell(lines)
}

// Seed rooms' hidden interactions: phrases like "under workbench" or "bottom drawer"
// answered from the room data, whatever verb the player used.
export function tryHidden(ctx, phrase) {
  const { player, room } = ctx
  const target = ' ' + String(phrase || '').toLowerCase().replace(/\b(the|a|an|some|this|that)\b/g, ' ').replace(/\s+/g, ' ').trim() + ' '
  const hidden = store.prop(room, 'hidden') || {}
  for (const [key, hi] of Object.entries(hidden)) {
    if (key === 'listen') continue // sense-triggered
    if (!hi.keywords?.some(kw => target.includes(' ' + String(kw).toLowerCase().replace(/\b(the|a|an)\b/g, ' ').replace(/\s+/g, ' ').trim() + ' '))) continue
    if (hi.flag && !playerFlag(player, hi.flag.key)) setPlayerFlag(player, hi.flag.key, hi.flag.value ?? true)
    ctx.tell(hi.responseText)
    return true
  }
  return false
}

export function verbUsage(v, obj) {
  const name = (v.names?.[0] || v.key).replace('*', '')
  const [d, p, i] = v.args || ['none', 'none', 'none']
  const parts = [name]
  if (d === 'this') parts.push(obj.name.toLowerCase())
  else if (d === 'any') parts.push('<something>')
  if (p && p !== 'none') parts.push(p === 'any' ? '<prep>' : p)
  if (i === 'this') parts.push(obj.name.toLowerCase())
  else if (i === 'any') parts.push('<something>')
  return parts.join(' ')
}

function describePlayer(ctx, p) {
  const lines = store.describe(p)
  if (lines.length === 0 || !lines[0]) lines.splice(0, lines.length, `${p.name} looks like someone who wandered in and decided to stay a while.`)
  const carrying = store.contents(p.id)
  if (carrying.length) lines.push(`${p.name} is carrying ${listNames(carrying, article)}.`)
  const tags = []
  if (p.flags?.wizard) tags.push('wizard')
  else if (p.flags?.programmer) tags.push('programmer')
  if (tags.length) lines.push(`[${tags.join(', ')}]`)
  ctx.tell(lines)
}

async function lookIn(ctx, ref) {
  if (tryHidden(ctx, ref)) return
  const res = ctx.resolve(ref)
  if (!res.obj) return ctx.noSuch(ref, res)
  const obj = res.obj
  if (!store.prop(obj, 'container')) return ctx.tell(`You can't look inside ${theName(obj)}.`)
  if (!store.prop(obj, 'opened')) return ctx.tell(`${capitalize(theName(obj))} is closed.`)
  const inside = store.contents(obj.id)
  ctx.tell(inside.length ? `Inside ${theName(obj)}: ${listNames(inside, article)}.` : `${capitalize(theName(obj))} is empty.`)
}

// ---------- movement ----------
registerCommand({
  name: 'go', aliases: ['walk', 'head', 'move', 'travel', 'run', 'climb', 'enter', 'step', 'proceed'], usage: 'go <direction or exit>', category: 'basics',
  summary: 'Move through an exit: "go north", "n", "go to the tree", or just the exit name.',
  async handler(ctx) {
    const ex = matchExit(ctx.player, ctx.raw) || matchExit(ctx.player, ctx.argstr)
    if (ex) return useExit(ctx.player, ex)
    // "enter box" for enterable things (vehicles)
    if (ctx.argstr) {
      const res = ctx.resolve(ctx.argstr, { includeExits: false })
      if (res.obj && store.prop(res.obj, 'enterable')) return enterThing(ctx, res.obj)
    }
    if (!ctx.argstr && ctx.verb === 'enter') return ctx.tell('Enter what?', 'error')
    const exits = exitsFor(ctx.room, ctx.player)
    if (!ctx.argstr) return ctx.tell(exits.length ? `Go where? Exits: ${[...new Set(exits.map(exitLabel))].join(', ')}` : 'There are no obvious exits.', 'error')
    return narrate(ctx, { intent: 'move', target: ctx.argstr })
  },
})

registerCommand({
  name: 'exits', aliases: [], usage: 'exits', category: 'basics',
  summary: 'List the ways out of this room.',
  async handler(ctx) {
    const exits = exitsFor(ctx.room, ctx.player)
    if (!exits.length) return ctx.tell('There are no obvious exits.')
    ctx.tell(exits.map(e => {
      const dest = store.get(e.props?.dest)
      const aliases = (e.aliases || []).filter(a => a !== e.name).slice(0, 3)
      return `${exitLabel(e)}${aliases.length ? ` (${aliases.join(', ')})` : ''} → ${dest ? dest.name : '?'}`
    }))
  },
})

registerCommand({
  name: 'home', usage: 'home', category: 'basics', protected: true,
  summary: 'Return to your home room (the Grand Hall unless you @sethome elsewhere).',
  async handler(ctx) {
    const inside = ctx.player.props.phase === 'playing'
    const homeId = inside ? (ctx.player.props.home || '#grand_hall') : '#entrance'
    const home = store.get(homeId) || store.get('#grand_hall')
    if (home.id === ctx.room.id) return ctx.tell('You are already home.')
    ctx.tell('You click your heels. There is no place like it.')
    movePlayer(ctx.player, home, { leaveMsg: '%N vanishes in a swirl of amber light.', arriveMsg: '%N appears in a swirl of amber light.' })
  },
})

registerCommand({
  name: 'exit', aliases: ['leave', 'out', 'disembark'], usage: 'exit', category: 'basics',
  summary: 'Leave a vehicle or enterable thing you are inside.',
  async handler(ctx) {
    const here = store.get(ctx.player.location)
    if (here && here.kind !== 'room' && here.props?.enterable) {
      const outer = roomOf(store.get(here.location)) || store.get(here.location)
      if (outer) {
        ctx.tell(substitute(store.message(here, 'exit') || 'You climb out of %t.', { player: ctx.player, thing: here }))
        return movePlayer(ctx.player, outer, { leaveMsg: substitute(store.message(here, 'oexit') || '%N climbs out of %t.', { player: ctx.player, thing: here }) })
      }
    }
    const ex = matchExit(ctx.player, 'out') || matchExit(ctx.player, 'leave') || matchExit(ctx.player, 'back')
    if (ex) return useExit(ctx.player, ex)
    ctx.tell('There is nothing here to exit from. Try "exits" to see the ways out.', 'error')
  },
})

async function enterThing(ctx, obj) {
  if (!store.prop(obj, 'enterable')) return ctx.tell(`You can't get inside ${theName(obj)}.`)
  const lock = obj.props?.lock
  if (lock && !passesLock(ctx.player, lock)) return ctx.tell(substitute(store.message(obj, 'enter_failed') || "%T won't let you in.", { player: ctx.player, thing: obj }))
  ctx.tell(substitute(store.message(obj, 'enter') || 'You climb into %t.', { player: ctx.player, thing: obj }))
  movePlayer(ctx.player, obj, { leaveMsg: substitute(store.message(obj, 'oenter') || '%N climbs into %t.', { player: ctx.player, thing: obj }), transition: true })
}

// ---------- things ----------
registerCommand({
  name: 'take', aliases: ['get', 'grab', 'pick', 'pick up', 'acquire'], usage: 'take <thing> [from <container>]', category: 'things',
  summary: 'Pick something up.',
  async handler(ctx) {
    let ref = ctx.dobjstr.replace(/^up\s+/, '')
    if (!ref && ctx.argstr) ref = ctx.argstr.replace(/^up\s+/, '')
    if (!ref) return ctx.tell('Take what?', 'error')
    if (await vaultHooks.take?.(ctx, ref)) return
    if (await entranceHooks.take?.(ctx, ref)) return
    if (tryHidden(ctx, ref)) return
    if (ctx.prepstr === 'from' || ctx.prepstr === 'out of' || ctx.prepstr === 'from inside') return takeFrom(ctx, ref, ctx.iobjstr)
    const room = ctx.room
    const candidates = visibleIn(room.id, ctx.player).filter(o => o.kind !== 'player')
    const { matches, best } = objectsApi.matchObjects(ref, candidates)
    if (!best) {
      if (matches.length > 1) return ctx.tell(`Which do you mean: ${matches.map(m => m.name).join(' or ')}?`, 'error')
      const inv = resolveRef(ctx.player, ref, { includeRoom: false, includeExits: false })
      if (inv.obj && inv.obj.location === ctx.player.id) return ctx.tell('You already have that in your pack.')
      return narrate(ctx, { intent: 'take', target: ref })
    }
    const r = takeObject(ctx.player, best)
    ctx.tell(r.msg, r.ok ? 'output' : 'error')
    if (r.ok) ctx.send({ t: 'sound', name: 'pickup' })
  },
})


async function takeFrom(ctx, ref, contRef) {
  const cres = ctx.resolve(contRef)
  if (!cres.obj) return ctx.noSuch(contRef, cres)
  const cont = cres.obj
  if (!store.prop(cont, 'container')) return ctx.tell(`${capitalize(theName(cont))} doesn't hold things.`)
  if (!store.prop(cont, 'opened')) return ctx.tell(`${capitalize(theName(cont))} is closed.`)
  const { best, matches } = objectsApi.matchObjects(ref, store.contents(cont.id))
  if (!best) return ctx.tell(matches.length > 1 ? `Which do you mean: ${matches.map(m => m.name).join(' or ')}?` : `There is no ${ref} in ${theName(cont)}.`, 'error')
  const lock = cont.props?.lock_remove
  if (lock && !passesLock(ctx.player, lock)) return ctx.tell(substitute(store.message(cont, 'remove_fail') || "You can't take things out of %t.", { player: ctx.player, thing: cont }))
  best.location = ctx.player.id
  store.save(best)
  sendInventory(ctx.player)
  ctx.tell(`You take ${theName(best)} from ${theName(cont)}.`)
  ctx.announce(`${ctx.player.name} takes ${theName(best)} from ${theName(cont)}.`)
}

registerCommand({
  name: 'drop', aliases: ['discard'], usage: 'drop <thing>', category: 'things',
  summary: 'Put something down here.',
  async handler(ctx) {
    const ref = ctx.argstr
    if (!ref) return ctx.tell('Drop what?', 'error')
    const { best, matches } = objectsApi.matchObjects(ref, store.contents(ctx.player.id), ctx.player.id)
    if (!best) return ctx.tell(matches.length > 1 ? `Which do you mean: ${matches.map(m => m.name).join(' or ')}?` : "You aren't carrying that.", 'error')
    const r = dropObject(ctx.player, best)
    ctx.tell(r.msg, r.ok ? 'output' : 'error')
  },
})

registerCommand({
  name: 'put', aliases: ['place', 'insert', 'store'], usage: 'put <thing> in <container>', category: 'things',
  summary: 'Put something into a container (or onto/under something, for scripted objects).',
  async handler(ctx) {
    if (!ctx.prepstr) return ctx.tell('Put what where? e.g. "put rock in box"', 'error')
    if (await vaultHooks.put?.(ctx, ctx.dobjstr, ctx.iobjstr)) return
    if (tryHidden(ctx, ctx.argstr)) return
    const { best, matches } = objectsApi.matchObjects(ctx.dobjstr, store.contents(ctx.player.id), ctx.player.id)
    if (!best) return ctx.tell(matches.length > 1 ? `Which do you mean: ${matches.map(m => m.name).join(' or ')}?` : `You aren't carrying "${ctx.dobjstr}".`, 'error')
    const cres = ctx.resolve(ctx.iobjstr)
    if (!cres.obj) return ctx.noSuch(ctx.iobjstr, cres)
    const cont = cres.obj
    if (!store.prop(cont, 'container')) return narrate(ctx, { intent: 'put', target: `${best.name} ${ctx.prepstr} ${cont.name}` })
    if (!store.prop(cont, 'opened')) return ctx.tell(`${capitalize(theName(cont))} is closed.`)
    const lock = cont.props?.lock_put
    if (lock && !passesLock(ctx.player, lock)) return ctx.tell(substitute(store.message(cont, 'put_fail') || "%T won't accept that.", { player: ctx.player, thing: cont }))
    if (best.flags?.copyOf) return ctx.tell(`${capitalize(theName(best))} refuses to leave your side. It belongs to your story, not to boxes.`)
    best.location = cont.id
    store.save(best)
    sendInventory(ctx.player)
    ctx.tell(substitute(store.message(cont, 'put') || `You put %d in %t.`, { player: ctx.player, thing: cont, dobj: best }))
    ctx.announce(substitute(store.message(cont, 'oput') || `%N puts %d in %t.`, { player: ctx.player, thing: cont, dobj: best }))
  },
})

registerCommand({
  name: 'open', usage: 'open <thing>', category: 'things',
  summary: 'Open a container, door or box.',
  async handler(ctx) { return openClose(ctx, true) },
})
registerCommand({
  name: 'close', aliases: ['shut'], usage: 'close <thing>', category: 'things',
  summary: 'Close a container.',
  async handler(ctx) { return openClose(ctx, false) },
})

async function openClose(ctx, open) {
  const ref = ctx.argstr
  if (!ref) return ctx.tell(`${open ? 'Open' : 'Close'} what?`, 'error')
  if (tryHidden(ctx, ref)) return
  if (open && await entranceHooks.open?.(ctx, ref)) return
  const res = ctx.resolve(ref)
  if (!res.obj) return narrate(ctx, { intent: open ? 'open' : 'close', target: ref })
  const obj = res.obj
  if (!store.prop(obj, 'container')) return narrate(ctx, { intent: open ? 'open' : 'close', target: obj.name })
  const lock = obj.props?.lock_open
  if (open && lock && !passesLock(ctx.player, lock)) return ctx.tell(substitute(store.message(obj, 'open_fail') || '%T is locked.', { player: ctx.player, thing: obj }))
  if (!!store.prop(obj, 'opened') === open) return ctx.tell(`${capitalize(theName(obj))} is already ${open ? 'open' : 'closed'}.`)
  obj.props.opened = open
  store.save(obj)
  ctx.tell(substitute(store.message(obj, open ? 'open' : 'close') || (open ? 'You open %t.' : 'You close %t.'), { player: ctx.player, thing: obj }))
  ctx.announce(substitute(store.message(obj, open ? 'oopen' : 'oclose') || (open ? '%N opens %t.' : '%N closes %t.'), { player: ctx.player, thing: obj }))
  if (open) {
    const inside = store.contents(obj.id)
    if (inside.length) ctx.tell(`Inside: ${listNames(inside, article)}.`)
  }
}

registerCommand({
  name: 'inventory', aliases: ['i', 'inv', 'pack'], usage: 'inventory', category: 'things',
  summary: 'See what you are carrying.',
  async handler(ctx) {
    const items = inventoryItems(ctx.player)
    ctx.send({ t: 'panel', panel: 'inventory' })
    if (!items.length) return ctx.tell('Your pack is empty.')
    ctx.tell([`You are carrying: ${listNames(items, i => i.name)}.`])
  },
})

registerCommand({
  name: 'map', aliases: ['m'], usage: 'map', category: 'basics',
  summary: 'Open the map of where you have been.',
  async handler(ctx) { sendMap(ctx.player); ctx.send({ t: 'panel', panel: 'map' }) },
})

registerCommand({
  name: 'use', aliases: ['apply', 'activate'], usage: 'use <item> [on <thing>]', category: 'things',
  summary: 'Use an item from your pack, on its own or on something here.',
  async handler(ctx) {
    const itemRef = ctx.dobjstr
    const targetRef = ctx.iobjstr
    if (!itemRef) return ctx.tell('Use what?', 'error')
    const { best: item, matches } = objectsApi.matchObjects(itemRef, store.contents(ctx.player.id), ctx.player.id)
    if (!item) {
      if (matches.length > 1) return ctx.tell(`Which do you mean: ${matches.map(m => m.name).join(' or ')}?`, 'error')
      if (tryHidden(ctx, ctx.argstr)) return
      const here = resolveRef(ctx.player, itemRef, { includeExits: false })
      if (here.obj && here.obj.location !== ctx.player.id) return narrate(ctx, { intent: 'use', target: ctx.argstr })
      return ctx.tell(`You don't have "${itemRef}". Check your inventory ("i").`, 'error')
    }
    let target = null
    if (targetRef) {
      const tres = ctx.resolve(targetRef)
      target = tres.obj
      if (!target && tres.reason === 'ambiguous') return ctx.noSuch(targetRef, tres)
    }
    if (await entranceHooks.use?.(ctx, item, target, targetRef)) return
    if (await vaultHooks.use?.(ctx, item, target, targetRef)) return
    const link = store.prop(item, 'realLink')
    if (link && !target) return ctx.tell([`You examine the ${item.name} carefully. It contains something important.`, `[Download: ${link}]`])
    return narrate(ctx, { intent: 'use', target: targetRef ? `${item.name} on ${target ? target.name : targetRef}` : item.name, mechanical: 'nothing in the mechanism of the world responded' })
  },
})

// ---------- senses ----------
for (const sense of ['listen', 'knock', 'smell', 'taste', 'touch', 'feel', 'sniff']) {
  registerCommand({
    name: sense, usage: sense, category: 'basics', hidden: sense === 'feel' || sense === 'sniff',
    summary: { listen: 'Listen to the room.', knock: 'Knock on something.', smell: 'Smell the air.', taste: 'Taste the air. Not recommended.', touch: 'Touch the nearest surface.' }[sense] || '',
    async handler(ctx) {
      const s = sense === 'feel' ? 'touch' : sense === 'sniff' ? 'smell' : sense
      if (await entranceHooks.sense?.(ctx, s)) return
      const hidden = store.prop(ctx.room, 'hidden') || {}
      if (hidden[s] && !ctx.argstr) {
        const hi = hidden[s]
        if (hi.flag && !playerFlag(ctx.player, hi.flag.key)) setPlayerFlag(ctx.player, hi.flag.key, hi.flag.value ?? true)
        return ctx.tell(hi.responseText)
      }
      if (ctx.argstr) {
        // "knock on door", "touch the mat": let the narrator handle targeted senses
        return narrate(ctx, { intent: s, target: ctx.argstr.replace(/^(on|to|at)\s+/, '') })
      }
      const senses = store.prop(ctx.room, 'senses') || {}
      if (senses[s]) return ctx.tell(senses[s])
      const defaults = {
        listen: 'You listen carefully. The ambient sounds of the room fill your awareness, but nothing stands out.',
        knock: 'You knock. The sound echoes briefly, then fades into silence.',
        smell: 'You breathe in. The air carries the scent of old stone and something faintly electric.',
        taste: 'You decide not to taste anything here. Some mysteries are best left unexplored.',
        touch: 'You reach out and touch the nearest surface. It is solid. It is real. That is reassuring.',
      }
      ctx.tell(defaults[s])
    },
  })
}

// ---------- notes ----------
registerCommand({
  name: 'write', aliases: ['scribble'], usage: 'write <text> on <note>', category: 'things',
  summary: 'Write a line on a note or sign you can write on.',
  async handler(ctx) {
    if (!ctx.prepstr || !ctx.iobjstr) return ctx.tell('Write what on what? e.g. write "hello" on note', 'error')
    const res = ctx.resolve(ctx.iobjstr)
    if (!res.obj) return ctx.noSuch(ctx.iobjstr, res)
    const note = res.obj
    const text = store.prop(note, 'text')
    if (!Array.isArray(text)) return ctx.tell(`You can't write on ${theName(note)}.`)
    if (!(controls(ctx.player, note) || note.perms?.w || store.prop(note, 'public_write'))) return ctx.tell(`${capitalize(theName(note))} is not yours to write on. (Its owner can "@set ${note.id}.public_write to true".)`)
    const lines = [...(note.props.text || text)]
    if (lines.length >= 40) return ctx.tell('The note is full. "erase note" to start over.')
    lines.push(`${ctx.dobjstr.replace(/^"|"$/g, '')}`.slice(0, 300))
    note.props.text = lines
    store.save(note)
    ctx.tell(`You write on ${theName(note)}.`)
    ctx.announce(`${ctx.player.name} writes something on ${theName(note)}.`)
  },
})

registerCommand({
  name: 'erase', usage: 'erase <note>', category: 'things',
  summary: 'Erase a note you own.',
  async handler(ctx) {
    const res = ctx.resolve(ctx.argstr)
    if (!res.obj) return ctx.noSuch(ctx.argstr, res)
    const note = res.obj
    if (!Array.isArray(store.prop(note, 'text'))) return ctx.tell(`There is nothing to erase on ${theName(note)}.`)
    if (!controls(ctx.player, note)) return ctx.tell(`${capitalize(theName(note))} is not yours to erase.`)
    note.props.text = []
    store.save(note)
    ctx.tell(`You wipe ${theName(note)} clean.`)
  },
})

export default {}
