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

// For frontend usage we keep a lightweight API: buildKDTree returns a shallow copy of points.
// Nearest neighbor queries will perform a linear scan over the points. This is simpler and
// easier to maintain; it's acceptable for typical small-medium datasets in the browser.
export function buildKDTree(points = [], options = {}) {
  return Array.isArray(points) ? points.slice() : []
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
  const pts = Array.isArray(tree) ? tree : (tree && tree.points) ? tree.points : []
  if (!pts || !pts.length) return []
  const getCoords = options.getCoords || defaultGetCoords
  const mode = options.distance || 'haversine'
  const distFn = mode === 'euclidean' ? euclideanDistance : haversineDistance
  const targetCoords = getCoords(target)
  const maxDistance = (typeof options.maxDistance === 'number') ? options.maxDistance : Infinity

  const results = []
  for (const p of pts) {
    const pc = getCoords(p)
    const d = distFn(pc, targetCoords)
    if (d <= maxDistance) results.push({ point: p, distance: d })
  }
  results.sort((a, b) => a.distance - b.distance)
  return results.slice(0, Math.max(1, k))
}

export default {
  buildKDTree,
  nearestNeighbors,
  haversineDistance,
  euclideanDistance
}
