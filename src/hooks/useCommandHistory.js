import { useRef, useCallback } from 'react'

export default function useCommandHistory() {
  const historyRef = useRef([])
  const indexRef = useRef(-1)
  const draftRef = useRef('')

  const push = useCallback((command) => {
    if (command.trim()) {
      historyRef.current.push(command)
    }
    indexRef.current = -1
    draftRef.current = ''
  }, [])

  const navigateUp = useCallback((currentInput) => {
    const history = historyRef.current
    if (history.length === 0) return currentInput

    if (indexRef.current === -1) {
      draftRef.current = currentInput
      indexRef.current = history.length - 1
    } else {
      indexRef.current = Math.max(0, indexRef.current - 1)
    }
    return history[indexRef.current]
  }, [])

  const navigateDown = useCallback(() => {
    const history = historyRef.current
    if (indexRef.current === -1) return draftRef.current

    indexRef.current += 1
    if (indexRef.current >= history.length) {
      indexRef.current = -1
      return draftRef.current
    }
    return history[indexRef.current]
  }, [])

  return { push, navigateUp, navigateDown }
}
