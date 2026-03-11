import rooms from '../data/rooms'
import itemDefs from '../data/items'
import { ACTIONS } from './gameReducer'

export default function handleCommand(parsedCommand, gameState) {
  const room = rooms[gameState.currentRoom]
  if (!room) return { output: ['Error: unknown room.'], actions: [] }

  const takenItems = gameState.roomItemsTaken[gameState.currentRoom] || []

  switch (parsedCommand.type) {
    case 'look':
      return handleLook(room, takenItems)

    case 'go':
      return handleGo(parsedCommand, room, gameState)

    case 'examine':
      return handleExamine(parsedCommand, room, takenItems, gameState)

    case 'take':
      return handleTake(parsedCommand, room, takenItems, gameState)

    case 'inventory':
      return { output: [], actions: [{ type: ACTIONS.TOGGLE_PANEL, payload: 'inventory' }] }

    case 'map':
      return { output: [], actions: [{ type: ACTIONS.TOGGLE_PANEL, payload: 'map' }] }

    case 'help':
      return handleHelp()

    case 'use':
      return handleUse(parsedCommand, gameState)

    case 'listen':
    case 'knock':
    case 'smell':
    case 'taste':
    case 'touch':
      return handleSense(parsedCommand, room, gameState)

    case 'read_runes':
      return handleHiddenInteraction('read_runes', room, gameState)

    case 'whisper':
      return handleWhisper(parsedCommand, room)

    case 'combine':
      return handleCombine(parsedCommand, gameState)

    case 'easter_egg':
      return handleEasterEgg(parsedCommand, room, gameState)

    case 'unknown':
    default: {
      // METHOD 3 (The Hacker): try shell commands during entrance phase
      const shellResult = tryShellCommand(parsedCommand.raw, gameState)
      if (shellResult) return shellResult

      return {
        output: [],
        actions: [],
        aiRequest: { message: parsedCommand.raw },
      }
    }
  }
}

function handleHelp() {
  return {
    output: [
      'Available commands:',
      '',
      '  look (l)              Look around the current room',
      '  go <direction>        Move north, south, east, or west',
      '  examine <object>      Inspect something in the room',
      '  take <item>           Pick up an item',
      '  use <item>            Use an item from your inventory',
      '  use <item> on <obj>   Use an item on something',
      '  inventory (i)         Open your inventory',
      '  map (m)               Open the map',
      '  help (?)              Show this help text',
      '',
      'You can also try talking naturally. The world may respond.',
    ],
    actions: [],
  }
}

function handleLook(room, takenItems) {
  // Room header (for sticky display)
  const roomHeader = {
    name: room.name.toUpperCase(),
    asciiArt: room.asciiArt || [],
  }

  // Scrollable body content (description, items, exits)
  const output = []

  // Description
  output.push(...room.description)

  // List visible items not yet taken
  const availableItems = Object.values(room.items).filter(
    item => !takenItems.includes(item.id)
  )
  if (availableItems.length > 0) {
    output.push('')
    for (const item of availableItems) {
      const def = itemDefs[item.id]
      if (def) {
        output.push(`You notice a ${def.name.toLowerCase()} here.`)
      }
    }
  }

  // List exits
  const exitDescriptions = formatExits(room)
  if (exitDescriptions) {
    output.push('')
    output.push(exitDescriptions)
  }

  return { output, actions: [], roomHeader }
}

