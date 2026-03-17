#!/usr/bin/env node

/**
 * ASCII Art Generator for The Depths
 *
 * Generates ASCII art from AI-generated images using:
 *   1. fal.ai FLUX Schnell — high-contrast B&W image (~$0.003/image)
 *   2. sharp — resize, greyscale, threshold to pure B&W
 *   3. Raw pixel → character mapping (no third-party ASCII lib)
 *
 * Usage:
 *   node scripts/generate-ascii.cjs <room-name> "<prompt>"
 *   node scripts/generate-ascii.cjs grand_hall "gothic cathedral hall with chandelier and stone pillars"
 *
 * Options:
 *   --width, -w     ASCII width in characters (default: 60)
 *   --height, -h    ASCII height in lines (default: 16)
 *   --threshold, -t B&W threshold 0-255 (default: 128)
 *   --save, -s      Save to src/data/ascii/<room-name>.txt
 *   --ramp, -r      Character ramp light→dark (default: " ░▒▓█")
 *   --invert, -i    Invert light/dark (use if art looks reversed)
 *   --steps          FLUX inference steps 1-4 (default: 4)
 *   --model, -m     "schnell" or "dev" (default: schnell)
 *   --gradient, -g  Keep grayscale (skip threshold) for smoother art
 *   --image          Skip generation, use local image file instead
 *
 * Environment:
 *   FAL_KEY — your fal.ai API key (required unless --image is used)
 */

const fs = require('fs')
const path = require('path')
const { generateImage, pixelsToAscii, trimAsciiLines, DEFAULT_RAMP } = require('./ascii-utils.cjs')

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const flags = {}
const positional = []

for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (arg === '--save' || arg === '-s') { flags.save = true; continue }
  if (arg === '--invert' || arg === '-i') { flags.invert = true; continue }
  if (arg === '--gradient' || arg === '-g') { flags.gradient = true; continue }
  if (arg === '--width' || arg === '-w') { flags.width = parseInt(args[++i]); continue }
  if (arg === '--height' || arg === '-h') { flags.height = parseInt(args[++i]); continue }
  if (arg === '--threshold' || arg === '-t') { flags.threshold = parseInt(args[++i]); continue }
  if (arg === '--ramp' || arg === '-r') { flags.ramp = args[++i]; continue }
  if (arg === '--steps') { flags.steps = parseInt(args[++i]); continue }
  if (arg === '--model' || arg === '-m') { flags.model = args[++i]; continue }
  if (arg === '--image') { flags.image = args[++i]; continue }
  if (arg === '--help') {
    const docstring = fs.readFileSync(__filename, 'utf8').match(/\/\*\*([\s\S]*?)\*\//)
    if (docstring) console.log(docstring[1])
    process.exit(0)
  }
  positional.push(arg)
}

const roomName = positional[0]
const userPrompt = positional.slice(1).join(' ')

if (!roomName) {
  console.error('Usage: node scripts/generate-ascii.cjs <room-name> "<prompt>"')
  console.error('       node scripts/generate-ascii.cjs <room-name> --image path/to/image.png')
  console.error('       node scripts/generate-ascii.cjs --help')
  process.exit(1)
}

if (!flags.image && !userPrompt) {
  console.error('Error: provide a prompt or use --image <path>')
  process.exit(1)
}

if (!flags.image && !process.env.FAL_KEY) {
  console.error('Error: FAL_KEY environment variable is required.')
  console.error('Get one at https://fal.ai/dashboard/keys')
  process.exit(1)
}

const WIDTH = flags.width || 60
const HEIGHT = flags.height || 16
const THRESHOLD = flags.threshold || 128
const STEPS = flags.steps || 4
const MODEL = flags.model === 'dev' ? 'fal-ai/flux/dev' : 'fal-ai/flux/schnell'
const CHAR_RAMP = flags.ramp || DEFAULT_RAMP

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

async function main() {
  let imageBuffer

  if (flags.image) {
    console.error(`[1/2] Loading image from ${flags.image}...`)
    imageBuffer = fs.readFileSync(flags.image)
  } else {
    console.error(`[1/3] Generating image via ${MODEL}...`)
    console.error(`      Prompt: "${userPrompt}"`)
    imageBuffer = await generateImage(userPrompt, { model: MODEL, steps: STEPS })
  }

  const step = flags.image ? '2/2' : '3/3'
  console.error(`[${step}] Converting to ASCII (${WIDTH}x${HEIGHT}, ramp: "${CHAR_RAMP}")...`)

  const lines = await pixelsToAscii(imageBuffer, {
    width: WIDTH,
    height: HEIGHT,
    ramp: CHAR_RAMP,
    invert: flags.invert,
    gradient: flags.gradient,
    threshold: THRESHOLD,
  })

  const trimmed = trimAsciiLines(lines)
  const finalArt = trimmed.join('\n')

  // Output the art to stdout
  console.log(finalArt)

  // Optionally save to file
  if (flags.save) {
    const outDir = path.join(__dirname, '..', 'src', 'data', 'ascii')
    fs.mkdirSync(outDir, { recursive: true })
    const outPath = path.join(outDir, `${roomName}.txt`)
    fs.writeFileSync(outPath, finalArt + '\n')
    console.error(`\nSaved to ${outPath}`)
  }

  // Output JS array format for easy pasting into rooms.js
  console.error('\n--- JS array format (paste into rooms.js) ---')
  console.error('asciiArt: [')
  for (const line of trimmed) {
    console.error(`  ${JSON.stringify(line)},`)
  }
  console.error('],')
}

main().catch(err => {
  console.error('Error:', err.message || err)
  process.exit(1)
})
