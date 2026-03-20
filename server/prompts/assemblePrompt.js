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
    "createItem": null,
    "createRoom": null,
    "moveToRoom": null
  }
}

- "narrative" is required. It is the text displayed to the player.
- "stateChanges.addFlag" can be set to { "key": "flag_name", "value": true } if the interaction should set a game flag. Otherwise null.
- "stateChanges.createItem" can be set to an item object when the player discovers and takes a new item:
  { "id": "snake_case_id", "name": "Display Name", "icon": "emoji", "description": "1-2 sentence description in narrator voice." }
  Otherwise null. See ITEM CREATION rules for when to use this.
- "stateChanges.createRoom" can create a new navigable room when the player does something creative. See ROOM CREATION rules.
  Format: { "id", "name", "description", "exitDirection", "returnDirection", "cluster", "objects" }
  Otherwise null.
- "stateChanges.moveToRoom" can be set to a room ID string from ROOM EXITS when the player is clearly trying to move to an existing adjacent room but used contextual language the parser couldn't resolve. See MOVEMENT TO EXISTING ROOMS rules. Otherwise null.
- Do NOT use both createItem and createRoom in the same response.
- Do NOT use both moveToRoom and createRoom in the same response.
- Do not include state changes for logbook opens — those are handled by the game engine.
- Keep the narrative to 2-4 sentences max (3-5 for room creation moments).`

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

  // Standard narrator mode — fall back to parent room content for generated rooms
  const content = alexContent[gameState.currentRoom]
    || alexContent[gameState.parentRoom]
    || alexContent.grand_hall

  return `${basePrompt}

${content}

CURRENT GAME STATE:
${roomCtx}

${responseFormat}`
}
