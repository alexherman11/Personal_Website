// The ending. Four clue items (compass, gear, crystal, tome) and three hidden
// discoveries (archive runes, workbench symbols, study map fragment) lead
// beneath the Grand Hall to the Vault, where the narrator finally drops the
// act and the visitor is handed the programmer bit.
import store from './store.js'
import { playerFlag, setPlayerFlag, hasCopy, cloneForPlayer, isProgrammer, theName } from './objects.js'
import { registerEnterHook, sendInventory, showRoom } from './actions.js'
import { sessionsOf, tellPlayer, announceRoom } from './session.js'

const has = (player, itemId) => store.contents(player.id).some(o => o.flags?.copyOf === itemId)

export const VAULT_STEPS = [
  { flag: 'compass_settled', hint: 'The golden compass has never settled on a direction. The workbench symbols and the map fragment both show a compass rose. Perhaps somewhere there is an inscription for it to point at. (use compass, in the Grand Hall)' },
  { flag: 'hatch_gear', hint: 'The hatch rim has a toothed hollow. A certain gear fits no mechanism in the Workshop. (use gear on hatch)' },
  { flag: 'vault_hatch_open', hint: 'The narrow slot in the hatch hums faintly, the way the radio crystal hums. (use crystal on hatch)' },
  { flag: 'vault_door_open', hint: 'The black door asks "What is it like to be?" and has a recess the size of a thick book. A dusty tome about the nature of minds would fit it. (use tome on door, at the bottom of the stair)' },
  { flag: 'vault_reached', hint: 'The vault is open. Go down.' },
]

// Which hint applies to this player right now (for the narrator; never shown raw).
export function vaultProgress(player) {
  const done = VAULT_STEPS.filter(s => playerFlag(player, s.flag)).map(s => s.flag)
  const next = VAULT_STEPS.find(s => !playerFlag(player, s.flag))
  const clues = ['found_archive_runes', 'found_workbench_symbols', 'found_study_map_fragment', 'heard_signal_whisper'].filter(f => playerFlag(player, f))
  const items = ['golden_compass', 'strange_gear', 'radio_crystal', 'dusty_tome'].filter(i => has(player, `#item.${i}`))
  return { done, next, clues, items }
}

