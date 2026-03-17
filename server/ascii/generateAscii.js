/**
 * Server-side ASCII art generation for procedural rooms.
 *
 * Calls fal.ai FLUX Schnell to generate an image from a text prompt,
 * then converts it to ASCII art via sharp pixel-to-character mapping.
 *
 * Falls back to empty array on any failure (missing key, network error, timeout).
 */

import { createFalClient } from '@fal-ai/client'
import sharp from 'sharp'

const DEFAULT_RAMP = ' ░▒▓█'
const STYLE_SUFFIX = ', grayscale illustration on pure white background, simple centered pictogram, smooth shading, no text, no border, clean edges, icon style'

/**
 * Generate ASCII art from a text prompt.
 * @param {string} prompt - Visual description of the room (e.g., "underground cave with stalactites")
 * @param {object} [options]
 * @param {number} [options.width=60] - ASCII width in characters
 * @param {number} [options.height=16] - ASCII height in lines
 * @param {number} [options.threshold=128] - B&W threshold 0-255
 * @param {string} [options.ramp=' ░▒▓█'] - Character ramp light→dark
 * @returns {Promise<string[]>} Array of ASCII art lines, or empty array on failure
 */
export async function generateAsciiArt(prompt, options = {}) {
  const {
    width = 60,
    height = 16,
    threshold = 128,
    ramp = DEFAULT_RAMP,
  } = options

  try {
    const falKey = process.env.FAL_KEY
    if (!falKey) {
      console.warn('[ascii] FAL_KEY not set, skipping ASCII art generation')
      return []
    }

    const fal = createFalClient({ credentials: falKey })
    const imagePrompt = `${prompt}${STYLE_SUFFIX}`

    console.log(`[ascii] Generating image for: "${prompt}"`)
    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt: imagePrompt,
        num_inference_steps: 4,
        image_size: 'square',
      },
    })

    const imageUrl = result.data.images[0].url
    const response = await fetch(imageUrl)
    const imageBuffer = Buffer.from(await response.arrayBuffer())

    // Convert to ASCII (gradient mode — full ░▒▓█ shading)
    let pipeline = sharp(imageBuffer)
      .greyscale()
      .resize(width, height, { fit: 'fill', kernel: 'lanczos3' })
      .normalize()

    const { data, info } = await pipeline
      .raw()
      .toBuffer({ resolveWithObject: true })

    const rampLen = ramp.length
    const lines = []

    for (let y = 0; y < info.height; y++) {
      let line = ''
      for (let x = 0; x < info.width; x++) {
        let brightness = 255 - data[y * info.width + x]
        if (brightness < 30) brightness = 0  // clean up near-white bg noise
        const charIdx = Math.floor((brightness / 255) * (rampLen - 1))
        line += ramp[charIdx]
      }
      lines.push(line)
    }

    // Trim
    const trimmed = lines.map(l => l.trimEnd())
    while (trimmed.length && trimmed[0].trim() === '') trimmed.shift()
    while (trimmed.length && trimmed[trimmed.length - 1].trim() === '') trimmed.pop()

    console.log(`[ascii] Generated ${trimmed.length}-line ASCII art`)
    return trimmed
  } catch (err) {
    console.error(`[ascii] Generation failed, proceeding without art:`, err.message)
    return []
  }
}
