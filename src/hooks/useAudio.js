import { useState, useRef, useCallback, useEffect } from 'react'
import audioEngine from '../audio/audioEngine'

export default function useAudio() {
  const [muted, setMuted] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const initingRef = useRef(false)

  const ensureInit = useCallback(async () => {
    if (initingRef.current) return
    initingRef.current = true
    await audioEngine.init()
    setInitialized(true)
  }, [])

  // Initialize on first user interaction
  useEffect(() => {
    const handler = () => ensureInit()
    window.addEventListener('click', handler, { once: true })
    window.addEventListener('keydown', handler, { once: true })
    return () => {
      window.removeEventListener('click', handler)
      window.removeEventListener('keydown', handler)
    }
  }, [ensureInit])

  const toggleMute = useCallback(() => {
    audioEngine.toggleMute()
    setMuted(audioEngine.isMuted())
  }, [])

  // Cleanup on unmount
  useEffect(() => () => audioEngine.dispose(), [])

  return { muted, toggleMute, initialized }
}
