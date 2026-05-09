import './MiniMap.css'

const INDOOR_ROOMS = {
  archive:     { col: 2, row: 1 },
  signal_room: { col: 1, row: 2 },
  grand_hall:  { col: 2, row: 2 },
  workshop:    { col: 3, row: 2 },
  study:       { col: 2, row: 3 },
}

const OUTDOOR_ROOMS = {
  entrance: { col: 1, row: 1 },
  grounds:  { col: 2, row: 1 },
  tree:     { col: 3, row: 1 },
}

// Secret static rooms map back to a parent on one of the grids so the
// MiniMap can show a "you are here" indicator near where they branch off.
const SECRET_PARENTS = {
  memory_cellar: { parent: 'grand_hall', grid: 'indoor' },
  greenhouse:    { parent: 'grounds',    grid: 'outdoor' },
}

export default function MiniMap({ currentRoom, visitedRooms, onClick,
                                   generatedRooms = {}, dynamicExits = {} }) {
  const secretInfo = SECRET_PARENTS[currentRoom]
  const isOutdoor = ['grounds', 'tree', 'entrance'].includes(currentRoom)
    || secretInfo?.grid === 'outdoor'
  // If in a generated room, show the indoor grid with a special indicator
  const isGenerated = currentRoom in generatedRooms
  const roomSet = isOutdoor && !isGenerated ? OUTDOOR_ROOMS : INDOOR_ROOMS

  // Find which seed rooms have dynamic branches
  const seedsWithBranches = new Set()
  for (const parentId of Object.keys(dynamicExits)) {
    if (parentId in INDOOR_ROOMS) seedsWithBranches.add(parentId)
  }

  return (
    <div className="mini-map" onClick={onClick} title="Map [M]">
      <div className="mini-map__label">MAP</div>
      <div className={`mini-map__grid ${isOutdoor && !isGenerated ? 'mini-map__grid--outdoor' : ''}`}>
        {Object.entries(roomSet).map(([roomId, pos]) => (
          <div
            key={roomId}
            className={`mini-map__room${
              currentRoom === roomId ? ' mini-map__room--current' : ''
            }${visitedRooms.includes(roomId) ? ' mini-map__room--visited' : ''}${
              seedsWithBranches.has(roomId) ? ' mini-map__room--branched' : ''
            }`}
            style={{ gridColumn: pos.col, gridRow: pos.row }}
          />
        ))}
        {/* Show a blinking dot when player is in a secret static room */}
        {secretInfo && (() => {
          const parentPos = (secretInfo.grid === 'outdoor' ? OUTDOOR_ROOMS : INDOOR_ROOMS)[secretInfo.parent]
          if (!parentPos) return null
          return (
            <div
              className="mini-map__room mini-map__room--current"
              style={{ gridColumn: parentPos.col, gridRow: 4 }}
            />
          )
        })()}
        {/* Show a blinking dot when player is in a generated room */}
        {isGenerated && (() => {
          // Walk up to find the seed room parent
          let parentId = generatedRooms[currentRoom]?.parentRoom
          while (parentId && generatedRooms[parentId]) {
            parentId = generatedRooms[parentId].parentRoom
          }
          const parentPos = parentId && INDOOR_ROOMS[parentId]
          if (!parentPos) return null
          // Place indicator at row 4 (below grid) aligned with parent column
          return (
            <div
              className="mini-map__room mini-map__room--current"
              style={{ gridColumn: parentPos.col, gridRow: 4 }}
            />
          )
        })()}
      </div>
    </div>
  )
}
