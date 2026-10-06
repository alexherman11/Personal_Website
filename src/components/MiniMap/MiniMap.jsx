import './MiniMap.css'

// A 3x3 glance at the rooms around you, from the server's map data.
const DIRS = { north: [1, 0], south: [1, 2], east: [2, 1], west: [0, 1], northeast: [2, 0], northwest: [0, 0], southeast: [2, 2], southwest: [0, 2] }

export default function MiniMap({ map, onClick }) {
  const current = map?.current
  const cells = []
  if (current) {
    cells.push({ key: current, col: 2, row: 2, cls: ' mini-map__room--current mini-map__room--visited' })
    for (const e of map.edges || []) {
      if (e.from !== current) continue
      const d = DIRS[e.dir]
      if (!d) continue
      cells.push({ key: e.to + e.dir, col: d[0] + 1, row: d[1] + 1, cls: e.known ? ' mini-map__room--visited' : '' })
    }
  }
  return (
    <div className="mini-map" onClick={onClick} title="Map [M]">
      <div className="mini-map__label">MAP</div>
      <div className="mini-map__grid">
        {cells.map(c => (
          <div key={c.key} className={`mini-map__room${c.cls}`} style={{ gridColumn: c.col, gridRow: c.row }} />
        ))}
      </div>
    </div>
  )
}