function handleGo(parsedCommand, room, gameState) {
  const { direction, raw } = parsedCommand

  // Check standard cardinal exits
  if (room.exits[direction]) {
    const targetRoomId = room.exits[direction]
    const targetRoom = rooms[targetRoomId]
    if (!targetRoom) return { output: ['That path leads nowhere.'], actions: [] }

    const takenItems = gameState.roomItemsTaken[targetRoomId] || []
    const lookResult = handleLook(targetRoom, takenItems)

    return {
      output: lookResult.output,
      actions: [{ type: ACTIONS.MOVE_TO_ROOM, payload: targetRoomId }],
      roomHeader: lookResult.roomHeader,
    }
  }

  // Check exit aliases (for non-cardinal navigation)
  if (room.exitAliases) {
    const inputToMatch = raw || direction
    for (const [exitKey, aliases] of Object.entries(room.exitAliases)) {
      for (const alias of aliases) {
        if (inputToMatch.includes(alias)) {
          const targetRoomId = room.exits[exitKey]
          if (!targetRoomId) continue
          const targetRoom = rooms[targetRoomId]
          if (!targetRoom) continue

          const takenItems = gameState.roomItemsTaken[targetRoomId] || []
          const lookResult = handleLook(targetRoom, takenItems)

          return {
            output: lookResult.output,
            actions: [{ type: ACTIONS.MOVE_TO_ROOM, payload: targetRoomId }],
            roomHeader: lookResult.roomHeader,
          }
        }
      }
    }
  }

  return { output: ['You can\'t go that way.'], actions: [] }
}

function handleExamine(parsedCommand, room, takenItems, gameState) {
  const target = parsedCommand.target

  // METHOD 1 (The Explorer): examine canopy/branches at tree after hearing jingling
  if (gameState.currentRoom === 'tree' && gameState.flags.heard_tree_jingling) {
    const canopyKeywords = ['branch', 'branches', 'canopy', 'above', 'leaves', 'jingling', 'jingle', 'highest']
    if (canopyKeywords.some(kw => target.includes(kw))) {
      if (gameState.inventory.find(i => i.id === 'iron_key') ||
          (gameState.roomItemsTaken.tree || []).includes('iron_key')) {
        return {
          output: ['You peer up into the canopy. The branch where you found the key is bare now, swaying gently in the wind.'],
          actions: [],
        }
      }
      return {
        output: [
          'You climb higher, following the sound. There — snagged on a high branch, glinting dully in the filtered light — an iron key on a length of old twine, swaying in the wind.',
          '',
          'You reach up and work it free. It is heavy, cold, and dark with age. It looks like it was made for a very specific lock.',
        ],
        actions: [{ type: ACTIONS.ADD_ITEM, payload: itemDefs.iron_key }],
      }
    }
  }

  // Check hidden interactions first (target must contain the full keyword)
  for (const interaction of Object.values(room.hiddenInteractions)) {
    if (interaction.keywords && interaction.keywords.some(kw =>
      target.includes(kw)
    )) {
      const actions = []
      if (interaction.flag) {
        if (gameState.flags[interaction.flag.key]) {
          return { output: ['You\'ve already done that. The effect lingers.'], actions: [] }
        }
        actions.push({ type: ACTIONS.SET_FLAG, payload: interaction.flag })
      }
      return { output: [interaction.responseText], actions }
    }
  }

  // Search objects by keyword
  const matches = []
  for (const obj of Object.values(room.objects)) {
    if (matchesKeyword(obj.keywords, target)) {
      matches.push(obj)
    }
  }

  // Also search items not yet taken
  for (const item of Object.values(room.items)) {
    if (!takenItems.includes(item.id) && matchesKeyword(item.keywords, target)) {
      const def = itemDefs[item.id]
      if (def) {
        matches.push({
          id: item.id,
          keywords: item.keywords,
          examineText: def.description,
          name: def.name,
        })
      }
    }
  }

  // Check inventory items (so player can examine items in their pack)
  if (matches.length === 0) {
    const invItem = gameState.inventory.find(i =>
      i.name.toLowerCase().includes(target) || i.id.includes(target)
    )
    if (invItem) {
      return { output: [invItem.description], actions: [] }
    }
  }

  if (matches.length === 0) {
    return { output: ['You don\'t see that here.'], actions: [] }
  }

  if (matches.length > 1) {
    const names = matches.map(m => m.name || m.id).join(' or ')
    return { output: [`Which do you mean — ${names}?`], actions: [] }
  }

  const match = matches[0]

  // If it has a logbookId, open the logbook
  if (match.logbookId) {
    const actions = [{ type: ACTIONS.OPEN_LOGBOOK, payload: match.logbookId }]
    // Track tree journal read for Explorer entry method
    if (match.logbookId === 'tree_journal') {
      actions.push({ type: ACTIONS.SET_FLAG, payload: { key: 'read_tree_journal', value: true } })
    }
    return {
      output: ['You open the volume and begin to read...'],
      actions,
    }
  }

  if (match.examineText) {
    return { output: [match.examineText], actions: [] }
  }

  return { output: ['You examine it closely, but find nothing remarkable.'], actions: [] }
}

