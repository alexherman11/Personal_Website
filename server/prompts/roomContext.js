export default function buildRoomContext(gameState) {
  const {
    currentRoom,
    visitedRooms = [],
    inventory = [],
    flags = {},
    roomItemsTaken = {},
    currentRoomItems = [],
  } = gameState

  const parts = []

  parts.push(`CURRENT LOCATION: ${currentRoom}`)
  parts.push(`ROOMS VISITED: ${visitedRooms.join(', ')}`)

  // Full inventory with IDs so AI can check for duplicates
  if (inventory.length > 0) {
    const itemList = inventory.map(i => `${i.id}: ${i.name}`).join(', ')
    parts.push(`PLAYER INVENTORY: ${itemList}`)
  } else {
    parts.push('PLAYER INVENTORY: empty')
  }

  // Items taken across ALL rooms (not just current) for global consistency
  const allTaken = Object.entries(roomItemsTaken)
    .filter(([, ids]) => ids.length > 0)
    .map(([room, ids]) => `${room}: ${ids.join(', ')}`)
  if (allTaken.length > 0) {
    parts.push(`ITEMS TAKEN (ALL ROOMS): ${allTaken.join('; ')}`)
  }

  // Static items still available in current room (sent from frontend)
  if (currentRoomItems.length > 0) {
    const itemStrs = currentRoomItems.map(i => `${i.name} (keywords: ${i.keywords.join(', ')})`)
    parts.push(`ITEMS AVAILABLE IN THIS ROOM: ${itemStrs.join('; ')}`)
  }

  const flagEntries = Object.entries(flags)
  if (flagEntries.length > 0) {
    const flagStr = flagEntries.map(([k, v]) => `${k}=${v}`).join(', ')
    parts.push(`GAME FLAGS: ${flagStr}`)
  }

  // Room generation context
  const genCount = gameState.generatedRoomCount || 0
  parts.push(`GENERATED ROOMS THIS SESSION: ${genCount}/8`)

  const currentDepth = gameState.currentRoomDepth
  if (currentDepth !== undefined) {
    parts.push(`CURRENT ROOM DEPTH FROM SEED: ${currentDepth}/3`)
  }

  const dynamicExits = gameState.dynamicExits || {}
  const dynExitEntries = Object.entries(dynamicExits)
    .map(([room, exits]) =>
      `${room}: ${Object.entries(exits).map(([dir, target]) => `${dir}→${target}`).join(', ')}`
    )
  if (dynExitEntries.length > 0) {
    parts.push(`DYNAMIC EXITS: ${dynExitEntries.join('; ')}`)
  }

  return parts.join('\n')
}
