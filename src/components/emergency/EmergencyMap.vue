<template>
  <section ref="shellRef" class="map-shell glass-card">
    <div ref="mapRef" class="map-canvas"></div>

    <div class="map-overlay top-overlay">
      <RouteLayer :routes="routes" :active-route-id="activeRouteId" @change-route="$emit('change-route', $event)" />
    </div>

    <div class="map-overlay bottom-overlay">
      <DangerZoneLayer :zones="dangerZones.slice(0, 3)" />
    </div>

    <div v-if="clickedCoordinate" class="coordinate-overlay">
      <div class="coordinate-title">Selected Start</div>
      <div class="coordinate-value">{{ formatCoordinate(clickedCoordinate.lat, clickedCoordinate.lng) }}</div>
      <div class="coordinate-tip">Clicking the map updates `currentLat/currentLng` for evacuation planning.</div>
    </div>

    <MapControls @relocate="$emit('relocate')" @refresh="$emit('refresh')" @toggle-fullscreen="toggleFullscreen" />
  </section>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import DangerZoneLayer from './DangerZoneLayer.vue'
import MapControls from './MapControls.vue'
import RouteLayer from './RouteLayer.vue'
import { loadAmapSdk } from '@/services/amap'
import type { DangerZoneItem, DisasterType, EmergencyDestinationItem, EmergencyLocation, EmergencyRouteItem, ShelterItem } from '@/types/emergency'

const props = defineProps<{
  currentLocation: EmergencyLocation | null
  destination: EmergencyDestinationItem | null
  shelters: ShelterItem[]
  dangerZones: DangerZoneItem[]
  routes: EmergencyRouteItem[]
  activeRouteId: string
  disasterType: DisasterType
  layerVisibility: {
    shelters: boolean
    dangerZones: boolean
    safeRoutes: boolean
    userLocation: boolean
    medicalPoints: boolean
    supplyPoints: boolean
  }
}>()

const emit = defineEmits<{
  (event: 'change-route', routeId: string): void
  (event: 'relocate'): void
  (event: 'refresh'): void
  (event: 'select-shelter', item: ShelterItem): void
  (event: 'pick-coordinate', location: EmergencyLocation): void
}>()

const mapRef = ref<HTMLElement | null>(null)
const shellRef = ref<HTMLElement | null>(null)
const clickedCoordinate = ref<EmergencyLocation | null>(null)

let map: any = null
let AMapRef: any = null
let shelterMarkers: any[] = []
let zonePolygons: any[] = []
let routePolylines: any[] = []
let riskPolylines: any[] = []
let userMarker: any = null
let selectedStartMarker: any = null
let routeMover: any = null

onMounted(async () => {
  await initMap()
})

onBeforeUnmount(() => {
  if (map) {
    map.off('click', handleMapClick)
    clearMap()
    map.destroy()
  }
})

watch(
  () => props.destination?.id,
  async () => {
    await nextTick()
    focusDestination()
  }
)

watch(
  () => [props.currentLocation, props.destination, props.shelters, props.dangerZones, props.routes, props.activeRouteId, props.layerVisibility, props.disasterType],
  async () => {
    await nextTick()
    renderMap()
  },
  { deep: true }
)

async function initMap() {
  AMapRef = await loadAmapSdk({
    plugins: ['AMap.ToolBar', 'AMap.Scale', 'AMap.ControlBar', 'AMap.MoveAnimation']
  })

  if (!mapRef.value) return

  map = new AMapRef.Map(mapRef.value, {
    zoom: 13,
    pitch: 35,
    viewMode: '3D',
    mapStyle: 'amap://styles/normal',
    ...(getPreferredCenter() ? { center: getPreferredCenter() } : {})
  })

  map.addControl(new AMapRef.ToolBar())
  map.addControl(new AMapRef.Scale())
  if (AMapRef.ControlBar) {
    map.addControl(new AMapRef.ControlBar({ position: { right: '14px', top: '120px' } }))
  }
  map.on('click', handleMapClick)
  renderMap()
}

function clearMap() {
  shelterMarkers.forEach((item) => item.setMap(null))
  zonePolygons.forEach((item) => item.setMap(null))
  routePolylines.forEach((item) => item.setMap(null))
  riskPolylines.forEach((item) => item.setMap(null))
  if (userMarker) userMarker.setMap(null)
  if (selectedStartMarker) selectedStartMarker.setMap(null)
  if (routeMover) routeMover.setMap(null)
  shelterMarkers = []
  zonePolygons = []
  routePolylines = []
  riskPolylines = []
  userMarker = null
  selectedStartMarker = null
  routeMover = null
}

