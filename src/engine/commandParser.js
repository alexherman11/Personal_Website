const DIRECTION_ALIASES = {
  n: 'north', north: 'north',
  s: 'south', south: 'south',
  e: 'east', east: 'east',
  w: 'west', west: 'west',
  u: 'up', up: 'up',
  d: 'down', down: 'down',
}

export default function parseCommand(raw) {
  const input = raw.trim().toLowerCase()
  if (!input) return null

  // Single-word exact matches
  if (input === 'look' || input === 'l') return { type: 'look' }
  if (input === 'inventory' || input === 'i') return { type: 'inventory' }
  if (input === 'map' || input === 'm') return { type: 'map' }
  if (input === 'help' || input === '?') return { type: 'help' }
  if (input === 'listen') return { type: 'listen' }
  if (input === 'knock') return { type: 'knock' }
  if (input === 'smell') return { type: 'smell' }
  if (input === 'taste') return { type: 'taste' }
  if (input === 'touch') return { type: 'touch' }
  if (input === 'read runes') return { type: 'read_runes' }

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

  // Navigation phrases for outdoor areas (don't start with "go")
  const navPhrases = [
    'climb down', 'climb up', 'climb tree', 'climb ladder',
    'approach tree', 'approach oak', 'walk toward tree',
    'go to tree', 'go to door', 'go back',
    'look around', 'go around', 'explore',
  ]
  for (const phrase of navPhrases) {
    if (input === phrase || input.startsWith(phrase)) {
      return { type: 'go', direction: input, raw: input }
    }
  }

  // Unrecognized — Phase 3 sends to AI
  return { type: 'unknown', raw: input }
}
