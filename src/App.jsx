import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import CRTScreen from './components/CRTScreen/CRTScreen'
import LandingPage from './components/LandingPage/LandingPage'
import PortfolioPage from './components/PortfolioPage/PortfolioPage'
import FlyerPage from './components/FlyerPage/FlyerPage'
import BootSequence from './components/BootSequence/BootSequence'
import Terminal from './components/Terminal/Terminal'
import InventoryPanel from './components/InventoryPanel/InventoryPanel'
import MapPanel from './components/MapPanel/MapPanel'
import MiniMap from './components/MiniMap/MiniMap'
import MiniInventory from './components/MiniInventory/MiniInventory'
import Logbook from './components/Logbook/Logbook'
import Editor from './components/Editor/Editor'
import DepthsClient from './engine/client'
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts'
import useAudio from './hooks/useAudio'
import * as effects from './audio/effects'
import ambientManager from './audio/ambients'
import musicManager from './audio/music'

function isFlyerRoute() {
  if (typeof window === 'undefined') return false
  return /^\/flyer\/?$/i.test(window.location.pathname)
}

export default function App() {
  if (isFlyerRoute()) {
    return (
      <CRTScreen muted={true} onToggleMute={() => {}} showMute={false}>
        <FlyerPage />
      </CRTScreen>
    )
  }
  return <GameApp />
}

