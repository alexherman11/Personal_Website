#!/usr/bin/env node

/**
 * Batch ASCII Art Generator for The Depths
 *
 * Generates 3 variants of ASCII art for each of the 9 seed rooms.
 * Uses gradient mode (full ░▒▓█ shading) for rich pictogram-style art.
 * Saves outputs to src/data/ascii/<room_id>_v<1|2|3>.txt
 *
 * Usage:
 *   node scripts/generate-all-ascii.cjs
 *   node scripts/generate-all-ascii.cjs --rooms grand_hall,archive
 *   node scripts/generate-all-ascii.cjs --variants 5
 *
 * Options:
 *   --rooms       Comma-separated list of room IDs to generate (default: all)
 *   --variants    Number of variants per room (default: 3)
 *   --width, -w   ASCII width in characters (default: 60)
 *   --height, -h  ASCII height in lines (default: 16)
 *
 * Environment:
 *   FAL_KEY — your fal.ai API key (required)
 */

const fs = require('fs')
const path = require('path')
const { generateImage, pixelsToAscii, trimAsciiLines } = require('./ascii-utils.cjs')

// ---------------------------------------------------------------------------
// Room prompts — visual descriptions optimized for shaded pictograms
// ---------------------------------------------------------------------------

const ROOM_PROMPTS = {
  grand_hall: 'chandelier, ornate hanging chandelier with candles, centered, isolated object',
  archive: 'single tall bookshelf with books, front view, centered, isolated object',
  workshop: 'soldering iron and circuit board on table, centered, isolated object',
  study: 'desk lamp on wooden desk, centered, isolated object',
  signal_room: 'vintage radio with antenna, front view, centered, isolated object',
  grounds: 'small stone cottage, front view, centered, isolated object',
  tree: 'single large oak tree, centered, isolated object',
  entrance: 'arched wooden door, front view, centered, isolated object',
  vault: 'glowing portal, concentric circles of light, centered, isolated object',
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const flags = {}

for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (arg === '--rooms') { flags.rooms = args[++i]; continue }
  if (arg === '--variants') { flags.variants = parseInt(args[++i]); continue }
  if (arg === '--width' || arg === '-w') { flags.width = parseInt(args[++i]); continue }
  if (arg === '--height' || arg === '-h') { flags.height = parseInt(args[++i]); continue }
  if (arg === '--help') {
    const docstring = fs.readFileSync(__filename, 'utf8').match(/\/\*\*([\s\S]*?)\*\//)
    if (docstring) console.log(docstring[1])
    process.exit(0)
  }
}

if (!process.env.FAL_KEY) {
  console.error('Error: FAL_KEY environment variable is required.')
  console.error('Get one at https://fal.ai/dashboard/keys')
  process.exit(1)
}

const VARIANTS = flags.variants || 3
const WIDTH = flags.width || 60
const HEIGHT = flags.height || 16

const roomIds = flags.rooms
  ? flags.rooms.split(',').filter(id => ROOM_PROMPTS[id])
  : Object.keys(ROOM_PROMPTS)

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

const OUT_DIR = path.join(__dirname, '..', 'src', 'data', 'ascii')

async function generateRoom(roomId) {
  const prompt = ROOM_PROMPTS[roomId]
  console.log(`\n${'='.repeat(60)}`)
  console.log(`  ${roomId.toUpperCase()}`)
  console.log(`  Prompt: "${prompt}"`)
  console.log(`${'='.repeat(60)}`)

  for (let v = 1; v <= VARIANTS; v++) {
    console.log(`\n  [variant ${v}/${VARIANTS}]`)

    try {
      // Generate a fresh image for each variant (different seed each time)
      console.log('    Generating image...')
      const imageBuffer = await generateImage(prompt, {
        model: 'fal-ai/flux/schnell',
        steps: 4,
      })

      console.log('    Converting to ASCII (gradient mode)...')
      const lines = await pixelsToAscii(imageBuffer, {
        width: WIDTH,
        height: HEIGHT,
        gradient: true,
        invert: true,
      })

      const trimmed = trimAsciiLines(lines)
      const finalArt = trimmed.join('\n')

      // Save to file
      const filename = `${roomId}_v${v}.txt`
      const outPath = path.join(OUT_DIR, filename)
      fs.writeFileSync(outPath, finalArt + '\n')
      console.log(`    Saved: ${filename}`)

      // Preview first 4 lines
      for (let i = 0; i < Math.min(4, trimmed.length); i++) {
        console.log(`    | ${trimmed[i]}`)
      }
      if (trimmed.length > 4) console.log(`    | ... (${trimmed.length - 4} more lines)`)
    } catch (err) {
      console.error(`    ERROR: ${err.message}`)
    }
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  console.log(`Generating ASCII art for ${roomIds.length} rooms × ${VARIANTS} variants`)
  console.log(`Output directory: ${OUT_DIR}`)
  console.log(`Dimensions: ${WIDTH}×${HEIGHT}`)
  console.log(`Mode: gradient (full ░▒▓█ shading)`)

  for (const roomId of roomIds) {
    await generateRoom(roomId)
  }

  const totalFiles = roomIds.length * VARIANTS
  console.log(`\n${'='.repeat(60)}`)
  console.log(`  Done! Generated ${totalFiles} files in src/data/ascii/`)
  console.log(`  Review them, then paste your favorites into src/data/rooms.js`)
  console.log(`${'='.repeat(60)}`)
}

main().catch(err => {
  console.error('Fatal error:', err.message || err)
  process.exit(1)
})
