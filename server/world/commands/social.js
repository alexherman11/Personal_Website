// Talking to people: say, emote, whisper, page, who, think, mail, names, accounts.
import store from '../store.js'
import { registerCommand } from '../registry.js'
import { roomOf, playersIn, theName, isWizard, WIZARD_ID } from '../objects.js'
import { tellPlayer, announceRoom, isOnline, onlinePlayers, sessionsOf } from '../session.js'
import { movePlayer } from '../actions.js'
import { setName, register, connect, attachToken, hashPassword, findPlayerByName } from '../auth.js'
import { substitute } from '../messages.js'
import { addMail, mailFor, markRead } from '../mail.js'

function clean(text, max = 600) {
  return String(text || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max)
}

registerCommand({
  name: 'say', aliases: ['"'], usage: 'say <message>  (or "message)', category: 'social', protected: true,
  summary: 'Say something to everyone in the room.',
  async handler(ctx) {
    const text = clean(ctx.rawArgstr ?? ctx.argstr)
    if (!text) return ctx.tell('Say what?', 'error')
    ctx.tell(`You say, "${text}"`, 'chat')
    ctx.announce(`${ctx.player.name} says, "${text}"`, { style: 'chat' })
    rememberRoom(ctx, `${ctx.player.name} says, "${text}"`)
  },
})

registerCommand({
  name: 'emote', aliases: [':', 'pose', 'me'], usage: 'emote <action>  (or :action)', category: 'social', protected: true,
  summary: 'Act: ":waves" shows "Yourname waves" to the room.',
  async handler(ctx) {
    const text = clean(ctx.rawArgstr ?? ctx.argstr)
    if (!text) return ctx.tell('Emote what? e.g. :waves', 'error')
    const line = text.startsWith("'") ? `${ctx.player.name}${text}` : `${ctx.player.name} ${text}`
    ctx.tell(line, 'emote')
    ctx.announce(line, { style: 'emote' })
    rememberRoom(ctx, line)
  },
})

registerCommand({
  name: 'think', aliases: ['ponder'], usage: 'think <thought>', category: 'social',
  summary: 'Think out loud: ". o O ( thought )" appears to the room.',
  async handler(ctx) {
    const text = clean(ctx.rawArgstr ?? ctx.argstr)
    if (!text) return ctx.tell('Think what?', 'error')
    const line = `${ctx.player.name} . o O ( ${text} )`
    ctx.tell(line, 'emote'); ctx.announce(line, { style: 'emote' })
  },
})

registerCommand({
  name: 'whisper', aliases: [], usage: 'whisper <message> to <player>', category: 'social', protected: true,
  summary: 'Whisper to someone in the same room. Others see only that you whispered.',
  async handler(ctx) {
    let text, who
    if (ctx.prepstr === 'to' && ctx.iobjstr) { text = ctx.dobjstr; who = ctx.iobjstr }
    else {
      // "whisper alex hello there"
      const [first, ...rest] = ctx.args
      who = first; text = rest.join(' ')
    }
    text = clean(text?.replace(/^"|"$/g, ''))
    if (!who || !text) return ctx.tell('Whisper what to whom? e.g. whisper "psst" to Alex', 'error')
    const target = findPlayerHere(ctx, who)
    if (!target) return ctx.tell(`There is no one called "${who}" here. Use "page" to reach people elsewhere.`, 'error')
    ctx.tell(`You whisper to ${target.name}, "${text}"`, 'chat')
    tellPlayer(target.id, `${ctx.player.name} whispers, "${text}"`, 'chat')
    announceRoom(ctx.room.id, `${ctx.player.name} whispers something to ${target.name}.`, { except: [ctx.player, target], style: 'dim' })
  },
})

