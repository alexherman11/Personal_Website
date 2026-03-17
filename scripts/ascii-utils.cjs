/**
 * Shared ASCII art generation utilities for The Depths
 *
 * Used by:
 *   - scripts/generate-ascii.cjs (CLI tool)
 *   - scripts/generate-all-ascii.cjs (batch generator)
 *   - server/ascii/generateAscii.js (runtime generation)
 */

const { createFalClient } = require('@fal-ai/client')
const sharp = require('sharp')

const DEFAULT_RAMP = ' ░▒▓█'
const STYLE_SUFFIX = ', grayscale illustration on pure white background, simple centered pictogram, smooth shading, no text, no border, clean edges, icon style'

/**
 * Generate an image via fal.ai FLUX
 * @param {string} prompt - User prompt (style suffix added automatically)
 * @param {object} options
 * @param {string} [options.model='fal-ai/flux/schnell'] - FLUX model ID
 * @param {number} [options.steps=4] - Inference steps (1-4)
 * @param {string} [options.falKey] - fal.ai API key (defaults to FAL_KEY env var)
 * @returns {Promise<Buffer>} Image buffer
 */
async function generateImage(prompt, options = {}) {
  const {
    model = 'fal-ai/flux/schnell',
    steps = 4,
    falKey = process.env.FAL_KEY,
  } = options

  if (!falKey) {
    throw new Error('FAL_KEY is required for image generation')
  }

  const fal = createFalClient({ credentials: falKey })
  const imagePrompt = `${prompt}${STYLE_SUFFIX}`

  const result = await fal.subscribe(model, {
    input: {
      prompt: imagePrompt,
      num_inference_steps: steps,
      image_size: 'square',
    },
  })

  const imageUrl = result.data.images[0].url
  const response = await fetch(imageUrl)
  return Buffer.from(await response.arrayBuffer())
}

/**
 * Convert an image buffer to ASCII art lines
 * @param {Buffer} imageBuffer - Raw image data
 * @param {object} options
 * @param {number} [options.width=60] - ASCII width in characters
 * @param {number} [options.height=16] - ASCII height in lines
 * @param {string} [options.ramp=' ░▒▓█'] - Character ramp light→dark
 * @param {boolean} [options.invert=false] - Invert light/dark
 * @param {boolean} [options.gradient=false] - Keep grayscale (skip threshold)
 * @param {number} [options.threshold=128] - B&W threshold 0-255
 * @returns {Promise<string[]>} Array of ASCII art lines
 */
async function pixelsToAscii(imageBuffer, options = {}) {
  const {
    width = 60,
    height = 16,
    ramp = DEFAULT_RAMP,
    invert = false,
    gradient = false,
    threshold = 128,
  } = options

  let pipeline = sharp(imageBuffer)
    .greyscale()
    .resize(width, height, { fit: 'fill', kernel: 'lanczos3' })
    .normalize()

  if (!gradient) {
    pipeline = pipeline.threshold(threshold)
  }

  const { data, info } = await pipeline
    .raw()
    .toBuffer({ resolveWithObject: true })

  const rampLen = ramp.length
  const lines = []

  for (let y = 0; y < info.height; y++) {
    let line = ''
    for (let x = 0; x < info.width; x++) {
      let brightness = data[y * info.width + x]
      if (invert) brightness = 255 - brightness
      if (brightness < 30) brightness = 0  // clean up near-white bg noise
      const charIdx = Math.floor((brightness / 255) * (rampLen - 1))
      line += ramp[charIdx]
    }
    lines.push(line)
  }

  return lines
}

/**
 * Trim blank lines from top/bottom and trailing whitespace per line
 * @param {string[]} lines
 * @returns {string[]}
 */
function trimAsciiLines(lines) {
  const trimmed = lines.map(l => l.trimEnd())
  while (trimmed.length && trimmed[0].trim() === '') trimmed.shift()
  while (trimmed.length && trimmed[trimmed.length - 1].trim() === '') trimmed.pop()
  return trimmed
}

module.exports = { generateImage, pixelsToAscii, trimAsciiLines, DEFAULT_RAMP, STYLE_SUFFIX }
