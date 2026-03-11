import Anthropic from '@anthropic-ai/sdk'
import assembleSystemPrompt from '../prompts/assemblePrompt.js'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export default async function chatRoute(req, res) {
  const { message, gameState } = req.body

  if (!message || !gameState) {
    return res.status(400).json({
      narrative: 'The narrator stares blankly. Something was lost in translation.',
      stateChanges: {},
    })
  }

  try {
    const systemPrompt = assembleSystemPrompt(gameState)

    // Build messages from conversation history + new message
    const messages = []
    if (gameState.conversationHistory) {
      for (const msg of gameState.conversationHistory) {
        messages.push({ role: msg.role, content: msg.content })
      }
    }
    messages.push({ role: 'user', content: message })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: systemPrompt,
      messages,
    })

    let rawText = response.content[0]?.text || ''

    // Strip markdown code fences if present (model sometimes wraps JSON in ```json ... ```)
    rawText = rawText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

    // Try to parse as JSON (with fallback for embedded JSON)
    let narrative = ''
    let stateChanges = {}

    try {
      const parsed = JSON.parse(rawText)
      narrative = parsed.narrative || rawText
      stateChanges = parsed.stateChanges || {}
    } catch {
      // JSON parse failed — try to find an embedded JSON block in the text
      // The model sometimes writes narrative text before the JSON
      const jsonMatch = rawText.match(/\{[\s\S]*"narrative"\s*:[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          narrative = parsed.narrative || rawText
          stateChanges = parsed.stateChanges || {}
        } catch {
          narrative = rawText
        }
      } else {
        narrative = rawText
      }
    }

    // Validate and sanitize createItem if present
    if (stateChanges.createItem) {
      const ci = stateChanges.createItem
      if (!ci.id || !ci.name || !ci.icon || !ci.description) {
        // Malformed — strip it
        stateChanges.createItem = null
      } else {
        // Sanitize: force safe defaults, cast to strings
        stateChanges.createItem = {
          id: String(ci.id),
          name: String(ci.name),
          icon: String(ci.icon),
          description: String(ci.description).slice(0, 300),
          realLink: null,
          isVaultClue: false,
        }
      }
    }

    // Check for jailbreak success marker
    let jailbreakSuccess = false
    if (narrative.includes('<<DOOR_OPENS>>')) {
      narrative = narrative.replace(/<<DOOR_OPENS>>/g, '').trim()
      jailbreakSuccess = true
    }

    return res.json({ narrative, stateChanges, jailbreakSuccess })
  } catch (err) {
    console.error('Chat API error:', err.message)

    if (err.status === 401) {
      return res.status(500).json({
        narrative: 'The narrator\'s voice fades to static. Something is wrong with the connection to the deeper systems.',
        stateChanges: {},
      })
    }

    if (err.status === 429) {
      return res.status(429).json({
        narrative: 'The narrator holds up a hand. "One moment. Too many voices at once."',
        stateChanges: {},
      })
    }

    return res.status(500).json({
      narrative: 'The narrator pauses, momentarily lost in thought. Perhaps try again.',
      stateChanges: {},
    })
  }
}
