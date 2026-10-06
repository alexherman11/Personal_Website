// Turn a typed line into an action: session modes, scripted verbs on nearby
// objects, builtin commands, exits, and finally the narrator.
import store from './store.js'
import { parse, canonicalDirection } from './parser.js'
import { findCommand } from './registry.js'
import { roomOf, resolveRef, exitsFor, isProgrammer, isWizard, candidatesFor } from './objects.js'
import { useExit, movePlayer } from './actions.js'
import { tellPlayer, announceRoom, sendTo } from './session.js'
import { runVerb } from './script/sandbox.js'
import { narrate } from './narrator.js'
import { matchObjects } from './objects.js'

const COMMAND_RATE = { perSecond: 25 }

export async function handleLine(session, line, opts = {}) {
  const player = session.p
  const text = String(line ?? '').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').slice(0, 2000)

  // simple flood control
  const now = Date.now()
  session.cmdTimes = session.cmdTimes.filter(t => now - t < 1000)
  if (session.cmdTimes.length >= COMMAND_RATE.perSecond) { session.out('Slow down. The halls can only listen so fast.', 'system'); return }
  session.cmdTimes.push(now)

  if (session.mode === 'editor') return editorLine(session, text)
  if (session.mode === 'name') return nameLine(session, text)
  if (session.mode === 'prompt') return promptLine(session, text)

  const parsed = parse(text)
  if (!parsed) return
  const ctx = makeContext(session, parsed)

  // 1. Scripted verbs on things in scope (unless the builtin is protected)
  const builtin = findCommand(parsed.verb)
  if (!(builtin && builtin.protected)) {
    const hit = findScriptedVerb(player, parsed)
    if (hit) {
      const res = await runVerb({ ...ctx, ...hit })
      if (res !== false) return
    }
  }

  // 2. Builtin command
  if (builtin) {
    if (builtin.requires === 'programmer' && !isProgrammer(player)) {
      return session.out(`"${builtin.name}" needs the programmer bit. It waits for you at the bottom of this place.`, 'error')
    }
    if (builtin.requires === 'wizard' && !isWizard(player)) {
      return session.out(`Only a wizard may ${builtin.name}.`, 'error')
    }
    try {
      await builtin.handler(ctx)
    } catch (err) {
      console.error(`[cmd ${builtin.name}]`, err)
      session.out('Something went wrong inside the walls. The command did nothing.', 'error')
    }
    return
  }

  // 3. An exit name typed on its own ("north", "tree", "climb down")
  const ex = matchExit(player, parsed.raw)
  if (ex) { useExit(player, ex); return }

  // 4. The narrator (never re-entered from its own "do")
  if (opts.fromNarrator) return session.out(`(The narrator meant "${parsed.raw}", but nothing here answers to it.)`, 'dim')
  await narrate(ctx)
}

export function makeContext(session, parsed) {
  const player = session.p
  const room = roomOf(player)
  const here = store.get(player.location) || room
  return {
    session, player, room, here, store, parsed,
    verb: parsed.verb, args: parsed.args, argstr: parsed.argstr, rawArgstr: parsed.rawArgstr,
    dobjstr: parsed.dobjstr, prepstr: parsed.prepstr, iobjstr: parsed.iobjstr, raw: parsed.raw,
    tell: (text, style = 'output', opts) => session.out(text, style, opts),
    tellPlayer: (p, text, style) => tellPlayer(typeof p === 'string' ? p : p.id, text, style),
    announce: (text, opts = {}) => room && announceRoom(room.id, text, { except: player, style: 'dim', ...opts }),
    send: msg => session.send(msg),
    resolve: (ref, opts) => resolveRef(player, ref, opts),
    // Explain why a reference failed, naming the fix (Agora4's self-teaching refusals).
    noSuch: (ref, res) => {
      if (res?.reason === 'ambiguous') {
        session.out(`Which do you mean: ${res.matches.map(m => `${m.name} (${m.id})`).join(', ')}? Try the full name or the #id.`, 'error')
      } else if (res?.reason === 'noid') {
        session.out(`There is no object "${ref}". Object ids look like #12; "@audit" lists what you own.`, 'error')
      } else {
        session.out(`You don't see "${ref}" here.`, 'error')
      }
    },
  }
}

// Match the whole typed line against exits in the room: "n", "north",
// "go to tree", "climb down", "tree".
export function matchExit(player, raw) {
  const room = roomOf(player)
  if (!room) return null
  const input = String(raw).toLowerCase().trim().replace(/^(go|walk|head|move|run|travel|climb|step|proceed)\s+(to\s+|toward\s+|towards\s+|through\s+|into\s+)?(the\s+)?/, '')
  const dir = canonicalDirection(input)
  const exits = exitsFor(room, player)
  for (const ex of exits) {
    const names = [ex.name, ex.props?.direction, ...(ex.aliases || [])].filter(Boolean).map(s => String(s).toLowerCase())
    if (dir && names.includes(dir)) return ex
    if (names.includes(input)) return ex
  }
  // the destination's name
  for (const ex of exits) {
    const dest = store.get(ex.props?.dest)
    if (dest && dest.name.toLowerCase().replace(/^the\s+/, '') === input.replace(/^the\s+/, '')) return ex
  }
  // alias phrases contained in the input, as whole words ("i want to climb down now")
  const hasPhrase = (phrase) => new RegExp(`(^|\\s)${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`).test(input)
  for (const ex of exits) {
    for (const a of ex.aliases || []) if (a.length > 3 && hasPhrase(String(a).toLowerCase())) return ex
  }
  return null
}

