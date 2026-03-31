import initialState from './initialState'

const SAVE_KEY = 'the-depths-save'

const PERSISTED_FIELDS = [
  'phase',
  'currentRoom',
  'visitedRooms',
  'inventory',
  'roomItemsTaken',
  'flags',
  'generatedRooms',
  'dynamicExits',
  'generatedRoomCount',
  'generatedItemDefs',
]

export function saveGame(state) {
  // Don't persist landing or portfolio phases — only game progress
  if (state.phase === 'landing' || state.phase === 'portfolio') return
  try {
    const saveData = {}
    for (const key of PERSISTED_FIELDS) {
      saveData[key] = state[key]
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)

    // Merge with initialState so new fields get defaults
    const merged = { ...initialState }
    for (const key of PERSISTED_FIELDS) {
      if (saved[key] !== undefined) {
        merged[key] = saved[key]
      }
    }

    // If saved mid-boot, treat as playing for resume purposes
    if (merged.phase === 'boot') {
      merged.phase = 'playing'
    }

    // Always start at landing screen on load — game progress is preserved,
    // but the player must choose to re-enter from the home screen
    merged._savedPhase = merged.phase
    merged.phase = 'landing'

    return merged
  } catch {
    // Corrupted save — start fresh
    localStorage.removeItem(SAVE_KEY)
    return null
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY)
}