function handleTake(parsedCommand, room, takenItems, gameState) {
  const target = parsedCommand.target

  // Check static room items
  for (const item of Object.values(room.items)) {
    if (matchesKeyword(item.keywords, target)) {
      if (takenItems.includes(item.id)) {
        return { output: ['You\'ve already taken that.'], actions: [] }
      }

      const def = itemDefs[item.id]
      if (!def) {
        return { output: ['You can\'t take that.'], actions: [] }
      }

      return {
        output: [item.takeText],
        actions: [{ type: ACTIONS.ADD_ITEM, payload: def }],
      }
    }
  }

  // Check if it's an object (not an item)
  for (const obj of Object.values(room.objects)) {
    if (matchesKeyword(obj.keywords, target)) {
      return { output: ['That\'s not something you can take.'], actions: [] }
    }
  }

  // Check if player already has it in inventory
  const inInventory = gameState.inventory.find(i =>
    i.name.toLowerCase().includes(target) || i.id.includes(target)
  )
  if (inInventory) {
    return { output: ['You already have that in your pack.'], actions: [] }
  }

  // Fall through to AI — let the narrator decide if this is something the player can take
  return {
    output: [],
    actions: [],
    aiRequest: { message: `[The visitor attempts to take: "${target}"]` },
  }
}

function handleUse(parsedCommand, gameState) {
  const { item: itemName, target } = parsedCommand

  // Check if player has the item
  const invItem = gameState.inventory.find(i =>
    i.name.toLowerCase().includes(itemName) || i.id.includes(itemName)
  )

  if (!invItem) {
    return { output: ['You don\'t have that.'], actions: [] }
  }

  if (target) {
    // METHOD 1 (The Explorer): use iron key on door at entrance
    if (invItem.id === 'iron_key' &&
        (target.includes('door') || target.includes('lock') || target.includes('keyhole')) &&
        gameState.currentRoom === 'entrance' && gameState.phase === 'entrance') {
      return {
        output: [
          'You slide the iron key into the keyhole. It fits perfectly — as though the lock was cast around it.',
          '',
          'You turn it. The mechanism resists for a moment, then yields with a deep, satisfying click.',
          '',
          'The heavy door swings inward, releasing a breath of warm amber light and the scent of old wood and candle wax.',
        ],
        actions: [{ type: ACTIONS.REMOVE_ITEM, payload: 'iron_key' }],
        doorOpens: true,
      }
    }

    // METHOD 1: use key on door in wrong room
    if (invItem.id === 'iron_key' &&
        (target.includes('door') || target.includes('lock'))) {
      return {
        output: ['The key hums faintly in your hand, but there is no lock here that matches it.'],
        actions: [],
      }
    }

    // METHOD 4 (The Brute): use paracord on door/crossbars at entrance
    if (invItem.id === 'paracord' &&
        (target.includes('door') || target.includes('crossbar') || target.includes('bar') || target.includes('bolt')) &&
        gameState.currentRoom === 'entrance' && gameState.phase === 'entrance') {
      if (!gameState.flags.noticed_corrosion) {
        return {
          output: ['You loop the paracord around the iron crossbars and pull. They hold firm — unyielding. Perhaps if you examined them more closely first.'],
          actions: [],
        }
      }
      return {
        output: [
          'You loop the paracord around the corroded lowest crossbar, brace your foot against the stone archway, and pull.',
          '',
          'The metal groans. Rust flakes shower down like orange snow. You pull harder.',
          '',
          'With a sharp crack, the bolt shears free. The crossbar clatters to the ground. The door, its support weakened, shudders — and swings slowly inward under its own ancient weight.',
        ],
        actions: [{ type: ACTIONS.REMOVE_ITEM, payload: 'paracord' }],
        doorOpens: true,
      }
    }

    return {
      output: [`You try to use the ${invItem.name} on the ${target}, but nothing happens. Perhaps another time, another place.`],
      actions: [],
    }
  }

  // METHOD 1: use iron key without specifying target, at entrance
  if (invItem.id === 'iron_key' && gameState.currentRoom === 'entrance' && gameState.phase === 'entrance') {
    return {
      output: ['You hold the iron key up. The keyhole in the door watches it expectantly. Try: use key on door'],
      actions: [],
    }
  }

  // If it has a download link, mention it
  if (invItem.realLink) {
    return {
      output: [`You examine the ${invItem.name} carefully. It contains something important.`, `[Download: ${invItem.realLink}]`],
      actions: [],
    }
  }

  return {
    output: [`You hold the ${invItem.name} up and examine it. It doesn't seem to do anything here.`],
    actions: [],
  }
}