// Map server room ids to the ambient soundscapes written for the seed rooms.
function ambientKey(roomId, cluster) {
  const id = String(roomId || '').replace(/^#/, '')
  const seed = ['grand_hall', 'archive', 'workshop', 'study', 'signal_room', 'grounds', 'tree', 'entrance', 'vault']
  if (seed.includes(id)) return id
  if (id === 'descent') return 'vault'
  return cluster === 'outdoor' ? 'grounds' : 'grand_hall'
}

function GameApp() {
  const client = useMemo(() => new DepthsClient(), [])
  const terminalRef = useRef(null)
  const { muted, toggleMute, initialized: audioReady } = useAudio()

  // screen: landing | portfolio | entrance | boot | playing
  const [screen, setScreen] = useState('landing')
  const [serverPhase, setServerPhase] = useState('entrance')
  const [player, setPlayer] = useState({ name: '', programmer: false })
  const [inventory, setInventory] = useState([])
  const [map, setMap] = useState(null)
  const [roomId, setRoomId] = useState(null)
  const [roomCluster, setRoomCluster] = useState('indoor')
  const [panelOpen, setPanelOpen] = useState(null)
  const [logbook, setLogbook] = useState(null)   // { title, pages, page }
  const [editor, setEditor] = useState(null)     // { target, title, text, hint }
  const [prompt, setPrompt] = useState('>')
  const [thinking, setThinking] = useState(false)
  const [connected, setConnected] = useState(false)
  const screenRef = useRef(screen)
  screenRef.current = screen
  const prevPanelRef = useRef(null)
  const prevLogbookRef = useRef(null)

  const addLines = useCallback((lines, opts = {}) => {
    terminalRef.current?.addLines(lines, { typewriter: false, speed: 10, ...opts })
  }, [])

  // ---- server messages ----
  useEffect(() => {
    const off = client.on(async (m) => {
      switch (m.t) {
        case '_open': setConnected(true); break
        case '_close': setConnected(false); break
        case 'welcome':
          setPlayer({ name: m.name, programmer: !!m.programmer, wizard: !!m.wizard })
          setServerPhase(m.phase)
          if (m.phase === 'boot') client.send({ t: 'bootdone' })
          break
        case 'out': {
          const lines = m.lines.map(l => ({ text: l.text, type: styleClass(l.style), typewriter: !!m.typewriter && l.style !== 'dim', speed: 8 }))
          addLines(lines)
          break
        }
        case 'room':
          setRoomId(m.id)
          terminalRef.current?.setRoomHeader(m.header)
          break
        case 'transition':
          if (screenRef.current === 'playing' || screenRef.current === 'entrance') {
            effects.roomTransition()
            await terminalRef.current?.playTransition({ duration: 700 })
          }
          break
        case 'phase':
          if (m.phase === 'boot') {
            setTimeout(() => { setScreen('boot'); setServerPhase('boot') }, m.delay || 1500)
          }
          break
        case 'inventory': setInventory(m.items); break
        case 'map':
          setMap(m.map)
          { const cur = m.map?.nodes?.find(n => n.current); if (cur) setRoomCluster(cur.cluster || 'indoor') }
          break
        case 'logbook': setLogbook({ title: m.title, pages: m.pages, page: 0 }); break
        case 'editor': setEditor({ target: m.target, title: m.title, text: m.text, hint: m.hint }); break
        case 'mode': setPrompt(m.mode === 'normal' ? '>' : (m.prompt || '>')); break
        case 'panel': setPanelOpen(p => (p === m.panel ? null : m.panel)); break
        case 'player': setPlayer(p => ({ ...p, name: m.name ?? p.name, programmer: m.programmer ?? p.programmer })); break
        case 'thinking': setThinking(!!m.on); break
        case 'sound':
          if (m.name === 'pickup') effects.itemPickup()
          else if (m.name === 'jailbreak') effects.jailbreakSuccess()
          break
        case 'reconnect':
          addLines([{ text: m.reason || 'Reconnecting...', type: 'system' }])
          terminalRef.current?.clearLines()
          client.reconnect()
          break
        default: break
      }
    })
    client.connect()
    return off
  }, [client, addLines])

  // ---- audio ----
  const ambientRef = useRef(null)
  useEffect(() => {
    if (audioReady && roomId) {
      const key = ambientKey(roomId, roomCluster)
      if (ambientRef.current === key) return
      ambientRef.current = key
      try {
        ambientManager.setRoom(key, roomCluster)
        musicManager.setRoom(key, roomCluster)
      } catch (err) { console.warn('audio', err) }
    }
  }, [roomId, roomCluster, audioReady])

  useEffect(() => {
    if (panelOpen && !prevPanelRef.current) effects.panelOpen()
    else if (!panelOpen && prevPanelRef.current) effects.panelClose()
    prevPanelRef.current = panelOpen
  }, [panelOpen])

  useEffect(() => {
    if (logbook && !prevLogbookRef.current) effects.logbookOpen()
    else if (!logbook && prevLogbookRef.current) effects.logbookClose()
    prevLogbookRef.current = logbook
  }, [logbook])

  // ---- input ----
  const handleCommand = useCallback((raw) => {
    const text = raw.trim()
    const lower = text.toLowerCase()
    if (lower === 'menu' || lower === 'main menu') { setScreen('landing'); return }
    if (lower === 'newgame' || lower === 'new game' || lower === 'restart') {
      addLines([{ text: 'Your progress lives in this house now, under your name; there is no "new game". Try "home", or "help".', type: 'system' }])
      return
    }
    client.command(text)
  }, [client, addLines])

  const handleBootComplete = useCallback(() => {
    client.send({ t: 'bootdone' })
    setServerPhase('playing')
    setScreen('playing')
  }, [client])

  const handleChooseGame = useCallback(() => {
    setScreen(serverPhase === 'playing' ? 'playing' : serverPhase === 'boot' ? 'boot' : 'entrance')
    // Re-show the room when coming back from the menu.
    setTimeout(() => client.send({ t: 'refresh' }), 50)
  }, [serverPhase, client])

  const getInputRef = useCallback(() => terminalRef.current?.getInputRef?.(), [])
  useKeyboardShortcuts({
    logbookOpen: !!logbook, editorOpen: !!editor, panelOpen,
    onEscape: () => { if (logbook) setLogbook(null); else if (panelOpen) setPanelOpen(null) },
    onLogbookPrev: () => setLogbook(lb => lb ? { ...lb, page: Math.max(0, lb.page - 1) } : lb),
    onLogbookNext: () => setLogbook(lb => lb ? { ...lb, page: Math.min(lb.pages.length - 1, lb.page + 1) } : lb),
    onTogglePanel: (p) => setPanelOpen(cur => (cur === p ? null : p)),
  }, getInputRef)

  useEffect(() => { if (logbook) effects.pageTurn() }, [logbook?.page])

  const inGame = screen === 'playing' || screen === 'entrance'
  return (
    <CRTScreen muted={muted} onToggleMute={toggleMute}>
      {screen === 'landing' && (
        <LandingPage
          onChoosePortfolio={() => setScreen('portfolio')}
          onChooseGame={handleChooseGame}
          onMenuSelect={effects.menuSelect}
          hasSave={serverPhase === 'playing'}
        />
      )}
      {screen === 'portfolio' && (
        <PortfolioPage onBack={() => setScreen('landing')} onMenuSelect={effects.menuSelect} />
      )}
      {screen === 'boot' && <BootSequence onComplete={handleBootComplete} />}
      {inGame && (
        <>
          <div className="game-container">
            <button className="exit-game-btn" onClick={() => setScreen('landing')} title="Return to menu">[ESC]</button>
            <InventoryPanel isOpen={panelOpen === 'inventory'} inventory={inventory} onClose={() => setPanelOpen(null)} />
            <MiniInventory inventory={inventory} onClick={() => setPanelOpen(p => (p === 'inventory' ? null : 'inventory'))} />
            <Terminal
              ref={terminalRef}
              onCommand={handleCommand}
              disabled={!!logbook || !!editor}
              prompt={prompt}
              thinking={thinking}
              status={!connected ? 'reconnecting…' : player.name ? `${player.name}${player.programmer ? ' ✦' : ''}` : ''}
            />
            <MiniMap map={map} onClick={() => setPanelOpen(p => (p === 'map' ? null : 'map'))} />
            <MapPanel isOpen={panelOpen === 'map'} map={map} onClose={() => setPanelOpen(null)} />
          </div>
          {logbook && (
            <Logbook
              book={logbook}
              page={logbook.page}
              onNextPage={() => setLogbook(lb => ({ ...lb, page: Math.min(lb.pages.length - 1, lb.page + 1) }))}
              onPrevPage={() => setLogbook(lb => ({ ...lb, page: Math.max(0, lb.page - 1) }))}
              onClose={() => setLogbook(null)}
            />
          )}
          {editor && (
            <Editor
              editor={editor}
              onSave={(text) => { client.send({ t: 'editor_save', target: editor.target, text }); setEditor(null) }}
              onCancel={() => { client.send({ t: 'editor_cancel', target: editor.target }); setEditor(null) }}
            />
          )}
        </>
      )}
    </CRTScreen>
  )
}

function styleClass(style) {
  switch (style) {
    case 'system': return 'system'
    case 'dim': return 'dim'
    case 'chat': return 'chat'
    case 'emote': return 'emote'
    case 'error': return 'error'
    case 'narrator': return 'narrator'
    default: return 'output'
  }
}