// ---------- scripted verbs ----------
function specOk(spec, str, obj, player, objName) {
  if (spec === 'any') return true
  if (spec === 'none') return !str
  if (spec === 'this') {
    if (!str) return false
    const { best, matches } = matchObjects(str, [obj])
    return !!best || matches.length === 1
  }
  return false
}

function findScriptedVerb(player, parsed) {
  const room = roomOf(player)
  const scope = [player]
  const here = store.get(player.location)
  if (here && here.id !== room?.id) scope.push(here)
  if (room) scope.push(room)
  scope.push(...store.contents(player.id))
  if (here && here.id !== room?.id) scope.push(...store.contents(here.id).filter(o => o.id !== player.id))
  if (room) scope.push(...store.contents(room.id).filter(o => o.id !== player.id))
  for (const obj of scope) {
    const found = store.findVerb(obj, parsed.verb)
    if (!found || !found.verb.code) continue
    const [d, p, i] = found.verb.args || ['none', 'none', 'none']
    if (d === 'this' && p === 'none' && i === 'this') continue // "this none this": not a command, only for fork()/call()
    if (!specOk(d, parsed.dobjstr, obj, player)) continue
    if (p === 'none' && parsed.prepstr) continue
    if (p === 'any' && !parsed.prepstr) continue
    if (p !== 'none' && p !== 'any' && p !== parsed.prepstr) continue
    if (!specOk(i, parsed.iobjstr, obj, player)) continue
    // dobj/iobj resolution for the script
    const dobj = parsed.dobjstr ? resolveRef(player, parsed.dobjstr).obj : null
    const iobj = parsed.iobjstr ? resolveRef(player, parsed.iobjstr).obj : null
    return { thisObj: obj, verbDef: found.verb, verbHolder: found.holder, dobj, iobj }
  }
  return null
}

// ---------- session modes ----------
function editorLine(session, text) {
  const ed = session.modeData
  const t = text.trim()
  if (t === '.' ) {
    session.mode = 'normal'; session.modeData = null
    session.send({ t: 'mode', mode: 'normal' })
    return ed.onDone(ed.lines.join('\n'))
  }
  if (t === '@abort') {
    session.mode = 'normal'; session.modeData = null
    session.send({ t: 'mode', mode: 'normal' })
    session.out('Abandoned. Nothing was changed.', 'system')
    return
  }
  if (t === '@show') { session.out(ed.lines.map((l, i) => `${String(i + 1).padStart(3)}  ${l}`), 'dim'); return }
  if (/^@del\s+\d+$/.test(t)) { const n = Number(t.split(/\s+/)[1]); ed.lines.splice(n - 1, 1); session.out(`Removed line ${n}.`, 'dim'); return }
  if (ed.lines.length >= 200) { session.out('That is enough lines for one verb. Finish with "." or "@abort".', 'error'); return }
  ed.lines.push(text.startsWith('.') ? text.slice(1) : text)
  session.send({ t: 'mode', mode: 'editor', prompt: `${ed.lines.length + 1}|` })
}

function nameLine(session, text) {
  const player = session.p
  const t = text.trim()
  if (!t || /^(skip|no|later)$/i.test(t)) {
    session.mode = 'normal'; session.send({ t: 'mode', mode: 'normal' })
    session.out(`Very well. The halls will know you as ${player.name} for now. (You can change this later: @name Yourname)`, 'system')
    return session.modeData?.onDone?.()
  }
  const res = session.modeData.setName(t)
  if (!res.ok) { session.out(res.msg, 'error'); return }
  session.mode = 'normal'; session.send({ t: 'mode', mode: 'normal' })
  session.out(res.msg, 'system')
  session.modeData?.onDone?.()
}

function promptLine(session, text) {
  const data = session.modeData
  session.mode = 'normal'; session.modeData = null
  session.send({ t: 'mode', mode: 'normal' })
  return data.onAnswer(text.trim())
}

export function enterEditor(session, { title, lines = [], onDone }) {
  session.mode = 'editor'
  session.modeData = { lines: [...lines], onDone }
  session.send({ t: 'mode', mode: 'editor', prompt: `${lines.length + 1}|` })
  session.out([
    `-- Editing ${title}. Type lines; "." alone on a line saves, "@abort" cancels, "@show" lists, "@del N" removes a line.`,
  ], 'system')
  if (lines.length) session.out(lines.map((l, i) => `${String(i + 1).padStart(3)}  ${l}`), 'dim')
}

export function askPlayer(session, question, onAnswer) {
  session.mode = 'prompt'
  session.modeData = { onAnswer }
  session.send({ t: 'mode', mode: 'prompt', prompt: '?' })
  session.out(question, 'system')
}

export { movePlayer }