registerCommand({
  name: 'page', aliases: ['p', 'msg'], usage: 'page <player> [with] <message>', category: 'social', protected: true,
  summary: 'Send a message to someone anywhere in The Depths. Offline players get it as mail.',
  async handler(ctx) {
    let who = ctx.args[0]
    let text = ctx.args.slice(1).join(' ').replace(/^with\s+/, '')
    text = clean(text.replace(/^"|"$/g, ''))
    if (!who) return ctx.tell('Page whom? e.g. page Alex hello there', 'error')
    const target = findPlayerByName(who)
    if (!target) return ctx.tell(`No one by the name "${who}" is known here. "who" lists who is around.`, 'error')
    if (!text) return ctx.tell(`Page ${target.name} with what?`, 'error')
    if (isOnline(target.id)) {
      const from = roomOf(ctx.player)
      tellPlayer(target.id, `You sense that ${ctx.player.name} is looking for you in ${from ? from.name : 'the dark'}.`, 'chat')
      tellPlayer(target.id, `${ctx.player.name} pages, "${text}"`, 'chat')
      ctx.tell(`Your message has been received by ${target.name}.`, 'chat')
    } else {
      addMail({ from: ctx.player, to: target, text, kind: 'page' })
      ctx.tell(`${target.name} is not here right now. Your page was left as mail; they will see it when they return.`, 'chat')
    }
  },
})

registerCommand({
  name: 'who', aliases: ['@who', 'players', 'online'], usage: 'who', category: 'social', protected: true,
  summary: 'See who is in The Depths right now, and where.',
  async handler(ctx) {
    const online = onlinePlayers()
    const lines = [`${online.length} ${online.length === 1 ? 'soul is' : 'souls are'} in The Depths:`]
    for (const p of online) {
      const r = roomOf(p)
      const tag = p.flags?.wizard ? ' [wizard]' : p.flags?.programmer ? ' [programmer]' : ''
      lines.push(`  ${p.name}${tag} — ${r ? r.name : 'somewhere between rooms'}${p.id === ctx.player.id ? ' (you)' : ''}`)
    }
    const alex = store.get(WIZARD_ID)
    if (alex && !isOnline(alex.id)) lines.push(`  Alex is away. "mail alex <message>" leaves him a note.`)
    ctx.tell(lines)
  },
})

registerCommand({
  name: 'mail', aliases: ['@mail', '@send', 'message'], usage: 'mail <player> <message>  |  mail', category: 'social', protected: true,
  summary: 'Leave a message for someone (works for Alex even when he is away). "mail" alone reads yours.',
  async handler(ctx) {
    const who = ctx.args[0]
    if (!who || who === 'read' || who === 'new' || who === 'list') return readMail(ctx)
    const text = clean(ctx.args.slice(1).join(' ').replace(/^"|"$/g, ''), 2000)
    const target = findPlayerByName(who) || (who.toLowerCase() === 'alex' ? store.get(WIZARD_ID) : null)
    if (!target) return ctx.tell(`No one by the name "${who}" is known here.`, 'error')
    if (!text) return ctx.tell(`Mail ${target.name} what? e.g. mail ${target.name.toLowerCase()} I loved the tree net.`, 'error')
    const entry = addMail({ from: ctx.player, to: target, text, kind: 'mail' })
    if (isOnline(target.id)) tellPlayer(target.id, `A letter from ${ctx.player.name} slides under the door. ("mail" to read it.)`, 'chat')
    ctx.tell(target.id === WIZARD_ID
      ? `Your letter is sealed and sent to Alex. He reads these — really. (#${entry.id})`
      : `Your letter is sent to ${target.name}. (#${entry.id})`, 'chat')
  },
})

