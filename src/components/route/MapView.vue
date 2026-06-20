<template>
  <section ref="shellRef" class="map-shell">
    <div class="map-stage glass-panel">
      <div ref="mapRef" class="amap-canvas"></div>

      <div class="map-head">
        <div>
          <p class="section-kicker">Gaode Map</p>
          <h2>{{ currentLocation?.areaName || '智能路径规划' }}</h2>
          <p>{{ currentLocation?.regionName || '高德地图承载底图，路线轨迹与 POI 来自后端接口' }}</p>
        </div>
        <div class="map-actions">
          <el-button circle class="map-btn" @click="requestCurrentLocation">定位</el-button>
          <el-button circle class="map-btn" @click="resetView">重置</el-button>
          <el-button circle class="map-btn" @click="toggleFullscreen">全屏</el-button>
        </div>
      </div>

      <div v-if="activePlan?.indoor && activePlan.floors.length" class="floor-overlay">
        <button
          v-for="floor in activePlan.floors"
          :key="String(floor.id)"
          :class="['floor-chip', { active: floor.id === activeFloorId }]"
          @click="$emit('change-floor', floor.id)"
        >
          {{ floor.name }}
        </button>
      </div>

      <div v-if="clickedCoordinate" class="coordinate-overlay">
        <div class="coordinate-title">点击坐标</div>
        <div class="coordinate-value">{{ formatCoordinate(clickedCoordinate.lat, clickedCoordinate.lng) }}</div>
        <div class="coordinate-actions">
          <el-button class="map-btn" size="small" @click="copyCoordinate">复制</el-button>
          <el-button class="map-btn" size="small" @click="clearClickedCoordinate">清除</el-button>
        </div>
      </div>
      <div v-if="loading" class="map-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>正在同步后端路线与高德底图...</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { loadAmapSdk } from '@/services/amap'
import type { CoordinatePoint, PoiSuggestion, RouteLocationContext, RoutePlanOption, WaypointItem } from '@/types/route-planner'

const props = defineProps<{
  currentLocation: RouteLocationContext | null
  destination: PoiSuggestion | null
  waypoints: WaypointItem[]
  activePlan: RoutePlanOption | null
  activeFloorId: string | number | null
  loading: boolean
  selectedCoordinate?: CoordinatePoint | null
}>()

const emit = defineEmits<{
  (event: 'request-current-location'): void
  (event: 'change-floor', floorId: string | number): void
  (event: 'pick-coordinate', point: CoordinatePoint): void
}>()

const mapRef = ref<HTMLElement | null>(null)
const shellRef = ref<HTMLElement | null>(null)
const clickedCoordinate = ref<{ lat: number; lng: number } | null>(null)

let map: any = null
let AMapRef: any = null
let markers: any[] = []
let polylines: any[] = []
let travelerMarker: any = null
let pulseMarkers: any[] = []
let clickMarker: any = null

onMounted(async () => {
  await initMap()
})

onBeforeUnmount(() => {
  clearOverlays()
  if (map) {
    map.off('click', handleMapClick)
    map.destroy()
    map = null
  }
})

watch(
  () => [props.currentLocation, props.destination, props.activePlan, props.activeFloorId],
  async () => {
    await nextTick()
    renderMapData()
  },
  { deep: true }
)

async function initMap() {
  try {
    AMapRef = await loadAmapSdk({
      plugins: ['AMap.ToolBar', 'AMap.Scale', 'AMap.ControlBar', 'AMap.MoveAnimation']
    })

    if (!mapRef.value) return

    map = new AMapRef.Map(mapRef.value, {
      viewMode: '3D',
      zoom: 16,
      pitch: 35,
      mapStyle: 'amap://styles/normal',
      ...(getCenterFromLocation() ? { center: getCenterFromLocation() } : {})
    })

    map.addControl(new AMapRef.ToolBar())
    map.addControl(new AMapRef.Scale())
    if (AMapRef.ControlBar) {
      map.addControl(new AMapRef.ControlBar({ position: { right: '16px', top: '90px' } }))
    }

    map.on('click', handleMapClick)

    renderMapData()
  } catch (error) {
    console.warn('init route planner map failed', error)
  }
}

function requestCurrentLocation() {
  emit('request-current-location')
}

function resetView() {
  renderMapData(true)
}

