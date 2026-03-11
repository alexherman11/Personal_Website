const initialState = {
  phase: 'entrance',
  currentRoom: 'entrance',
  visitedRooms: ['entrance'],
  inventory: [],
  panelOpen: null,
  logbookOpen: null,
  logbookPage: 0,
  flags: {},
  roomItemsTaken: {},
  conversationHistory: [],
  aiLoading: false,
  jailbreakAttempts: 0,
}

export default initialState
