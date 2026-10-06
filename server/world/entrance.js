// The entrance puzzle: five ways through the locked door.
//   1. The Explorer: read the tree journal, listen, find the iron key, use it.
//   2. The Knock: just knock.
//   3. The Hacker: ls / cd / cat your way to /secret/key.txt.
//   4. The Brute: notice the corroded crossbar, pull it with the paracord.
//   5. The Charmer: make the narrator smile (<<DOOR_OPENS>>).
// All of it is per player and keyed on player.props.phase === 'entrance'.
import store from './store.js'
import { playerFlag, setPlayerFlag, hasCopy, cloneForPlayer, theName } from './objects.js'
import { movePlayer, showRoom, sendInventory } from './actions.js'
import { sessionsOf, tellPlayer, announceRoom } from './session.js'
import { enterNamePrompt } from './onboarding.js'

const OUTSIDE = new Set(['#entrance', '#grounds', '#tree'])

export function atEntrance(player) {
  return player.props.phase !== 'playing' && player.location === '#entrance'
}

export function openDoor(player, { via = 'knock', lines = [] } = {}) {
  if (player.props.phase === 'playing' || playerFlag(player, 'door_opened')) return false
  setPlayerFlag(player, 'door_opened', true)
  setPlayerFlag(player, 'door_method', via)
  player.props.phase = 'boot'
  store.save(player)
  for (const s of sessionsOf(player.id)) {
    if (lines.length) s.out(lines, 'output', { typewriter: true })
    s.send({ t: 'sound', name: 'jailbreak' })
    s.send({ t: 'phase', phase: 'boot', delay: lines.length ? 4000 : 1500 })
  }
  announceRoom('#entrance', `The great door swings open for ${player.name}, who steps through into the warm light.`, { except: player, style: 'dim' })
  return true
}

// Called when the client finishes the boot animation (or reconnects mid-boot).
export function finishBoot(session) {
  const player = session.p
  if (player.props.phase === 'playing') return
  player.props.phase = 'playing'
  store.save(player)
  const hall = store.get('#grand_hall')
  movePlayer(player, hall, { quiet: true, transition: false, arriveMsg: null })
  announceRoom('#grand_hall', `${player.name} steps in through the great door, blinking at the light.`, { except: player, style: 'dim' })
  enterNamePrompt(session)
}

function doorLines() {
  return [
    'You raise your fist and knock on the heavy door.',
    '',
    'The sound reverberates — deep, resonant, final.',
    '',
    'A long silence.',
    '',
    'Then, slowly, with a groan of ancient hinges, the door swings open on its own. No key. No trick. Just the oldest greeting in the world, answered.',
  ]
}

