const initialState = {
  phase: 'landing',
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
  generatedRooms: {},
  dynamicExits: {},
  generatedRoomCount: 0,
  generatedItemDefs: {},
}

export default initialState