async function toggleFullscreen() {
  const element = shellRef.value
  if (!element) return
  if (document.fullscreenElement) {
    await document.exitFullscreen()
    return
  }
  await element.requestFullscreen()
}

function getCenterFromLocation() {
  const point = props.currentLocation?.location
  return point && point.lng != null && point.lat != null ? [point.lng, point.lat] : null
}

function clearOverlays() {
  markers.forEach((item) => item.setMap(null))
  polylines.forEach((item) => item.setMap(null))
  pulseMarkers.forEach((item) => item.setMap(null))
  if (travelerMarker) travelerMarker.setMap(null)
  if (clickMarker) clickMarker.setMap(null)
  markers = []
  polylines = []
  pulseMarkers = []
  travelerMarker = null
  clickMarker = null
}

function renderMapData(forceFit = false) {
  if (!map || !AMapRef) return

  clearOverlays()

  const pointsForFit: any[] = []
  const currentPoint = props.currentLocation?.location
  if (currentPoint) {
    const marker = createMarker(currentPoint, '我', '#8fb06e')
    if (marker) {
      markers.push(marker)
      pointsForFit.push([currentPoint.lng, currentPoint.lat])
    }
  }

  if (props.destination?.latitude != null && props.destination?.longitude != null) {
    const marker = createMarker(
      { lat: props.destination.latitude, lng: props.destination.longitude },
      '终',
      '#f59e0b'
    )
    if (marker) {
      markers.push(marker)
      pointsForFit.push([props.destination.longitude, props.destination.latitude])
    }
  }

  props.waypoints.forEach((item, index) => {
    if (item.poi?.latitude == null || item.poi?.longitude == null) return
    const marker = createMarker(
      { lat: item.poi.latitude, lng: item.poi.longitude },
      String(index + 1),
      '#60a5fa'
    )
    if (marker) {
      markers.push(marker)
      pointsForFit.push([item.poi.longitude, item.poi.latitude])
    }
  })

  const activePath = getActivePath()
  const activeSegments = getRenderableSegments()
  if (activeSegments.length) {
    activeSegments.forEach((segment, index) => {
      const renderablePath = toRenderableLngLatPath(segment.path || [])
      if (renderablePath.length < 2) return
      const polyline = new AMapRef.Polyline({
        path: renderablePath,
        strokeColor: getSegmentColor(segment.visualType),
        strokeWeight: segment.visualType === 'walk' ? 7 : 9,
        strokeStyle: segment.visualType === 'stairs' ? 'dashed' : 'solid',
        strokeDasharray: segment.visualType === 'stairs' ? [10, 8] : undefined,
        strokeOpacity: 0.92,
        lineJoin: 'round',
        lineCap: 'round',
        showDir: true,
        zIndex: 20 + index
      })
      polyline.setMap(map)
      polylines.push(polyline)
      renderablePath.forEach((item) => pointsForFit.push(item))
      addSegmentPulse(renderablePath, segment.visualType)
    })
    animateTraveler(activePath)
  } else {
    const renderableActivePath = toRenderableLngLatPath(activePath)
    if (renderableActivePath.length > 1) {
    const polyline = new AMapRef.Polyline({
      path: renderableActivePath,
      strokeColor: '#7dd3fc',
      strokeWeight: 7,
      strokeOpacity: 0.9,
      lineJoin: 'round',
      lineCap: 'round',
      showDir: true
    })
    polyline.setMap(map)
    polylines.push(polyline)
    renderableActivePath.forEach((item) => pointsForFit.push(item))
    animateTraveler(activePath)
    }
  }

  if (props.activePlan?.indoor && props.activePlan.floors.length) {
    addIndoorNodeMarkers()
  }

  if (pointsForFit.length && forceFit) {
    map.setFitView()
    return
  }

  if (pointsForFit.length) {
    map.setFitView()
  } else if (currentPoint) {
    map.setCenter([currentPoint.lng, currentPoint.lat])
  }
}

