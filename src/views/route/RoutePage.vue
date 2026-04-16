<template>
  <div class="route-page">
    <h1>🗺️ 路线规划</h1>
    <p class="subtitle">使用 GeoJSON 地图数据计算多点最短（距离）与最快（时间）路线</p>

    <div class="planning-section">
      <div class="input-panel">
        <h3>地图数据</h3>
        <div class="form-group">
          <label>上传 GeoJSON 文件</label>
          <input type="file" accept=".geojson,application/json" @change="onFileChange" />
        </div>
        <div class="form-group">
          <label>或加载示例地图（assets/map.geojson）</label>
          <button class="btn-outline" @click="loadSample">加载示例地图</button>
        </div>

        <h3 style="margin-top:1rem">路点选择</h3>
        <div class="form-group">
          <label>可选路点（从地图节点列表选择，支持多选）</label>
          <select multiple size="8" v-model="selectedNodeIds" class="node-list">
            <option v-for="(node, id) in Array.from(nodes.entries())" :key="id" :value="id">{{ node.name || id }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>起点（可选，默认为选择列表第一个）</label>
          <select v-model="startNode" class="node-select">
            <option value="">-- 不指定 --</option>
            <option v-for="(node, id) in Array.from(nodes.entries())" :key="id" :value="id">{{ node.name || id }}</option>
          </select>
        </div>

        <div class="form-group">
          <button class="btn-plan" @click="computeBestByDistance">多点最短（距离）</button>
          <button class="btn-plan" @click="computeBestByTime" style="margin-left:8px">多点最快（时间）</button>
        </div>
      </div>

      <div class="route-display">
        <h3>规划结果</h3>
        <div v-if="!result">
          <div class="empty-state">
            <div class="icon">🗺️</div>
            <p>请上传或加载地图，并在左侧选择若干路点后点击计算。</p>
          </div>
        </div>

        <div v-else>
          <div class="summary">
            <p><strong>优化目标：</strong> {{ result.mode === 'distance' ? '最短距离' : '最短时间' }}</p>
            <p><strong>总耗时：</strong> {{ formatTime(result.totalTime) }}</p>
            <p><strong>总距离：</strong> {{ formatDistance(result.totalDistance) }}</p>
            <p><strong>访问顺序：</strong> <span v-for="(id, idx) in result.orderNodes" :key="id">{{ nodeName(id) }}<span v-if="idx < result.orderNodes.length -1"> → </span></span></p>
          </div>

          <div class="segments">
            <h4>分段路径</h4>
            <div v-for="(seg, idx) in result.segments" :key="idx" class="segment">
              <div class="seg-header">{{ idx + 1 }}. {{ nodeName(seg.from) }} → {{ nodeName(seg.to) }}：{{ formatDistance(seg.distance) }}，{{ formatTime(seg.time) }}</div>
              <div class="seg-path">路径：<span v-for="(p, i) in seg.path" :key="i">{{ nodeName(p) }}<span v-if="i < seg.path.length -1"> → </span></span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { buildGraphFromGeoJSON, computePairwise, solveTSP_nn2opt, shortestPath } from '../../utils/graph'

const nodes = ref(new Map())
const adj = ref(new Map())

const selectedNodeIds = ref([])
const startNode = ref('')

const result = ref(null)

function nodeName(id) {
  const n = nodes.value.get(id)
  return n ? (n.name || id) : id
}

async function onFileChange(e) {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  try {
    const txt = await f.text()
    const geo = JSON.parse(txt)
    const g = buildGraphFromGeoJSON(geo)
    nodes.value = g.nodes
    adj.value = g.adj
    // reset
    selectedNodeIds.value = []
    startNode.value = ''
    result.value = null
    alert('地图加载成功，节点数量：' + nodes.value.size)
  } catch (err) {
    alert('解析 GeoJSON 失败：' + err.message)
  }
}

async function loadSample() {
  // 尝试多种方式加载示例地图：优先静态 assets，再尝试内置 src/assets 文件
  try {
    let geo = null
    // 1) 尝试 public 下的 assets/map.geojson
    try {
      const r = await fetch('/assets/map.geojson')
      if (r.ok) geo = await r.json()
    } catch (e) {
      // ignore
    }

    // 2) 如果没有，尝试 public 下的 nju_gulou.geojson
    if (!geo) {
      try {
        const r2 = await fetch('/assets/nju_gulou.geojson')
        if (r2.ok) geo = await r2.json()
      } catch (e) {}
    }

    // 3) 最后尝试通过打包时的 src 路径导入（Vite 支持）
    if (!geo) {
      try {
        const mod = await import('../../assets/nju_gulou.geojson')
        geo = mod.default || mod
      } catch (e) {
        // ignore
      }
    }

    if (!geo) throw new Error('未找到示例 GeoJSON 文件（尝试 /assets/map.geojson /assets/nju_gulou.geojson 以及 src/assets/nju_gulou.geojson）')

    const g = buildGraphFromGeoJSON(geo)
    nodes.value = g.nodes
    adj.value = g.adj
    selectedNodeIds.value = []
    startNode.value = ''
    result.value = null
    alert('示例地图加载成功，节点数量：' + nodes.value.size)
  } catch (err) {
    alert('加载示例地图失败：' + err.message)
  }
}

function formatDistance(m) {
  if (!isFinite(m)) return 'N/A'
  if (m >= 1000) return (m/1000).toFixed(2) + ' km'
  return Math.round(m) + ' m'
}

function formatTime(mins) {
  if (!isFinite(mins)) return 'N/A'
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  return (h ? h + 'h ' : '') + m + 'm'
}

function ensureWaypoints() {
  const wp = selectedNodeIds.value.slice()
  if (!wp || wp.length < 2) { alert('请至少选择两个路点'); return null }
  // if startNode specified, move it to beginning
  if (startNode.value) {
    const idx = wp.indexOf(startNode.value)
    if (idx > -1) {
      wp.splice(idx,1)
      wp.unshift(startNode.value)
    } else {
      // if start not in selected, add at beginning if exists in nodes
      if (nodes.value.has(startNode.value)) wp.unshift(startNode.value)
    }
  }
  return wp
}

function computeBestByDistance() {
  const wp = ensureWaypoints()
  if (!wp) return
  if (!adj.value || adj.value.size === 0) { alert('请先加载地图数据'); return }
  // compute pairwise by distance
  const { costs, paths } = computePairwise(wp, adj.value, 'distance')
  const tsp = solveTSP_nn2opt(costs)
  // build segments
  const order = tsp.order
  const orderNodes = order.map(i => wp[i])
  const segments = []
  let totalDist = 0
  let totalTime = 0
  for (let k = 0; k < order.length - 1; k++) {
    const i = order[k], j = order[k+1]
    const segPath = paths[i][j] || []
    const segDist = costs[i][j]
    // compute time by shortestPath (time) for accurate time estimate
    const sp = shortestPath(adj.value, wp[i], wp[j], 'time')
    const segTime = isFinite(sp.cost) ? sp.cost : 0
    segments.push({ from: wp[i], to: wp[j], path: segPath, distance: segDist, time: segTime })
    totalDist += isFinite(segDist) ? segDist : 0
    totalTime += isFinite(segTime) ? segTime : 0
  }
  result.value = { mode: 'distance', orderNodes, segments, totalDistance: totalDist, totalTime }
}

function computeBestByTime() {
  const wp = ensureWaypoints()
  if (!wp) return
  if (!adj.value || adj.value.size === 0) { alert('请先加载地图数据'); return }
  const { costs, paths } = computePairwise(wp, adj.value, 'time')
  const tsp = solveTSP_nn2opt(costs)
  const order = tsp.order
  const orderNodes = order.map(i => wp[i])
  const segments = []
  let totalDist = 0
  let totalTime = 0
  for (let k = 0; k < order.length - 1; k++) {
    const i = order[k], j = order[k+1]
    const segPath = paths[i][j] || []
    const segTime = costs[i][j]
    const sp = shortestPath(adj.value, wp[i], wp[j], 'distance')
    const segDist = isFinite(sp.cost) ? sp.cost : 0
    segments.push({ from: wp[i], to: wp[j], path: segPath, distance: segDist, time: segTime })
    totalDist += isFinite(segDist) ? segDist : 0
    totalTime += isFinite(segTime) ? segTime : 0
  }
  result.value = { mode: 'time', orderNodes, segments, totalDistance: totalDist, totalTime }
}

</script>

<style scoped>
.route-page { max-width: 1200px; margin: 0 auto }
.subtitle { color: #718096; margin-bottom: 1rem }
.planning-section { display: grid; grid-template-columns: 380px 1fr; gap: 1.5rem }
.input-panel, .route-display { background: white; padding: 1.25rem; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05) }
.form-group { margin-bottom: 1rem }
.form-group label { display:block; margin-bottom:0.5rem; color:#4a5568 }
.node-list { width:100%; border:1px solid #e2e8f0; border-radius:6px }
.node-select { width:100%; padding:0.5rem; border:1px solid #e2e8f0; border-radius:6px }
.btn-plan { padding:0.6rem 1rem; background:#667eea; color:white; border:none; border-radius:8px; cursor:pointer }
.btn-outline { padding:0.45rem 0.8rem; background:white; border:1px solid #e2e8f0; border-radius:8px; cursor:pointer }
.empty-state { text-align:center; padding:2rem; color:#718096 }
.segments { margin-top:1rem }
.segment { padding:0.75rem; border-bottom:1px dashed #f0f0f0 }
.seg-header { font-weight:600; margin-bottom:0.5rem }
.seg-path { color:#4a5568; font-size:0.95rem }
.summary p { margin:0.25rem 0 }

</style>