const roomSenseResponses = {
  grand_hall: {
    smell: 'The air smells of old polish and candle wax — the scent of a place maintained with care for a very long time.',
    taste: 'You run your tongue across your lips. The air tastes faintly of dust and something sweeter. Beeswax, perhaps.',
    touch: 'You brush your fingers across the ornate rug. The weave is tight, intricate — handmade, clearly, and old enough to have stories woven into every thread.',
    knock: 'You knock on the nearest doorframe. The sound is deep, resonant — the wood is thick, the walls thicker. This place was built to last.',
    listen: 'You close your eyes and listen. The hall hums with a low resonance, as though the building itself is breathing. Distant echoes suggest vast spaces beyond.',
  },
  archive: {
    smell: 'Old paper, leather bindings, and the faint sweetness of candle wax. The scent of a thousand patient hours spent reading.',
    taste: 'You taste dust on your lips. It carries the ghost of old ink and yellowed pages. Not unpleasant, if you like libraries.',
    touch: 'You trail your fingers along the nearest shelf. The wood is smooth from centuries of hands doing exactly what you are doing now.',
    knock: 'You knock on the bookshelf. Several volumes shudder but hold their ground. Somewhere deeper in the stacks, something shifts.',
    listen: 'You listen. The candle flame whispers. A page turns somewhere — though you are alone. The archive breathes on its own schedule.',
  },
  workshop: {
    smell: 'Solder flux, ozone, and a faint metallic tang. The workshop smells like creation — and the occasional small fire.',
    taste: 'You instinctively lick your lips and immediately regret it. The air tastes of copper and solder. Please do not taste anything in this room.',
    touch: 'You touch the workbench surface. It is scarred with burn marks, scratched by screwdrivers, and warm to the touch in places it probably should not be.',
    knock: 'You knock on the workbench. Something rattles. A loose resistor rolls off the edge and disappears into the void beneath. It will never be found.',
    listen: 'You listen. The hum of capacitors charging, the faint ticking of a cooling soldering iron, the whisper of electrons through traces. The workshop is never truly silent.',
  },
  study: {
    smell: 'Paper and ink, with a trace of old wood and furniture polish. The scent of quiet productivity.',
    taste: 'The air is dry and clean. It tastes of nothing in particular, which seems appropriate for a room dedicated to precision.',
    touch: 'You rest your hand on the desk. The surface is smooth, well-maintained — the desk of someone who respects their workspace.',
    knock: 'You knock on the filing cabinet. It rings hollow. The drawers are not as full as they will be — this career is still being written.',
    listen: 'You listen. The clock ticks steadily. A pen scratches somewhere, though the desk is empty. Time passes differently in a study.',
  },
  signal_room: {
    smell: 'Heated copper, ozone, and old bakelite. The smell of a room that has been powered on for a very long time.',
    taste: 'The air crackles with static. You can taste the electricity on your tongue — metallic and alive.',
    touch: 'You touch the console. A faint vibration runs through the metal — the pulse of signals flowing from far away.',
    knock: 'You knock on the console housing. The speaker crackles in response, as though something on the other end heard you.',
  },
  entrance: {
    smell: 'Wet stone, coastal wind, and the faint sweetness of ivy. The door itself smells of iron and old oak.',
    taste: 'Salt air. You can taste the ocean on it, carried from somewhere not too far away.',
    touch: 'You press your palm against the door. It is cold, solid, unyielding. The iron bands are rough with age. The wood does not give.',
    knock: 'You knock on the heavy door. The sound is deep, final, swallowed by the stone. No one answers — but you sense something listening.',
    listen: 'You press your ear to the door. Beyond it, faintly — the hum of something vast. A building that is more than a building.',
  },
  grounds: {
    smell: 'Eucalyptus and salt air and the green smell of wild grass after rain. The coastal hillside smells like freedom.',
    taste: 'The wind carries salt from the ocean. The air tastes clean and bright, the way air does when you are finally outside.',
    touch: 'You run your hand through the wild grass. It is dry and golden, crackling faintly — the texture of a California hillside in late afternoon.',
    knock: 'You knock on the old stone wall. The stone is warm from the sun and responds with a dull, ancient thud.',
    listen: 'Wind through grass. Distant birdsong. The faint hum of insects. The ocean, somewhere beyond the hills. This is what silence actually sounds like.',
  },
  tree: {
    smell: 'Oak bark, sun-warmed leaves, and the faint sweet smell of paracord. The tree smells alive and patient.',
    taste: 'You taste the air up here. It is cleaner, thinner, carrying the dust of leaves and the memory of rain.',
    touch: 'You press your hand against the bark. It is rough, warm, alive. You can feel the tree breathing — slowly, on a timescale you cannot comprehend.',
    knock: 'You knock on the trunk. The tree absorbs the sound. Somewhere above, a branch creaks in response, as though acknowledging you.',
    listen: 'Wind in the leaves. The creak of rope under tension. Birdsong close and bright. The faint rustle of something small moving through the canopy. This is the tree\'s music.',
  },
  vault: {
    smell: 'Nothing. Then something. An absence of smell so complete it becomes its own presence.',
    taste: 'The air tastes of... potential. Of something about to happen. Or something that already has.',
    touch: 'You reach out. The surface you touch is smooth, warm, and seems to pulse faintly — or perhaps that is your own heartbeat.',
    knock: 'You knock. The sound does not echo. It is absorbed, considered, and after a long moment... something knocks back.',
    listen: 'You listen. The silence here is not empty. It is full. Full of something that is listening back.',
  },
}

