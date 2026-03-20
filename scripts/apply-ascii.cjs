#!/usr/bin/env node
/**
 * Apply selected ASCII art variants to rooms.js
 */
const fs = require('fs')
const path = require('path')

const SELECTIONS = {
  grand_hall: 'grand_hall_v3.txt',
  archive: 'archive_v1.txt',
  workshop: 'workshop_v1.txt',
  study: 'study_v1.txt',
  signal_room: 'signal_room_v2.txt',
  grounds: 'grounds_v2.txt',
  tree: 'tree_v3.txt',
  entrance: 'entrance_v2.txt',
  vault: 'vault_v2.txt',
}

const asciiDir = path.join(__dirname, '..', 'src', 'data', 'ascii')
const roomsFile = path.join(__dirname, '..', 'src', 'data', 'rooms.js')

let content = fs.readFileSync(roomsFile, 'utf8')

for (const [roomId, filename] of Object.entries(SELECTIONS)) {
  const artPath = path.join(asciiDir, filename)
  const lines = fs.readFileSync(artPath, 'utf8').trimEnd().split('\n')

  // Dedent: strip common leading whitespace so CSS can center the art
  const nonEmptyLines = lines.filter(l => l.trim().length > 0)
  const minIndent = nonEmptyLines.reduce((min, l) => {
    const spaces = l.match(/^( *)/)[1].length
    return Math.min(min, spaces)
  }, Infinity)
  const dedented = lines.map(l => l.slice(minIndent))

  // Build JS array lines
  const jsLines = dedented.map(l => {
    const escaped = l.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    return `      '${escaped}',`
  }).join('\n')

  // Find the asciiArt block for this room
  const roomStart = content.indexOf(`id: '${roomId}'`)
  if (roomStart === -1) {
    console.error(`Room not found: ${roomId}`)
    continue
  }

  const artStart = content.indexOf('asciiArt: [', roomStart)
  if (artStart === -1) {
    console.error(`asciiArt not found for: ${roomId}`)
    continue
  }

  const bracketStart = artStart + 'asciiArt: ['.length
  const bracketEnd = content.indexOf('\n    ],', bracketStart)
  if (bracketEnd === -1) {
    console.error(`Closing bracket not found for: ${roomId}`)
    continue
  }

  content = content.slice(0, bracketStart) + '\n' + jsLines + content.slice(bracketEnd)
  console.log(`Replaced: ${roomId} (${lines.length} lines)`)
}

fs.writeFileSync(roomsFile, content)
console.log('Done! All asciiArt arrays updated.')