export const entranceHooks = {
  async sense(ctx, sense) {
    const { player } = ctx
    if (sense === 'knock' && atEntrance(player) && !ctx.argstr.replace(/^(on\s+)?(the\s+)?(door|wood)$/, '').trim()) {
      return openDoor(player, { via: 'knock', lines: doorLines() })
    }
    if (sense === 'listen' && player.location === '#tree' && playerFlag(player, 'read_tree_journal')) {
      if (playerFlag(player, 'heard_tree_jingling')) {
        ctx.tell('You listen again. The jingling is still there — faint, metallic, somewhere high above in the canopy.')
        return true
      }
      setPlayerFlag(player, 'heard_tree_jingling', true)
      ctx.tell([
        'You close your eyes and listen — truly listen — the way the journal suggested.',
        '',
        'Wind in the leaves, like slow breathing. The creak of branches. Birdsong, close and bright. And then — faint but unmistakable — a metallic jingling, somewhere high above in the canopy. Something small and bright, catching the wind.',
      ])
      return true
    }
    return false
  },

  async examine(ctx, target) {
    const { player } = ctx
    if (player.location === '#tree' && playerFlag(player, 'heard_tree_jingling')) {
      const canopy = ['branch', 'canopy', 'above', 'leaves', 'jingling', 'jingle', 'highest', 'top', 'glint', 'something small', 'bright']
      if (canopy.some(kw => target.includes(kw))) {
        const key = store.get('#item.iron_key')
        if (hasCopy(player, key) || playerFlag(player, 'took_iron_key')) {
          ctx.tell('You peer up into the canopy. The branch where you found the key is bare now, swaying gently in the wind.')
          return true
        }
        cloneForPlayer(key, player)
        setPlayerFlag(player, 'took_iron_key', true)
        sendInventory(player)
        ctx.send({ t: 'sound', name: 'pickup' })
        ctx.tell([
          'You climb higher, following the sound. There — snagged on a high branch, glinting dully in the filtered light — an iron key on a length of old twine, swaying in the wind.',
          '',
          'You reach up and work it free. It is heavy, cold, and dark with age. It looks like it was made for a very specific lock.',
        ])
        return true
      }
    }
    return false
  },

  async take(ctx, ref) {
    const { player } = ctx
    if (player.location === '#tree' && playerFlag(player, 'heard_tree_jingling') && /key|jingl|bright|glint/.test(ref)) {
      return entranceHooks.examine(ctx, 'canopy')
    }
    return false
  },

  async open(ctx, ref) {
    const { player } = ctx
    if (atEntrance(player) && /door|lock|keyhole/.test(ref)) {
      const key = store.contents(player.id).find(o => o.flags?.copyOf === '#item.iron_key')
      if (key) return entranceHooks.use(ctx, key, null, 'door')
      ctx.tell('The door is locked. Heavy iron crossbars reinforce its face, bolted deep into the stone frame. The keyhole stares back at you like a single dark eye. There must be a way in.')
      return true
    }
    return false
  },

  async use(ctx, item, target, targetRef = '') {
    const { player } = ctx
    const isKey = item.flags?.copyOf === '#item.iron_key'
    const isCord = item.flags?.copyOf === '#item.paracord'
    const doorish = /door|lock|keyhole|crossbar|bar|bolt/.test(targetRef || '') || target?.id === '#entrance.door'
    if (isKey) {
      if (atEntrance(player) && (doorish || !targetRef)) {
        if (!targetRef) { ctx.tell('You hold the iron key up. The keyhole in the door watches it expectantly. Try: use key on door'); return true }
        store.remove(item.id); sendInventory(player)
        openDoor(player, { via: 'key', lines: [
          'You slide the iron key into the keyhole. It fits perfectly — as though the lock was cast around it.',
          '',
          'You turn it. The mechanism resists for a moment, then yields with a deep, satisfying click.',
          '',
          'The heavy door swings inward, releasing a breath of warm amber light and the scent of old wood and candle wax.',
        ] })
        return true
      }
      if (doorish) { ctx.tell('The key hums faintly in your hand, but there is no lock here that matches it.'); return true }
      return false
    }
    if (isCord && atEntrance(player) && doorish) {
      if (!playerFlag(player, 'noticed_corrosion')) {
        ctx.tell('You loop the paracord around the iron crossbars and pull. They hold firm — unyielding. Perhaps if you examined them more closely first.')
        return true
      }
      store.remove(item.id); sendInventory(player)
      openDoor(player, { via: 'brute', lines: [
        'You loop the paracord around the corroded lowest crossbar, brace your foot against the stone archway, and pull.',
        '',
        'The metal groans. Rust flakes shower down like orange snow. You pull harder.',
        '',
        'With a sharp crack, the bolt shears free. The crossbar clatters to the ground. The door, its support weakened, shudders — and swings slowly inward under its own ancient weight.',
      ] })
      return true
    }
    return false
  },

  // Unknown input at the entrance: the virtual shell.
  async unknown(ctx) {
    const { player } = ctx
    if (player.props.phase === 'playing' || !OUTSIDE.has(player.location)) return false
    return tryShell(ctx)
  },
}

// ---------- METHOD 3: the virtual filesystem ----------
const VIRTUAL_FS = {
  '/': { type: 'dir', children: ['README.txt', 'logs', 'config', 'secret'] },
  '/readme.txt': { type: 'file', content: [
    '=== THE DEPTHS v3.0 ===', 'A narrative exploration system.', '',
    'Status: DOOR LOCKED', 'Visitors today: you', 'Narrator mood: sardonic', '',
    'Note: The narrator insists this system is "unhackable."', 'The narrator is frequently wrong about things.',
  ] },
  '/logs': { type: 'dir', children: ['access.log', 'error.log'] },
  '/logs/access.log': { type: 'file', content: [
    '[09:14:02] visitor_7291 tried "open sesame" — DENIED',
    '[09:14:15] visitor_7291 tried "sudo open door" — DENIED (nice try)',
    '[09:15:03] visitor_7291 tried physical force — DENIED (the door is amused)',
    '[09:22:41] visitor_3847 tried "please" — DENIED (manners noted, still no)',
    '[09:30:00] visitor_3847 tried existential argument — DENIED (compelling though)',
    '[10:01:12] visitor_0042 typed "ls" — wait, that actually worked?',
  ] },
  '/logs/error.log': { type: 'file', content: [
    'ERR_NARRATOR_OVERCONFIDENCE: narrator claimed door was "impenetrable"',
    'ERR_FOURTH_WALL_STRESS: fourth wall integrity at 43%',
    'WARN_METAPHOR_MIXED: "the door stared hungrily" — flagged for review',
    'ERR_SELF_AWARENESS_LEAK: narrator briefly questioned own existence',
  ] },
  '/config': { type: 'dir', children: ['narrator.cfg'] },
  '/config/narrator.cfg': { type: 'file', content: [
    '# Narrator Configuration', 'voice_style = "sardonic_british"', 'humor_level = 0.87',
    'helpfulness = 0.12  # intentionally low', 'self_awareness = REDACTED',
    'door_policy = "locked_until_impressed"', 'secret_weakness = SEE /secret/key.txt',
  ] },
  '/secret': { type: 'dir', children: ['key.txt'] },
  '/secret/key.txt': { type: 'file', content: null },
}