function readMail(ctx) {
  const box = mailFor(ctx.player.id)
  if (!box.length) return ctx.tell('No mail. The halls are quiet.')
  const lines = [`You have ${box.length} letter${box.length === 1 ? '' : 's'}:`]
  for (const m of box.slice(-15)) {
    const when = new Date(m.ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    lines.push(`  ${m.read ? ' ' : '*'} #${m.id} from ${m.fromName} (${when}): ${m.text}`)
  }
  markRead(ctx.player.id)
  ctx.tell(lines, 'chat')
}

registerCommand({
  name: '@name', aliases: ['@rename-me', 'name'], usage: '@name <new name>', category: 'social', protected: true,
  summary: 'Change what the halls call you.',
  async handler(ctx) {
    const res = setName(ctx.player, ctx.rawArgstr || ctx.argstr)
    if (!res.ok) return ctx.tell(res.msg, 'error')
    ctx.tell(res.msg, 'system')
    ctx.announce(`${res.old} is now known as ${res.name}.`)
    ctx.send({ t: 'player', name: res.name })
  },
})

registerCommand({
  name: '@gender', usage: '@gender <he|she|they|it>', category: 'social', protected: true,
  summary: 'Set the pronouns messages use for you (%s/%o/%p in messages).',
  async handler(ctx) {
    const g = (ctx.argstr || '').toLowerCase()
    if (!['he', 'she', 'they', 'it'].includes(g)) return ctx.tell('Usage: @gender he | she | they | it', 'error')
    ctx.player.props.gender = g
    store.save(ctx.player)
    ctx.tell(`Noted. Messages will call you "${g}".`, 'system')
  },
})

registerCommand({
  name: '@register', usage: '@register <name> <password>', category: 'social', protected: true,
  summary: 'Give yourself a name and password so you can come back from any browser (and keep your programmer bit).',
  async handler(ctx) {
    const [name, ...rest] = ctx.args
    const pw = rest.join(' ')
    const res = register(ctx.player, name, pw)
    if (!res.ok) return ctx.tell(res.msg, 'error')
    ctx.tell(res.msg, 'system')
    ctx.send({ t: 'player', name: ctx.session.p.name })
  },
})

registerCommand({
  name: '@password', usage: '@password <new password>', category: 'social', protected: true,
  summary: 'Change your password.',
  async handler(ctx) {
    if (!ctx.player.props.registered) return ctx.tell('You are not registered yet: @register <name> <password>', 'error')
    const pw = ctx.rawArgstr || ctx.argstr
    if (pw.length < 4) return ctx.tell('At least 4 characters, please.', 'error')
    ctx.player.props.passwordHash = hashPassword(pw)
    store.save(ctx.player)
    ctx.tell('Password changed.', 'system')
  },
})

registerCommand({
  name: 'connect', aliases: ['login', '@connect'], usage: 'connect <name> <password>', category: 'social', protected: true,
  summary: 'Log in as a registered player from this browser.',
  async handler(ctx) {
    const [name, ...rest] = ctx.args
    const res = connect(name, rest.join(' '))
    if (!res.ok) return ctx.tell(res.msg, 'error')
    if (res.player.id === ctx.player.id) return ctx.tell(`You are already ${res.player.name}.`, 'system')
    const token = attachToken(res.player)
    ctx.send({ t: 'token', token })
    ctx.send({ t: 'reconnect', reason: `Welcome back, ${res.player.name}.` })
  },
})

registerCommand({
  name: '@sethome', usage: '@sethome', category: 'social',
  summary: 'Make this room your home (where "home" takes you).',
  async handler(ctx) {
    if (ctx.room.props?.private && !isWizard(ctx.player) && ctx.room.owner !== ctx.player.id) return ctx.tell('This room is private; you cannot make it your home.', 'error')
    ctx.player.props.home = ctx.room.id
    store.save(ctx.player)
    ctx.tell(`${ctx.room.name} is now your home.`, 'system')
  },
})

registerCommand({
  name: '@join', usage: '@join <player>', category: 'social',
  summary: 'Go to where another player is (unless their room is private).',
  async handler(ctx) {
    const target = findPlayerByName(ctx.argstr)
    if (!target) return ctx.tell(`No one by the name "${ctx.argstr}" is known here.`, 'error')
    if (!isOnline(target.id)) return ctx.tell(`${target.name} is not here right now.`, 'error')
    const dest = roomOf(target)
    if (!dest) return ctx.tell(`${target.name} is nowhere you can follow.`, 'error')
    if (dest.id === ctx.room.id) return ctx.tell(`${target.name} is right here.`)
    if (dest.props?.private && dest.owner !== ctx.player.id && !isWizard(ctx.player)) return ctx.tell(`${target.name} is somewhere private.`, 'error')
    if (ctx.player.props.phase !== 'playing' && dest.id !== '#entrance' && dest.id !== '#grounds' && dest.id !== '#tree') {
      return ctx.tell('You have not found your way inside yet. The door comes first.', 'error')
    }
    ctx.tell(`You join ${target.name}.`)
    movePlayer(ctx.player, dest, { leaveMsg: '%N vanishes in a swirl of amber light.', arriveMsg: '%N appears in a swirl of amber light.' })
  },
})

function findPlayerHere(ctx, who) {
  const w = String(who).toLowerCase()
  return playersIn(ctx.room.id).find(p => p.id !== ctx.player.id && (p.name.toLowerCase() === w || p.name.toLowerCase().startsWith(w))) || null
}

function rememberRoom(ctx, line) {
  for (const p of playersIn(ctx.room.id)) for (const s of sessionsOf(p.id)) if (s !== ctx.session) s.remember(line)
  ctx.session.remember(line)
}

export default {}
