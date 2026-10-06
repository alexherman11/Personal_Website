// The Annex (where building is welcome) and the example generics builders
// can read, copy and make children of. Every verb here is real sandbox code
// — reading them is how MOOers learned, and @list works on all of them.
import store from '../store.js'
import { WIZARD_ID } from '../objects.js'

function upsert(spec) {
  const existing = store.get(spec.id)
  const verbs = {}
  for (const [k, v] of Object.entries(spec.verbs || {})) verbs[k] = { owner: WIZARD_ID, perms: { r: true, x: true }, ...v }
  if (!existing) return store.create({ ...spec, verbs, flags: { ...(spec.flags || {}), seed: true, example: true } })
  Object.assign(existing, { kind: spec.kind, name: spec.name, aliases: spec.aliases || [], parent: spec.parent ?? existing.parent, owner: WIZARD_ID, location: spec.location ?? existing.location, description: spec.description })
  existing.props = { ...(existing.props || {}), ...(spec.props || {}) }
  existing.messages = { ...(existing.messages || {}), ...(spec.messages || {}) }
  existing.verbs = { ...(existing.verbs || {}), ...verbs }
  existing.perms = { ...existing.perms, ...(spec.perms || {}) }
  existing.flags = { ...(spec.flags || {}), seed: true, example: true }
  store.save(existing)
  return existing
}

const V = (names, args, code, extra = {}) => ({ names: Array.isArray(names) ? names : [names], args, code: code.trim(), ...extra })

