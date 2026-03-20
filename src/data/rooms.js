const rooms = {

  grand_hall: {

    id: 'grand_hall',

    name: 'The Grand Hall',

    description: [

      'You stand in a vast hall that seems to stretch beyond what the walls should allow. A chandelier of amber glass casts warm light across an ornate rug. Tall doorways lead in four directions, each framing darkness beyond.',

      '',

      'A portrait hangs on the eastern wall. A carved inscription traces the perimeter of the floor. A worn welcome mat rests near where you entered.',

    ],

    asciiArt: [
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

        examineText: 'The mat is worn but beatiful. It appears to be handwoven, from some ancient time before machines. You wonder at the strange patterns woven into it. Some appear to be some arcane script but it means nothing to you.',

      },

    },

    items: {

      golden_compass: {

        id: 'golden_compass',

        keywords: ['compass', 'golden compass', 'gold compass', 'golden'],

        takeText: 'You carefully lift the golden compass from its resting place on a small pedestal. The needle spins lazily, pointing toward no particular direction. You have the feeling it may be important later.',

      },

    },

    hiddenInteractions: {},

    cluster: 'indoor',

  },



  archive: {

    id: 'archive',

    name: 'The Archive',

    description: [

      'Towering shelves of books line every wall, reaching up into shadows where the ceiling should be. A reading desk holds a single candle that burns without diminishing. The air smells of old paper and quiet thought.',

      '',

      'A tall bookshelf dominates the north wall. A leather-bound journal lies open on the desk. A stack of letters rests beside it.',

    ],

    asciiArt: [
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

        keywords: ['letters', 'stack', 'mail'],

        examineText: 'The letters are addressed to no one in particular — more like manifestos than correspondence. They speak of democracy, of communities that govern themselves, of unseating corruption through transparency, not force. The handwriting grows more urgent toward the bottom of the stack.',

      },

    },

    items: {

      dusty_tome: {

        id: 'dusty_tome',

        keywords: ['tome', 'dusty tome', 'dusty', 'book', 'minds', 'nature of minds'],

        takeText: 'You slide the dusty tome from its shelf. The leather binding is cool to the touch, and the title — "On the Nature of Minds" — seems to shimmer faintly in the candlelight. You tuck it away carefully.',

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

      'A cluttered workbench dominates the room, covered in circuit boards, soldering irons, and loose wires. Blueprints are pinned to every available wall surface. The air carries a faint tang of solder flux and ozone.',

      '',

      'On the bench you see a circuit board labeled "OTO," a small speaker emitting faint beats, and a peculiar foot pedal. Two thick logbooks sit on a shelf above the workbench. A set of rolled blueprints and a strange gear catch your eye.',

    ],

    asciiArt: [
      '                ░░             ░▒▒░',
      '                ▓█▓▒░▒▒▒▒▒▒▒░░░░▒▒░',
      '        ░░     ░▒▓█▓▓▓▒▒░░░░░       ░░',
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

      'A tidy desk sits beneath a diploma mounted on the wall. A filing cabinet stands in the corner, each drawer carefully labeled. A small lamp casts a warm circle of light. A ticking clock somewhere marks the passage of time.',

      '',

      'A framed photo sits on the desk beside a sealed letter.',

    ],

    asciiArt: [
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

        takeText: 'You pick up the sealed letter. The wax seal is warm to the touch, as though it was pressed only moments ago. Whatever is inside feels substantial — pages of careful work.',

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

      'Banks of radio equipment line the walls, dials glowing amber in the dim light. A crackling speaker emits bursts of static between fragments of distant voices. Wires run everywhere like the nervous system of some vast machine.',

      '',

      'A radio console dominates the center. A morse code key sits ready for input. A logbook of frequencies lies open nearby. A framed photo of two people hangs on the wall.',

    ],

    asciiArt: [
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

    },

    items: {

      radio_crystal: {

        id: 'radio_crystal',

        keywords: ['crystal', 'radio crystal'],

        takeText: 'You carefully remove the radio crystal from its housing. It hums faintly in your palm, resonating with some frequency just below the threshold of hearing. The radio console flickers but continues to function.',

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

      'Wild grass stretches across a coastal hillside under a vast sky. The air smells of eucalyptus and salt. Old stone walls trace property lines that no one has respected in decades.',

      '',

      'The house looms behind you, its front door still locked. In the distance, on a gentle rise, stands a magnificent gnarled oak — solitary, ancient, and somehow inviting.',

    ],

    asciiArt: [
      '   ░░░░         ░▒▒▒▒▒▒░░░   ░░░',
      '░▒▓▓███████▓▒▒░░░░░░▒▒▒▒░░░░░▒▒▓▓▓▒▒░',
      '    ░░░░░░▒▒▒▒▒▒▒▒▒▓▓▓████████▓▒▒░░',
      '             ░░▒▒▓▓▓▓▓▓▓▒▒░░',
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

    },

    items: {},

    hiddenInteractions: {},

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

}



export default rooms

