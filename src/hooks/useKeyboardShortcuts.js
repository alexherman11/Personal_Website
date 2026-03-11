import { useEffect } from 'react'
import { ACTIONS } from '../engine/gameReducer'
import logbooks from '../data/logbooks'

export default function useKeyboardShortcuts(state, dispatch, getInputRef) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const inputRef = getInputRef?.()
      const isTypingInInput = inputRef && document.activeElement === inputRef.current

      // ESC always works
      if (e.key === 'Escape') {
        if (state.logbookOpen) {
          e.preventDefault()
          dispatch({ type: ACTIONS.CLOSE_LOGBOOK })
        } else if (state.panelOpen) {
          e.preventDefault()
          dispatch({ type: ACTIONS.CLOSE_PANELS })
        }
        return
      }

      // Logbook navigation — swallow all shortcut keys when logbook is open
      if (state.logbookOpen) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          dispatch({ type: ACTIONS.LOGBOOK_PREV_PAGE })
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          const lb = logbooks[state.logbookOpen]
          if (lb && state.logbookPage < lb.pages.length - 1) {
            dispatch({ type: ACTIONS.LOGBOOK_NEXT_PAGE })
          }
        } else if (e.key === 'q' || e.key === 'Q') {
          e.preventDefault()
          dispatch({ type: ACTIONS.CLOSE_LOGBOOK })
        }
        return
      }

      // Panel shortcuts — only when not typing in terminal input
      if (!isTypingInInput) {
        if (e.key === 'i' || e.key === 'I') {
          e.preventDefault()
          dispatch({ type: ACTIONS.TOGGLE_PANEL, payload: 'inventory' })
        } else if (e.key === 'm' || e.key === 'M') {
          e.preventDefault()
          dispatch({ type: ACTIONS.TOGGLE_PANEL, payload: 'map' })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.panelOpen, state.logbookOpen, state.logbookPage, dispatch, getInputRef])
}
