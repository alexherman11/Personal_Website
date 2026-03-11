import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import useCommandHistory from '../../hooks/useCommandHistory'
import { keystroke as playKeystroke } from '../../audio/effects'
import './Terminal.css'

const Terminal = forwardRef(function Terminal({ onCommand, disabled: externalDisabled }, ref) {
  const [lines, setLines] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentlyTypingText, setCurrentlyTypingText] = useState(null)
  const [roomHeader, setRoomHeader] = useState(null)

  const outputRef = useRef(null)
  const inputRef = useRef(null)
  const lineIdCounter = useRef(0)
  const queueRef = useRef([])
  const timerRef = useRef(null)
  const isProcessingRef = useRef(false)
  const currentItemRef = useRef(null)

  const { push: pushHistory, navigateUp, navigateDown } = useCommandHistory()

  const nextId = () => ++lineIdCounter.current

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [lines, currentlyTypingText, scrollToBottom])

  // Commit a finished line to the lines array
  const commitLine = useCallback((text, type = 'output') => {
    setLines(prev => [...prev, { id: nextId(), type, content: text, dim: false }])
  }, [])

  // Process the next item in the typewriter queue
  const processQueue = useCallback(() => {
    if (isProcessingRef.current || queueRef.current.length === 0) {
      if (queueRef.current.length === 0) {
        setIsTyping(false)
        setCurrentlyTypingText(null)
      }
      return
    }

    isProcessingRef.current = true
    setIsTyping(true)

    const item = queueRef.current.shift()
    currentItemRef.current = item

    if (!item.typewriter) {
      // Instant — commit all at once
      commitLine(item.text, item.type || 'output')
      isProcessingRef.current = false
      if (item.onComplete) item.onComplete()
      processQueue()
      return
    }

    // Typewriter — character by character
    let charIndex = 0
    const text = item.text
    const speed = item.speed || 30

    const tick = () => {
      if (charIndex <= text.length) {
        setCurrentlyTypingText(text.slice(0, charIndex))
        if (charIndex > 0 && text[charIndex - 1] !== ' ') playKeystroke()
        charIndex++
        timerRef.current = setTimeout(tick, speed)
      } else {
        // Done — commit the line and process next
        setCurrentlyTypingText(null)
        currentItemRef.current = null
        commitLine(text, item.type || 'output')
        isProcessingRef.current = false
        if (item.onComplete) item.onComplete()
        processQueue()
      }
    }

    tick()
  }, [commitLine])

  // Skip all typing — instantly commit everything in the queue
  const skipAll = useCallback(() => {
    clearTimeout(timerRef.current)
    setCurrentlyTypingText(null)
    isProcessingRef.current = false

    // Gather current item (mid-typing) + all remaining queued items
    const toCommit = []
    if (currentItemRef.current) {
      toCommit.push(currentItemRef.current)
      currentItemRef.current = null
    }
    toCommit.push(...queueRef.current)
    queueRef.current = []

    setLines(prev => {
      const newLines = [...prev]
      for (const item of toCommit) {
        newLines.push({ id: nextId(), type: item.type || 'output', content: item.text, dim: false })
      }
      return newLines
    })

    setIsTyping(false)
  }, [])

  // Clear all lines and cancel any in-progress typewriter
  const clearLines = useCallback(() => {
    clearTimeout(timerRef.current)
    setCurrentlyTypingText(null)
    isProcessingRef.current = false
    currentItemRef.current = null
    queueRef.current = []
    setLines([])
    setIsTyping(false)
  }, [])

  // Expose addLines API, room header, clear, and inputRef to parent
  useImperativeHandle(ref, () => ({
    addLines(texts, options = {}) {
      const { typewriter = true, speed = 30, type = 'output', onComplete } = options
      const items = texts.map((entry, i) => {
        const isObj = typeof entry === 'object' && entry !== null && 'text' in entry
        return {
          text: isObj ? entry.text : entry,
          typewriter: isObj ? (entry.typewriter ?? typewriter) : typewriter,
          speed: isObj ? (entry.speed ?? speed) : speed,
          type: isObj ? (entry.type || type) : type,
          onComplete: i === texts.length - 1 ? onComplete : undefined,
        }
      })
      queueRef.current.push(...items)
      processQueue()
    },
    commitLine(text, type = 'output') {
      commitLine(text, type)
    },
    getInputRef() {
      return inputRef
    },
    setRoomHeader(header) {
      setRoomHeader(header)
    },
    clearLines() {
      clearLines()
    },
  }), [processQueue, commitLine, clearLines])

  const focusInput = () => {
    if (inputRef.current) inputRef.current.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const command = inputValue.trim()
      if (command) {
        pushHistory(command)
        commitLine(command, 'input')
        if (onCommand) onCommand(command)
      }
      setInputValue('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setInputValue(navigateUp(inputValue))
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setInputValue(navigateDown())
    }
  }

  // Skip typing on any keypress (when not focused on input)
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (e.defaultPrevented) return
      if (isTyping && e.key !== 'F5' && e.key !== 'F12' && !e.ctrlKey && !e.metaKey) {
        skipAll()
      }
    }
    window.addEventListener('keydown', handleGlobalKey)
    return () => window.removeEventListener('keydown', handleGlobalKey)
  }, [isTyping, skipAll])

  return (
    <div className="terminal" onClick={focusInput}>
      {roomHeader && (
        <div className="terminal-room-header">
          <div className="terminal-line terminal-line--room-name">
            {roomHeader.name}
          </div>
          <div className="terminal-room-header__art">
            {roomHeader.asciiArt.map((line, i) => (
              <div key={i} className="terminal-line terminal-line--ascii">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="terminal-output" ref={outputRef}>
        {lines.map(line => (
          <div
            key={line.id}
            className={`terminal-line terminal-line--${line.type}${line.dim ? ' terminal-line--dim' : ''}`}
          >
            {line.type === 'input' && <span className="terminal-prompt">&gt; </span>}
            {line.content}
          </div>
        ))}
        {currentlyTypingText !== null && (
          <div className="terminal-line terminal-line--output">
            {currentlyTypingText}
            <span className="terminal-cursor">_</span>
          </div>
        )}
      </div>
      <div className="terminal-input-line">
        <span className="terminal-prompt">&gt;&nbsp;</span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isTyping || externalDisabled}
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  )
})

export default Terminal
