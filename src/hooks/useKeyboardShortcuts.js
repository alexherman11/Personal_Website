import { useEffect } from 'react'

// ESC closes overlays; arrows page logbooks; I and M toggle panels when not typing.
export default function useKeyboardShortcuts({ logbookOpen, editorOpen, panelOpen, onEscape, onLogbookPrev, onLogbookNext, onTogglePanel }, getInputRef) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editorOpen) return
      const inputRef = getInputRef?.()
      const isTypingInInput = inputRef && document.activeElement === inputRef.current
      if (e.key === 'Escape') {
        if (logbookOpen || panelOpen) { e.preventDefault(); onEscape() }
        return
      }
      if (logbookOpen) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); onLogbookPrev() }
        else if (e.key === 'ArrowRight') { e.preventDefault(); onLogbookNext() }
        else if (e.key === 'q' || e.key === 'Q') { e.preventDefault(); onEscape() }
        return
      }
      if (!isTypingInInput) {
        if (e.key === 'i' || e.key === 'I') { e.preventDefault(); onTogglePanel('inventory') }
        else if (e.key === 'm' || e.key === 'M') { e.preventDefault(); onTogglePanel('map') }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [logbookOpen, editorOpen, panelOpen, onEscape, onLogbookPrev, onLogbookNext, onTogglePanel, getInputRef])
}
