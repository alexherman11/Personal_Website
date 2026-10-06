// Player identity: every browser gets a guest player bound to a secret token;
// @register attaches a name and password so the player (and their programmer
// bit) can be reached from anywhere; connect <name> <password> logs in.
import crypto from 'crypto'
import store from './store.js'
import { WIZARD_ID } from './objects.js'

const NAME_RE = /^[A-Za-z][A-Za-z0-9_\- ]{1,19}$/
const RESERVED = new Set(['me', 'here', 'you', 'narrator', 'system', 'wizard', 'guest', 'visitor', 'alex', 'admin', 'everyone', 'nobody', 'anyone',
  'look', 'help', 'north', 'south', 'east', 'west', 'up', 'down', 'inventory', 'map', 'exits', 'say', 'go', 'take', 'skip', 'quit', 'exit', 'home', 'who'])

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

export function newToken() {
  return crypto.randomBytes(24).toString('hex')
}

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(String(pw), salt, 32).toString('hex')
  return `${salt}:${hash}`
}

export function checkPassword(pw, stored) {
  if (!stored || !stored.includes(':')) return false
  const [salt, hash] = stored.split(':')
  const test = crypto.scryptSync(String(pw), salt, 32).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'))
}

export function players() {
  return [...store.all()].filter(o => o.kind === 'player')
}

export function findPlayerByName(name) {
  const n = String(name || '').trim().toLowerCase()
  return players().find(p => p.name.toLowerCase() === n) || null
}

export function findPlayerByToken(token) {
  if (!token) return null
  const h = hashToken(token)
  return players().find(p => (p.props?.tokens || []).includes(h)) || null
}

function uniqueGuestName() {
  for (let i = 0; i < 50; i++) {
    const n = `Visitor-${Math.floor(1000 + Math.random() * 9000)}`
    if (!findPlayerByName(n)) return n
  }
  return `Visitor-${Date.now() % 100000}`
}

export function createGuest() {
  const token = newToken()
  const player = store.create({
    kind: 'player', name: uniqueGuestName(), aliases: [], parent: '#player', owner: null,
    location: '#entrance',
    description: 'A visitor, still dusted with the road.',
    props: { phase: 'entrance', home: '#grand_hall', visited: ['#entrance'], flags: {}, tokens: [hashToken(token)], gender: 'they', quota: 60, registered: false, mail: [] },
    flags: { guest: true },
    perms: { r: true, w: false, f: false },
  })
  player.owner = player.id
  store.save(player)
  return { player, token }
}

export function attachToken(player) {
  const token = newToken()
  const tokens = (player.props.tokens || []).slice(-4)
  tokens.push(hashToken(token))
  player.props.tokens = tokens
  store.save(player)
  return token
}

export function validateName(name, forPlayer = null) {
  const n = String(name || '').trim()
  if (!NAME_RE.test(n)) return { ok: false, msg: 'A name is 2 to 20 characters: letters, digits, spaces, - or _, starting with a letter.' }
  if (RESERVED.has(n.toLowerCase()) && !(forPlayer && forPlayer.flags?.wizard)) return { ok: false, msg: `"${n}" is taken by the house itself. Pick another.` }
  const other = findPlayerByName(n)
  if (other && (!forPlayer || other.id !== forPlayer.id)) return { ok: false, msg: `Someone already answers to "${n}". Pick another.` }
  return { ok: true, name: n }
}

export function setName(player, name) {
  const v = validateName(name, player)
  if (!v.ok) return v
  const old = player.name
  player.name = v.name
  player.aliases = []
  if (player.flags.guest && /^Visitor-\d+$/.test(old)) player.flags.guest = false
  store.save(player)
  return { ok: true, msg: `The halls will know you as ${v.name}.`, name: v.name, old }
}

export function register(player, name, password) {
  const v = validateName(name, player)
  if (!v.ok) return v
  if (!password || String(password).length < 4) return { ok: false, msg: 'Pick a password of at least 4 characters: @register <name> <password>' }
  if (player.props.registered && player.name.toLowerCase() !== v.name.toLowerCase()) {
    return { ok: false, msg: `You are already registered as ${player.name}. Use "@name" to change your name or "@password" to change your password.` }
  }
  player.name = v.name
  player.aliases = []
  player.props.passwordHash = hashPassword(password)
  player.props.registered = true
  player.flags.guest = false
  store.save(player)
  return { ok: true, msg: `Registered. You are ${v.name}. From any other browser: connect ${v.name} <password>` }
}

export function connect(name, password) {
  const p = findPlayerByName(name)
  if (!p || !p.props?.passwordHash) return { ok: false, msg: 'No registered player by that name, or no password set.' }
  if (!checkPassword(password, p.props.passwordHash)) return { ok: false, msg: 'Wrong password.' }
  return { ok: true, player: p }
}

export function syncWizardPassword() {
  const pw = process.env.WIZARD_PASSWORD
  const wiz = store.get(WIZARD_ID)
  if (!wiz) return
  if (pw && !(wiz.props.passwordSource === 'env' && checkPassword(pw, wiz.props.passwordHash || ''))) {
    wiz.props.passwordHash = hashPassword(pw)
    wiz.props.passwordSource = 'env'
    wiz.props.registered = true
    store.save(wiz)
    console.log('[world] wizard password set from WIZARD_PASSWORD')
  } else if (!pw && !wiz.props.passwordHash) {
    console.log('[world] WIZARD_PASSWORD not set: Alex cannot log in as wizard until it is')
  }
}