function animateTraveler(path: CoordinatePoint[]) {
  const renderablePath = toRenderableLngLatPath(path)
  if (renderablePath.length < 2) return
  travelerMarker = new AMapRef.Marker({
    position: renderablePath[0],
    anchor: 'center',
    content: `<div style="width:16px;height:16px;border-radius:50%;background:#fff;border:3px solid #7dd3fc;box-shadow:0 0 0 8px rgba(125,211,252,.18);"></div>`
  })
  travelerMarker.setMap(map)

  if (typeof travelerMarker.moveAlong === 'function') {
    travelerMarker.moveAlong(
      renderablePath,
      {
        duration: Math.max(renderablePath.length * 350, 2200),
        autoRotation: true
      }
    )
  }
}

function getActivePath() {
  const plan = props.activePlan
  if (!plan) return []
  if (!plan.indoor || !props.activeFloorId) return plan.path
  return plan.path.filter((item) => (item.floorId == null || item.floorId === props.activeFloorId) && item.lng != null && item.lat != null)
}

function getRenderableSegments() {
  const plan = props.activePlan
  if (!plan?.segments?.length) return []
  if (!plan.indoor || !props.activeFloorId) return plan.segments.filter((item) => item.path?.length)
  return plan.segments
    .map((segment) => ({
      ...segment,
      path: (segment.path || []).filter((item) => (item.floorId == null || item.floorId === props.activeFloorId) && item.lng != null && item.lat != null)
    }))
    .filter((item) => item.path?.length)
}

function createMarker(point: CoordinatePoint, label: string, color: string) {
  if (point.lng == null || point.lat == null) return null
  const marker = new AMapRef.Marker({
    position: [point.lng, point.lat],
    anchor: 'bottom-center',
    offset: new AMapRef.Pixel(0, -6),
    content: `
      <div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:999px;background:${color};color:#fff;font-weight:700;border:2px solid rgba(255,255,255,.88);box-shadow:0 12px 28px rgba(0,0,0,.22);">
        ${label}
      </div>
    `
  })
  marker.setMap(map)
  return marker
}

function addIndoorNodeMarkers() {
  const floor = props.activePlan?.floors.find((item) => item.id === props.activeFloorId) || props.activePlan?.floors[0]
  if (!floor?.nodes?.length) return

  floor.nodes.forEach((node, index) => {
    const type = String(node.type || '').toLowerCase()
    if (node.lng == null || node.lat == null) return
    const marker = new AMapRef.Marker({
      position: [node.lng, node.lat],
      anchor: 'center',
      zIndex: 40 + index,
      content: buildIndoorMarkerContent(type)
    })
    marker.setMap(map)
    markers.push(marker)
  })
}

function buildIndoorMarkerContent(type: string) {
  const icon = type.includes('elevator') ? 'E' : type.includes('stair') ? 'S' : type.includes('room') ? 'R' : 'N'
  const color = type.includes('elevator')
    ? '#f59e0b'
    : type.includes('stair')
      ? '#ef4444'
      : type.includes('room')
        ? '#10b981'
        : '#60a5fa'

  return `
    <div style="width:24px;height:24px;border-radius:999px;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;border:2px solid rgba(255,255,255,.9);box-shadow:0 10px 24px rgba(0,0,0,.18)">
      ${icon}
    </div>
  `
}

function addSegmentPulse(path: [number, number][], type?: string) {
  const lastPoint = path[path.length - 1]
  if (!lastPoint) return

  const marker = new AMapRef.Marker({
    position: lastPoint,
    anchor: 'center',
    zIndex: 35,
    content: `
      <div style="width:18px;height:18px;border-radius:999px;background:${getSegmentColor(type)};border:3px solid rgba(255,255,255,.9);box-shadow:0 0 0 10px ${getSegmentGlow(type)}"></div>
    `
  })
  marker.setMap(map)
  pulseMarkers.push(marker)
}

function toRenderableLngLatPath(path: CoordinatePoint[]) {
  return path
    .filter((item) => item && item.lng != null && item.lat != null && Number.isFinite(Number(item.lng)) && Number.isFinite(Number(item.lat)))
    .map((item) => [Number(item.lng), Number(item.lat)] as [number, number])
}

function getSegmentColor(type?: string) {
  if (type === 'bike') return '#22c55e'
  if (type === 'shuttle') return '#f59e0b'
  if (type === 'elevator') return '#fb7185'
  if (type === 'stairs') return '#a78bfa'
  return '#38bdf8'
}