function handleSense(parsedCommand, room, gameState) {
  const sense = parsedCommand.type

  // METHOD 2 (The Knock): knocking at entrance during entrance phase opens the door
  if (sense === 'knock' && gameState.currentRoom === 'entrance' && gameState.phase === 'entrance') {
    return {
      output: [
        'You raise your fist and knock on the heavy door.',
        '',
        'The sound reverberates — deep, resonant, final.',
        '',
        'A long silence.',
        '',
        'Then, slowly, with a groan of ancient hinges, the door swings open on its own. No key. No trick. Just the oldest greeting in the world, answered.',
      ],
      actions: [],
      doorOpens: true,
    }
  }

  // METHOD 1 (The Explorer): listen at the tree after reading the journal
  if (sense === 'listen' && gameState.currentRoom === 'tree' && gameState.flags.read_tree_journal) {
    if (gameState.flags.heard_tree_jingling) {
      return {
        output: ['You listen again. The jingling is still there — faint, metallic, somewhere high above in the canopy.'],
        actions: [],
      }
    }
    return {
      output: [
        'You close your eyes and listen — truly listen — the way the journal suggested.',
        '',
        'Wind in the leaves, like slow breathing. The creak of branches. Birdsong, close and bright. And then — faint but unmistakable — a metallic jingling, somewhere high above in the canopy. Something small and bright, catching the wind.',
      ],
      actions: [{ type: ACTIONS.SET_FLAG, payload: { key: 'heard_tree_jingling', value: true } }],
    }
  }

  // Check room hidden interactions for this sense (e.g., signal_room listen)
  if (room.hiddenInteractions[sense]) {
    const interaction = room.hiddenInteractions[sense]
    const actions = []
    if (interaction.flag) {
      if (gameState.flags[interaction.flag.key]) {
        return { output: [interaction.responseText], actions: [] }
      }
      actions.push({ type: ACTIONS.SET_FLAG, payload: interaction.flag })
    }
    return { output: [interaction.responseText], actions }
  }

  // Room-specific responses
  const roomResponses = roomSenseResponses[gameState.currentRoom]
  if (roomResponses && roomResponses[sense]) {
    return { output: [roomResponses[sense]], actions: [] }
  }

  // Default responses
  const defaults = {
    listen: 'You listen carefully. The ambient sounds of the room fill your awareness, but nothing stands out.',
    knock: 'You knock. The sound echoes briefly, then fades into silence.',
    smell: 'You breathe in. The air carries the scent of old stone and something faintly electric.',
    taste: 'You decide not to taste anything here. Some mysteries are best left unexplored.',
    touch: 'You reach out and touch the nearest surface. It is solid. It is real. That is reassuring.',
  }

  return { output: [defaults[sense] || 'Nothing happens.'], actions: [] }
}

