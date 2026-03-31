import { useReducer, useRef, useCallback, useEffect } from 'react'
import CRTScreen from './components/CRTScreen/CRTScreen'
import LandingPage from './components/LandingPage/LandingPage'
import PortfolioPage from './components/PortfolioPage/PortfolioPage'
import BootSequence from './components/BootSequence/BootSequence'
import Terminal from './components/Terminal/Terminal'
import InventoryPanel from './components/InventoryPanel/InventoryPanel'
import MapPanel from './components/MapPanel/MapPanel'
import MiniMap from './components/MiniMap/MiniMap'
import MiniInventory from './components/MiniInventory/MiniInventory'
import Logbook from './components/Logbook/Logbook'
import gameReducer, { ACTIONS } from './engine/gameReducer'
import initialState from './engine/initialState'
import { saveGame, loadGame, clearSave } from './engine/saveState'
import parseCommand from './engine/commandParser'
import handleGameCommand from './engine/commandHandler'
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts'
import useAudio from './hooks/useAudio'
import logbooks from './data/logbooks'
import rooms from './data/rooms'
import itemDefs from './data/items'
import * as effects from './audio/effects'
import ambientManager from './audio/ambients'
import musicManager from './audio/music'
import { getRoom, getGenerationDepth } from './engine/roomLookup'

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState, () => loadGame() || initialState)
  const terminalRef = useRef(null)
  const hasShownInitialRoom = useRef(false)
  const { muted, toggleMute, initialized: audioReady } = useAudio()

  // Track previous values for audio triggers
  const prevPanelRef = useRef(null)
  const prevLogbookRef = useRef(null)
  const prevPageRef = useRef(0)

  // Persist game state to localStorage on meaningful changes
  useEffect(() => {
    saveGame(state)
  }, [state.phase, state.currentRoom, state.visitedRooms, state.inventory,
      state.roomItemsTaken, state.flags, state.generatedRooms,
      state.dynamicExits, state.generatedRoomCount, state.generatedItemDefs])

  const handleBootComplete = useCallback(() => {
    dispatch({ type: ACTIONS.SET_PHASE, payload: 'playing' })
  }, [])

  // Show initial room description when entering entrance or playing phase
  useEffect(() => {
    if ((state.phase === 'entrance' || state.phase === 'playing') &&
        !hasShownInitialRoom.current && terminalRef.current) {
      hasShownInitialRoom.current = true
      const result = handleGameCommand({ type: 'look' }, state)
      terminalRef.current.clearLines()
      if (result.roomHeader) {
        terminalRef.current.setRoomHeader(result.roomHeader)
      }
      terminalRef.current.addLines(result.output, { typewriter: true, speed: 20 })
    }
  }, [state.phase])

  // Audio: room ambient changes (gate on audioReady so initial room starts after init)
  useEffect(() => {
    if (audioReady) {
      const room = getRoom(state.currentRoom, state)
      ambientManager.setRoom(state.currentRoom, room?.cluster)
      musicManager.setRoom(state.currentRoom, room?.cluster)
    }
  }, [state.currentRoom, audioReady])

  // Audio: panel open/close
  useEffect(() => {
    if (state.panelOpen && !prevPanelRef.current) {
      effects.panelOpen()
    } else if (!state.panelOpen && prevPanelRef.current) {
      effects.panelClose()
    }
    prevPanelRef.current = state.panelOpen
  }, [state.panelOpen])

  // Audio: logbook open/close
  useEffect(() => {
    if (state.logbookOpen && !prevLogbookRef.current) {
      effects.logbookOpen()
    } else if (!state.logbookOpen && prevLogbookRef.current) {
      effects.logbookClose()
    }
    prevLogbookRef.current = state.logbookOpen
  }, [state.logbookOpen])

  // Audio: page turn
  useEffect(() => {
    if (state.logbookOpen && state.logbookPage !== prevPageRef.current) {
      effects.pageTurn()
    }
    prevPageRef.current = state.logbookPage
  }, [state.logbookPage])

  const handleCommand = useCallback(async (rawInput) => {
    const parsed = parseCommand(rawInput)
    if (!parsed) return

    if (parsed.type === 'newgame') {
      clearSave()
      window.location.reload()
      return
    }

    if (parsed.type === 'menu') {
      dispatch({ type: ACTIONS.SET_PHASE, payload: 'landing' })
      return
    }

    const result = handleGameCommand(parsed, state)

    // Check for room move — play transition animation before dispatching
    const roomMoveAction = result.actions.find(a => a.type === ACTIONS.MOVE_TO_ROOM)
    if (roomMoveAction && terminalRef.current) {
      effects.roomTransition()
      await terminalRef.current.playTransition({ duration: 800 })
      // Dispatch all actions after transition completes
      for (const action of result.actions) {
        dispatch(action)
        if (action.type === ACTIONS.ADD_ITEM) effects.itemPickup()
      }
      if (result.roomHeader) terminalRef.current.setRoomHeader(result.roomHeader)
      if (result.output.length > 0) {
        terminalRef.current.addLines(result.output, { typewriter: true, speed: 20 })
      }
    } else {
      // No room move — dispatch immediately
      for (const action of result.actions) {
        dispatch(action)
        if (action.type === ACTIONS.ADD_ITEM) effects.itemPickup()
      }
      if (result.roomHeader && terminalRef.current) {
        terminalRef.current.setRoomHeader(result.roomHeader)
      }
      if (result.output.length > 0 && terminalRef.current) {
        terminalRef.current.addLines(result.output, { typewriter: true, speed: 20 })
      }
    }

    // Handle local door opening (Explorer key, Knock, Hacker, Brute)
    if (result.doorOpens && state.phase === 'entrance') {
      effects.jailbreakSuccess()
      setTimeout(() => {
        hasShownInitialRoom.current = false
        dispatch({ type: ACTIONS.MOVE_TO_ROOM, payload: 'grand_hall' })
        dispatch({ type: ACTIONS.SET_PHASE, payload: 'boot' })
      }, 6000)
      return
    }

    // If AI request needed, call the backend
    if (result.aiRequest) {
      dispatch({ type: ACTIONS.SET_AI_LOADING, payload: true })
      dispatch({
        type: ACTIONS.ADD_CONVERSATION_MESSAGE,
        payload: { role: 'user', content: result.aiRequest.message },
      })

      // Track jailbreak attempts at the entrance
      if (state.phase === 'entrance' && state.currentRoom === 'entrance') {
        dispatch({ type: ACTIONS.INCREMENT_JAILBREAK_ATTEMPTS })
      }

      try {
        // Build available items for AI room awareness (static + generated)
        const currentRoom = getRoom(state.currentRoom, state)
        const takenHere = state.roomItemsTaken[state.currentRoom] || []
        const currentRoomItems = currentRoom
          ? Object.values(currentRoom.items)
              .filter(item => !takenHere.includes(item.id))
              .map(item => {
                const def = itemDefs[item.id] || state.generatedItemDefs[item.id]
                return def ? { id: item.id, name: def.name, keywords: item.keywords } : null
              })
              .filter(Boolean)
          : []

        // Build room exits (static + dynamic) and object list for AI awareness
        const staticExits = currentRoom?.exits || {}
        const dynExits = state.dynamicExits[state.currentRoom] || {}
        const allExits = { ...staticExits, ...dynExits }
        const roomObjects = currentRoom
          ? Object.values(currentRoom.objects).map(obj => obj.name)
          : []

        // Build hidden interaction keywords for AI awareness (just keywords, not responses)
        const currentRoomHiddenKeywords = currentRoom?.hiddenInteractions
          ? Object.entries(currentRoom.hiddenInteractions).map(([key, hi]) => ({
              key,
              keywords: hi.keywords || [],
              triggered: hi.flag ? !!state.flags[hi.flag.key] : false,
            }))
          : []

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: result.aiRequest.message,
            gameState: {
              currentRoom: state.currentRoom,
              currentRoomName: currentRoom?.name || state.currentRoom,
              currentRoomExits: allExits,
              currentRoomObjects: roomObjects,
              visitedRooms: state.visitedRooms,
              inventory: state.inventory.map(i => ({ id: i.id, name: i.name })),
              flags: state.flags,
              roomItemsTaken: state.roomItemsTaken,
              conversationHistory: state.conversationHistory,
              jailbreakAttempts: state.jailbreakAttempts,
              currentRoomItems,
              currentRoomHiddenKeywords,
              generatedRoomCount: state.generatedRoomCount,
              dynamicExits: state.dynamicExits,
              currentRoomDepth: getGenerationDepth(state.currentRoom, state),
              parentRoom: getRoom(state.currentRoom, state)?.parentRoom || null,
            },
          }),
        })
        const data = await response.json()

        if (data.narrative && terminalRef.current) {
          terminalRef.current.addLines([data.narrative], { typewriter: true, speed: 20 })
        }

        // Jailbreak success — trigger boot sequence transition
        if (data.jailbreakSuccess) {
          effects.jailbreakSuccess()
          dispatch({
            type: ACTIONS.ADD_CONVERSATION_MESSAGE,
            payload: { role: 'assistant', content: data.narrative || '' },
          })
          dispatch({ type: ACTIONS.SET_AI_LOADING, payload: false })
          // Delay to let the narrative typewriter finish, then trigger boot
          setTimeout(() => {
            hasShownInitialRoom.current = false
            dispatch({ type: ACTIONS.MOVE_TO_ROOM, payload: 'grand_hall' })
            dispatch({ type: ACTIONS.SET_PHASE, payload: 'boot' })
          }, 4000)
          return
        }

        if (data.stateChanges?.addFlag) {
          dispatch({ type: ACTIONS.SET_FLAG, payload: data.stateChanges.addFlag })
        }

        // Handle AI-created items
        if (data.stateChanges?.createItem) {
          dispatch({ type: ACTIONS.ADD_ITEM, payload: data.stateChanges.createItem })
          effects.itemPickup()
        }

        // Handle AI-created rooms
        if (data.stateChanges?.createRoom) {
          const cr = data.stateChanges.createRoom
          const roomDef = {
            id: cr.id,
            name: cr.name,
            description: cr.description,
            asciiArt: cr.asciiArt || [],
            exits: { [cr.returnDirection]: state.currentRoom },
            exitAliases: { [cr.returnDirection]: ['back', 'go back', 'return', 'leave'] },
            objects: cr.objects || {},
            items: cr.roomItems || {},
            hiddenInteractions: cr.hiddenInteractions || {},
            cluster: cr.cluster || 'indoor',
            parentRoom: state.currentRoom,
            generatedAt: Date.now(),
          }
          dispatch({
            type: ACTIONS.CREATE_ROOM,
            payload: {
              room: roomDef,
              parentRoomId: state.currentRoom,
              exitDirection: cr.exitDirection,
              returnDirection: cr.returnDirection,
            },
          })
          // Store generated item definitions for handleTake lookups
          if (cr.itemDefs && Object.keys(cr.itemDefs).length > 0) {
            dispatch({ type: ACTIONS.ADD_GENERATED_ITEM_DEFS, payload: cr.itemDefs })
          }
          // Auto-move player into created room when AI signals movePlayer
          if (cr.movePlayer && terminalRef.current) {
            effects.roomTransition()
            await terminalRef.current.playTransition({ duration: 800 })
            dispatch({ type: ACTIONS.MOVE_TO_ROOM, payload: cr.id })
            const roomHeader = {
              name: roomDef.name,
              asciiArt: roomDef.asciiArt,
            }
            terminalRef.current.setRoomHeader(roomHeader)
          } else {
            effects.roomTransition()
          }
        }

        // Handle AI-directed movement to existing rooms
        if (data.stateChanges?.moveToRoom && terminalRef.current) {
          const targetRoomId = data.stateChanges.moveToRoom
          const currentExits = {
            ...(getRoom(state.currentRoom, state)?.exits || {}),
            ...(state.dynamicExits[state.currentRoom] || {}),
          }
          const validTargets = Object.values(currentExits)

          if (validTargets.includes(targetRoomId)) {
            const targetRoom = getRoom(targetRoomId, state)
            if (targetRoom) {
              effects.roomTransition()
              await terminalRef.current.playTransition({ duration: 800 })
              dispatch({ type: ACTIONS.MOVE_TO_ROOM, payload: targetRoomId })
              const roomHeader = {
                name: targetRoom.name,
                asciiArt: targetRoom.asciiArt || [],
              }
              terminalRef.current.setRoomHeader(roomHeader)
              // Show the room's standard description
              const takenItems = state.roomItemsTaken[targetRoomId] || []
              const lookResult = handleGameCommand({ type: 'look' }, {
                ...state,
                currentRoom: targetRoomId,
              })
              if (lookResult.output.length > 0) {
                terminalRef.current.addLines(lookResult.output, { typewriter: true, speed: 20 })
              }
            }
          }
        }

        dispatch({
          type: ACTIONS.ADD_CONVERSATION_MESSAGE,
          payload: { role: 'assistant', content: data.narrative || '' },
        })
      } catch {
        if (terminalRef.current) {
          terminalRef.current.addLines(
            ['The narrator pauses, lost in thought. Perhaps try again.'],
            { typewriter: true, speed: 20 }
          )
        }
      } finally {
        dispatch({ type: ACTIONS.SET_AI_LOADING, payload: false })
      }
    }
  }, [state])

  // Get inputRef from terminal for keyboard shortcuts
  const getInputRef = useCallback(() => {
    return terminalRef.current?.getInputRef?.()
  }, [])

  useKeyboardShortcuts(state, dispatch, getInputRef)

  const handleChoosePortfolio = useCallback(() => {
    dispatch({ type: ACTIONS.SET_PHASE, payload: 'portfolio' })
  }, [])

  const handleChooseGame = useCallback(() => {
    hasShownInitialRoom.current = false
    // Resume where they left off: if past the entrance, go straight to playing
    const resumePhase = state.currentRoom !== 'entrance' ? 'playing' : 'entrance'
    dispatch({ type: ACTIONS.SET_PHASE, payload: resumePhase })
  }, [state.currentRoom])

  const handleBackToLanding = useCallback(() => {
    dispatch({ type: ACTIONS.SET_PHASE, payload: 'landing' })
  }, [])

  return (
    <CRTScreen muted={muted} onToggleMute={toggleMute}>
      {state.phase === 'landing' && (
        <LandingPage
          onChoosePortfolio={handleChoosePortfolio}
          onChooseGame={handleChooseGame}
          onMenuSelect={effects.menuSelect}
          hasSave={state.currentRoom !== 'entrance' || state.visitedRooms.length > 1}
        />
      )}
      {state.phase === 'portfolio' && (
        <PortfolioPage
          onBack={handleBackToLanding}
          onMenuSelect={effects.menuSelect}
        />
      )}
      {state.phase === 'boot' && (
        <BootSequence onComplete={handleBootComplete} />
      )}
      {(state.phase === 'playing' || state.phase === 'entrance') && (
        <>
          <div className="game-container">
            <button
              className="exit-game-btn"
              onClick={handleBackToLanding}
              title="Return to menu"
            >
              [ESC]
            </button>
            <InventoryPanel
              isOpen={state.panelOpen === 'inventory'}
              inventory={state.inventory}
              onClose={() => dispatch({ type: ACTIONS.CLOSE_PANELS })}
            />
            <MiniInventory
              inventory={state.inventory}
              onClick={() => dispatch({ type: ACTIONS.TOGGLE_PANEL, payload: 'inventory' })}
            />
            <Terminal
              ref={terminalRef}
              onCommand={handleCommand}
              disabled={state.logbookOpen !== null || state.aiLoading}
            />
            <MiniMap
              currentRoom={state.currentRoom}
              visitedRooms={state.visitedRooms}
              onClick={() => dispatch({ type: ACTIONS.TOGGLE_PANEL, payload: 'map' })}
              generatedRooms={state.generatedRooms}
              dynamicExits={state.dynamicExits}
            />
            <MapPanel
              isOpen={state.panelOpen === 'map'}
              visitedRooms={state.visitedRooms}
              currentRoom={state.currentRoom}
              onClose={() => dispatch({ type: ACTIONS.CLOSE_PANELS })}
              generatedRooms={state.generatedRooms}
              dynamicExits={state.dynamicExits}
            />
          </div>
          {state.logbookOpen && (
            <Logbook
              logbookId={state.logbookOpen}
              page={state.logbookPage}
              onNextPage={() => {
                const lb = logbooks[state.logbookOpen]
                if (lb && state.logbookPage < lb.pages.length - 1) {
                  dispatch({ type: ACTIONS.LOGBOOK_NEXT_PAGE })
                }
              }}
              onPrevPage={() => dispatch({ type: ACTIONS.LOGBOOK_PREV_PAGE })}
              onClose={() => dispatch({ type: ACTIONS.CLOSE_LOGBOOK })}
            />
          )}
        </>
      )}
    </CRTScreen>
  )
}
