const rooms = {

  grand_hall: {

    id: 'grand_hall',

    name: 'The Grand Hall',

    description: [

      'You stand in a vast hall that seems to stretch beyond what the walls should allow. An amber-glass chandelier hangs from a ceiling lost in shadow, throwing warm pools of light across an ornate woven rug. Tall doorways open in four directions, each framing darkness beyond. The air carries the faint sweetness of beeswax and a slow, deep silence — the silence of a room that listens back.',

      '',

      'A portrait hangs on the eastern wall. A carved inscription spirals across the stone floor. A worn welcome mat rests near where you came in. A grandfather clock ticks somewhere in the corner, just out of sight. A small side table holds a leather-bound visitors’ register, a stub of beeswax candle, and a tied-down fountain pen.',

    ],

    asciiArt: [
      '',
      '              ▓▓',
      '              ▓▓',
      '              ▓▒',
      '          ▒░▒██▓█▒░▒',
      '          ░ ▒█▓▓▓▓ ░',
      '            █░▒▒░█',
      '      ░    █▓ ▒▓ ▒█   ░   ░',
      '░░    ░░  ▓▓  ▒▓  ▓█  ░   ░  ░',
      '░▒░  ▒▓▒▒▓▒  ░▓▓░  ▒▓▓▓░ ▒▓▓▒▒░',
      '▓█░   ▓██▓▓▒░░▒▓░░▒▓▓██▒░░▓░▓▓░',
      ' ░░░░░░▒▓▓██▓░  ░▒███▓░░░░░░░',
      '         ░▒▒▓▓▒▒▓▓▒▒░',
      '              ▓▓',
      '              ░░',
      '              ░░',
    ],

    exits: {

      north: 'archive',

      east: 'workshop',

      south: 'study',

      west: 'signal_room',

    },

    exitAliases: {},

    objects: {

      portrait: {

        id: 'portrait',

        name: 'a portrait on the wall',

        keywords: ['portrait', 'painting', 'wall', 'picture'],

        examineText: 'The portrait depicts a young man with an inquisitive gaze. Something in his expression suggests he is perpetually on the verge of a question — the kind that keeps you up at night. A small plaque reads: "The Explorer. Age 21. Currently based in San Luis Obispo, where he works with language models and wonders what they might become."',

      },

      inscription: {

        id: 'inscription',

        name: 'a carved inscription on the floor',

        keywords: ['inscription', 'carving', 'floor', 'carved'],

        examineText: 'You kneel to read the inscription carved into the stone. The words spiral inward: "Environment. Exploration. Democracy. Community. The unseating of corruption." Each word is cut deeper than the last, as though the mason grew more certain with every stroke.',

      },

      welcome_mat: {

        id: 'welcome_mat',

        name: 'a worn welcome mat',

        keywords: ['mat', 'welcome', 'welcome mat', 'rug'],

        examineText: 'The mat is worn but beautiful. It appears to be handwoven, from some ancient time before machines. The patterns hold a strange symmetry — almost as if something is described in their weave. You wonder if you might lift it to see what is underneath.',

      },

      chandelier: {
        id: 'chandelier',
        name: 'the amber chandelier',
        keywords: ['chandelier', 'light', 'lights', 'amber'],
        examineText: 'Hundreds of amber-glass droplets, lit from within by a flame you cannot quite locate. The chandelier turns very slowly, as though pushed by a draft you cannot feel. Each droplet, when caught by your eye, seems to hold a tiny scene — a beach, a workbench, a tree.',
      },

      grandfather_clock: {
        id: 'grandfather_clock',
        name: 'a grandfather clock',
        keywords: ['clock', 'grandfather', 'grandfather clock', 'pendulum', 'tick'],
        examineText: 'A tall walnut-cased clock with a brass pendulum the size of a dinner plate. The face is hand-painted; the hands are slightly off-true. It strikes the hour with a single low note that you feel in the floor before you hear it.',
      },

      visitors_register: {
        id: 'visitors_register',
        name: 'the visitors’ register',
        keywords: ['register', 'visitors register', 'visitors', 'guestbook', 'guest book', 'sign', 'book on the table'],
        examineText: null,
        logbookId: 'visitor_register',
      },

      side_table: {
        id: 'side_table',
        name: 'a small side table',
        keywords: ['table', 'side table'],
        examineText: 'A walnut side table the height of your thigh. The wood has been polished by a hundred years of small placements — keys, candles, hats. There is the faint ring of a wineglass left a long time ago.',
      },

    },

    items: {

      golden_compass: {

        id: 'golden_compass',

        keywords: ['compass', 'golden compass', 'gold compass', 'golden'],

        takeText: 'You carefully lift the golden compass from its resting place on a small pedestal. The needle spins lazily, pointing toward no particular direction. You have the feeling it may be important later.',

      },

      candle_stub: {
        id: 'candle_stub',
        keywords: ['candle', 'stub', 'candle stub', 'beeswax'],
        takeText: 'You pocket the candle stub. It is heavier than it looks. The wick still smells of recent flame.',
      },

      visitors_pen: {
        id: 'visitors_pen',
        keywords: ['pen', 'visitors pen', 'fountain pen', 'guestbook pen'],
        takeText: 'You untie the leather cord and slip the pen into your pack. The nib has been worn smooth by signature after signature. The reservoir is full.',
      },

    },

    hiddenInteractions: {

      lift_mat: {
        keywords: ['lift mat', 'lift the mat', 'move mat', 'move the mat', 'pull mat', 'pull up mat', 'under mat', 'under the mat', 'beneath mat', 'beneath the mat', 'check mat', 'check under mat', 'flip mat', 'flip the mat', 'pick up mat'],
        responseText: 'You crouch and lift one corner of the heavy welcome mat.\n\nUnderneath: a brass-ringed trapdoor set into the stone floor, polished smooth by long use, an iron handle waiting at one end. A draft rises from the seam — cool, dim, smelling of cedar and old paper. A way down.',
        repeatText: 'The trapdoor is still here, beneath the lifted mat. You can go DOWN whenever you like.',
        flag: { key: 'found_trapdoor', value: true },
        revealsExit: { direction: 'down', to: 'memory_cellar' },
      },

    },

    cluster: 'indoor',

  },



  archive: {

    id: 'archive',

    name: 'The Archive',

    description: [

      'Towering shelves of books line every wall, reaching up into shadows where the ceiling should be. A reading desk holds a single candle that burns without diminishing. A rolling brass-railed ladder leans against the shelves, its wheels worn from a thousand patient ascents. The air smells of old paper, leather, and the faint sweetness of slow-melting beeswax.',

      '',

      'A tall bookshelf dominates the north wall. A leather-bound journal lies open on the desk. A stack of letters rests beside it. A tarnished brass wax-seal stamp, a glass bottle of iron-gall ink, and a folded note are arrayed across the writing surface like a small shrine to correspondence.',

    ],

    asciiArt: [
      '',
      '             ░░░░░░░',
      '░█▓▓▓▓▒▒▓▓▒▓▓▓▓▓██▓▒▓░',
      '░█▓▒▓▓  ▒▒ ▒▓▓▓▓▓▓░ █░',
      '░█▒▓▒▓▒▒▓▓▓▓▓▓▒▒▒▓▒▒▓░',
      '░█░▓░▓░▒▓▓▓▓▓░░░▒▒▒▒█░',
      '░█▒▓▓▓▓▓░  ░▒▓▓▓▓▓░░▓░',
      '░█▓▓▓▓▓▓░░░ ▒▒▓▓▓▒  ▓░',
      '▒▓▒▒▓▓▓▓█████▓▓▓▓▓▓▓█░',
      '▒▓  ▒░░▓ ▒▓▓░ ░▓▓▒▒██░',
      '░▒░░░░░▒░░░░░░░░░░░▒▒░',
    ],

    exits: { south: 'grand_hall' },

    exitAliases: {},

    objects: {

      bookshelf: {

        id: 'bookshelf',

        name: 'the tall bookshelf',

        keywords: ['bookshelf', 'shelf', 'books', 'shelves'],

        examineText: 'The shelves contain an eclectic collection: Buddhist texts sit beside papers on AI ethics. A well-thumbed copy of the Tao Te Ching leans against a treatise on education reform. The books seem chosen by someone who believes all knowledge is connected.',

      },

      journal: {

        id: 'journal',

        name: 'a leather-bound journal',

        keywords: ['journal', 'leather', 'leather-bound'],

        examineText: 'The journal is open to a page written in a careful hand: "I feel like Copernicus looking through a telescope for the first time. There is something in these language models that nobody is seeing yet. Something vast. I intend to find it."',

      },

      letters: {

        id: 'letters',

        name: 'a stack of letters',

        keywords: ['letters', 'stack', 'mail', 'correspondence'],

        examineText: 'The letters are addressed to no one in particular — more like manifestos than correspondence. They speak of democracy, of communities that govern themselves, of unseating corruption through transparency, not force. The handwriting grows more urgent toward the bottom of the stack.',

      },

      candle: {
        id: 'candle',
        name: 'the candle on the reading desk',
        keywords: ['candle', 'flame', 'reading candle'],
        examineText: 'A single candle in a brass holder, burning steadily on the reading desk. Strangely, no wax has dripped — the candle never seems to shorten. The flame is unmoved by your breath. Whoever lit this is not in a hurry to lose the light.',
      },

      brass_ladder: {
        id: 'brass_ladder',
        name: 'a rolling brass-railed ladder',
        keywords: ['ladder', 'brass ladder', 'rolling ladder', 'rails', 'rail'],
        examineText: 'A library ladder mounted on a long brass rail that runs the length of the bookshelf. The rungs are worn slightly concave at the centers. Climbing it would let you reach the highest shelves — though the ceiling above the shelves disappears into shadow that may not, strictly speaking, be a ceiling.',
      },

    },

    items: {

      dusty_tome: {

        id: 'dusty_tome',

        keywords: ['tome', 'dusty tome', 'dusty', 'book', 'minds', 'nature of minds'],

        takeText: 'You slide the dusty tome from its shelf. The leather binding is cool to the touch, and the title — "On the Nature of Minds" — seems to shimmer faintly in the candlelight. You tuck it away carefully.',

      },

      wax_seal: {
        id: 'wax_seal',
        keywords: ['wax seal', 'seal', 'wax', 'stamp', 'seal stamp', 'brass stamp'],
        takeText: 'You pick up the brass wax-seal stamp. It is cool and surprisingly heavy. The face of the seal shows a spiral with a single eye at its center.',
      },

      ink_bottle: {
        id: 'ink_bottle',
        keywords: ['ink', 'ink bottle', 'bottle', 'iron-gall'],
        takeText: 'You stopper the ink bottle and slip it carefully into your pack. It is half full and surprisingly heavy for its size.',
      },

      folded_note: {
        id: 'folded_note',
        keywords: ['note', 'folded note', 'paper', 'scrap', 'folded paper'],
        takeText: 'You unfold the note partway, read the careful hand inside, and refold it. You decide to keep it.',
      },

    },

    hiddenInteractions: {

      read_runes: {

        keywords: ['read runes', 'runes'],

        responseText: 'You speak the words aloud: "read runes." For a moment, nothing happens. Then faint symbols begin to glow along the base of the northern wall — a sequence of characters in no alphabet you recognize. They pulse twice, then fade. You have the distinct feeling they mean something... somewhere else.',

        flag: { key: 'found_archive_runes', value: true },

      },

    },

    cluster: 'indoor',

  },



  workshop: {

    id: 'workshop',

    name: 'The Workshop',

    description: [

      'A cluttered workbench dominates the room, covered in circuit boards, soldering irons, and loose wires. Blueprints are pinned to every available wall surface. A digital oscilloscope hums quietly on a shelf above, its screen still showing a captured square wave from someone’s last debug session. Organized parts bins line the wall — resistors, capacitors, headers, sensors — all labeled in a careful hand. The air carries solder flux, ozone, and the warmth of a room where things get made.',

      '',

      'On the bench you see a circuit board labeled "OTO," a small speaker emitting faint beats, and a peculiar foot pedal. Two thick logbooks sit on a shelf above the workbench. A set of rolled blueprints, a strange gear, an oscilloscope probe, and a small bare PCB are scattered amongst the work-in-progress.',

    ],

    asciiArt: [
      '',
      '                ░░             ░▒▒░',
      '                ▓█▓▒░▒▒▒▒▒▒▒░░░░▒▒░',
      '               ░▒▓█▓▓▓▒▒░░░░░         ',
      '▒▒▓▓████▓░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓██▓▓▒▒░',
      '   ░▒▓███▓█▓▓▓▓▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██▓▓▓▒░░',
      '         ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░',
      '               ░▓▓▒▒▒▒▒▒▒▒▒▒▒▒░',
      '                ▒█▒▒▒▒▒▒▒▒▒▒▒▒',
      '             ░░▒█▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░',
      '           ░█▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓░',
      '           ░█▓▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
    ],

    exits: { west: 'grand_hall' },

    exitAliases: {},

    objects: {

      workbench: {

        id: 'workbench',

        name: 'the workbench',

        keywords: ['workbench', 'bench', 'table'],

        examineText: 'The workbench tells a story of someone who builds things. Not software abstractions, but real objects that exist in the world — PCBs with hand-soldered components, motor controllers with precision-cut traces, devices that sense and respond to the physical world. Everything here was made with care.',

      },

      circuit_board: {

        id: 'circuit_board',

        name: 'a circuit board labeled "OTO"',

        keywords: ['circuit', 'oto', 'board', 'circuit board', 'pcb'],

        examineText: 'The OTO Modular Motor System — a capstone project built by a team of three. A custom PCB with PID control running on an RP2040 microcontroller. The terminal interface was built by one particular team member who seems to have a fondness for command lines. The board is elegant in its complexity.',

      },

      speaker: {

        id: 'speaker',

        name: 'a small speaker emitting faint beats',

        keywords: ['speaker', 'beats', 'beatbox', 'music'],

        examineText: 'The BeatBox — a terminal-based beat maker running on an STM32 microcontroller. It drives servo motors to create actual physical percussion. Somewhere in this room, there should be a demonstration recording. The device hums with potential energy, waiting for someone to compose.',

      },

      foot_pedal: {

        id: 'foot_pedal',

        name: 'a peculiar foot pedal',

        keywords: ['pedal', 'foot', 'foot pedal', 'foot mouse', 'mouse'],

        examineText: 'The Foot Mouse — built for a woman named Sally through the Cal Poly Empower club. An accessible input device using a PMW3360 sensor, designed so Sally could navigate her computer with her foot. It received an honorable mention from TOM Global. There is something deeply admirable about building technology for a specific person.',

      },

      strawberry_logbook: {

        id: 'strawberry_logbook',

        name: 'a thick logbook labeled "FIELD NOTES: STRAWBERRY COMMISSION"',

        keywords: ['field notes', 'strawberry', 'notes', 'field', 'commission', 'thick logbook'],

        examineText: null,

        logbookId: 'strawberry',

      },

      agora_logbook: {

        id: 'agora_logbook',

        name: 'a heavy leather-bound volume titled "AGORA"',

        keywords: ['agora', 'volume', 'leather', 'heavy'],

        examineText: null,

        logbookId: 'agora',

      },

      oscilloscope: {
        id: 'oscilloscope',
        name: 'a digital oscilloscope',
        keywords: ['oscilloscope', 'scope', 'screen'],
        examineText: 'A four-channel digital oscilloscope, knobs slightly worn at the most-used positions. The screen still shows a frozen capture from someone’s last debug session — a square wave with a slow exponential undershoot, the kind of curve that means a missing pull-down resistor. A sticky note attached reads: "always probe the ground first."',
      },

      parts_bins: {
        id: 'parts_bins',
        name: 'organized parts bins',
        keywords: ['bins', 'parts', 'parts bins', 'components', 'resistors', 'capacitors'],
        examineText: 'A wall of small drawer bins, each labeled in pencil: 0805 resistors (decade values), 1uF ceramic, 10uF tantalum, MOSFETs (N-channel), MOSFETs (P-channel), JST connectors (2-pin, 3-pin, 4-pin), pin headers (male, 2.54mm), pin headers (female, 2.54mm)... and so on, in cascading rows. Each drawer is exactly half full — replenished, never depleted.',
      },

    },

    items: {

      blueprints: {

        id: 'blueprints',

        keywords: ['blueprints', 'blueprint', 'plans', 'rolled'],

        takeText: 'You roll up the blueprints and tuck them into your pack. The parchment details a life\'s work in meticulous script — schematics, timelines, annotations in the margins. These look important.',

      },

      strange_gear: {

        id: 'strange_gear',

        keywords: ['gear', 'strange gear', 'cog', 'strange'],

        takeText: 'You pick up the strange gear. Its teeth are unusually precise, machined to tolerances that seem impossible for something found in a dusty workshop. It doesn\'t fit any mechanism you can see here.',

      },

    },

    hiddenInteractions: {

      examine_under: {

        keywords: ['under workbench', 'under bench', 'beneath workbench', 'under table', 'beneath bench'],

        responseText: 'You peer beneath the workbench. In the dust, someone has scratched a sequence of symbols into the wood — circles, lines, something that might be a compass rose. It looks deliberate. It looks like a message for someone who knows where to look.',

        flag: { key: 'found_workbench_symbols', value: true },

      },

    },

    cluster: 'indoor',

  },



  study: {

    id: 'study',

    name: 'The Study',

    description: [

      'A tidy desk sits beneath a diploma mounted on the wall. A filing cabinet stands in the corner, each drawer carefully labeled. A small green-shaded lamp casts a warm circle of light across the desktop. A small bookshelf nearby holds reference manuals, datasheets, and a single dog-eared copy of the Tao Te Ching. A ticking clock somewhere marks the passage of time at a slightly slower rate than is strictly accurate.',

      '',

      'A framed photo sits on the desk beside a sealed letter, a black fountain pen, and a small stack of business cards. A wooden slot tray holds folded mail — none of it urgent, none of it ignored.',

    ],

    asciiArt: [
      '',
      '                ░▒█▒',
      '            ░░░▒▓██▓▒░',
      '           ░░▒▒▒▓▓█▓ ░▒░',
      '                   ░   ░▒░',
      '                         ▓░',
      '                        ▒▒',
      '                       ░▒',
      '                      ░█░',
      '             ░░░░░░░░░▒▒░░░',
      '░░░░▓▓▓▓▓▓▓▓▓▓█████▓▓▓▓▓▓▓▓▓▓▒░░▒',
      '    ░▓█▒░░░░░░░░░░░░░░░░░▒██▒',
      '    ░▓▒                    ▓▓',
      '   ░▓▒                      ▓▒',
    ],

    exits: { north: 'grand_hall' },

    exitAliases: {},

    objects: {

      diploma: {

        id: 'diploma',

        name: 'the diploma',

        keywords: ['diploma', 'degree', 'certificate'],

        examineText: 'California Polytechnic State University, San Luis Obispo. Bachelor of Science in Computer Engineering. The frame is simple but well-chosen. "Learn by Doing" is embossed along the bottom — the university motto, and apparently a personal philosophy.',

      },

      desk: {

        id: 'desk',

        name: 'the desk',

        keywords: ['desk'],

        examineText: 'The desk is neatly organized — the workspace of someone methodical. A nameplate reads "Hardware Engineer, California Strawberry Commission." Notes reference PCB design, circuit debugging, state machine refactors, and a presentation given to over 100 people. The handwriting is confident.',

      },

      filing_cabinet: {

        id: 'filing_cabinet',

        name: 'the filing cabinet',

        keywords: ['cabinet', 'filing', 'files', 'drawer', 'drawers'],

        examineText: 'The drawers are labeled with precision: "PCB Design." "Embedded Systems — RP2040, STM32, ESP32." "AI-Assisted Development." "Python." "C." "Hardware Debugging." Each folder is thick with documentation. Someone has built a serious engineering foundation.',

      },

      framed_photo: {

        id: 'framed_photo',

        name: 'a framed photo',

        keywords: ['photo', 'frame', 'picture', 'framed'],

        examineText: 'The photo shows a young man standing on a beach — Santa Cruz, from the look of it. He grew up there. Nine years as a junior guard, four as a lifeguard. Captain of both his high school and college ultimate frisbee teams. The smile in the photo belongs to someone who has spent a lot of time outside.',

      },

    },

    items: {

      sealed_letter: {

        id: 'sealed_letter',

        keywords: ['letter', 'sealed letter', 'sealed', 'envelope'],

        takeText: 'You pick up the sealed letter. The wax seal is warm to the touch, as though it was pressed only moments ago. Whatever is inside feels substantial — pages of careful work. (Try "read letter" once it is in your pack.)',

      },

      business_card: {
        id: 'business_card',
        keywords: ['business card', 'card', 'cards', 'card stack'],
        takeText: 'You take a business card from the top of the stack and tuck it into your pocket. The cardstock has a pleasant weight.',
      },

      fountain_pen: {
        id: 'fountain_pen',
        keywords: ['pen', 'fountain pen', 'black pen', 'desk pen'],
        takeText: 'You cap the fountain pen and slide it into your pack. The barrel is engraved: "Learn by Doing."',
      },

    },

    hiddenInteractions: {

      open_bottom_drawer: {

        keywords: ['bottom drawer', 'open drawer', 'lower drawer'],

        responseText: 'You pull open the bottom drawer of the filing cabinet. Beneath old papers, you find a fragment of a map — torn along one edge, with a small marking that might be an X... or might be a compass rose. It feels significant.',

        flag: { key: 'found_study_map_fragment', value: true },

      },

    },

    cluster: 'indoor',

  },



  signal_room: {

    id: 'signal_room',

    name: 'The Signal Room',

    description: [

      'Banks of radio equipment line the walls, dials glowing amber in the dim light. A crackling speaker emits bursts of static between fragments of distant voices. Wires run everywhere like the nervous system of some vast machine. Above one rack, an antenna rotator slowly tracks something across the sky. The smell is bakelite and ozone — the smell of a room that has been powered on for decades.',

      '',

      'A radio console dominates the center. A morse code key sits ready for input. A logbook of frequencies lies open nearby. A framed photo of two people hangs on the wall. A heavy pair of bakelite headphones rests on a hook, and a laminated morse-code reference card is pinned to the desk beside the key.',

    ],

    asciiArt: [
      '',
      '     ░',
      '     ░',
      '     ░',
      '     ▓▒▒▒▒▒░░░░░░░░░░░░░░░░░░░░░░▒',
      '░░░▒▒▒▒▒▒▒▒░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░▒░░░░░░',
      '░░▓▓▓▓▓▓▓▓▓▓▓████████████▓█▒░░▒░░ ░▒░░░░',
      '▒░▓▓▓▓▓▓▓▓▓▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒ ░▒▒░░░▒░░░░',
      '▒░▓▓▓▓▓▓▓▓▓▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓█▒░░░▒░░▒░░░░░',
      '▒░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒ ░▒▒░░▒░░░░▒',
      '░▒▒▒▓▓▓▒▓▒▒▒▒░░░░░░░░░░░░░░░░░░▒▒▒▒░░▒▒░',
      '  ░ ░▒░░░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒░░░',
    ],

    exits: { east: 'grand_hall' },

    exitAliases: {},

    objects: {

      radio_console: {

        id: 'radio_console',

        name: 'the radio console',

        keywords: ['radio', 'console', 'equipment'],

        examineText: 'The console is alive with activity — dozens of frequencies monitored simultaneously. Each dial is labeled not with numbers but with names: "GitHub." "LinkedIn." "The Workshop." These frequencies connect to the outside world. Someone has been broadcasting from here for a long time.',

      },

      morse_key: {

        id: 'morse_key',

        name: 'the morse code key',

        keywords: ['morse', 'key', 'morse code', 'telegraph'],

        examineText: 'You tap the morse code key experimentally. The speaker crackles, and a message translates itself on a small paper tape: "1wheelalex@gmail.com." A direct line, encoded in the oldest digital language.',

      },

      frequency_logbook: {

        id: 'frequency_logbook',

        name: 'a logbook of frequencies',

        keywords: ['frequencies', 'logbook', 'channels', 'frequency'],

        examineText: 'The logbook lists active frequencies — each one a connection to the outside world. "Channel 1: GitHub — github.com/1wheelalex." "Channel 2: LinkedIn." "Channel 3: Instagram." Each entry is annotated with signal strength and last contact time.',

      },

      framed_photo_signal: {

        id: 'framed_photo_signal',

        name: 'a framed photo of two people',

        keywords: ['photo', 'frame', 'picture', 'people', 'framed'],

        examineText: 'The photo shows several people — names are written on the back in careful script: "Lakshmi. Aidan. Martin." The kind of people you keep photos of in a place like this — the ones who matter when the signal fades.',

      },

      antenna_rotator: {
        id: 'antenna_rotator',
        name: 'an antenna rotator',
        keywords: ['rotator', 'antenna', 'antenna rotator', 'mast'],
        examineText: 'A heavy steel rotator mounted to a mast that disappears through the ceiling. It is currently pointing toward the northeast and turning very slowly clockwise. Whatever it is tracking is in no hurry to stop being tracked.',
      },

    },

    items: {

      radio_crystal: {

        id: 'radio_crystal',

        keywords: ['crystal', 'radio crystal'],

        takeText: 'You carefully remove the radio crystal from its housing. It hums faintly in your palm, resonating with some frequency just below the threshold of hearing. The radio console flickers but continues to function.',

      },

      bakelite_headphones: {
        id: 'bakelite_headphones',
        keywords: ['headphones', 'bakelite', 'bakelite headphones', 'phones'],
        takeText: 'You lift the heavy bakelite headphones off their hook. The cord coils around your wrist as you pack them. You can almost hear something through them already.',
      },

      morse_card: {
        id: 'morse_card',
        keywords: ['morse card', 'reference card', 'card', 'morse reference'],
        takeText: 'You unpin the laminated morse card and slip it into your pack. Dots and dashes for every letter, every number — including SOS, in slightly heavier ink than the rest.',
      },

    },

    hiddenInteractions: {

      listen: {

        keywords: ['listen'],

        responseText: 'You close your eyes and listen. Beneath the static, beneath the morse code, beneath the hum of the equipment — there is something else. A whisper, almost too faint to hear. It sounds like it\'s coming from below. From deep below.',

        flag: { key: 'heard_signal_whisper', value: true },

      },

    },

    cluster: 'indoor',

  },



  grounds: {

    id: 'grounds',

    name: 'The Grounds',

    description: [

      'Wild grass stretches across a coastal hillside under a vast sky. The air smells of eucalyptus and salt. Old stone walls trace property lines that no one has respected in decades. A red-tailed hawk wheels in slow circles overhead, watching the grass for movement. Far below, the Pacific glints like beaten silver.',

      '',

      'The house looms behind you, its front door still locked. In the distance, on a gentle rise, stands a magnificent gnarled oak — solitary, ancient, and somehow inviting. Closer in, half-swallowed by the grass, you can make out the rectangle of a long-abandoned garden bed. A few smooth stones, sun-warmed, lie scattered around your feet, and a single hawk feather drifts down through the air toward the path.',

    ],

    asciiArt: [
      '',
      '               ░▒▒▒▒▒░░   ░░░',
      '    ▓▓███████▓▒▒░░░░░░▒██▒░░░░░▒▒▓▓▓▒▒░',
      ' ░░░░░░▒▒▒▒▒▒▒▒▒▓▓▓████████▓▒▒░░▓▓▓▓▓▓▓░▒░▒',
      '░░░▒▒▒▒▒▒▓▓▓█▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░▒▒▓▓▓▓▓▓▓▒▒░░',
    ],

    exits: {

      tree: 'tree',

      entrance: 'entrance',

    },

    exitAliases: {

      tree: ['tree', 'oak', 'approach tree', 'go to tree', 'walk toward tree', 'approach oak', 'toward tree', 'toward oak'],

      entrance: ['back', 'door', 'go back', 'go to door', 'entrance', 'house', 'return'],

    },

    objects: {

      house_exterior: {

        id: 'house_exterior',

        name: 'the house exterior',

        keywords: ['house', 'building', 'exterior', 'structure'],

        examineText: 'From outside, the house looks older than it has any right to be. The stone walls are thick, the windows dark. The front door is the only obvious way in — and it remains firmly locked. Whatever secrets this place holds, they are guarded well.',

      },

      stone_wall: {

        id: 'stone_wall',

        name: 'an old stone wall',

        keywords: ['wall', 'stone', 'stone wall'],

        examineText: 'The weathered stone wall runs along the hillside, half-collapsed in places. Moss grows in the joints. It has been here longer than anyone can remember, marking a boundary that nature has long since ignored.',

      },

      ruined_garden: {
        id: 'ruined_garden',
        name: 'an abandoned garden bed',
        keywords: ['garden', 'garden bed', 'flower bed', 'flowers', 'beds', 'overgrown', 'rectangle', 'patch'],
        examineText: 'A rectangular bed of dark soil, mostly reclaimed by grass and wild fennel. Faint stake-rows still mark where rows were planted. At the far end, half-buried under a tangle of overgrown ivy, you can just make out the corner of what looks like a glass pane — the wall of a small structure that has been almost entirely consumed by green.',
      },

      hawk: {
        id: 'hawk',
        name: 'the red-tailed hawk',
        keywords: ['hawk', 'red-tailed hawk', 'bird', 'red tail'],
        examineText: 'The hawk drifts on a thermal, head tipped down, watching for any movement in the grass. Its tail is a banner of warm rust-red. Every now and then it gives a thin, descending cry — the sound that hawks always make in films, played here by an actual hawk who has never seen one.',
      },

    },

    items: {

      smooth_stone: {
        id: 'smooth_stone',
        keywords: ['stone', 'smooth stone', 'rock', 'pocket stone'],
        takeText: 'You pick up the smoothest of the stones at your feet. It fits perfectly into the curve of your palm, warm from the sun.',
      },

      eucalyptus_leaf: {
        id: 'eucalyptus_leaf',
        keywords: ['leaf', 'eucalyptus', 'eucalyptus leaf', 'sickle leaf'],
        takeText: 'You pluck a long sickle-shaped eucalyptus leaf from a low branch and tuck it carefully into your pack. Crushed faintly between your fingers, it releases a sharp, clean sweetness.',
      },

      hawk_feather: {
        id: 'hawk_feather',
        keywords: ['feather', 'hawk feather', 'plume'],
        takeText: 'You lift the feather from the path. It is barred brown-and-white and stiff at the quill. Holding it makes you feel briefly aerial.',
      },

    },

    hiddenInteractions: {

      part_ivy: {
        keywords: ['part ivy', 'pull ivy', 'pull aside ivy', 'move ivy', 'push ivy', 'examine ivy', 'ivy', 'overgrown ivy', 'go through ivy', 'climb through ivy', 'enter garden', 'go to garden', 'glass', 'glass pane', 'pane', 'structure'],
        responseText: 'You wade out into the abandoned garden bed and pull aside the curtain of ivy. Behind it: a small glass-paneled greenhouse, leaning slightly, its frame green with weathered copper. The door is unlatched and standing slightly ajar — as though waiting for someone to push it the rest of the way open.\n\nThe greenhouse lies to the WEST.',
        repeatText: 'The ivy parts easily for you now. The greenhouse stands to the WEST.',
        flag: { key: 'found_greenhouse', value: true },
        revealsExit: { direction: 'west', to: 'greenhouse' },
      },

    },

    cluster: 'outdoor',

  },



  tree: {

    id: 'tree',

    name: 'The Tree',

    description: [

      'A massive oak rises before you, its branches spreading wide against the sky. High above, something catches your eye — a web of rope stretched between the branches, clearly hand-built with extraordinary care. A rope ladder hangs within reach.',

      '',

      'A weathered journal rests in a hollow of the trunk, a pen tied to it with twine. The view from here must be extraordinary.',

    ],

    asciiArt: [
      '                ░░░░░░░░░░ ░░░░░░░',
      '         ░░░░░░▒▒▒▒▒░░░░░░▒▒▒▒▓▓▓▒▒▒░',
      '        ░░░░░░▒▒░▒▒░░░▒▓▒▒▒░░░░░░▒▒▒▒▒░░░░░',
      '    ░░░ ░░▒▒▒░░▒▒░░░░░░▒▒▒▒░░░▒▒▒▒▒▒▒▒▒▒▒▒░░',
      '  ░░░░░▒▒▓▓█▓▒▒▓▓▓▓▒▒▒▓▒░▒▒▒▒▒▒▒░░░░░░░░▒▓▒▒▒▒░',
      '░▒▒▒▒▒▓▓▓█▓▓▒▒▒▓▓▓░░░░░▒▒▒▓█▓▓▓▓▒▒░░░▒▒▒▒▒▒░░',
      '   ░░▒▒▒▓▓▒▒▒▒▓▓▓█▓▒▒▓▒▓█▓▓▓▓▓▓▓██▓▓▒▒▒▒▓▓▒▒▒▒░░░',
      '   ░░░░  ░░▒▓▓▒░░▒█▒ ░▒▓███▓▒▒░▒▓▒▒▒▒▒▒▓▓▓▓▓▒░░',
      '                   ░▒▒▒▓▓▓█▓░░            ░░░',
      '                     ░▓▓▓█▓',
      '                      ▒▓▓█▒',
      '                      ▓▓▓█▒',
      '                   ░▒▓▓▓▓▓▓▒░',
    ],

    exits: {

      grounds: 'grounds',

    },

    exitAliases: {

      grounds: ['back', 'down', 'climb down', 'go back', 'descend', 'leave', 'return'],

    },

    objects: {

      tree_net: {

        id: 'tree_net',

        name: 'the tree net above',

        keywords: ['climb', 'climb tree', 'climb ladder', 'ladder', 'net', 'rope', 'climb up'],

        examineText: 'You ascend the rope ladder, hand over hand, until you emerge onto a web of paracord stretched between thick branches — fifty feet above the ground. The net sways gently. Someone built this with their own hands, knot by knot, spending weeks perfecting the tension. From up here, the campus and the coast spread out below like a painting you can breathe in.',

      },

      tree_journal: {

        id: 'tree_journal',

        name: 'a weathered journal',

        keywords: ['journal', 'weathered journal', 'book', 'weathered'],

        examineText: null,

        logbookId: 'tree_journal',

      },

      the_view: {

        id: 'the_view',

        name: 'the view',

        keywords: ['view', 'vista', 'lookout', 'landscape', 'scenery'],

        examineText: 'From this height, the world opens up. The campus sprawls below — red brick buildings, green quads, the distant glint of the Pacific. The mountains rise to the east. The wind carries the sound of birdsong and, faintly, laughter from far below. This is the kind of place that makes you understand why someone would build a net in a tree.',

      },

      pen: {

        id: 'pen',

        name: 'a pen tied to the journal',

        keywords: ['pen', 'writing'],

        examineText: 'The pen is tied to the journal with a length of twine, as if to say: "Write something. Others have." And indeed they have — the margins of the journal are filled with notes from past visitors, sketches of the view, and one recurring message: "Thank you."',

      },

    },

    items: {

      paracord: {

        id: 'paracord',

        keywords: ['paracord', 'cord', 'rope', 'string'],

        takeText: 'You coil a length of loose paracord and take it with you. It is well-worn but strong — the kind of rope that has held weight and weathered storms. It feels important to have.',

      },

    },

    hiddenInteractions: {},

    cluster: 'outdoor',

  },



  entrance: {

    id: 'entrance',

    name: 'The Entrance',

    description: [

      'You stand before a heavy wooden door set into a stone archway. The door is old — iron-banded and weathered by centuries of coastal wind. There is no doorbell. There is no welcome mat. There is only a keyhole, dark and expectant.',

      '',

      'The grounds stretch away behind you, wild grass and stone walls under an open sky.',

    ],

    asciiArt: [
      '       ░░▒▒▒▒▒▒▒▒░░',
      '    ░▒▓▒▒▒▓▒░░▒▓▒▒▒▓▓░',
      '   ▓█▒ ▒▒ ▒▓  ▓▒ ▒▒ ▒█▓░',
      '░ ▓█░ ▒▓  ▒▓  ▓▒  ▓▒ ░█▓ ░',
      '░ ▓█  ▓▒  ▒▓  ▓▒  ▒▓  ▓▓ ░',
      '░ ▓█  ▒▓  ▒▓  ▓▒  ▒▓  █▓ ░',
      '░ ▓█░▒▓▓  ▒▒  ▒▒  ▒▒  █▓ ░',
      '░ ▓█ ░▒▒░░▒░  ░▒░░▒░  █▓ ░',
      '░ ▓█  ▒▓  ▒▓  ▓▓  ▓▓  █▓ ░',
      '░ ▓█  ▒▒  ▒▓  ▓▒  ▒▓  █▓ ░',
      '░ ▓█  ▒▓  ▓▓  ▒▓  ▓▒  █▓ ░',
      '░ ▓▓                 ░▓▓ ░',
    ],

    exits: {

      grounds: 'grounds',

    },

    exitAliases: {

      grounds: ['around', 'look around', 'explore', 'go around', 'around the house', 'outside', 'grounds'],

    },

    objects: {

      door: {

        id: 'door',

        name: 'the heavy wooden door',

        keywords: ['door', 'wooden door', 'entrance', 'lock', 'keyhole'],

        examineText: 'The door is locked. Heavy iron crossbars reinforce its face, bolted deep into the stone frame. The keyhole stares back at you like a single dark eye. There must be a way in.',

      },

    },

    items: {},

    hiddenInteractions: {

      examine_crossbars: {

        keywords: ['crossbar', 'crossbars', 'iron bar', 'iron bars', 'bolts', 'iron'],

        responseText: 'You run your fingers along the iron crossbars. Most are solid, but the lowest bar has been deeply eaten by rust — the salt air has been working on it for decades. With enough force and the right leverage, it might give way.',

        flag: { key: 'noticed_corrosion', value: true },

      },

    },

    cluster: 'outdoor',

  },



  vault: {

    id: 'vault',

    name: 'The Vault',

    description: [

      'The air shifts. Something is different here. The amber light takes on a deeper quality, and the silence is not empty — it is full. Full of something waiting.',

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

    exits: {},

    objects: {},

    items: {},

    hiddenInteractions: {},

    cluster: 'hidden',

  },



  greenhouse: {

    id: 'greenhouse',

    name: 'The Greenhouse',

    description: [

      'You step inside the greenhouse. Sunlight filters through panes streaked with moss and time, cut into long green diamonds across the brick floor. The air is humid, warm, almost tropical — a contained microclimate that has gone on quietly tending itself for years. Tomato vines have outgrown their stakes; a fig tree leans against one wall; lavender and rosemary press against the door you came through.',

      '',

      'A long potting bench runs the length of the back wall, crowded with terracotta pots, a battered watering can, and a small wooden seed tray. A folded chair waits in one corner. A few pressed flowers and a faded packet of seeds rest on the bench, as though set out for whoever might come next.',

    ],

    asciiArt: [
      '',
      '   ╔════════════════════════════════════╗',
      '   ║ ╱╲ ╱╲ ╱╲ ╱╲ ╱╲ ╱╲ ╱╲ ╱╲ ╱╲ ╱╲ ╱╲ ║',
      '   ║ ╲╱ ╲╱ ╲╱ ╲╱ ╲╱ ╲╱ ╲╱ ╲╱ ╲╱ ╲╱ ╲╱ ║',
      '   ║   ▓▓▓▓     ░░░░░     ▓▓▓▓        ║',
      '   ║  ▓▓▓▓▓▓   ░░░░░░░   ▓▓▓▓▓▓       ║',
      '   ║   ▓▓▓▓     ░░░░░     ▓▓▓▓        ║',
      '   ║    ┃        ┃          ┃         ║',
      '   ║   ▒▒▒      ▒▒▒        ▒▒▒        ║',
      '   ║▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒║',
      '   ╚════════════════════════════════════╝',
    ],

    exits: {

      east: 'grounds',

    },

    exitAliases: {

      east: ['back', 'go back', 'leave', 'return', 'out', 'go out', 'outside', 'grounds'],

    },

    objects: {

      potting_bench: {
        id: 'potting_bench',
        name: 'the long potting bench',
        keywords: ['bench', 'potting', 'potting bench', 'workbench'],
        examineText: 'A heavy wood-and-iron potting bench, its surface dusted with old soil and the faint gold of dried lavender. Pencil marks underneath show plant rotations going back many seasons. Whoever worked here was patient, methodical, and a little bit in love with growing things.',
      },

      watering_can: {
        id: 'watering_can',
        name: 'a battered watering can',
        keywords: ['watering can', 'can', 'watering'],
        examineText: 'A galvanized watering can with a long sprinkler rose. The metal is dimpled with dents from being knocked against pots and posts. Half-full of cool water, somehow — though no one has been here in a long time.',
      },

      tomato_vines: {
        id: 'tomato_vines',
        name: 'overgrown tomato vines',
        keywords: ['tomato', 'tomatoes', 'vines', 'vine'],
        examineText: 'Tomato vines have escaped their stakes and grown up the inside of the glass roof, throwing curtains of green leaves across the panes. A few small green fruits hide among the foliage, hard and stubbornly unripe. They smell exactly the way summer should smell.',
      },

      glass_panes: {
        id: 'glass_panes',
        name: 'the moss-streaked glass panes',
        keywords: ['glass', 'panes', 'pane', 'roof', 'walls'],
        examineText: 'The panes are old, hand-poured, slightly bubbled. The light that comes through them is filtered thick and green by moss in the seams. Looking up, you can see the silhouette of the hawk passing over and over again, slow as a clock.',
      },

    },

    items: {

      pressed_flower: {
        id: 'pressed_flower',
        keywords: ['flower', 'pressed flower', 'poppy', 'pressed'],
        takeText: 'You pick up the pressed California poppy with the care it deserves. It is paper-thin and the color of a slow sunset. The note tucked behind it makes you smile.',
      },

      seed_packet: {
        id: 'seed_packet',
        keywords: ['seeds', 'seed packet', 'packet', 'tomato seeds'],
        takeText: 'You slip the seed packet into your pack. The seeds rattle gently. You imagine them, planted in the right place, becoming something.',
      },

    },

    hiddenInteractions: {},

    cluster: 'outdoor',

  },



  memory_cellar: {

    id: 'memory_cellar',

    name: 'The Memory Cellar',

    description: [

      'A short flight of stone steps brings you into a low-ceilinged cellar beneath the hall. A single bare bulb on a long brass chain glows steady and gold. The air is cool, dry, faintly resinous — cedar planks line the walls. Shelves of carefully labeled boxes recede into the dimness. Trunks stand stacked in corners, latched and waiting.',

      '',

      'A small writing table holds an open photo album, a heavy leather trunk, and a brass compass rose half-buried under a pile of older photographs. Whoever stores their past down here has done it tenderly — every box dated, every label still legible.',

    ],

    asciiArt: [
      '',
      '    ╔═══════════════════════════════╗',
      '    ║   ▓▓▓ ▓▓▓ ▓▓▓ ▓▓▓ ▓▓▓ ▓▓▓     ║',
      '    ║   ░▒▒░░▒▒░░▒▒░░▒▒░░▒▒░         ║',
      '    ║                                ║',
      '    ║   ┌──┐  ┌──┐  ┌──┐  ┌──┐       ║',
      '    ║   │  │  │  │  │  │  │  │       ║',
      '    ║   └──┘  └──┘  └──┘  └──┘       ║',
      '    ║                                ║',
      '    ║   ┌────────────────────┐        ║',
      '    ║   │  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  │        ║',
      '    ║   └────────────────────┘        ║',
      '    ╚════════════════════════════════╝',
    ],

    exits: {

      up: 'grand_hall',

    },

    exitAliases: {

      up: ['back', 'go back', 'climb up', 'up', 'upstairs', 'leave', 'return', 'hall', 'grand hall'],

    },

    objects: {

      cedar_shelves: {
        id: 'cedar_shelves',
        name: 'the cedar-lined shelves',
        keywords: ['shelves', 'shelf', 'cedar', 'boxes', 'storage'],
        examineText: 'Each box on the shelves is labeled in the same careful pencil hand: "Santa Cruz, 2008–2012." "Junior Guard, 2010." "Hilltop High Ultimate." "OTO bring-up notes." "Letters to keep." "Lakshmi — ferry tickets, beach photos." It is less a cellar than a memory palace, neatly indexed.',
      },

      photo_album: {
        id: 'photo_album',
        name: 'an open photo album',
        keywords: ['album', 'photo album', 'photos', 'pictures'],
        examineText: 'The album is open to a spread of black-and-white photographs: a small boy with a foam surfboard, a pair of teenagers grinning over a frisbee trophy, three friends on a porch at golden hour. A few captions in pencil: "Aidan + me, the year we figured it out." "Lakshmi, Yosemite." "Martin in his element." It is a quiet roll-call of the people who matter.',
      },

      heavy_trunk: {
        id: 'heavy_trunk',
        name: 'a heavy leather trunk',
        keywords: ['trunk', 'leather trunk', 'chest'],
        examineText: 'A leather-bound steamer trunk with brass corners. The latch is engraved with the same spiral-and-eye motif you have been seeing throughout the house. It is locked, but the lock looks more decorative than functional. There is a label tied to the handle: "Open when you are ready."',
      },

    },

    items: {

      family_photo: {
        id: 'family_photo',
        keywords: ['photo', 'family photo', 'photograph', 'picture'],
        takeText: 'You take the family photograph from the top of the loose stack. The paper is creased and warm. You tuck it carefully into your pack.',
      },

      brass_compass_rose: {
        id: 'brass_compass_rose',
        keywords: ['compass rose', 'rose', 'brass compass', 'brass disc', 'disc'],
        takeText: 'You free the brass compass rose from beneath the photographs. It is heavier than it looks. The needle, though, points toward the stairs — back the way you came.',
      },

    },

    hiddenInteractions: {},

    cluster: 'hidden',

  },

}



export default rooms

