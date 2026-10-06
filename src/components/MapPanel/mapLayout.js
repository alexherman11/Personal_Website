// Lay out the rooms a player has seen on a grid, by exit direction, and
// render them as ASCII. Works for the seed house and for anything built.
const VEC = {
  north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0],
  northeast: [1, -1], northwest: [-1, -1], southeast: [1, 1], southwest: [-1, 1],
  up: [1, -1], down: [-1, 1], in: [0, 1], out: [0, -1],
}

export function layoutMap(map) {
  const nodes = new Map(map.nodes.map(n => [n.id, { ...n }]))
  const edges = map.edges
  const placed = new Map()      // id -> {x,y}
  const used = new Set()
  const key = (x, y) => `${x},${y}`
  const free = (x, y) => !used.has(key(x, y))
  const place = (id, x, y) => { placed.set(id, { x, y }); used.add(key(x, y)) }
  const nearestFree = (x, y) => {
    for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (free(x + dx, y + dy)) return [x + dx, y + dy]
    return [x, y]
  }
  const adj = new Map()
  for (const e of edges) {
    if (!adj.has(e.from)) adj.set(e.from, [])
    adj.get(e.from).push(e)
    if (!nodes.has(e.to)) nodes.set(e.to, { id: e.to, name: e.toName, cluster: e.toCluster, unknown: !e.known, current: false })
  }
  const roots = ['#grand_hall', map.current, ...nodes.keys()].filter(id => nodes.has(id))
  for (const root of roots) {
    if (placed.has(root)) continue
    const [rx, ry] = placed.size ? nearestFree(0, (Math.max(0, ...[...placed.values()].map(p => p.y)) + 3)) : [0, 0]
    place(root, rx, ry)
    const queue = [root]
    while (queue.length) {
      const cur = queue.shift()
      const p = placed.get(cur)
      for (const e of adj.get(cur) || []) {
        if (placed.has(e.to)) continue
        const v = VEC[e.dir]
        let x, y
        if (v) { [x, y] = [p.x + v[0], p.y + v[1]]; if (!free(x, y)) [x, y] = nearestFree(x, y) }
        else [x, y] = nearestFree(p.x + 1, p.y)
        place(e.to, x, y)
        queue.push(e.to)
      }
    }
  }
  return { nodes, placed, edges }
}

const CELL_W = 11
const CELL_H = 3

export function renderMap(map) {
  if (!map || !map.nodes?.length) return 'No map yet.'
  const { nodes, placed, edges } = layoutMap(map)
  const xs = [...placed.values()].map(p => p.x), ys = [...placed.values()].map(p => p.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const W = (maxX - minX + 1) * CELL_W, H = (maxY - minY + 1) * CELL_H
  const grid = Array.from({ length: H }, () => Array(W).fill(' '))
  const put = (x, y, s) => { for (let i = 0; i < s.length; i++) if (y >= 0 && y < H && x + i >= 0 && x + i < W) grid[y][x + i] = s[i] }
  const cellX = x => (x - minX) * CELL_W, cellY = y => (y - minY) * CELL_H
  // connectors between adjacent cells
  for (const e of edges) {
    const a = placed.get(e.from), b = placed.get(e.to)
    if (!a || !b) continue
    const dx = b.x - a.x, dy = b.y - a.y
    if (Math.abs(dx) + Math.abs(dy) !== 1 && !(Math.abs(dx) === 1 && Math.abs(dy) === 1)) continue
    const ax = cellX(a.x) + 5, ay = cellY(a.y)
    if (dx === 1 && dy === 0) put(ax + 2, ay, '-'.repeat(CELL_W - 4))
    else if (dx === -1 && dy === 0) put(cellX(b.x) + 7, ay, '-'.repeat(CELL_W - 4))
    else if (dy === 1 && dx === 0) { put(ax, ay + 1, '|'); put(ax, ay + 2, '|') }
    else if (dy === -1 && dx === 0) { put(ax, ay - 1, '|'); put(ax, ay - 2, '|') }
    else if (dx === 1 && dy === -1) put(ax + 2, ay - 1, '/')
    else if (dx === -1 && dy === 1) put(ax - 2, ay + 1, '/')
    else if (dx === 1 && dy === 1) put(ax + 2, ay + 1, '\\')
    else if (dx === -1 && dy === -1) put(ax - 2, ay - 1, '\\')
  }
  for (const [id, p] of placed) {
    const n = nodes.get(id)
    const x = cellX(p.x), y = cellY(p.y)
    const ch = n.current ? '█' : n.unknown ? '?' : '░'
    put(x + 4, y, `[${ch}]`)
    let label = n.unknown ? '???' : String(n.name).replace(/^The /, '')
    if (label.length > CELL_W - 1) label = label.slice(0, CELL_W - 2) + '…'
    const lx = x + Math.max(0, Math.floor((CELL_W - label.length) / 2)) + (CELL_W % 2 ? 0 : 0)
    put(lx, y + 1, label)
  }
  return grid.map(r => r.join('').replace(/\s+$/, '')).join('\n').replace(/^\n+/, '')
}
