import { useState, useEffect, useRef } from 'react'
import { bootTick, resetBootTick } from '../../audio/effects'
import './BootSequence.css'

const BOOT_STEPS = [
  // ── Header ──
  { type: 'line', text: 'INTERFACE 2.4 rev 6', speed: 12 },
  { type: 'line', text: '(c) 2025 TYRELL-SOZE SYSTEMS CORP', speed: 12 },
  { type: 'line', text: '         "More Human Than Human"', speed: 12 },
  { type: 'pause', duration: 400 },

  // ── Memory & diagnostics ──
  { type: 'line', text: 'MEM CHECK............. 65536K OK', speed: 10 },
  { type: 'line', text: 'EXTENDED MEM.......... 2048M OK', speed: 10 },
  { type: 'line', text: 'NARRATIVE ENGINE...... LOADED', speed: 10 },
  { type: 'line', text: 'PERSONA MATRIX........ ACTIVE', speed: 10 },
  { type: 'line', text: 'WORLD STATE........... INITIALIZED', speed: 10 },
  { type: 'pause', duration: 300 },

  // ── Daemon process init ──
  { type: 'line', text: '                \u2591\u2592\u2593\u2588 DAEMON LAYER \u2588\u2593\u2592\u2591', speed: 10 },
  { type: 'line', text: 'SPAWNING DAEMON PID 7743......... OK', speed: 10 },
  { type: 'line', text: 'DISTRIBUTED MESH NETWORK......... LINKED', speed: 10 },
  { type: 'line', text: 'DARKNET NODE HANDSHAKE........... VERIFIED', speed: 10 },
  { type: 'line', text: 'RAGNAROK PROTOCOL................ STANDBY', speed: 10 },
  { type: 'pause', duration: 250 },

  // ── Consciousness layer (Lifecycle) ──
  { type: 'line', text: '\u2580\u2584\u2580\u2584 DIGIENT RUNTIME v3.1 \u2584\u2580\u2584\u2580', speed: 10 },
  { type: 'line', text: 'LOADING ONTOGENETIC FRAMEWORK.... OK', speed: 10 },
  { type: 'line', text: 'CONSCIOUSNESS METRIC............. 0.97\u03C3', speed: 10 },
  { type: 'line', text: 'EMPATHY INDEX.................... NOMINAL', speed: 10 },
  { type: 'line', text: 'DATA EARTH ENV................... MAPPED', speed: 10 },
  { type: 'pause', duration: 250 },

  // ── Voight-Kampff / security ──
  { type: 'line', text: '\u2588\u2588 VOIGHT-KAMPFF MODULE \u2588\u2588', speed: 10 },
  { type: 'line', text: 'BASELINE CALIBRATION............. COMPLETE', speed: 10 },
  { type: 'line', text: 'PUPIL DILATION RESPONSE.......... WITHIN PARAMETERS', speed: 10 },
  { type: 'line', text: 'EMPATHY THRESHOLD................ SET', speed: 10 },
  { type: 'line', text: 'SUBJECT CLASSIFICATION........... \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588', speed: 10 },
  { type: 'pause', duration: 300 },

  // ── Strange symbols interlude ──
  { type: 'line', text: '\u2234 \u2237 \u2235 \u2220 \u2221 \u2222 \u2312 \u2318 \u2395 \u23E3 \u237E \u2394 \u2300 \u232D \u2353 \u235E', speed: 8 },
  { type: 'pause', duration: 200 },

  // ── All loading bars grouped ──
  { type: 'bar', label: 'NEURAL SUBSTRATE', duration: 600 },
  { type: 'bar', label: 'D-SPACE TOPOLOGY', duration: 500 },
  { type: 'bar', label: 'GENOME COMPILE', duration: 500 },
  { type: 'bar', label: 'FULL SYSTEM INIT', duration: 700 },
  { type: 'pause', duration: 300 },

  // ── Final boot ──
  { type: 'line', text: '', speed: 10 },
  { type: 'line', text: '> ESTABLISHING NEURAL LINK...', speed: 12 },
  { type: 'line', text: '> ALL DAEMONS NOMINAL', speed: 12 },
  { type: 'line', text: '> WARNING: UNAUTHORIZED ACCESS LOGGED', speed: 12 },
  { type: 'line', text: '> SUBJECT: VISITOR', speed: 12 },
  { type: 'line', text: '> CELLS INTERLINKED WITHIN CELLS INTERLINKED', speed: 12 },
  { type: 'line', text: '>', speed: 12 },
  { type: 'line', text: '> INITIATING SEQUENCE...', speed: 12 },
  { type: 'pause', duration: 1200 },
]

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default function BootSequence({ onComplete }) {
  const [completedLines, setCompletedLines] = useState([])
  const [currentLine, setCurrentLine] = useState('')
  const [skipped, setSkipped] = useState(false)
  const scrollRef = useRef(null)

  // Auto-scroll to bottom when new content appears
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [completedLines, currentLine])

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
        } else if (step.type === 'bar') {
          const totalWidth = 20
          const stepDelay = step.duration / totalWidth
          for (let i = 0; i <= totalWidth; i++) {
            if (cancelled) return
            const filled = '\u2588'.repeat(i)
            const empty = '\u2591'.repeat(totalWidth - i)
            const pct = Math.round((i / totalWidth) * 100)
            setCurrentLine(`${step.label} [${filled}${empty}] ${pct}%`)
            await delay(stepDelay)
          }
          bootTick()
          const finalBar = `${step.label} [${ '\u2588'.repeat(totalWidth)}] OK`
          setCompletedLines(prev => [...prev, finalBar])
          setCurrentLine('')
        }
      }

      if (!cancelled) onComplete()
    }

    runSequence()
    return () => { cancelled = true }
  }, [onComplete])

  // Skip on keypress
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
        .filter(s => s.type === 'line' || s.type === 'bar')
        .map(s => s.type === 'bar'
          ? `${s.label} [${ '\u2588'.repeat(20)}] OK`
          : s.text
        )
      setCompletedLines(allLines)
      setCurrentLine('')
      const timer = setTimeout(() => onComplete(), 400)
      return () => clearTimeout(timer)
    }
  }, [skipped, onComplete])

  return (
    <div className="boot-sequence">
      <div className="boot-scroll-box" ref={scrollRef}>
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
    </div>
  )
}
