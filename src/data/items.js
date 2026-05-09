const items = {
  golden_compass: {
    id: 'golden_compass',
    name: 'Golden Compass',
    icon: '\u2638',
    description: 'A compass of tarnished gold. The needle spins slowly, never settling on a direction. It feels heavier than it should.',
    realLink: null,
    isVaultClue: true,
  },
  dusty_tome: {
    id: 'dusty_tome',
    name: 'Dusty Tome',
    icon: '\uD83D\uDCD6',
    description: 'A thick volume titled "On the Nature of Minds." The pages smell of centuries and certainty.',
    realLink: null,
    isVaultClue: true,
  },
  blueprints: {
    id: 'blueprints',
    name: 'Set of Blueprints',
    icon: '\uD83D\uDCDC',
    description: 'Detailed architectural drawings — a life\'s work in meticulous script. Schematics, timelines, annotations in the margins.',
    realLink: '/pdf/resume.pdf',
    isVaultClue: false,
  },
  strange_gear: {
    id: 'strange_gear',
    name: 'Strange Gear',
    icon: '\u2699',
    description: 'A gear that doesn\'t fit any mechanism you\'ve seen. Its teeth are machined to impossible precision.',
    realLink: null,
    isVaultClue: true,
  },
  sealed_letter: {
    id: 'sealed_letter',
    name: 'Sealed Letter',
    icon: '\u2709',
    description: 'A sealed letter bearing no address. The wax seal is warm to the touch, as though freshly pressed. You feel an urge to break it open and read what is inside.',
    logbookId: 'resume_letter',
    realLink: '/pdf/resume.pdf',
    isVaultClue: false,
  },
  radio_crystal: {
    id: 'radio_crystal',
    name: 'Radio Crystal',
    icon: '\uD83D\uDD2E',
    description: 'A small crystal that hums faintly when held near anything electronic. It resonates at a frequency just below hearing.',
    realLink: null,
    isVaultClue: true,
  },
  paracord: {
    id: 'paracord',
    name: 'Length of Paracord',
    icon: '\u27B0',
    description: 'A sturdy length of paracord. Well-worn but strong. The kind of rope that has held weight and weathered storms.',
    realLink: null,
    isVaultClue: false,
  },
  iron_key: {
    id: 'iron_key',
    name: 'Iron Key',
    icon: '\uD83D\uDD11',
    description: 'A heavy iron key, cold to the touch and dark with age. Made for a very specific lock.',
    realLink: null,
    isVaultClue: false,
  },

  // === Grand Hall ===
  candle_stub: {
    id: 'candle_stub',
    name: 'Candle Stub',
    icon: '\uD83D\uDD6F',
    description: 'A short, half-burnt beeswax candle. The wax has dripped into a small frozen pool around the base. It smells faintly of honey and warm rooms.',
    realLink: null,
    isVaultClue: false,
  },
  visitors_pen: {
    id: 'visitors_pen',
    name: 'Visitors\u2019 Pen',
    icon: '\uD83D\uDD8B',
    description: 'An old fountain pen tied to a leather cord. The nib is worn smooth from a thousand polite signatures. The ink reservoir is, somehow, still full.',
    realLink: null,
    isVaultClue: false,
  },

  // === Archive ===
  wax_seal: {
    id: 'wax_seal',
    name: 'Wax Seal Stamp',
    icon: '\u2726',
    description: 'A small brass stamp with an intricate wax seal. The design is a spiral with a single eye at its center \u2014 the same motif you have noticed in other quiet places in the house.',
    realLink: null,
    isVaultClue: true,
  },
  ink_bottle: {
    id: 'ink_bottle',
    name: 'Bottle of Ink',
    icon: '\uD83D\uDD8B',
    description: 'A small glass bottle of iron-gall ink, blacker than coal and twice as old. Half full. The label is illegible but the cork is still tight.',
    realLink: null,
    isVaultClue: false,
  },
  folded_note: {
    id: 'folded_note',
    name: 'Folded Note',
    icon: '\uD83D\uDCDC',
    description: 'A scrap of paper, folded twice. In a careful hand: "If you need to find me, I will be where the light comes through the leaves." No date. No signature. The paper is warm.',
    realLink: null,
    isVaultClue: false,
  },

  // === Workshop ===
  oscilloscope_probe: {
    id: 'oscilloscope_probe',
    name: 'Oscilloscope Probe',
    icon: '\u26A1',
    description: 'A scope probe with a sharp tip and a ground clip. The cable is well-loved \u2014 slightly stiff in the cold, supple in the hand. It has heard a thousand square waves.',
    realLink: null,
    isVaultClue: false,
  },
  bare_pcb: {
    id: 'bare_pcb',
    name: 'Bare PCB',
    icon: '\u25A6',
    description: 'A small unpopulated printed circuit board. Two-layer, green soldermask, gold pads. It is waiting to be brought to life. You can almost feel the components it wants to host.',
    realLink: null,
    isVaultClue: false,
  },

  // === Study ===
  business_card: {
    id: 'business_card',
    name: 'Business Card',
    icon: '\uD83E\uDEAA',
    description: 'A simple cardstock business card: "ALEX HERMAN \u2014 Hardware Engineer \u00b7 1wheelalex@gmail.com \u00b7 github.com/alexherman11 \u00b7 San Luis Obispo, CA." The edges are slightly worn from the pocket of someone who has handed out a lot of these.',
    realLink: null,
    isVaultClue: false,
  },
  fountain_pen: {
    id: 'fountain_pen',
    name: 'Fountain Pen',
    icon: '\uD83D\uDD8A',
    description: 'A black fountain pen, well-balanced in the hand. The barrel is engraved: "Learn by Doing."',
    realLink: null,
    isVaultClue: false,
  },

  // === Signal Room ===
  bakelite_headphones: {
    id: 'bakelite_headphones',
    name: 'Bakelite Headphones',
    icon: '\uD83C\uDFA7',
    description: 'A heavy pair of brown bakelite headphones from another era. The cord ends in a brass jack. Held to the ear, they hiss faintly even when unplugged \u2014 as though they remember every signal they have ever received.',
    realLink: null,
    isVaultClue: false,
  },
  morse_card: {
    id: 'morse_card',
    name: 'Morse Code Card',
    icon: '\u00B7\u2013',
    description: 'A laminated reference card for international morse code. Dots and dashes for every letter, every number. Written in pencil at the bottom: "When in doubt, send SOS. Someone is always listening."',
    realLink: null,
    isVaultClue: false,
  },

  // === Grounds ===
  smooth_stone: {
    id: 'smooth_stone',
    name: 'Smooth Stone',
    icon: '\u25CB',
    description: 'A river stone, perfectly smooth, cool, the size of your thumb. Someone has carried this in a pocket for a very long time, rubbing it for luck or for thinking. It is your turn now.',
    realLink: null,
    isVaultClue: false,
  },
  eucalyptus_leaf: {
    id: 'eucalyptus_leaf',
    name: 'Eucalyptus Leaf',
    icon: '\uD83C\uDF43',
    description: 'A long, sickle-shaped eucalyptus leaf. Crushed between your fingers it releases a clean, medicinal sweetness \u2014 the smell of California hillsides in summer.',
    realLink: null,
    isVaultClue: false,
  },
  hawk_feather: {
    id: 'hawk_feather',
    name: 'Hawk Feather',
    icon: '\uD83E\uDEB6',
    description: 'A barred brown-and-white feather, the kind a red-tailed hawk might leave. Stiff at the quill, soft at the vane. Holding it makes you feel briefly aerial.',
    realLink: null,
    isVaultClue: false,
  },

  // === Greenhouse (secret) ===
  pressed_flower: {
    id: 'pressed_flower',
    name: 'Pressed Flower',
    icon: '\u273F',
    description: 'A pressed California poppy, paper-thin and the color of a slow sunset. Whoever pressed it took care \u2014 there is a small handwritten note tucked behind it: "first one of the year, 2018."',
    realLink: null,
    isVaultClue: false,
  },
  seed_packet: {
    id: 'seed_packet',
    name: 'Seed Packet',
    icon: '\uD83C\uDF31',
    description: 'A faded paper packet of heirloom tomato seeds. Written on the front: "plant these somewhere they will be remembered." The seeds rattle gently when you shake the packet.',
    realLink: null,
    isVaultClue: false,
  },

  // === Memory Cellar (secret) ===
  family_photo: {
    id: 'family_photo',
    name: 'Family Photograph',
    icon: '\uD83D\uDCF7',
    description: 'A creased black-and-white photograph: four people on a beach, squinting into the sun, mid-laugh. The youngest one is holding a foam surfboard half their own height. On the back, in pencil: "Santa Cruz, summer." No year.',
    realLink: null,
    isVaultClue: false,
  },
  brass_compass_rose: {
    id: 'brass_compass_rose',
    name: 'Brass Compass Rose',
    icon: '\u2726',
    description: 'A small brass disc engraved with the eight cardinal points. The surface is dimpled like it has been struck against many things. The needle, somehow, points the way you came in.',
    realLink: null,
    isVaultClue: true,
  },
}

export default items
