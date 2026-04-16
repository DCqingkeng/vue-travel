// Graph utilities for GeoJSON-based map data
// 支持：
// - buildGraphFromGeoJSON(geojson): 构建邻接表，返回 { nodes: Map(id->node), adj: Map(id->[{to, distance, time}]) }
// - dijkstra(adj, source, weightKey): 返回 distances Map 和 prev Map
// - shortestPath(adj, source, target, weightKey): 返回 path array and total cost
// - computePairwise(waypoints, adj, weightKey): 返回矩阵 of costs and paths
// - solveTSP_nn2opt(matrix): 对点索引矩阵求近似TSP（最近邻+2-opt），返回 order and total

export function buildGraphFromGeoJSON(geojson) {
  const nodes = new Map()
  const adj = new Map()

  if (!geojson || !geojson.features) return { nodes, adj }

  for (const f of geojson.features) {
    const props = f.properties || {}
    if ((f.geometry && f.geometry.type === 'Point') || props.type === 'node') {
      const id = props.id != null ? String(props.id) : props.name || JSON.stringify(f.geometry.coordinates)
      nodes.set(String(id), { id: String(id), name: props.name || String(id), coord: f.geometry ? f.geometry.coordinates : null })
      if (!adj.has(String(id))) adj.set(String(id), [])
    }
  }

  for (const f of geojson.features) {
    const props = f.properties || {}
    if ((f.geometry && f.geometry.type === 'LineString') || props.type === 'edge') {
      const from = props.from != null ? String(props.from) : null
      const to = props.to != null ? String(props.to) : null
      if (!from || !to) continue
      const distance = typeof props.distance === 'number' ? props.distance : calcLineDistance(f.geometry.coordinates)
      const time = typeof props.time === 'number' ? props.time : estimateTimeFromDistance(distance)
      if (!adj.has(from)) adj.set(from, [])
      if (!adj.has(to)) adj.set(to, [])
      // undirected
      adj.get(from).push({ to, distance, time })
      adj.get(to).push({ to: from, distance, time })
    }
  }

  return { nodes, adj }
}

function calcLineDistance(coords) {
  // 简单估算：如果 coords 为经纬度数组，返回米级近似（哈弗辛公式）
  if (!coords || coords.length < 2) return 0
  let sum = 0
  for (let i = 1; i < coords.length; i++) {
    sum += haversineDistance(coords[i - 1], coords[i])
  }
  return Math.round(sum)
}

function haversineDistance(a, b) {
  const toRad = (v) => v * Math.PI / 180
  const lat1 = a[1], lon1 = a[0], lat2 = b[1], lon2 = b[0]
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const la1 = toRad(lat1), la2 = toRad(lat2)
  const hav = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2
  return 2 * R * Math.asin(Math.sqrt(hav))
}

function estimateTimeFromDistance(distance) {
  // 假设平均速度 40 km/h -> 40000 m/h => time in hours, convert to minutes
  const hours = distance / 40000
  return Math.round(hours * 60) // minutes
}

// 简单优先队列（最小堆）
class MinPQ {
  constructor() { this.data = [] }
  push(item, pr) { this.data.push({ item, pr }); this._siftUp(this.data.length - 1) }
  pop() { if (!this.data.length) return null; const top = this.data[0]; const last = this.data.pop(); if (this.data.length) { this.data[0] = last; this._siftDown(0) } return top }
  _siftUp(i) { let p=(i-1)>>1; while(i>0 && this.data[p].pr>this.data[i].pr){[this.data[p],this.data[i]]=[this.data[i],this.data[p]]; i=p; p=(i-1)>>1} }
  _siftDown(i){ const n=this.data.length; while(true){ let l=2*i+1,r=l+1,small=i; if(l<n && this.data[l].pr<this.data[small].pr) small=l; if(r<n && this.data[r].pr<this.data[small].pr) small=r; if(small===i) break; [this.data[i],this.data[small]]=[this.data[small],this.data[i]]; i=small } }
}

export function dijkstra(adj, source, weightKey = 'distance') {
  const dist = new Map()
  const prev = new Map()
  for (const k of adj.keys()) { dist.set(k, Infinity); prev.set(k, null) }
  if (!adj.has(source)) return { dist, prev }
  dist.set(source, 0)
  const pq = new MinPQ()
  pq.push(source, 0)
  while (true) {
    const node = pq.pop()
    if (!node) break
    const u = node.item
    const d = node.pr
    if (d !== dist.get(u)) continue
    const neighbors = adj.get(u) || []
    for (const e of neighbors) {
      const v = e.to
      const w = typeof e[weightKey] === 'number' ? e[weightKey] : Infinity
      const alt = dist.get(u) + w
      if (alt < dist.get(v)) {
        dist.set(v, alt)
        prev.set(v, u)
        pq.push(v, alt)
      }
    }
  }
  return { dist, prev }
}

export function shortestPath(adj, source, target, weightKey = 'distance') {
  const { dist, prev } = dijkstra(adj, source, weightKey)
  if (!dist.has(target) || dist.get(target) === Infinity) return { path: [], cost: Infinity }
  const path = []
  let u = target
  while (u != null) { path.push(u); u = prev.get(u) }
  path.reverse()
  return { path, cost: dist.get(target) }
}

export function computePairwise(waypoints, adj, weightKey='distance') {
  const n = waypoints.length
  const costs = Array.from({ length: n }, () => Array(n).fill(Infinity))
  const paths = Array.from({ length: n }, () => Array(n).fill(null))
  for (let i = 0; i < n; i++) {
    const { dist, prev } = dijkstra(adj, waypoints[i], weightKey)
    for (let j = 0; j < n; j++) {
      const t = waypoints[j]
      if (!dist.has(t) || dist.get(t) === Infinity) continue
      costs[i][j] = dist.get(t)
      // rebuild path
      const p = []
      let u = t
      while (u != null) { p.push(u); u = prev.get(u) }
      p.reverse()
      paths[i][j] = p
    }
  }
  return { costs, paths }
}

// 最近邻 + 2-opt 改善
export function solveTSP_nn2opt(costMatrix) {
  const n = costMatrix.length
  if (n === 0) return { order: [], cost: 0 }
  // NN start at 0
  const unvisited = new Set(Array.from({ length: n }, (_, i) => i))
  const order = []
  let cur = 0
  order.push(cur); unvisited.delete(cur)
  while (unvisited.size) {
    let next = null; let best = Infinity
    for (const v of unvisited) {
      const c = costMatrix[cur][v]
      if (c < best) { best = c; next = v }
    }
    if (next == null) break
    order.push(next); unvisited.delete(next); cur = next
  }
  // 2-opt
  let improved = true
  const MAX_IT = 200
  let it = 0
  const tourCost = (ord) => {
    let s = 0
    for (let i = 0; i < ord.length - 1; i++) s += costMatrix[ord[i]][ord[i+1]]
    // no return to start
    return s
  }
  while (improved && it++ < MAX_IT) {
    improved = false
    for (let i = 1; i < n - 1; i++) {
      for (let k = i + 1; k < n; k++) {
        const newOrder = order.slice(0, i).concat(order.slice(i, k + 1).reverse(), order.slice(k + 1))
        if (tourCost(newOrder) + 1e-6 < tourCost(order)) {
          order.splice(0, order.length, ...newOrder)
          improved = true
        }
      }
      if (improved) break
    }
  }
  return { order, cost: tourCost(order) }
}

export default { buildGraphFromGeoJSON, dijkstra, shortestPath, computePairwise, solveTSP_nn2opt }
