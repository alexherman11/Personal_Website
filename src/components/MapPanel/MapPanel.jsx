import './MapPanel.css'

const ROOM_LABELS = {
  archive: 'Archive',
  signal_room: 'Signal',
  grand_hall: 'Hall',
  workshop: 'Workshop',
  study: 'Study',
  grounds: 'Grounds',
  tree: 'Tree',
}

function roomChar(roomId, visitedRooms, currentRoom) {
  if (currentRoom === roomId) return '\u2588'  // solid block, will blink via CSS
  if (visitedRooms.includes(roomId)) return '\u2588'
  return '?'
}

function roomClass(roomId, currentRoom) {
  if (currentRoom === roomId) return 'map-room map-room--current'
  return 'map-room'
}

export default function MapPanel({ isOpen, visitedRooms, currentRoom, onClose }) {
  const r = (id) => roomChar(id, visitedRooms, currentRoom)
  const c = (id) => roomClass(id, currentRoom)
  const label = (id) => visitedRooms.includes(id) ? ROOM_LABELS[id] : '???'

  return (
    <div className={`map-panel ${isOpen ? 'map-panel--open' : ''}`}>
      <div className="map-panel__header">
        <span>MAP</span>
        <button className="map-panel__close" onClick={onClose}>
          [ESC]
        </button>
      </div>

      <div className="map-panel__content">
        <pre className="map-panel__ascii">
{`
           [${r('archive')}]
          ${label('archive')}
            |
            |
 [${r('signal_room')}]--[${r('grand_hall')}]--[${r('workshop')}]
 ${label('signal_room')}   ${label('grand_hall')}  ${label('workshop')}
            |
            |
           [${r('study')}]
          ${label('study')}


  --- Outdoor ---

 [${r('grounds')}]--[${r('tree')}]
 ${label('grounds')}  ${label('tree')}
`}
        </pre>

        <div className="map-panel__legend">
          <span>[<span className="map-room--current">{'\u2588'}</span>] You are here</span>
          <span>[{'\u2588'}] Visited</span>
          <span>[?] Unknown</span>
        </div>
      </div>
    </div>
  )
}