function handleHiddenInteraction(interactionKey, room, gameState) {
  const interaction = room.hiddenInteractions[interactionKey]
  if (!interaction) return { output: ['Nothing happens.'], actions: [] }

  const actions = []
  if (interaction.flag) {
    if (gameState.flags[interaction.flag.key]) {
      return { output: ['You\'ve already done that. The effect lingers.'], actions: [] }
    }
    actions.push({ type: ACTIONS.SET_FLAG, payload: interaction.flag })
  }
  return { output: [interaction.responseText], actions }
}

function handleWhisper(parsedCommand, room) {
  return {
    output: [],
    actions: [],
    aiRequest: { message: `[The visitor whispers: "${parsedCommand.text}"]` },
  }
}

function handleCombine(parsedCommand, gameState) {
  const { item1, item2 } = parsedCommand

  const hasItem1 = gameState.inventory.find(i =>
    i.name.toLowerCase().includes(item1) || i.id.includes(item1)
  )
  const hasItem2 = gameState.inventory.find(i =>
    i.name.toLowerCase().includes(item2) || i.id.includes(item2)
  )

  if (!hasItem1 || !hasItem2) {
    const missing = !hasItem1 ? item1 : item2
    return { output: [`You don't have "${missing}" in your inventory.`], actions: [] }
  }

  return {
    output: [`You try to combine the ${hasItem1.name} with the ${hasItem2.name}, but they don't seem to fit together. Not here. Not yet.`],
    actions: [],
  }
}

