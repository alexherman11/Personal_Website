// MOO-style command parsing: `verb [dobj] [prep iobj]`, with quote-aware
// tokenising and the classic shortcut prefixes (" say, : emote, ; eval).

export const PREPOSITIONS = [
  'in front of', 'on top of', 'out of', 'from inside', 'off of',
  'with', 'using', 'at', 'to', 'in', 'inside', 'into', 'on', 'onto', 'upon',
  'from', 'over', 'through', 'under', 'underneath', 'beneath', 'behind',
  'beside', 'for', 'about', 'is', 'as', 'off',
]

export const DIRECTIONS = {
  n: 'north', north: 'north', s: 'south', south: 'south', e: 'east', east: 'east',
  w: 'west', west: 'west', u: 'up', up: 'up', d: 'down', down: 'down',
  ne: 'northeast', northeast: 'northeast', nw: 'northwest', northwest: 'northwest',
  se: 'southeast', southeast: 'southeast', sw: 'southwest', southwest: 'southwest',
  out: 'out', in: 'in',
}

// Tokenise honouring double quotes; returns [{ text, quoted }]
export function tokenize(input) {
  const tokens = []
  let i = 0
  while (i < input.length) {
    const ch = input[i]
    if (/\s/.test(ch)) { i++; continue }
    if (ch === '"') {
      let j = i + 1
      let buf = ''
      while (j < input.length && input[j] !== '"') { buf += input[j]; j++ }
      tokens.push({ text: buf, quoted: true })
      i = j + 1
      continue
    }
    let j = i
    let buf = ''
    while (j < input.length && !/\s/.test(input[j])) { buf += input[j]; j++ }
    tokens.push({ text: buf, quoted: false })
    i = j
  }
  return tokens
}

export function parse(rawLine) {
  const raw = String(rawLine || '').replace(/\r/g, '').trim()
  if (!raw) return null

  // Shortcut prefixes
  if (raw.startsWith('"')) return { verb: 'say', argstr: raw.slice(1).trim(), args: [], dobjstr: raw.slice(1).trim(), prepstr: '', iobjstr: '', raw, shortcut: true }
  if (raw.startsWith(':')) return { verb: 'emote', argstr: raw.slice(1).trim(), args: [], dobjstr: raw.slice(1).trim(), prepstr: '', iobjstr: '', raw, shortcut: true }
  if (raw.startsWith(';')) return { verb: 'eval', argstr: raw.slice(1).trim(), args: [], dobjstr: raw.slice(1).trim(), prepstr: '', iobjstr: '', raw, shortcut: true }

  const tokens = tokenize(raw)
  if (tokens.length === 0) return null
  let verb = tokens[0].text.toLowerCase()
  // Strip a leading "i " ("i go north") the way the old parser did
  let rest = tokens.slice(1)
  if (verb === 'i' && rest.length > 0) { verb = rest[0].text.toLowerCase(); rest = rest.slice(1) }

  const argstr = raw.slice(raw.indexOf(tokens[0].text) + tokens[0].text.length).trim()
    .replace(/^i\s+/, verb === tokens[0].text.toLowerCase() ? '' : '')
  const args = rest.map(t => t.text)

  // Find a preposition among the unquoted tokens (longest first)
  let prepIndex = -1, prepLen = 0, prepstr = ''
  for (let i = 0; i < rest.length && prepIndex === -1; i++) {
    if (rest[i].quoted) continue
    for (const prep of PREPOSITIONS) {
      const words = prep.split(' ')
      if (i + words.length > rest.length) continue
      let ok = true
      for (let k = 0; k < words.length; k++) {
        if (rest[i + k].quoted || rest[i + k].text.toLowerCase() !== words[k]) { ok = false; break }
      }
      if (ok) { prepIndex = i; prepLen = words.length; prepstr = prep; break }
    }
  }
  let dobjstr, iobjstr
  if (prepIndex === -1) {
    dobjstr = rest.map(t => t.text).join(' ')
    iobjstr = ''
  } else {
    dobjstr = rest.slice(0, prepIndex).map(t => t.text).join(' ')
    iobjstr = rest.slice(prepIndex + prepLen).map(t => t.text).join(' ')
  }
  return { verb, args, argstr: rest.map(t => t.quoted ? `"${t.text}"` : t.text).join(' '), rawArgstr: argstr, dobjstr, prepstr, iobjstr, raw, tokens }
}

// Resolve a typed direction word ("n", "north", "northward") to a canonical one.
export function canonicalDirection(word) {
  if (!word) return null
  const w = word.toLowerCase().replace(/ward(s)?$/, '')
  return DIRECTIONS[w] || null
}

export default parse
