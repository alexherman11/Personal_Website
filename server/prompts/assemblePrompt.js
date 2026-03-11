import basePrompt from './basePrompt.js'
import buildRoomContext from './roomContext.js'
import alexContent from './alexContent.js'
import buildEntrancePrompt from './entrancePrompt.js'

const responseFormat = `
RESPONSE FORMAT:
You must respond with valid JSON only. No markdown, no code fences, no extra text outside the JSON.
{
  "narrative": "Your narrator text here. This is what the player sees in the terminal.",
  "stateChanges": {
    "addFlag": null,
    "createItem": null
  }
}

- "narrative" is required. It is the text displayed to the player.
- "stateChanges.addFlag" can be set to { "key": "flag_name", "value": true } if the interaction should set a game flag. Otherwise null.
- "stateChanges.createItem" can be set to an item object when the player discovers and takes a new item:
  { "id": "snake_case_id", "name": "Display Name", "icon": "emoji", "description": "1-2 sentence description in narrator voice." }
  Otherwise null. See ITEM CREATION rules for when to use this.
- Do not include state changes for room moves or logbook opens — those are handled by the game engine.
- Keep the narrative to 2-4 sentences max.`

export default function assembleSystemPrompt(gameState) {
  const roomCtx = buildRoomContext(gameState)

  // Entrance mode — uses special narrator prompt (no guardian, no escalation)
  if (gameState.currentRoom === 'entrance' && gameState.phase === 'entrance') {
    const entranceContent = alexContent.entrance
    return `${buildEntrancePrompt()}

${entranceContent}

CURRENT GAME STATE:
${roomCtx}

${responseFormat}`
  }

  // Standard narrator mode
  const content = alexContent[gameState.currentRoom] || alexContent.grand_hall

  return `${basePrompt}

${content}

CURRENT GAME STATE:
${roomCtx}

${responseFormat}`
}