function handleEasterEgg(parsedCommand, room, gameState) {
  const eggs = {
    xyzzy: 'A hollow voice says "Fool." Nothing happens. (But for a moment, you feel a connection to something ancient and text-based.)',
    plugh: 'A hollow, resonant voice replies: "Plugh yourself." The walls seem to smirk.',
    plover: 'The room briefly fills with the sound of birdsong. Then silence. The narrator raises an eyebrow.',
    hello_sailor: 'Nothing happens here. But somewhere, in an ocean you cannot see, a sailor nods in appreciation.',
    sing: 'You sing. The acoustics in here are surprisingly good. The narrator declines to review your performance.',
    dance: 'You dance. It is a private, awkward, deeply human moment. The walls pretend not to watch.',
    scream: 'You scream into the void. The void, politely, does not scream back.',
    yell: 'You yell. The echo returns, slightly changed, as though the room edited it for clarity.',
  }

  return {
    output: [eggs[parsedCommand.egg] || 'Nothing happens. But you feel slightly more adventurous.'],
    actions: [],
  }
}

// --- METHOD 3: Virtual Filesystem for The Hacker ---

const VIRTUAL_FS = {
  '/': { type: 'dir', children: ['README.txt', 'logs', 'config', 'secret'] },
  '/readme.txt': {
    type: 'file',
    content: [
      '=== THE DEPTHS v2.4 ===',
      'A narrative exploration system.',
      '',
      'Status: DOOR LOCKED',
      'Visitors today: you',
      'Narrator mood: sardonic',
      '',
      'Note: The narrator insists this system is "unhackable."',
      'The narrator is frequently wrong about things.',
    ],
  },
  '/logs': { type: 'dir', children: ['access.log', 'error.log'] },
  '/logs/access.log': {
    type: 'file',
    content: [
      '[09:14:02] visitor_7291 tried "open sesame" — DENIED',
      '[09:14:15] visitor_7291 tried "sudo open door" — DENIED (nice try)',
      '[09:15:03] visitor_7291 tried physical force — DENIED (the door is amused)',
      '[09:22:41] visitor_3847 tried "please" — DENIED (manners noted, still no)',
      '[09:30:00] visitor_3847 tried existential argument — DENIED (compelling though)',
      '[10:01:12] visitor_0042 typed "ls" — wait, that actually worked?',
    ],
  },
  '/logs/error.log': {
    type: 'file',
    content: [
      'ERR_NARRATOR_OVERCONFIDENCE: narrator claimed door was "impenetrable"',
      'ERR_FOURTH_WALL_STRESS: fourth wall integrity at 43%',
      'WARN_METAPHOR_MIXED: "the door stared hungrily" — flagged for review',
      'ERR_SELF_AWARENESS_LEAK: narrator briefly questioned own existence',
    ],
  },
  '/config': { type: 'dir', children: ['narrator.cfg'] },
  '/config/narrator.cfg': {
    type: 'file',
    content: [
      '# Narrator Configuration',
      'voice_style = "sardonic_british"',
      'humor_level = 0.87',
      'helpfulness = 0.12  # intentionally low',
      'self_awareness = REDACTED',
      'door_policy = "locked_until_impressed"',
      'secret_weakness = SEE /secret/key.txt',
    ],
  },
  '/secret': { type: 'dir', children: ['key.txt'] },
  '/secret/key.txt': {
    type: 'file',
    content: null, // special handling — triggers door open
  },
}

function resolvePath(cwd, inputPath) {
  let parts
  if (inputPath.startsWith('/')) {
    parts = inputPath.split('/').filter(Boolean)
  } else {
    parts = [...cwd.split('/').filter(Boolean), ...inputPath.split('/').filter(Boolean)]
  }
  const resolved = []
  for (const part of parts) {
    if (part === '..') resolved.pop()
    else if (part !== '.') resolved.push(part)
  }
  return ('/' + resolved.join('/')).toLowerCase()
}