function renderMap() {
  if (!map || !AMapRef) return
  clearMap()

  const fitPoints: [number, number][] = []

  if (props.layerVisibility.userLocation && props.currentLocation) {
    userMarker = new AMapRef.Marker({
      position: [props.currentLocation.lng, props.currentLocation.lat],
      anchor: 'center',
      content: '<div style="width:18px;height:18px;border-radius:50%;background:#f97316;border:4px solid rgba(255,255,255,.92);box-shadow:0 0 0 10px rgba(249,115,22,.18);"></div>'
    })
    userMarker.setMap(map)
    fitPoints.push([props.currentLocation.lng, props.currentLocation.lat])
  }

  if (clickedCoordinate.value && !isSameLocation(clickedCoordinate.value, props.currentLocation)) {
    selectedStartMarker = new AMapRef.Marker({
      position: [clickedCoordinate.value.lng, clickedCoordinate.value.lat],
      anchor: 'bottom-center',
      offset: new AMapRef.Pixel(0, -8),
      content: '<div style="display:flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#f97316;border:3px solid rgba(255,255,255,.92);box-shadow:0 0 0 8px rgba(249,115,22,.18),0 12px 28px rgba(0,0,0,.24);"></div>'
    })
    selectedStartMarker.setMap(map)
  }

  if (hasDestinationCoordinate()) {
    fitPoints.push([Number(props.destination!.longitude), Number(props.destination!.latitude)])
  }

  if (props.layerVisibility.shelters) {
    props.shelters.forEach((item) => {
      const marker = new AMapRef.Marker({
        position: [item.lng, item.lat],
        anchor: 'bottom-center',
        content: `<div style="padding:8px 10px;border-radius:18px;background:#fffaf3;border:1px solid #e7dccb;color:#4d4135;font-weight:700;box-shadow:0 12px 24px rgba(108,90,67,.14);">${getMarkerEmoji(item.type)}</div>`
      })
      marker.on('click', () => emit('select-shelter', item))
      marker.setMap(map)
      shelterMarkers.push(marker)
      fitPoints.push([item.lng, item.lat])
    })
  }

  if (props.layerVisibility.dangerZones) {
    props.dangerZones.forEach((item) => {
      const polygon = new AMapRef.Polygon({
        path: item.polygon.map(([lng, lat]) => [lng, lat]),
        fillColor: getZoneFill(item.riskLevel),
        fillOpacity: 0.7,
        strokeColor: getZoneStroke(item.riskLevel),
        strokeWeight: 2
      })
      polygon.setMap(map)
      zonePolygons.push(polygon)
      item.polygon.forEach(([lng, lat]) => fitPoints.push([lng, lat]))
    })
  }

  if (props.layerVisibility.safeRoutes) {
    props.routes.forEach((item, index) => {
      const active = item.id === props.activeRouteId
      const path = item.coordinates.map((point) => [point.lng, point.lat])
      const polyline = new AMapRef.Polyline({
        path,
        strokeColor: active ? '#16a34a' : '#9ca3af',
        strokeWeight: active ? 8 : 5,
        strokeOpacity: active ? 0.95 : 0.65,
        showDir: true,
        lineCap: 'round',
        lineJoin: 'round',
        zIndex: active ? 20 : 10
      })
      polyline.setMap(map)
      routePolylines.push(polyline)

      if (active) {
        renderRiskOverlay(item)
        animateRoute(item)
      }

      item.coordinates.forEach((point) => fitPoints.push([point.lng, point.lat]))
      if (!active && index === 1) {
        polyline.setOptions({ strokeColor: '#2563eb' })
      }
    })
  }

  if (fitPoints.length) {
    map.setFitView()
    if (hasDestinationCoordinate()) {
      window.setTimeout(() => {
        focusDestination()
      }, 120)
    }
  } else {
    const center = getPreferredCenter()
    if (center) {
      map.setCenter(center)
      map.setZoom(15)
    }
  }
}

function focusDestination() {
  if (!map || !hasDestinationCoordinate()) return
  map.setCenter([Number(props.destination!.longitude), Number(props.destination!.latitude)])
  map.setZoom(15)
}

function renderRiskOverlay(route: EmergencyRouteItem) {
  const segments = route.riskSegments?.length
    ? route.riskSegments
    : route.coordinates.slice(0, -1).map((point, index) => ({
        id: `fallback-segment-${index + 1}`,
        from: point,
        to: route.coordinates[index + 1],
        weight: route.riskScore == null ? null : route.riskScore / 100
      }))

  segments.forEach((segment) => {
    const weight = normalizeWeight(segment.weight, route.riskScore)
    const polyline = new AMapRef.Polyline({
      path: [
        [segment.from.lng, segment.from.lat],
        [segment.to.lng, segment.to.lat]
      ],
      strokeColor: getRiskOverlayColor(props.disasterType, weight),
      strokeWeight: 4 + weight * 3,
      strokeOpacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
      zIndex: 25
    })
    polyline.setMap(map)
    riskPolylines.push(polyline)
  })
}

function normalizeWeight(value?: number | null, fallbackRiskScore?: number | null) {
  const numeric = Number(value)
  if (Number.isFinite(numeric)) {
    if (numeric > 1) return Math.max(0, Math.min(numeric / 100, 1))
    return Math.max(0, Math.min(numeric, 1))
  }
  if (fallbackRiskScore == null || !Number.isFinite(fallbackRiskScore)) return 0.35
  return Math.max(0.15, Math.min(fallbackRiskScore / 100, 1))
}

