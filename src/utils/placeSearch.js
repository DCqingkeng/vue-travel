// KD-Tree based nearest-place search utilities
// Exports:
// - buildKDTree(points, options)
// - nearestNeighbors(tree, target, k = 1, options)
// - haversineDistance(a, b)
// Points are generic objects. By default this utility expects either:
//  - objects with {lat, lon} (degrees), or
//  - objects with {x, y}, or
//  - arrays [x, y]
// You can pass options.getCoords(point) => [x, y]

function defaultGetCoords(p) {
  if (Array.isArray(p)) return [p[0], p[1]]
  if (p == null) return [0, 0]
  if (typeof p.lat === 'number' && typeof p.lon === 'number') return [p.lat, p.lon]
  if (typeof p.x === 'number' && typeof p.y === 'number') return [p.x, p.y]
  // fallback: try numeric properties
  if (typeof p[0] === 'number' && typeof p[1] === 'number') return [p[0], p[1]]
  return [0, 0]
}

// Haversine distance in meters between two points [lat, lon] in degrees
export function haversineDistance(a, b) {
  const toRad = (d) => (d * Math.PI) / 180
  const [lat1, lon1] = a
  const [lat2, lon2] = b
  const R = 6371000 // Earth radius in meters
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const la1 = toRad(lat1)
  const la2 = toRad(lat2)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLon = Math.sin(dLon / 2)
  const h = sinDLat * sinDLat + Math.cos(la1) * Math.cos(la2) * sinDLon * sinDLon
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function euclideanDistance(a, b) {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  return Math.sqrt(dx * dx + dy * dy)
}

// Build a KD-tree for 2D points
export function buildKDTree(points = [], options = {}) {
  const getCoords = options.getCoords || defaultGetCoords

  function build(list, depth = 0) {
    if (!list.length) return null
    const axis = depth % 2
    // sort by axis
    list.sort((A, B) => {
      const a = getCoords(A)[axis]
      const b = getCoords(B)[axis]
      return a - b
    })
    const mid = Math.floor(list.length / 2)
    const node = {
      point: list[mid],
      left: build(list.slice(0, mid), depth + 1),
      right: build(list.slice(mid + 1), depth + 1),
      axis
    }
    return node
  }

  // clone array so that sort doesn't mutate caller's array
  return build(points.slice(), 0)
}

// Simple max-heap implementation for fixed size k
class MaxHeap {
  constructor(capacity) {
    this.data = []
    this.capacity = capacity
  }
  size() { return this.data.length }
  peek() { return this.data[0] }
  push(item) {
    this.data.push(item)
    this._siftUp(this.data.length - 1)
    if (this.data.length > this.capacity) this.pop()
  }
  pop() {
    if (!this.data.length) return null
    const top = this.data[0]
    const last = this.data.pop()
    if (this.data.length) {
      this.data[0] = last
      this._siftDown(0)
    }
    return top
  }
  _siftUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2)
      if (this.data[parent].dist >= this.data[i].dist) break
      const tmp = this.data[parent]
      this.data[parent] = this.data[i]
      this.data[i] = tmp
      i = parent
    }
  }
  _siftDown(i) {
    const n = this.data.length
    while (true) {
      let largest = i
      const l = 2 * i + 1
      const r = 2 * i + 2
      if (l < n && this.data[l].dist > this.data[largest].dist) largest = l
      if (r < n && this.data[r].dist > this.data[largest].dist) largest = r
      if (largest === i) break
      const tmp = this.data[i]
      this.data[i] = this.data[largest]
      this.data[largest] = tmp
      i = largest
    }
  }
}

// Find k nearest neighbors to target (array or point object depending on getCoords)
// options: k, maxDistance (meters when using haversine), distance ("haversine" or "euclidean"), getCoords
export function nearestNeighbors(tree, target, k = 1, options = {}) {
  if (!tree) return []
  const getCoords = options.getCoords || defaultGetCoords
  const mode = options.distance || 'haversine'
  const distFn = mode === 'euclidean' ? euclideanDistance : haversineDistance
  const targetCoords = getCoords(target)
  const heap = new MaxHeap(k)
  const maxDistance = (typeof options.maxDistance === 'number') ? options.maxDistance : Infinity

  function search(node) {
    if (!node) return
    const pointCoords = getCoords(node.point)
    const d = distFn(pointCoords, targetCoords)
    if (d <= maxDistance) {
      heap.push({ point: node.point, dist: d })
    }
    const axis = node.axis
    // distance along axis (for lat/lon this is degrees; safe pruning when using euclidean, for haversine we approximate)
    const diff = targetCoords[axis] - pointCoords[axis]

    let first = node.left
    let second = node.right
    if (diff > 0) { first = node.right; second = node.left }

    search(first)

    // compute bounding condition: there may still be closer points in other side
    let shouldCheckOther = false
    if (heap.size() < k) shouldCheckOther = true
    else if (heap.peek()) {
      const farthest = heap.peek().dist
      // For haversine we need to convert axis-diff (degrees) to meters conservatively
      if (mode === 'haversine') {
        // create a point shifted by diff on that axis
        const tmp = targetCoords.slice()
        tmp[axis] = pointCoords[axis]
        const axisDist = distFn(tmp, targetCoords)
        if (axisDist <= farthest) shouldCheckOther = true
      } else {
        if (Math.abs(diff) <= farthest) shouldCheckOther = true
      }
    }

    if (shouldCheckOther) search(second)
  }

  search(tree)

  // extract results sorted by distance ascending
  const results = heap.data.slice().sort((a, b) => a.dist - b.dist).map(x => ({ point: x.point, distance: x.dist }))
  return results
}

export default {
  buildKDTree,
  nearestNeighbors,
  haversineDistance,
  euclideanDistance
}
