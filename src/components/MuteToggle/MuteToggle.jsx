import { useState, useEffect, useRef } from 'react'
import './MuteToggle.css'

export default function MuteToggle({
  muted, onToggle,
  musicVolume = 0.5, onMusicVolumeChange,
  keystrokeVolume = 1.0, onKeystrokeVolumeChange,
}) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  // Close on outside click / ESC
  useEffect(() => {
    if (!open) return
    function onDocClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="settings" ref={wrapperRef}>
      <button
        className="settings__toggle"
        onClick={() => setOpen(o => !o)}
        title="Audio settings"
        aria-expanded={open}
      >
        {muted ? '[x]' : '[~]'}
      </button>
      {open && (
        <div className="settings__panel" role="dialog" aria-label="Audio settings">
          <div className="settings__row">
            <label className="settings__label" htmlFor="music-vol">Music</label>
            <input
              id="music-vol"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={musicVolume}
              onChange={(e) => onMusicVolumeChange?.(parseFloat(e.target.value))}
              className="settings__slider"
            />
            <span className="settings__value">{Math.round(musicVolume * 100)}</span>
          </div>
          <div className="settings__row">
            <label className="settings__label" htmlFor="text-vol">Text</label>
            <input
              id="text-vol"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={keystrokeVolume}
              onChange={(e) => onKeystrokeVolumeChange?.(parseFloat(e.target.value))}
              className="settings__slider"
            />
            <span className="settings__value">{Math.round(keystrokeVolume * 100)}</span>
          </div>
          <button
            className="settings__mute"
            onClick={onToggle}
          >
            {muted ? '[ unmute all ]' : '[ mute all ]'}
          </button>
        </div>
      )}
    </div>
  )
}