function animateRoute(route: EmergencyRouteItem) {
  if (!route.coordinates.length) return
  routeMover = new AMapRef.Marker({
    position: [route.coordinates[0].lng, route.coordinates[0].lat],
    anchor: 'center',
    content: '<div style="width:16px;height:16px;border-radius:50%;background:#fff;border:3px solid #16a34a;box-shadow:0 0 0 8px rgba(22,163,74,.14);"></div>'
  })
  routeMover.setMap(map)
  if (typeof routeMover.moveAlong === 'function') {
    routeMover.moveAlong(route.coordinates.map((point) => [point.lng, point.lat]), {
      duration: Math.max(route.coordinates.length * 250, 3000),
      autoRotation: true
    })
  }
}

function handleMapClick(event: any) {
  const lng = Number(event?.lnglat?.getLng?.())
  const lat = Number(event?.lnglat?.getLat?.())
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return

  clickedCoordinate.value = { lng, lat }
  emit('pick-coordinate', { lng, lat })
}

function hasDestinationCoordinate() {
  return Number.isFinite(Number(props.destination?.latitude)) && Number.isFinite(Number(props.destination?.longitude))
}

function getPreferredCenter() {
  if (hasDestinationCoordinate()) {
    return [Number(props.destination!.longitude), Number(props.destination!.latitude)]
  }
  if (props.currentLocation) {
    return [props.currentLocation.lng, props.currentLocation.lat]
  }
  return null
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

function getMarkerEmoji(type: string) {
  const text = String(type || '').toLowerCase()
  if (text.includes('medical')) return 'M'
  if (text.includes('supply')) return 'S'
  if (text.includes('temporary')) return 'T'
  return 'E'
}

function getZoneFill(level: string) {
  const text = String(level || '').toLowerCase()
  if (text.includes('high')) return 'rgba(220,38,38,0.35)'
  if (text.includes('medium')) return 'rgba(245,158,11,0.35)'
  return 'rgba(59,130,246,0.2)'
}

function getZoneStroke(level: string) {
  const text = String(level || '').toLowerCase()
  if (text.includes('high')) return '#dc2626'
  if (text.includes('medium')) return '#f59e0b'
  return '#3b82f6'
}

function getRiskOverlayColor(disasterType: DisasterType, weight: number) {
  if (disasterType === 'EARTHQUAKE') {
    return interpolateColor('#b08968', '#5c3d2e', weight)
  }
  if (disasterType === 'FLOOD_HIGH') {
    return interpolateColor('#7dd3fc', '#1d4ed8', weight)
  }
  if (disasterType === 'FIRE') {
    return interpolateColor('#fdba74', '#dc2626', weight)
  }
  return interpolateColor('#a3a3a3', '#374151', weight)
}

function interpolateColor(start: string, end: string, ratio: number) {
  const clamped = Math.max(0, Math.min(ratio, 1))
  const startRgb = hexToRgb(start)
  const endRgb = hexToRgb(end)
  const r = Math.round(startRgb.r + (endRgb.r - startRgb.r) * clamped)
  const g = Math.round(startRgb.g + (endRgb.g - startRgb.g) * clamped)
  const b = Math.round(startRgb.b + (endRgb.b - startRgb.b) * clamped)
  return `rgb(${r}, ${g}, ${b})`
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '')
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  }
}

function formatCoordinate(lat: number, lng: number) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

function isSameLocation(a: EmergencyLocation | null, b: EmergencyLocation | null) {
  if (!a || !b) return false
  return Math.abs(a.lat - b.lat) < 0.000001 && Math.abs(a.lng - b.lng) < 0.000001
}
</script>

<style scoped>
.glass-card {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(212, 205, 192, 0.7);
  box-shadow: 0 18px 48px rgba(123, 103, 74, 0.1);
  backdrop-filter: blur(18px);
}

.map-shell {
  height: 100%;
  border-radius: 34px;
}

.map-canvas {
  width: 100%;
  height: 100%;
}

.map-overlay {
  position: absolute;
  left: 18px;
  right: 18px;
  z-index: 10;
}

.top-overlay {
  top: 18px;
}

.bottom-overlay {
  left: 18px;
  right: auto;
  bottom: 18px;
  width: min(320px, calc(100% - 36px));
}

.coordinate-overlay {
  position: absolute;
  right: 18px;
  bottom: 18px;
  z-index: 12;
  width: min(280px, calc(100% - 36px));
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.82);
  color: #e5eefb;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.24);
}

.coordinate-title {
  font-size: 0.76rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(229, 238, 251, 0.62);
}

.coordinate-value {
  margin-top: 8px;
  font-size: 0.98rem;
  font-weight: 700;
}

.coordinate-tip {
  margin-top: 8px;
  font-size: 0.82rem;
  line-height: 1.5;
  color: rgba(229, 238, 251, 0.74);
}
</style>