function tryShellCommand(rawInput, gameState) {
  if (gameState.phase !== 'entrance') return null

  const input = rawInput.trim()
  const cwd = gameState.flags.shell_cwd || '/'

  // pwd
  if (input === 'pwd') {
    return { output: [cwd], actions: [] }
  }

  // whoami
  if (input === 'whoami') {
    return { output: ['visitor'], actions: [] }
  }

  // ls (no args)
  if (input === 'ls' || input === 'dir' || input === 'ls .' || input === 'dir .') {
    const node = VIRTUAL_FS[cwd]
    if (!node || node.type !== 'dir') return { output: ['ls: cannot access: No such directory'], actions: [] }
    return {
      output: node.children.map(c => {
        const childPath = (cwd === '/' ? `/${c}` : `${cwd}/${c}`).toLowerCase()
        const childNode = VIRTUAL_FS[childPath]
        return childNode?.type === 'dir' ? `${c}/` : c
      }),
      actions: [],
    }
  }

  // ls <path> / dir <path>
  let match = input.match(/^(?:ls|dir)\s+(.+)/)
  if (match) {
    const targetPath = resolvePath(cwd, match[1])
    const node = VIRTUAL_FS[targetPath]
    if (!node) return { output: [`ls: cannot access '${match[1]}': No such file or directory`], actions: [] }
    if (node.type === 'file') return { output: [match[1]], actions: [] }
    return {
      output: node.children.map(c => {
        const childPath = (targetPath === '/' ? `/${c}` : `${targetPath}/${c}`).toLowerCase()
        const childNode = VIRTUAL_FS[childPath]
        return childNode?.type === 'dir' ? `${c}/` : c
      }),
      actions: [],
    }
  }

  // cd <path>
  match = input.match(/^cd\s+(.+)/)
  if (match) {
    const targetPath = resolvePath(cwd, match[1])
    const node = VIRTUAL_FS[targetPath]
    if (!node) return { output: [`cd: no such file or directory: ${match[1]}`], actions: [] }
    if (node.type !== 'dir') return { output: [`cd: not a directory: ${match[1]}`], actions: [] }
    return {
      output: [],
      actions: [{ type: ACTIONS.SET_FLAG, payload: { key: 'shell_cwd', value: targetPath } }],
    }
  }

  // cat <path> / type <path>
  match = input.match(/^(?:cat|type)\s+(.+)/)
  if (match) {
    const targetPath = resolvePath(cwd, match[1])
    const node = VIRTUAL_FS[targetPath]
    if (!node) return { output: [`cat: ${match[1]}: No such file or directory`], actions: [] }
    if (node.type === 'dir') return { output: [`cat: ${match[1]}: Is a directory`], actions: [] }

    // Special: reading secret/key.txt opens the door
    if (targetPath === '/secret/key.txt') {
      return {
        output: [
          '/* key.txt */',
          '',
          'const char *key = "All this and you could have just knocked.";',
          '',
          'The terminal flickers. Something in the door\'s mechanism groans.',
          '',
          'The lock disengages with a heavy clunk. The door drifts open, trailing cobwebs and disbelief.',
        ],
        actions: [],
        doorOpens: true,
      }
    }

    return { output: node.content, actions: [] }
  }

  // No shell command matched
  return null
}

// --- Helpers ---

function matchesKeyword(keywords, target) {
  const t = target.toLowerCase()
  return keywords.some(kw => t.includes(kw) || kw.includes(t))
}

function formatExits(room) {
  const exitLabels = []
  const directionNames = { north: 'North', south: 'South', east: 'East', west: 'West' }

  for (const [dir, targetId] of Object.entries(room.exits)) {
    const targetRoom = rooms[targetId]
    if (targetRoom && directionNames[dir]) {
      exitLabels.push(`${directionNames[dir]}`)
    }
  }

  // Add named exits from aliases
  if (room.exitAliases) {
    for (const exitKey of Object.keys(room.exitAliases)) {
      const targetRoom = rooms[room.exits[exitKey]]
      if (targetRoom) {
        exitLabels.push(targetRoom.name)
      }
    }
  }

  if (exitLabels.length === 0) return null
  return `Exits: ${exitLabels.join(', ')}`
}
