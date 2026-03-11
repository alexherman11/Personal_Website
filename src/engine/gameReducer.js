import rooms from '../data/rooms'

export const ACTIONS = {
  MOVE_TO_ROOM: 'MOVE_TO_ROOM',
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  TOGGLE_PANEL: 'TOGGLE_PANEL',
  CLOSE_PANELS: 'CLOSE_PANELS',
  OPEN_LOGBOOK: 'OPEN_LOGBOOK',
  CLOSE_LOGBOOK: 'CLOSE_LOGBOOK',
  LOGBOOK_NEXT_PAGE: 'LOGBOOK_NEXT_PAGE',
  LOGBOOK_PREV_PAGE: 'LOGBOOK_PREV_PAGE',
  SET_FLAG: 'SET_FLAG',
  SET_PHASE: 'SET_PHASE',
  ADD_CONVERSATION_MESSAGE: 'ADD_CONVERSATION_MESSAGE',
  SET_AI_LOADING: 'SET_AI_LOADING',
  INCREMENT_JAILBREAK_ATTEMPTS: 'INCREMENT_JAILBREAK_ATTEMPTS',
  CREATE_ROOM: 'CREATE_ROOM',
}

export default function gameReducer(state, action) {
  switch (action.type) {

    case ACTIONS.MOVE_TO_ROOM: {
      const roomId = action.payload
      return {
        ...state,
        currentRoom: roomId,
        visitedRooms: state.visitedRooms.includes(roomId)
          ? state.visitedRooms
          : [...state.visitedRooms, roomId],
        panelOpen: null,
        conversationHistory: [],
      }
    }

    case ACTIONS.ADD_ITEM: {
      const item = action.payload
      if (state.inventory.find(i => i.id === item.id)) return state
      const roomId = state.currentRoom
      return {
        ...state,
        inventory: [...state.inventory, item],
        roomItemsTaken: {
          ...state.roomItemsTaken,
          [roomId]: [...(state.roomItemsTaken[roomId] || []), item.id],
        },
      }
    }

    case ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        inventory: state.inventory.filter(i => i.id !== action.payload),
      }

    case ACTIONS.TOGGLE_PANEL: {
      const panelName = action.payload
      return {
        ...state,
        panelOpen: state.panelOpen === panelName ? null : panelName,
        logbookOpen: null,
        logbookPage: 0,
      }
    }

    case ACTIONS.CLOSE_PANELS:
      return { ...state, panelOpen: null }

    case ACTIONS.OPEN_LOGBOOK:
      return {
        ...state,
        logbookOpen: action.payload,
        logbookPage: 0,
        panelOpen: null,
      }

    case ACTIONS.CLOSE_LOGBOOK:
      return { ...state, logbookOpen: null, logbookPage: 0 }

    case ACTIONS.LOGBOOK_NEXT_PAGE:
      return { ...state, logbookPage: state.logbookPage + 1 }

    case ACTIONS.LOGBOOK_PREV_PAGE:
      return { ...state, logbookPage: Math.max(0, state.logbookPage - 1) }

    case ACTIONS.SET_FLAG:
      return {
        ...state,
        flags: { ...state.flags, [action.payload.key]: action.payload.value },
      }

    case ACTIONS.SET_PHASE:
      return { ...state, phase: action.payload }

    case ACTIONS.ADD_CONVERSATION_MESSAGE: {
      const history = [...state.conversationHistory, action.payload]
      if (history.length > 20) history.splice(0, history.length - 20)
      return { ...state, conversationHistory: history }
    }

    case ACTIONS.SET_AI_LOADING:
      return { ...state, aiLoading: action.payload }

    case ACTIONS.INCREMENT_JAILBREAK_ATTEMPTS:
      return { ...state, jailbreakAttempts: state.jailbreakAttempts + 1 }

    case ACTIONS.CREATE_ROOM: {
      const { room, parentRoomId, exitDirection } = action.payload

      // Guard: session cap
      if (state.generatedRoomCount >= 8) return state

      // Guard: duplicate room ID (check static and generated)
      if (rooms[room.id] || state.generatedRooms[room.id]) return state

      // Guard: exit direction already occupied on parent
      const parentStaticExits = rooms[parentRoomId]?.exits || state.generatedRooms[parentRoomId]?.exits || {}
      const parentDynamicExits = state.dynamicExits[parentRoomId] || {}
      if (parentStaticExits[exitDirection] || parentDynamicExits[exitDirection]) return state

      // Guard: depth cap (walk parentRoom chain, max 3 deep)
      let depth = 0
      let cursor = parentRoomId
      while (state.generatedRooms[cursor]) {
        depth++
        cursor = state.generatedRooms[cursor].parentRoom
        if (depth >= 3) return state
      }

      return {
        ...state,
        generatedRooms: {
          ...state.generatedRooms,
          [room.id]: room,
        },
        dynamicExits: {
          ...state.dynamicExits,
          [parentRoomId]: {
            ...parentDynamicExits,
            [exitDirection]: room.id,
          },
        },
        generatedRoomCount: state.generatedRoomCount + 1,
      }
    }

    default:
      return state
  }
}
