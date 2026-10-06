// WebSocket transport: one socket per terminal, JSON messages both ways.
//   client -> server: hello {token}, cmd {text}, bootdone, editor_save {target,text}, ping
//   server -> client: welcome, out, room, transition, phase, inventory, map, logbook,
//                     editor, mode, sound, panel, player, token, reconnect, error
import { WebSocketServer } from 'ws'
import store from './store.js'
import { Session, sessionsOf } from './session.js'
import { handleLine } from './dispatch.js'
import { findPlayerByToken, createGuest } from './auth.js'
import { showRoom, sendInventory, sendMap, movePlayer } from './actions.js'
import { finishBoot } from './entrance.js'
import { editorSave } from './commands/programming.js'
import { announceRoom } from './session.js'
import { roomOf } from './objects.js'
import { unreadCount } from './mail.js'
import { enterNamePrompt } from './onboarding.js'
import { SYSTEM_ID } from './objects.js'

const MAX_SESSIONS = 300

export function attachWebSocket(httpServer) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 })
  httpServer.on('upgrade', (req, socket, head) => {
    if (!req.url.startsWith('/ws')) { socket.destroy(); return }
    if (wss.clients.size >= MAX_SESSIONS) { socket.destroy(); return }
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req))
  })

  wss.on('connection', (ws) => {
    let session = null
    ws.isAlive = true
    ws.on('pong', () => { ws.isAlive = true })
    ws.on('message', async (data) => {
      let msg
      try { msg = JSON.parse(String(data)) } catch { return }
      if (!msg || typeof msg !== 'object') return
      try {
        if (msg.t === 'hello') {
          if (session) return
          session = hello(ws, msg)
          return
        }
        if (!session) return
        if (msg.t === 'cmd') return await handleLine(session, String(msg.text ?? ''))
        if (msg.t === 'bootdone') return finishBoot(session)
        if (msg.t === 'editor_save') return await editorSave(session, String(msg.target || ''), String(msg.text || ''))
        if (msg.t === 'editor_cancel') return session.out('Editor closed. Nothing changed.', 'dim')
        if (msg.t === 'ping') return session.send({ t: 'pong' })
        if (msg.t === 'refresh') { const r = store.get(session.p.location); if (r) showRoom(session.p, r, { transition: false }); sendInventory(session.p); return }
      } catch (err) {
        console.error('[ws]', err)
        session?.out('Something went wrong inside the walls.', 'error')
      }
    })
    ws.on('close', () => {
      if (!session) return
      const p = session.p
      session.close()
      p.props.lastSeen = Date.now(); store.save(p)
      if (!sessionsOf(p.id).length) {
        const room = roomOf(p)
        if (room) announceRoom(room.id, `${p.name} fades from view.`, { except: p, style: 'dim' })
      }
    })
  })

  // heartbeat
  setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) { try { ws.terminate() } catch {} ; continue }
      ws.isAlive = false
      try { ws.ping() } catch {}
    }
  }, 30000)

  return wss
}

function hello(ws, msg) {
  let player = findPlayerByToken(msg.token)
  let token = null
  if (!player) {
    const g = createGuest()
    player = g.player; token = g.token
  }
  const session = new Session(ws, player)
  player.props.lastSeen = Date.now()
  // Repair players left in odd places (recycled rooms etc.)
  if (!store.get(player.location)) { player.location = player.props.phase === 'playing' ? '#grand_hall' : '#entrance' }
  if (player.props.phase === 'boot') { player.props.phase = 'playing'; player.location = '#grand_hall' }
  store.save(player)
  session.send({
    t: 'welcome', id: player.id, name: player.name, phase: player.props.phase || 'entrance',
    programmer: !!(player.flags?.programmer || player.flags?.wizard), wizard: !!player.flags?.wizard,
    token, registered: !!player.props.registered, unreadMail: unreadCount(player.id),
    logbooks: Object.fromEntries(Object.entries(store.get(SYSTEM_ID)?.props?.logbooks || {}).map(([k, v]) => [k, { title: v.title, pages: v.pages.length }])),
  })
  const room = roomOf(player)
  if (room) {
    showRoom(player, room, { transition: false })
    announceRoom(room.id, `${player.name} fades into view.`, { except: player, style: 'dim' })
  }
  sendInventory(player)
  sendMap(player)
  const unread = unreadCount(player.id)
  if (unread) session.out(`You have ${unread} unread letter${unread === 1 ? '' : 's'}. ("mail" to read them.)`, 'chat')
  if (player.props.phase === 'playing') enterNamePrompt(session)
  return session
}
