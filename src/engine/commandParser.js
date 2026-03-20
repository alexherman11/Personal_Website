const DIRECTION_ALIASES = {
  n: 'north', north: 'north',
  s: 'south', south: 'south',
  e: 'east', east: 'east',
  w: 'west', west: 'west',
  u: 'up', up: 'up',
  d: 'down', down: 'down',
}

// Patterns to extract cardinal/vertical directions from verbose phrases
// Ordered from most specific to least specific to avoid false positives
const DIRECTION_PATTERNS = [
  // "northward", "southward", etc.
  /\b(north|south|east|west)ward[s]?\b/,
  // "to the north", "toward the east", "towards the west"
  /\b(?:to(?:ward[s]?)?)\s+the\s+(north|south|east|west|up|down)\b/,
  // "the northern/eastern passage", "the southern door"
  /\bthe\s+(north|south|east|west)(?:ern|erly)\b/,
  // "head/walk/move north", "proceed south" (direction at end of movement phrase)
  /\b(?:head|walk|move|go|proceed|travel|run|step|venture)\s+(?:to\s+(?:the\s+)?)?(?:the\s+)?(north|south|east|west|up|down)\b/,
  // up/down with movement verbs
  /\b(?:go|head|climb|walk|move|proceed|step)\s+(up|down)\b/,
  // "upstairs"/"downstairs"
  /\b(upstairs|downstairs)\b/,
  // bare direction word as last resort (only used when caller has movement context)
  /\b(north|south|east|west)\b/,
]

export function extractDirection(input) {
  for (const pattern of DIRECTION_PATTERNS) {
    const match = input.match(pattern)
    if (match) {
      const word = match[1].toLowerCase()
      if (word === 'upstairs') return 'up'
      if (word === 'downstairs') return 'down'
      // "northern" → "north", "eastern" → "east", etc.
      const base = word.replace(/(?:ern|erly)$/, '')
      return DIRECTION_ALIASES[base] || null
    }
  }
  return null
}

export default function parseCommand(raw) {
  let input = raw.trim().toLowerCase()
  if (!input) return null

  // Strip leading "I" so natural phrasing works: "I go north", "I examine desk"
  input = input.replace(/^i\s+/, '')

  // Single-word exact matches
  if (input === 'look' || input === 'l') return { type: 'look' }
  if (input === 'inventory' || input === 'i') return { type: 'inventory' }
  if (input === 'map' || input === 'm') return { type: 'map' }
  if (input === 'help' || input === '?') return { type: 'help' }
  if (input === 'listen') return { type: 'listen' }
  if (/^knock(\s|$)/.test(input)) return { type: 'knock' }
  if (input === 'smell') return { type: 'smell' }
  if (input === 'taste') return { type: 'taste' }
  if (input === 'touch') return { type: 'touch' }
  if (input === 'read runes') return { type: 'read_runes' }
  if (input === 'newgame' || input === 'new game' || input === 'restart') return { type: 'newgame' }
  if (input === 'menu' || input === 'main menu' || input === 'home') return { type: 'menu' }

  // Easter eggs — classic text adventure commands
  if (input === 'xyzzy') return { type: 'easter_egg', egg: 'xyzzy' }
  if (input === 'plugh') return { type: 'easter_egg', egg: 'plugh' }
  if (input === 'plover') return { type: 'easter_egg', egg: 'plover' }
  if (input === 'hello sailor') return { type: 'easter_egg', egg: 'hello_sailor' }
  if (input === 'sing' || input === 'dance' || input === 'scream' || input === 'yell') return { type: 'easter_egg', egg: input }

  // "go [direction]" or bare direction
  if (input.startsWith('go ')) {
    const dirWord = input.slice(3).trim()
    const dir = DIRECTION_ALIASES[dirWord]
    if (dir) return { type: 'go', direction: dir }
    // Try extracting direction from verbose phrase: "go toward the north"
    const extracted = extractDirection(dirWord)
    if (extracted) return { type: 'go', direction: extracted, raw: input }
    return { type: 'go', direction: dirWord, raw: input }
  }
  if (DIRECTION_ALIASES[input]) {
    return { type: 'go', direction: DIRECTION_ALIASES[input] }
  }

  // "examine [target]" / "look at [target]" / "inspect [target]" / "read [target]" / "x [target]"
  const examineMatch = input.match(/^(?:examine|look at|inspect|read|x)\s+(.+)/)
  if (examineMatch) return { type: 'examine', target: examineMatch[1] }

  // "take [target]" / "get [target]" / "pick up [target]" / "grab [target]"
  const takeMatch = input.match(/^(?:take|get|pick up|grab)\s+(.+)/)
  if (takeMatch) return { type: 'take', target: takeMatch[1] }

  // "use [item] on [target]"
  const useOnMatch = input.match(/^use\s+(.+?)\s+on\s+(.+)/)
  if (useOnMatch) return { type: 'use', item: useOnMatch[1], target: useOnMatch[2] }

  // "use [item]"
  const useMatch = input.match(/^use\s+(.+)/)
  if (useMatch) return { type: 'use', item: useMatch[1] }

  // "open [target]" — routes to examine for hidden interactions
  const openMatch = input.match(/^open\s+(.+)/)
  if (openMatch) return { type: 'examine', target: openMatch[1] }

  // "whisper [text]"
  const whisperMatch = input.match(/^whisper\s+(.+)/)
  if (whisperMatch) return { type: 'whisper', text: whisperMatch[1] }

  // "combine [item] + [item]"
  const combineMatch = input.match(/^combine\s+(.+?)\s*\+\s*(.+)/)
  if (combineMatch) return { type: 'combine', item1: combineMatch[1].trim(), item2: combineMatch[2].trim() }

  // Navigation phrases (don't start with "go")
  const navPhrases = [
    'climb down', 'climb up', 'climb tree', 'climb ladder',
    'approach tree', 'approach oak', 'walk toward tree',
    'go to tree', 'go to door', 'go back',
    'look around', 'go around', 'explore',
    'enter', 'descend', 'ascend', 'crawl',
    'go through', 'go into', 'go inside', 'go down', 'go up',
    'walk through', 'walk into', 'walk inside', 'walk down', 'walk up',
    'step through', 'step into', 'step inside',
    'follow', 'proceed',
  ]
  for (const phrase of navPhrases) {
    if (input === phrase || input.startsWith(phrase)) {
      const extracted = extractDirection(input)
      return { type: 'go', direction: extracted || input, raw: input }
    }
  }

  // Movement verb + direction detection (catches "move toward the north", etc.)
  const movementVerbs = /\b(?:go|move|walk|head|proceed|travel|run|step|venture|wander|march|stroll|advance)\b/
  if (movementVerbs.test(input)) {
    const extracted = extractDirection(input)
    if (extracted) return { type: 'go', direction: extracted, raw: input }
  }

  // Unrecognized — Phase 3 sends to AI
  return { type: 'unknown', raw: input }
}
