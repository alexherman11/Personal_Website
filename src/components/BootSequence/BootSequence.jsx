import { useState, useEffect } from 'react'
import { bootTick, resetBootTick } from '../../audio/effects'
import './BootSequence.css'

const BOOT_STEPS = [
  { type: 'line', text: 'INTERFACE 2.4 rev 6', speed: 15 },
  { type: 'line', text: '(c) 2025 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 SYSTEMS CORP', speed: 15 },
  { type: 'pause', duration: 500 },
  { type: 'line', text: 'MEM CHECK............. 65536K OK', speed: 15 },
  { type: 'line', text: 'NARRATIVE ENGINE...... LOADED', speed: 15 },
  { type: 'line', text: 'PERSONA MATRIX........ ACTIVE', speed: 15 },
  { type: 'line', text: 'WORLD STATE........... INITIALIZED', speed: 15 },
  { type: 'pause', duration: 800 },
  { type: 'line', text: '> ESTABLISHING NEURAL LINK...', speed: 15 },
  { type: 'line', text: '> ENVIRONMENT LOADED', speed: 15 },
  { type: 'line', text: '> WARNING: UNAUTHORIZED ACCESS LOGGED', speed: 15 },
  { type: 'line', text: '> SUBJECT: VISITOR', speed: 15 },
  { type: 'line', text: '>', speed: 15 },
  { type: 'line', text: '> INITIATING SEQUENCE...', speed: 15 },
  { type: 'pause', duration: 1500 },
]

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default function BootSequence({ onComplete }) {
  const [completedLines, setCompletedLines] = useState([])
  const [currentLine, setCurrentLine] = useState('')
  const [skipped, setSkipped] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function runSequence() {
      resetBootTick()
      for (const step of BOOT_STEPS) {
        if (cancelled) return

        if (step.type === 'pause') {
          await delay(step.duration)
        } else if (step.type === 'line') {
          for (let i = 0; i <= step.text.length; i++) {
            if (cancelled) return
            setCurrentLine(step.text.slice(0, i))
            await delay(step.speed)
          }
          bootTick()
          setCompletedLines(prev => [...prev, step.text])
          setCurrentLine('')
        }
      }

      if (!cancelled) onComplete()
    }

    runSequence()
    return () => { cancelled = true }
  }, [onComplete])

  // Skip on keypress — show all lines instantly and complete
  // Delay activation so stray events during page load don't trigger skip
  useEffect(() => {
    let active = false
    const activateTimer = setTimeout(() => { active = true }, 500)

    const handleKey = (e) => {
      if (active && !skipped && e.key !== 'F5' && e.key !== 'F12' && !e.ctrlKey && !e.metaKey) {
        setSkipped(true)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      clearTimeout(activateTimer)
      window.removeEventListener('keydown', handleKey)
    }
  }, [skipped])

  useEffect(() => {
    if (skipped) {
      const allLines = BOOT_STEPS
        .filter(s => s.type === 'line')
        .map(s => s.text)
      setCompletedLines(allLines)
      setCurrentLine('')
      // Brief pause before transitioning so the user sees the full boot text
      const timer = setTimeout(() => onComplete(), 400)
      return () => clearTimeout(timer)
    }
  }, [skipped, onComplete])

  return (
    <div className="boot-sequence">
      {completedLines.map((line, i) => (
        <div key={i} className="boot-line">{line}</div>
      ))}
      {!skipped && (
        <div className="boot-line">
          {currentLine}
          <span className="boot-cursor">_</span>
        </div>
      )}
    </div>
  )
}
