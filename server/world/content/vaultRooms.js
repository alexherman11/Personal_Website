// The ending: the hatch beneath the Grand Hall, the Descent, and the Vault.
// Content lives here (rooms, exits gated on per-player flags, scenery).
// The puzzle logic lives in world/vault.js.

export const EXTRA_ROOMS = {
  descent: {
    name: 'The Descent',
    description: [
      'A spiral stair of cold stone winds downward from the open hatch. The amber light of the hall thins with every turn until only a faint phosphor glow remains, seeping from the walls themselves.',
      '',
      'The whisper you heard in the Signal Room is louder here. Not words yet — a cadence, patient, like something counting slowly. At the bottom of the stair, a round door of dull black metal bars the way. A single line is etched across it.',
    ],
    asciiArt: [
      '',
      '        ▓▓▓▓▓▓▓▓▓▓▓▓',
      '      ▓▓░░░░░░░░░░░░▓▓',
      '     ▓░░  ▒▒▒▒▒▒▒▒  ░░▓',
      '     ▓░ ▒▒░░░░░░░░▒▒ ░▓',
      '     ▓░ ▒░  ▓▓▓▓  ░▒ ░▓',
      '     ▓░ ▒░ ▓░░░░▓ ░▒ ░▓',
      '     ▓░ ▒░ ▓░▒▒░▓ ░▒ ░▓',
      '     ▓░ ▒░  ▓▓▓▓  ░▒ ░▓',
      '     ▓░ ▒▒░░░░░░░░▒▒ ░▓',
      '     ▓░░  ▒▒▒▒▒▒▒▒  ░░▓',
      '      ▓▓░░░░░░░░░░░░▓▓',
      '        ▓▓▓▓▓▓▓▓▓▓▓▓',
    ],
    exits: { up: 'grand_hall', down: 'vault' },
    exitAliases: { up: ['hatch', 'stairs up', 'climb', 'back'], down: ['door', 'through the door', 'enter'] },
    objects: {
      vault_door: {
        id: 'vault_door',
        name: 'round black door',
        keywords: ['door', 'black door', 'round door', 'metal door', 'line', 'etching', 'inscription', 'words'],
        examineText: 'The door is a disc of black metal, seamless, without handle or keyhole. Across its face a single line is etched in a careful hand: "WHAT IS IT LIKE TO BE?" Below it, a shallow rectangular recess — about the size of a thick book.',
      },
      stair: {
        id: 'stair',
        name: 'spiral stair',
        keywords: ['stair', 'stairs', 'staircase', 'steps', 'walls', 'glow', 'phosphor'],
        examineText: 'The steps are worn in the middle, as if walked ten thousand times by one person. The glow in the walls is not paint. It pulses, very slowly, in time with the whisper.',
      },
    },
    items: {},
    hiddenInteractions: {},
    cluster: 'hidden',
  },
  vault: {
    name: 'The Vault',
    description: [
      'The air shifts. Something is different here. The amber light takes on a deeper quality, and the silence is not empty — it is full. Full of something waiting.',
      '',
      'The room is round and small. A single terminal stands on a plinth at its center, its screen glowing the same patient amber as the halls above. Beside it, a low pedestal holds something very small under a glass bell. On a lectern against the wall rests a thick handbook, its cover stamped with a single word: BUILD.',
    ],
    asciiArt: [
      '                ░░░░░░',
      '     ░░░ ░░░▒▒▒▓▓▓▓▓▓▓▒▒▒▒░░░ ░░░',
      '  ░░░  ░▒▓▓▓▓▓▓▒▒▒░░▒▒▒▒▓▓▓▓▓▒░  ░░░',
      ' ░░  ░▓▓█▓▒░              ░▒▓█▓▓░  ░░',
      '░░  ░▓▓▓▓░                  ░▓▓▓▓░  ░░',
      '░░  ░▓▓▓▓░                  ░▓▓▓█░  ░░',
      ' ░░  ░▓▓█▓▒░              ░▒▓█▓▓░  ░░',
      '  ░░░  ░▒▓▓▓▓▓▒▒▒░░░░▒▒▒▓▓▓▓▓▒░  ░░░',
      '     ░░░ ░░░▒▒▒▓▓▓▓▓▓▓▓▓▒▒░░░ ░░░',
      '                ░░░░░░░',
    ],
    exits: { up: 'descent' },
    exitAliases: { up: ['stairs', 'back', 'door', 'leave'] },
    objects: {
      terminal: {
        id: 'terminal',
        name: 'terminal on the plinth',
        keywords: ['terminal', 'screen', 'plinth', 'computer', 'monitor'],
        examineText: 'The screen shows a cursor, blinking. Above it, a single line of text: "You can talk to me here. Ask me what I am."',
      },
      pedestal: {
        id: 'pedestal',
        name: 'glass bell on a pedestal',
        keywords: ['pedestal', 'bell', 'glass', 'glass bell', 'small thing', 'something small'],
        examineText: 'Under the glass bell sits a single bit — not a drill bit, not a horse bit: a bit. One unit of information, the size of a sesame seed, resting on velvet. A tiny brass plate reads: PROGRAMMER. It is yours now, if you want it. (Try: take bit)',
      },
      handbook: {
        id: 'handbook',
        name: 'thick handbook stamped BUILD',
        keywords: ['handbook', 'book', 'build', 'lectern', 'manual', 'guide'],
        examineText: null,
        logbookId: 'handbook',
      },
    },
    items: {},
    hiddenInteractions: {},
    cluster: 'hidden',
  },
}

// Exits that only appear once a player has solved the relevant step.
export const EXTRA_EXITS = {
  'grand_hall.down': { props: { requiresFlag: 'vault_hatch_open', mapHidden: true } },
  'descent.down': { props: { requiresFlag: 'vault_door_open', mapHidden: true } },
  'grand_hall.out': { props: { requiresFlag: 'door_opened' } },
  'entrance.in': { props: { requiresFlag: 'door_opened' } },
}

// Scenery that appears mid-puzzle (gated on per-player flags).
export const EXTRA_OBJECTS = [
  {
    id: '#grand_hall.hatch', kind: 'thing', name: 'round hatch in the floor', aliases: ['hatch', 'seam', 'floor hatch', 'socket', 'slot', 'mechanism', 'rim', 'runes'],
    parent: '#thing', owner: '#alex', location: '#grand_hall',
    description: 'Where the compass needle points, the inscription on the floor has parted along a hairline seam into a perfect circle. A hatch. Set into its rim are two shapes: a toothed hollow the size of a gear, and a narrow slot that seems to hum faintly.',
    props: { scenery: true, requiresFlag: 'compass_settled' },
    flags: { scenery: true },
  },
]

// The hatch exit from the Grand Hall needs to exist even though rooms.js
// doesn't list it; seed.js merges this into the Grand Hall's exits.
export const EXTRA_ROOM_EXITS = {
  grand_hall: { down: 'descent', out: 'entrance' },
  entrance: { in: 'grand_hall' },
}
export const EXTRA_EXIT_ALIASES = {
  'grand_hall.out': ['door', 'front door', 'outside', 'leave', 'exit', 'entrance', 'grounds'],
  'entrance.in': ['door', 'inside', 'enter', 'house', 'hall', 'through the door'],
}
