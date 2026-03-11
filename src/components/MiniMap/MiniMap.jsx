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

export default function MiniMap({ currentRoom, visitedRooms, onClick }) {
  const isOutdoor = ['grounds', 'tree', 'entrance'].includes(currentRoom)
  const roomSet = isOutdoor ? OUTDOOR_ROOMS : INDOOR_ROOMS

  return (
    <div className="mini-map" onClick={onClick} title="Map [M]">
      <div className="mini-map__label">MAP</div>
      <div className={`mini-map__grid ${isOutdoor ? 'mini-map__grid--outdoor' : ''}`}>
        {Object.entries(roomSet).map(([roomId, pos]) => (
          <div
            key={roomId}
            className={`mini-map__room${
              currentRoom === roomId ? ' mini-map__room--current' : ''
            }${visitedRooms.includes(roomId) ? ' mini-map__room--visited' : ''}`}
            style={{ gridColumn: pos.col, gridRow: pos.row }}
          />
        ))}
      </div>
    </div>
  )
}