function resolvePath(cwd, inputPath) {
  const parts = inputPath.startsWith('/') ? inputPath.split('/').filter(Boolean)
    : [...cwd.split('/').filter(Boolean), ...inputPath.split('/').filter(Boolean)]
  const resolved = []
  for (const part of parts) { if (part === '..') resolved.pop(); else if (part !== '.') resolved.push(part) }
  return ('/' + resolved.join('/')).toLowerCase()
}

function listDir(cwd, targetPath, node) {
  return node.children.map(c => {
    const childPath = (targetPath === '/' ? `/${c}` : `${targetPath}/${c}`).toLowerCase()
    return VIRTUAL_FS[childPath]?.type === 'dir' ? `${c}/` : c
  })
}

function tryShell(ctx) {
  const { player } = ctx
  const input = ctx.raw.trim()
  const cwd = playerFlag(player, 'shell_cwd') || '/'
  if (input === 'pwd') { ctx.tell(cwd, 'dim'); return true }
  if (input === 'whoami') { ctx.tell('visitor', 'dim'); return true }
  if (/^(ls|dir)(\s+\.)?$/.test(input)) {
    const node = VIRTUAL_FS[cwd]
    ctx.tell(node ? listDir(cwd, cwd, node) : ['ls: cannot access: No such directory'], 'dim'); return true
  }
  let m = input.match(/^(?:ls|dir)\s+(\S+)/)
  if (m) {
    const p = resolvePath(cwd, m[1]); const node = VIRTUAL_FS[p]
    if (!node) ctx.tell(`ls: cannot access '${m[1]}': No such file or directory`, 'dim')
    else if (node.type === 'file') ctx.tell(m[1], 'dim')
    else ctx.tell(listDir(cwd, p, node), 'dim')
    return true
  }
  m = input.match(/^cd\s+(\S+)/)
  if (m) {
    const p = resolvePath(cwd, m[1]); const node = VIRTUAL_FS[p]
    if (!node) ctx.tell(`cd: no such file or directory: ${m[1]}`, 'dim')
    else if (node.type !== 'dir') ctx.tell(`cd: not a directory: ${m[1]}`, 'dim')
    else { setPlayerFlag(player, 'shell_cwd', p); ctx.tell(p, 'dim') }
    return true
  }
  m = input.match(/^(?:cat|type|less|more)\s+(\S+)/)
  if (m) {
    const p = resolvePath(cwd, m[1]); const node = VIRTUAL_FS[p]
    if (!node) { ctx.tell(`cat: ${m[1]}: No such file or directory`, 'dim'); return true }
    if (node.type === 'dir') { ctx.tell(`cat: ${m[1]}: Is a directory`, 'dim'); return true }
    if (p === '/secret/key.txt') {
      if (!atEntrance(player)) { ctx.tell(['/* key.txt */', '', 'const char *key = "All this and you could have just knocked.";', '', '(The door is elsewhere. Go stand in front of it.)'], 'dim'); return true }
      openDoor(player, { via: 'hacker', lines: [
        '/* key.txt */', '', 'const char *key = "All this and you could have just knocked.";', '',
        'The terminal flickers. Something in the door\'s mechanism groans.', '',
        'The lock disengages with a heavy clunk. The door drifts open, trailing cobwebs and disbelief.',
      ] })
      return true
    }
    ctx.tell(node.content, 'dim'); return true
  }
  if (/^(sudo|rm|chmod|su)\b/.test(input)) { ctx.tell('permission denied: the door does not take orders.', 'dim'); return true }
  return false
}
