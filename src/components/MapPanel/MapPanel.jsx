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

function roomChar(roomId, visitedRooms, currentRoom, generatedRooms) {
  if (currentRoom === roomId) return '\u2588'
  if (visitedRooms.includes(roomId)) return '\u2588'
  return '?'
}

function roomLabel(roomId, visitedRooms, generatedRooms) {
  if (!visitedRooms.includes(roomId)) return '???'
  if (ROOM_LABELS[roomId]) return ROOM_LABELS[roomId]
  if (generatedRooms[roomId]) return generatedRooms[roomId].name
  return '???'
}

function buildBranches(dynamicExits, generatedRooms, visitedRooms, currentRoom) {
  if (!dynamicExits) return []
  const branches = []

  for (const [parentId, exits] of Object.entries(dynamicExits)) {
    for (const [, childId] of Object.entries(exits)) {
      const parentName = ROOM_LABELS[parentId]
        || (generatedRooms[parentId] && visitedRooms.includes(parentId) ? generatedRooms[parentId].name : null)
        || '???'
      const childChar = roomChar(childId, visitedRooms, currentRoom, generatedRooms)
      const childName = roomLabel(childId, visitedRooms, generatedRooms)

      // Check if this child has its own children (for chaining)
      let chain = ` ${parentName} \u2500\u25B8 [${childChar}] ${childName}`
      let cursor = childId
      while (dynamicExits[cursor]) {
        const nextExits = Object.entries(dynamicExits[cursor])
        if (nextExits.length === 0) break
        const [, nextChildId] = nextExits[0]
        const nextChar = roomChar(nextChildId, visitedRooms, currentRoom, generatedRooms)
        const nextName = roomLabel(nextChildId, visitedRooms, generatedRooms)
        chain += ` \u2500\u25B8 [${nextChar}] ${nextName}`
        cursor = nextChildId
      }
      branches.push(chain)
    }
  }

  return branches
}

export default function MapPanel({ isOpen, visitedRooms, currentRoom, onClose,
                                    generatedRooms = {}, dynamicExits = {} }) {
  const r = (id) => roomChar(id, visitedRooms, currentRoom, generatedRooms)
  const label = (id) => roomLabel(id, visitedRooms, generatedRooms)

  const branches = buildBranches(dynamicExits, generatedRooms, visitedRooms, currentRoom)

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
${branches.length > 0 ? `

  --- Discovered ---
${branches.join('\n')}` : ''}`}
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