function getSegmentGlow(type?: string) {
  if (type === 'bike') return 'rgba(34,197,94,.18)'
  if (type === 'shuttle') return 'rgba(245,158,11,.18)'
  if (type === 'elevator') return 'rgba(251,113,133,.18)'
  if (type === 'stairs') return 'rgba(167,139,250,.18)'
  return 'rgba(56,189,248,.18)'
}

function handleMapClick(event: any) {
  const lng = Number(event?.lnglat?.getLng?.())
  const lat = Number(event?.lnglat?.getLat?.())
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return

  clickedCoordinate.value = { lat, lng }
  emit('pick-coordinate', { lat, lng, x: null, y: null, floorId: null, floorName: '' })

  if (clickMarker) {
    clickMarker.setMap(null)
  }

  clickMarker = new AMapRef.Marker({
    position: [lng, lat],
    anchor: 'bottom-center',
    offset: new AMapRef.Pixel(0, -8),
    content: `
      <div style="display:flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:999px;background:#f97316;border:3px solid rgba(255,255,255,.92);box-shadow:0 0 0 8px rgba(249,115,22,.18), 0 12px 28px rgba(0,0,0,.24);"></div>
    `
  })
  clickMarker.setMap(map)
}

function formatCoordinate(lat: number, lng: number) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

async function copyCoordinate() {
  if (!clickedCoordinate.value) return
  const text = formatCoordinate(clickedCoordinate.value.lat, clickedCoordinate.value.lng)

  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('经纬度已复制')
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

function clearClickedCoordinate() {
  clickedCoordinate.value = null
  if (clickMarker) {
    clickMarker.setMap(null)
    clickMarker = null
  }
}
</script>

<style scoped>
.map-shell,
.map-stage {
  height: 100%;
}

.map-stage {
  position: relative;
  overflow: hidden;
  border-radius: 36px;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 28px 80px rgba(0, 0, 0, 0.26);
  backdrop-filter: blur(22px);
}

.amap-canvas {
  width: 100%;
  height: 100%;
}

.map-head,
.map-actions {
  display: flex;
}

.map-head {
  position: absolute;
  top: 22px;
  left: 22px;
  right: 22px;
  z-index: 10;
  justify-content: space-between;
  gap: 18px;
  pointer-events: none;
}

.map-head > div,
.floor-overlay,
.coordinate-overlay,
.map-loading {
  pointer-events: auto;
}

.section-kicker {
  margin: 0 0 6px;
  font-size: 0.74rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(245, 241, 232, 0.54);
}

.map-head h2 {
  color: #fff7ea;
  font-size: clamp(1.5rem, 2.5vw, 2.2rem);
}

.map-head p {
  margin-top: 8px;
  color: rgba(245, 241, 232, 0.76);
  max-width: 34rem;
  line-height: 1.7;
}

.map-actions {
  gap: 10px;
}

.map-btn {
  --el-button-bg-color: rgba(13, 18, 16, 0.6);
  --el-button-border-color: rgba(255, 255, 255, 0.16);
  --el-button-text-color: #fff;
}

.floor-overlay {
  position: absolute;
  left: 22px;
  bottom: 22px;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.floor-chip {
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(13, 18, 16, 0.58);
  color: #fff;
  cursor: pointer;
}

.floor-chip.active {
  background: rgba(169, 193, 140, 0.2);
  border-color: rgba(169, 193, 140, 0.24);
  color: #e5f6c8;
}

.coordinate-overlay {
  position: absolute;
  right: 22px;
  top: 130px;
  z-index: 10;
  min-width: 220px;
  padding: 14px 16px;
  border-radius: 20px;
  background: rgba(13, 18, 16, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff7ea;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
}

.coordinate-title {
  font-size: 0.76rem;
  color: rgba(245, 241, 232, 0.6);
  letter-spacing: 0.12em;
}

.coordinate-value {
  margin-top: 8px;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.coordinate-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.map-loading {
  position: absolute;
  right: 22px;
  bottom: 22px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 999px;
  background: rgba(13, 18, 16, 0.62);
  color: #fff7ea;
}

@media (max-width: 1024px) {
  .map-shell {
    min-height: 560px;
  }
}

@media (max-width: 768px) {
  .map-head {
    flex-direction: column;
  }

  .map-actions {
    justify-content: flex-start;
  }

  .coordinate-overlay {
    left: 22px;
    right: 22px;
    top: auto;
    bottom: 88px;
    min-width: 0;
  }
}
</style>
