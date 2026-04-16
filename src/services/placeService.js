import { buildKDTree, nearestNeighbors } from '@/utils/placeSearch'

// Factory for a place search service that maintains an index (KD-Tree) and a place list.
// Usage:
// const svc = createPlaceService({ getCoords })
// svc.load(places) // load array of place objects
// svc.build() // build internal index (automatically called on load)
// svc.nearest(target, k, options) // returns array [{point, distance}]
// svc.withinRadius(target, radiusMeters, options) // returns all points within radius
// svc.add(place) / svc.removeById(id) / svc.clear()

export function createPlaceService(defaultOptions = {}) {
  let places = []
  let tree = null
  const opts = Object.assign({ getCoords: undefined, distance: 'haversine' }, defaultOptions)

  function load(list = []) {
    places = Array.isArray(list) ? list.slice() : []
    build()
  }

  function build() {
    tree = buildKDTree(places, { getCoords: opts.getCoords })
    return tree
  }

  function ensureBuilt() {
    if (!tree) build()
  }

  function nearest(target, k = 1, options = {}) {
    ensureBuilt()
    const merged = Object.assign({}, opts, options)
    return nearestNeighbors(tree, target, k, merged)
  }

  function withinRadius(target, radiusMeters, options = {}) {
    ensureBuilt()
    const merged = Object.assign({}, opts, options)
    // Get more candidates, then filter by radius. We don't know k; use all by passing large k.
    // To be efficient, request a reasonably large k (e.g., 100) or the total number of places.
    const k = Math.min(Math.max(1, options.k || 100), places.length || 100)
    const candidates = nearestNeighbors(tree, target, k, merged)
    return candidates.filter(r => r.distance <= radiusMeters)
  }

  function add(place) {
    places.push(place)
    // lazy rebuild
    tree = null
  }

  function removeById(id) {
    const idx = places.findIndex(p => p && (p.id === id || p._id === id))
    if (idx >= 0) {
      places.splice(idx, 1)
      tree = null
      return true
    }
    return false
  }

  function remove(predicate) {
    const origLen = places.length
    places = places.filter(p => !predicate(p))
    if (places.length !== origLen) tree = null
    return places.length !== origLen
  }

  function clear() {
    places = []
    tree = null
  }

  function getAll() {
    return places.slice()
  }

  return {
    load,
    build,
    nearest,
    withinRadius,
    add,
    removeById,
    remove,
    clear,
    getAll,
    // expose internal for debugging
    _internal: () => ({ places, tree })
  }
}

export default createPlaceService
