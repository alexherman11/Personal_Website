import rooms from '../data/rooms'

/**
 * Get a room definition from either static rooms or generated rooms.
 */
export function getRoom(roomId, gameState) {
  return rooms[roomId] || gameState.generatedRooms?.[roomId] || null
}

/**
 * Get merged exits for a room (static exits + dynamically-added exits).
 */
export function getExits(roomId, gameState) {
  const room = getRoom(roomId, gameState)
  if (!room) return {}
  const dynamic = gameState.dynamicExits?.[roomId] || {}
  return { ...room.exits, ...dynamic }
}

/**
 * Check whether a roomId belongs to the static seed rooms.
 */
export function isSeedRoom(roomId) {
  return roomId in rooms
}

/**
 * Compute how many hops a room is from the nearest seed room.
 * Seed rooms return 0. Generated rooms walk up the parentRoom chain.
 */
export function getGenerationDepth(roomId, gameState) {
  if (isSeedRoom(roomId)) return 0
  const room = gameState.generatedRooms?.[roomId]
  if (!room?.parentRoom) return 99
  return 1 + getGenerationDepth(room.parentRoom, gameState)
}