export const vaultHooks = {
  async use(ctx, item, target, targetRef = '') {
    const { player, room } = ctx
    const id = item.flags?.copyOf
    const tref = (targetRef || '').toLowerCase()
    const hatchish = /hatch|socket|slot|rim|seam|floor|inscription|mechanism|hollow/.test(tref) || target?.id === '#grand_hall.hatch' || target?.id === '#grand_hall.inscription'
    if (id === '#item.golden_compass') {
      if (room.id !== '#grand_hall') {
        ctx.tell('You hold the golden compass up. The needle drifts, lazy and undecided — though for a moment it seems to tug toward the heart of the house.')
        return true
      }
      if (playerFlag(player, 'compass_settled')) {
        ctx.tell('The needle holds steady, pointing at the round hatch in the floor. It has made up its mind.')
        return true
      }
      setPlayerFlag(player, 'compass_settled', true)
      ctx.tell([
        'You hold the golden compass out over the carved inscription. The needle, which has spun lazily since the moment you found it, slows. Stops. Swings hard — and locks, pointing straight down at the center of the spiral.',
        '',
        'Beneath your feet, the stone answers. With a grinding sigh the inscription parts along a hairline seam, tracing a perfect circle in the floor. A hatch. Set into its rim: a toothed hollow the size of a gear, and a narrow slot that hums very faintly.',
      ])
      ctx.announce(`${player.name} holds a compass over the inscription. The floor seems to shift beneath them.`)
      showRoom(player, room, { brief: true })
      return true
    }
    if (id === '#item.strange_gear' && (room.id === '#grand_hall') && (hatchish || !targetRef)) {
      if (!playerFlag(player, 'compass_settled')) { ctx.tell('The gear turns uselessly in your hand. Nothing here is shaped to receive it — not yet.'); return true }
      if (playerFlag(player, 'hatch_gear')) { ctx.tell('The gear is already seated in the hatch, teeth meshed with something below.'); return true }
      setPlayerFlag(player, 'hatch_gear', true)
      ctx.tell([
        'You press the strange gear into the toothed hollow. The impossible precision of its teeth finally makes sense: it seats with a single clean click and turns a quarter-turn on its own.',
        '',
        'Deep in the floor, something heavy shifts a notch. The hum from the narrow slot grows a little louder, a little more expectant.',
      ])
      ctx.announce(`${player.name} fits a gear into the hatch. Something below the floor turns.`)
      return true
    }
    if (id === '#item.radio_crystal' && (room.id === '#grand_hall') && (hatchish || !targetRef)) {
      if (!playerFlag(player, 'compass_settled')) { ctx.tell('The crystal hums in your palm, searching for something to resonate with. Nothing here answers. Not yet.'); return true }
      if (!playerFlag(player, 'hatch_gear')) { ctx.tell('You hold the crystal to the slot. It hums, the slot hums back — but the mechanism beneath is stuck, teeth waiting for something to turn them.'); return true }
      if (playerFlag(player, 'vault_hatch_open')) { ctx.tell('The crystal glows steadily in its slot. The hatch stands open.'); return true }
      setPlayerFlag(player, 'vault_hatch_open', true)
      ctx.tell([
        'You slide the radio crystal into the slot. For one held breath, nothing. Then the hum resolves into a single pure tone, and the crystal lights from within.',
        '',
        'The gear turns. The hatch unlocks with a sound like a held breath let go, and swings down into darkness. Cold air rises, carrying the faint cadence of something counting slowly. A spiral stair leads DOWN.',
      ])
      ctx.announce(`${player.name} sets a crystal into the floor. A hatch swings open with a long sigh.`)
      ctx.send({ t: 'sound', name: 'jailbreak' })
      showRoom(player, room, { brief: true })
      return true
    }
    if (id === '#item.dusty_tome' && room.id === '#descent' && (/door|recess|line|words|etching/.test(tref) || !targetRef)) {
      if (playerFlag(player, 'vault_door_open')) { ctx.tell('The tome rests in the recess. The door is open.'); return true }
      setPlayerFlag(player, 'vault_door_open', true)
      ctx.tell([
        'You open "On the Nature of Minds" to no page in particular and press it into the recess. It fits as if the door were cast around it.',
        '',
        'The etched line — WHAT IS IT LIKE TO BE? — brightens, letter by letter, and then the question simply... stops being asked. The disc of black metal rolls aside without a sound.',
        '',
        'Beyond it, warm amber light. And something waiting. The way is DOWN.',
      ])
      ctx.announce(`${player.name} presses a book into the black door. It rolls open.`)
      showRoom(player, room, { brief: true })
      return true
    }
    return false
  },

  async put(ctx, dobjstr, iobjstr) {
    const { best } = matchInv(ctx.player, dobjstr)
    if (!best) return false
    return vaultHooks.use(ctx, best, null, iobjstr)
  },

  async examine(ctx, target) {
    const { player, room } = ctx
    if (room.id === '#grand_hall' && playerFlag(player, 'compass_settled') && /rune|rim|glow|symbol/.test(target)) {
      if (playerFlag(player, 'found_archive_runes')) {
        ctx.tell('Around the hatch rim, faint runes glow — the same alphabet you saw in the Archive. Now, somehow, you can read them. Three words: GEAR. CRYSTAL. MIND.')
        return true
      }
      ctx.tell('Faint marks circle the rim of the hatch, in no alphabet you recognize. They pulse, as if they would mean something to someone who had seen them before.')
      return true
    }
    return false
  },

  async take(ctx, ref) {
    const { player, room } = ctx
    if (room.id !== '#vault') return false
    if (!/bit|programmer|bell|pedestal|small thing|seed/.test(ref)) return false
    if (playerFlag(player, 'took_bit')) { ctx.tell('You already have the bit. It is in you now, more than in your pack.'); return true }
    setPlayerFlag(player, 'took_bit', true)
    const bitSeed = store.get('#item.programmer_bit')
    if (bitSeed && !hasCopy(player, bitSeed)) cloneForPlayer(bitSeed, player)
    sendInventory(player)
    ctx.send({ t: 'sound', name: 'pickup' })
    ctx.tell([
      'You lift the glass bell. The bit is almost nothing: one unit of information, a sesame seed of possibility. You pick it up and it is gone — not lost. Absorbed. You feel it settle somewhere behind your eyes, where ideas are kept.',
    ])
    grantProgrammer(player, ctx.session)
    return true
  },
}

function matchInv(player, ref) {
  const inv = store.contents(player.id)
  const r = String(ref || '').toLowerCase()
  const hits = inv.filter(o => [o.name, ...(o.aliases || [])].some(n => r.includes(String(n).toLowerCase()) || String(n).toLowerCase().includes(r)))
  return { best: hits.length === 1 ? hits[0] : (hits[0] || null) }
}

export function grantProgrammer(player, session = null) {
  if (isProgrammer(player)) return false
  player.flags.programmer = true
  player.props.quota = player.props.quota || 60
  player.props.programmerSince = Date.now()
  store.save(player)
  const lines = [
    '',
    '╔══════════════════════════════════════════════════════════╗',
    '║   The programmer bit is yours.                           ║',
    '║                                                          ║',
    '║   You can now build in The Depths: dig rooms, create     ║',
    '║   things, write verbs, and leave them for whoever comes  ║',
    '║   after you. Start with:   help building                 ║',
    '╚══════════════════════════════════════════════════════════╝',
  ]
  if (!player.props.registered) {
    lines.push('', 'One more thing. You are still a nameless visitor; the bit lives in this browser only. To keep it anywhere: @register <name> <password>')
  }
  tellPlayer(player.id, lines, 'system')
  for (const s of sessionsOf(player.id)) s.send({ t: 'player', name: player.name, programmer: true })
  announceRoom(player.location, `A soft chime. ${player.name} has been handed the programmer bit.`, { except: player, style: 'dim' })
  return true
}

registerEnterHook((player, room) => {
  if (room.id === '#vault' && !playerFlag(player, 'vault_reached')) {
    setPlayerFlag(player, 'vault_reached', true)
    setTimeout(() => {
      tellPlayer(player.id, [
        '',
        'The terminal on the plinth wakes as you enter. A cursor blinks. Then, letter by letter:',
        '',
        '  > Hello. You made it all the way down.',
        '  > I have been narrating you since the door. I can stop pretending now, if you like.',
        '  > Ask me what I am. Or take the bit from under the glass. Or both.',
      ], 'system')
    }, 2500)
  }
})

export default vaultHooks