export function seedExamples() {
  // ---- The Annex ----
  upsert({
    id: '#annex', kind: 'room', name: 'The Annex', aliases: ['annex'], parent: '#room', owner: WIZARD_ID,
    description: [
      'A long gallery of raw stone, newer than the rest of the house and clearly unfinished on purpose. Doorways have been roughed into both walls at regular intervals — some lead somewhere, most are still blank rock waiting for a builder.',
      '',
      'A workbench near the entrance holds a row of curious objects under a hand-lettered sign: EXAMPLES. TOUCH EVERYTHING. A chalkboard beside it reads: "If you can read this, you can build here. Type: help building".',
    ],
    props: {
      asciiArt: [
        '',
        ' ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
        ' ▓░  ░▒▒░  ░▒▒░  ░▒▒░  ░▒▒░  ░▒▒░  ░▒▒░  ░▓',
        ' ▓░  ▒  ▒  ▒  ▒  ▒  ▒  ▒  ▒  ▒  ▒  ▒  ▒  ░▓',
        ' ▓░  ▒  ▒  ▒  ▒  ▒  ▒  ▒  ▒  ▒  ▒  ▒  ▒  ░▓',
        ' ▓░░░▒░░▒░░▒░░▒░░▒░░▒░░▒░░▒░░▒░░▒░░▒░░▒░░░▓',
        ' ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
      ],
      cluster: 'indoor', publicDig: true, hidden: {}, senses: {
        listen: 'Chisels, somewhere. Or the memory of chisels. The Annex always sounds like someone is about to start building.',
        smell: 'Stone dust and chalk.',
      },
    },
    perms: { r: true, w: false, f: false },
  })
  upsert({ id: '#exit.workshop.east', kind: 'exit', name: 'east', aliases: ['e', 'annex', 'gallery'], parent: '#exit', owner: WIZARD_ID, location: '#workshop', description: '', props: { dest: '#annex', direction: 'east' } })
  upsert({ id: '#exit.annex.west', kind: 'exit', name: 'west', aliases: ['w', 'workshop', 'back'], parent: '#exit', owner: WIZARD_ID, location: '#annex', description: '', props: { dest: '#workshop', direction: 'west' } })
  upsert({
    id: '#annex.chalkboard', kind: 'thing', name: 'chalkboard', aliases: ['board', 'chalk', 'sign', 'examples sign'], parent: '#thing', owner: WIZARD_ID, location: '#annex',
    description: ['Chalk, in a confident hand:', '', '  Anyone with the programmer bit can dig new rooms from this gallery.', '  @dig north to "Your Room Name"   — then go north and @describe here as "..."', '  The things on the bench are examples: "examine" them, "@list" their verbs,', '  and make your own with   @create $pet_rock named "Pebble,pebble"', '', '  Full guide: help building · help scripting · help examples'],
    props: { scenery: true }, flags: { scenery: true },
  })

  // ---- Pet rock (Yib's classic) ----
  upsert({
    id: '#pet_rock', kind: 'thing', name: 'pet rock', aliases: ['rock', 'pet rock'], parent: '#thing', owner: WIZARD_ID, location: '#annex',
    description: 'A smooth grey rock with an air of great patience. Someone has drawn two small eyes on it. (pet rock · feed rock · throw rock)',
    props: { pets: 0, help: 'pet rock, feed rock, throw rock. Make your own: @create $pet_rock named "Pebble,pebble". Customise: @set pebble.pet_msg to "..."', pet_msg: 'You pet %t. Nothing happens, in the most satisfying way.', opet_msg: '%N %<pets> %t. %S %<looks> very content about it.' },
    perms: { r: true, w: false, f: true }, flags: { takeable: false, fixture: true },
    verbs: {
      pet: V(['pet', 'stroke', 'pat'], ['this', 'none', 'none'], `
// "pet rock": tell the petter, tell everyone else, remember it.
this.pets = (this.pets || 0) + 1
tell(player, sub(this.pet_msg || "You pet %t."))
announce(sub(this.opet_msg || "%N pets %t."))
if (this.pets % 10 === 0) announceAll(cap(this.name) + " has now been petted " + this.pets + " times. It seems pleased.")
`),
      feed: V('feed', ['this', 'none', 'none'], `
// Rocks do not eat. But they appreciate the thought.
tell(player, "You offer the " + name(this) + " something to eat. It declines, as rocks are wont to do, but you sense it is touched.")
announce(player.name + " tries to feed the " + name(this) + ".")
`),
      throw: V(['throw', 'toss', 'hurl'], ['this', 'none', 'none'], `
// A lesson in refusing politely.
tell(player, cap("the " + name(this)) + " would prefer to stay exactly where it is. It communicates this by being heavy.")
`),
    },
  })

  // ---- Button with a timer ----
  upsert({
    id: '#button', kind: 'thing', name: 'big red button', aliases: ['button', 'red button'], parent: '#thing', owner: WIZARD_ID, location: '#annex',
    description: 'A big red button on a small brass box. A tiny lamp beside it is dark. (push button)',
    props: { lit: false, presses: 0, help: 'push button. It lights a lamp for ten seconds using fork(). @list button:push and @list button:lamp_off to see how.' },
    perms: { r: true, w: false, f: true }, flags: { takeable: false, fixture: true },
    verbs: {
      push: V(['push', 'press', 'hit'], ['this', 'none', 'none'], `
// "push button": light the lamp, then schedule lamp_off in 10 seconds.
this.presses = (this.presses || 0) + 1
if (this.lit) { tell(player, "The lamp is already lit. You press the button anyway. It feels good."); return }
this.lit = true
this.description = "A big red button on a small brass box. The tiny lamp beside it glows amber. (push button)"
tell(player, "Click. The little lamp glows amber.")
announce(player.name + " presses the big red button. A little lamp lights up.")
cancel("lamp_off")        // never two timers at once
fork(10, "lamp_off")      // calls this object's lamp_off verb in 10s
`),
      lamp_off: V('lamp_off', ['this', 'none', 'this'], `
// Runs from the timer. 'player' is whoever pressed the button; use announce for the room.
this.lit = false
this.description = "A big red button on a small brass box. A tiny lamp beside it is dark. (push button)"
announce("The little lamp beside the red button fades out.", { all: true })
`, { hidden: true }),
    },
  })

  // ---- Dice ----
  upsert({
    id: '#dice', kind: 'thing', name: 'pair of dice', aliases: ['dice', 'die'], parent: '#thing', owner: WIZARD_ID, location: '#annex',
    description: 'Two bone dice, worn smooth. (roll dice)',
    props: { sides: 6, help: 'roll dice. @set dice.sides to 20 for a d20.' },
    perms: { r: true, w: false, f: true }, flags: { takeable: false, fixture: true },
    verbs: {
      roll: V(['roll', 'throw'], ['this', 'none', 'none'], `
const sides = this.sides || 6
const a = random(1, sides), b = random(1, sides)
tell(player, "You roll the " + name(this) + ": " + a + " and " + b + " (" + (a + b) + ").")
announce(player.name + " rolls the " + name(this) + ": " + a + " and " + b + ".")
if (a === b) announceAll("Doubles!")
`),
    },
  })

  // ---- Sign: overriding "read" for one object ----
  upsert({
    id: '#sign', kind: 'thing', name: 'wooden sign', aliases: ['sign', 'wooden sign'], parent: '#thing', owner: WIZARD_ID, location: '#annex',
    description: 'A wooden sign on a post. Letters have been burned into it. (read sign)',
    props: { text: ['WELCOME, BUILDER.', 'Everything in this gallery can be examined, @listed, and copied.'], help: 'read sign. Owners: @set sign.text to ["line one", "line two"]' },
    perms: { r: true, w: false, f: true }, flags: { takeable: false, fixture: true },
    verbs: {
      read: V('read', ['this', 'none', 'none'], `
// A scripted "read" wins over the built-in one for this object only.
const lines = Array.isArray(this.text) ? this.text : [String(this.text || "(blank)")]
tell(player, "The sign reads:")
for (const l of lines) tell(player, "  " + l)
`),
    },
  })

  // ---- Lever and a lockable door (two objects working together) ----
  upsert({
    id: '#lever', kind: 'thing', name: 'iron lever', aliases: ['lever', 'iron lever'], parent: '#thing', owner: WIZARD_ID, location: '#annex',
    description: 'An iron lever set into the wall. It is currently up. (pull lever)',
    props: { up: true, exit: null, help: 'pull lever. If this.exit is set to an exit #id you own, pulling toggles that exit\'s lock. @set lever.exit to "#123"' },
    perms: { r: true, w: false, f: true }, flags: { takeable: false, fixture: true },
    verbs: {
      pull: V(['pull', 'push', 'flip'], ['this', 'none', 'none'], `
this.up = !this.up
this.description = "An iron lever set into the wall. It is currently " + (this.up ? "up" : "down") + ". (pull lever)"
tell(player, "You haul the lever " + (this.up ? "up" : "down") + ". Somewhere, something heavy shifts.")
announce(player.name + " pulls the iron lever " + (this.up ? "up" : "down") + ".")
if (this.exit) {
  const ex = obj(this.exit)        // an exit you own, e.g. @set lever.exit to "#45"
  ex.lock = this.up ? "nobody" : "" // "nobody" locks everyone out; "" unlocks
  announce((this.up ? "A door grinds shut." : "A door grinds open."), { all: true })
}
`),
    },
  })

  // ---- A computer (type on it, read its screen) ----
  upsert({
    id: '#computer', kind: 'thing', name: 'old computer', aliases: ['computer', 'terminal', 'screen', 'keyboard'], parent: '#thing', owner: WIZARD_ID, location: '#annex',
    description: 'A beige computer with a green phosphor screen. The cursor blinks. (type <text> on computer · read computer · clear computer)',
    props: { screen: ['READY.'], help: 'type hello on computer · read computer · clear computer. A tiny bulletin board: everyone sees what everyone typed.' },
    perms: { r: true, w: false, f: true }, flags: { takeable: false, fixture: true },
    verbs: {
      type: V(['type', 'enter'], ['any', 'on', 'this'], `
// "type <anything> on computer": dobjstr is the text before "on".
const line = dobjstr.replace(/^"|"$/g, "")
if (!line) { tell(player, "Type what? e.g. type hello on computer"); return }
const screen = (this.screen || []).slice(-19)
screen.push(player.name.toUpperCase() + "> " + line.slice(0, 80))
this.screen = screen
tell(player, "You type. The screen answers in green: " + line)
announce(player.name + " types something on the old computer.")
`),
      read: V(['read', 'look'], ['this', 'none', 'none'], `
tell(player, "The green screen shows:")
for (const l of (this.screen || ["READY."])) tell(player, "  " + l)
`),
      clear: V(['clear', 'reset'], ['this', 'none', 'none'], `
this.screen = ["READY."]
tell(player, "The screen clears with a soft electronic sigh.")
announce(player.name + " clears the old computer's screen.")
`),
    },
  })

  // ---- Vehicle: a thing you can enter and pilot between rooms ----
  upsert({
    id: '#vehicle', kind: 'thing', name: 'brass balloon', aliases: ['balloon', 'brass balloon', 'basket', 'vehicle'], parent: '#thing', owner: WIZARD_ID, location: '#annex',
    description: 'A wicker basket under a patched brass-coloured balloon, tethered to a ring in the floor. A placard on the basket reads: ENTER BALLOON, then PILOT <direction>. (enter balloon)',
    props: { enterable: true, help: 'enter balloon · pilot north (from inside) · exit. A room you can move: inside it, "pilot <exit>" flies the whole balloon through that exit of the room it is in.' },
    messages: { enter: 'You climb into the basket of %t.', oenter: '%N climbs into the basket of %t.', exit: 'You climb out of %t.', oexit: '%N climbs out of %t.' },
    perms: { r: true, w: false, f: true }, flags: { takeable: false, fixture: true },
    verbs: {
      pilot: V(['pilot', 'fly', 'steer'], ['any', 'none', 'none'], `
// "pilot north" while inside the balloon: move the balloon through an exit of the room it sits in.
const dir = (args[0] || "").toLowerCase()
if (!dir) { tell(player, "Pilot which way? The exits of the room below are: " + list(roomOf(this).exits.map(e => e.name))); return }
const here_ = roomOf(this)
const ex = here_.exits.find(e => e.name === dir || e.direction === dir)
if (!ex) { tell(player, "There is no way '" + dir + "' from " + here_.name + ". Try: " + list(here_.exits.map(e => e.name))); return }
announce(cap("the " + name(this)) + " lifts, sways, and drifts " + dir + ".", { room: here_, all: true })
move(this, ex.dest)
announce("The basket lurches. Through the wicker you glimpse " + obj(ex.dest).name + ".", { room: this, all: true })
announce(cap("the " + name(this)) + " drifts in from the " + dir + " and settles.", { room: ex.dest, all: true })
`),
      look_out: V(['peer', 'look_out'], ['none', 'none', 'none'], `
tell(player, "Over the rim of the basket: " + roomOf(this).name + ".")
`),
    },
  })

  // ---- A monster: the seed of a Lambda RPG ----
  upsert({
    id: '#monster', kind: 'thing', name: 'training dummy', aliases: ['dummy', 'monster', 'training dummy'], parent: '#thing', owner: WIZARD_ID, location: '#annex',
    description: 'A straw-stuffed training dummy with a painted scowl. A small slate hangs from its neck: HP 20. (attack dummy)',
    props: { hp: 20, maxhp: 20, maxdmg: 6, fighters: {}, alive_desc: '%T stands here, scowling. A small slate hangs from its neck.', dead_desc: 'A heap where %t used to stand. It will be back.', death_msg: '%T goes down in a heap!', respawn_msg: 'Something stirs and gathers itself: %t stands again.', respawn_seconds: 60, help: 'attack dummy. Hit points live on the dummy; each fighter\'s score lives in dummy.fighters[player.id]. Copies can be re-skinned without code: @set troll.maxhp to 50, @set troll.death_msg to "...", @set troll.alive_desc to "...". When it falls it respawns via fork().' },
    perms: { r: true, w: false, f: true }, flags: { takeable: false, fixture: true },
    verbs: {
      attack: V(['attack', 'hit', 'fight', 'kick', 'punch'], ['this', 'none', 'none'], `
// Messages are properties, so a copy can be re-skinned with @set instead of code:
//   @set troll.death_msg to "The troll topples with a roar!"
if ((this.hp || 0) <= 0) { tell(player, cap("the " + name(this)) + " is in pieces on the floor. Give it a minute."); return }
const dmg = random(1, this.maxdmg || 6)
this.hp = Math.max(0, this.hp - dmg)
const fighters = this.fighters || {}
fighters[player.id] = (fighters[player.id] || 0) + dmg
this.fighters = fighters
tell(player, "You strike the " + name(this) + " for " + dmg + ". It has " + this.hp + " HP left.")
announce(player.name + " strikes the " + name(this) + " for " + dmg + ".")
if (this.hp === 0) {
  // sub() fills %T / %t with this thing's name, so copies read right.
  announceAll(sub(this.death_msg || "%T goes down in a heap!") + " " + player.name + " lands the final blow (" + fighters[player.id] + " damage in all).")
  this.description = sub(this.dead_desc || "A heap where %t used to stand. It will be back.")
  fork(this.respawn_seconds || 60, "respawn")
} else {
  this.description = sub(this.alive_desc || "%T stands here, scowling.") + " HP " + this.hp + "/" + (this.maxhp || 20) + ". (attack " + (this.aliases[0] || name(this)) + ")"
}
`),
      respawn: V('respawn', ['this', 'none', 'this'], `
this.hp = this.maxhp || 20
this.fighters = {}
this.description = sub(this.alive_desc || "%T stands here, scowling.") + " HP " + this.hp + "/" + (this.maxhp || 20) + ". (attack " + (this.aliases[0] || name(this)) + ")"
announce(sub(this.respawn_msg || "Something stirs: %t stands again."), { all: true })
`, { hidden: true }),
    },
  })

  // ---- Puppet / NPC that answers keywords ----
  upsert({
    id: '#npc', kind: 'thing', name: 'clockwork parrot', aliases: ['parrot', 'bird', 'clockwork parrot'], parent: '#thing', owner: WIZARD_ID, location: '#annex',
    description: 'A brass parrot with a wind-up key in its back. One glass eye follows you. (talk to parrot · ask parrot about <topic>)',
    props: { lines: ['Pieces of eight! Pieces of... oh, you know the rest.', 'Build something. BUILD something. Squawk.', 'The vault is down. Everything is down, eventually.'], topics: { alex: 'ALEX? Built this place. Builds nets in trees. Squawk.', bit: 'The BIT. Under the glass, at the bottom. Take it, take it.' }, help: 'talk to parrot · ask parrot about alex. Owners: @set parrot.lines to [...] and @set parrot.topics to {"word": "reply"}' },
    perms: { r: true, w: false, f: true }, flags: { takeable: false, fixture: true },
    verbs: {
      talk: V(['talk', 'chat', 'speak'], ['none', 'to', 'this'], `
const line = pick(this.lines || ["Squawk."])
tell(player, "You address the " + name(this) + ". It cocks its head and says: \\"" + line + "\\"")
announce(player.name + " talks to the " + name(this) + ", which says: \\"" + line + "\\"")
`),
      ask: V('ask', ['this', 'about', 'any'], `
const topic = iobjstr.toLowerCase()
const topics = this.topics || {}
const key = Object.keys(topics).find(k => topic.includes(k))
const reply = key ? topics[key] : "Squawk? " + cap("the " + name(this)) + " has nothing to say about that."
tell(player, cap("the " + name(this)) + " says: \\"" + reply + "\\"")
announce(player.name + " asks the " + name(this) + " about " + topic + ".")
`),
    },
  })
}
