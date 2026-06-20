<template>
  <div class="route-planner-page">
    <header class="topbar glass-strip">
      <div class="topbar-main">
        <el-button class="back-btn" circle @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <div>
          <p class="section-kicker">Smart Navigation</p>
          <h1>智能路径规划</h1>
          <p class="topbar-subtitle">{{ currentLocation?.areaName || '等待识别当前位置' }}</p>
        </div>
      </div>

      <div class="topbar-side">
        <div class="area-badge">
          <span>当前区域</span>
          <strong>{{ currentLocation?.regionName || currentLocation?.areaName || '未识别' }}</strong>
        </div>
        <el-avatar :size="44" :src="currentLocation?.avatar || undefined">
          {{ avatarFallback }}
        </el-avatar>
      </div>
    </header>

    <main class="planner-layout">
      <RoutePanel
        :current-location="currentLocation"
        :destination="destination"
        :waypoints="waypoints"
        :strategy="strategy"
        :transport-mode="transportMode"
        :transport-mixed="transportMixed"
        :route-provider="routeProvider"
        :transport-options="transportOptions"
        :view-mode="viewMode"
        :planning-error="planningError"
        :loading="loading"
        :loading-location="loadingLocation"
        :manual-latitude="manualLatitude"
        :manual-longitude="manualLongitude"
        :indoor-request="indoorRequest"
        :search-destination="queryDestination"
        :search-waypoint="queryWaypoint"
        @refresh-location="refreshCurrentLocation"
        @update:manual-latitude="handleManualLatitudeChange"
        @update:manual-longitude="handleManualLongitudeChange"
        @apply-manual-coordinate="handleApplyManualCoordinate"
        @update:destination="setDestination"
        @add-waypoint="addWaypoint"
        @remove-waypoint="removeWaypoint"
        @reorder-waypoints="reorderWaypoints"
        @update-waypoint-keyword="updateWaypointKeyword"
        @update-waypoint-poi="setWaypointPoi"
        @update:strategy="setStrategy"
        @update:transport-mode="setTransportMode"
        @update:transport-mixed="setTransportMixed"
        @update:route-provider="handleRouteProviderChange"
        @update:indoor-request="updateIndoorRequest"
        @toggle-view="handleToggleView"
        @plan="handlePlanRoutes"
      />

      <MapView
        :current-location="currentLocation"
        :destination="destination"
        :waypoints="waypoints"
        :active-plan="activePlan"
        :active-floor-id="activeFloorId"
        :loading="loading"
        @request-current-location="refreshCurrentLocation"
        @change-floor="setActiveFloor"
        @pick-coordinate="handlePickCoordinate"
      />

      <RouteResult
        :plans="plans"
        :active-plan="activePlan"
        :active-plan-id="activePlanId"
        :active-floor-id="activeFloorId"
        :indoor-request="indoorRequest"
        :view-mode="viewMode"
        :loading="loading"
        @change-plan="setActivePlan"
        @change-floor="setActiveFloor"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MapView from './MapView.vue'
import RoutePanel from './RoutePanel.vue'
import RouteResult from './RouteResult.vue'
import { useRoutePlannerStore } from '@/stores/routePlanner'
import type { PoiSuggestion, RouteProvider } from '@/types/route-planner'

const router = useRouter()
const route = useRoute()
const plannerStore = useRoutePlannerStore()

const {
  activeFloorId,
  activePlan,
  activePlanId,
  currentLocation,
  destination,
  indoorRequest,
  loading,
  loadingLocation,
  planningError,
  plans,
  routeProvider,
  searchKeyword,
  selectedCoordinate,
  strategy,
  transportMixed,
  transportMode,
  transportOptions,
  waypoints
} = storeToRefs(plannerStore)

const {
  addWaypoint,
  applySelectedCoordinate,
  initialize,
  planRoutes,
  queryDestination,
  queryWaypoint,
  refreshCurrentLocation,
  removeWaypoint,
  reorderWaypoints,
  setActiveFloor,
  setActivePlan,
  setDestination,
  setRouteProvider,
  setSelectedCoordinate,
  setStrategy,
  setTransportMixed,
  setTransportMode,
  setWaypointPoi,
  updateIndoorRequest,
  updateWaypointKeyword
} = plannerStore

const avatarFallback = computed(() => (currentLocation.value?.areaName || 'R').slice(0, 1))
const viewMode = ref<'outdoor' | 'indoor'>('outdoor')
const manualLatitude = ref('')
const manualLongitude = ref('')
const destinationKeyword = ref('')

onMounted(async () => {
  await initialize()
  await hydrateQueryDestination()
})

watch(selectedCoordinate, (value) => {
  manualLatitude.value = value?.lat != null ? String(value.lat) : ''
  manualLongitude.value = value?.lng != null ? String(value.lng) : ''
}, { immediate: true })

watch(destination, (value) => {
  destinationKeyword.value = value?.name || ''
}, { immediate: true })

watch(activePlan, (value) => {
  if (value?.indoor) {
    viewMode.value = 'indoor'
  }
})

async function hydrateQueryDestination() {
  const poi = String(route.query.poi || '').trim()
  if (!poi) return
  const list = await queryDestination(poi)
  const matched = list.find((item) => item.name === poi) || list[0] || null
  if (matched) {
    setDestination(matched)
  }
}

function handlePickCoordinate(point: { lat: number | null; lng: number | null }) {
  setSelectedCoordinate({
    lat: point.lat,
    lng: point.lng,
    x: null,
    y: null,
    floorId: null,
    floorName: ''
  })
}

function handleManualLatitudeChange(value: string) {
  manualLatitude.value = value
}

function handleManualLongitudeChange(value: string) {
  manualLongitude.value = value
}

function handleApplyManualCoordinate() {
  const lat = Number(manualLatitude.value)
  const lng = Number(manualLongitude.value)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    ElMessage.warning('请输入合法的起点经纬度')
    return
  }

  setSelectedCoordinate({
    lat,
    lng,
    x: null,
    y: null,
    floorId: null,
    floorName: ''
  })
  applySelectedCoordinate()
  ElMessage.success('手动起点坐标已应用')
}

function handleToggleView(mode: 'outdoor' | 'indoor') {
  viewMode.value = mode
}

function handleRouteProviderChange(value: RouteProvider) {
  setRouteProvider(value)
  setDestination(null)
}

async function handlePlanRoutes() {
  if (viewMode.value !== 'indoor') {
    const resolvedWaypoints = await resolveWaypointsForPlanning()
    if (!resolvedWaypoints) return

    const keyword = String(searchKeyword.value || destinationKeyword.value || '').trim()
    const resolvedDestination = await resolveDestinationForPlanning(keyword, resolvedWaypoints.length > 0)

    setDestination(resolvedDestination)
    resolvedWaypoints.forEach(({ id, poi }) => {
      setWaypointPoi(id, poi)
    })

    if (!resolvedDestination && !resolvedWaypoints.length) {
      ElMessage.warning('请输入目的地，或至少添加一个多目标点')
      return
    }
  }

  planRoutes({
    preferIndoor: viewMode.value === 'indoor'
  })
}

async function resolveDestinationForPlanning(keyword: string, allowEmpty: boolean) {
  if (!keyword) {
    if (allowEmpty) {
      return null
    }
    ElMessage.warning('请输入目的地')
    return null
  }

  const list = await queryDestination(keyword)
  const normalizedKeyword = normalizeKeyword(keyword)
  const exactBackendPoiMatch = list.find((item) => item.source === 'backend-poi' && normalizeKeyword(item.name) === normalizedKeyword)
  const exactMatch = exactBackendPoiMatch || list.find((item) => normalizeKeyword(item.name) === normalizedKeyword)

  if (routeProvider.value === 'backend') {
    const backendMatch = exactBackendPoiMatch || exactMatch
    if (!backendMatch) {
      ElMessage.warning('后端接口模式下，请从下拉结果中选择正确的 POI 目的地')
      return null
    }

    if (backendMatch.source === 'backend-poi' && !backendMatch.destinationId) {
      ElMessage.warning('当前 POI 缺少 destinationId，无法调用后端路径规划')
      return null
    }

    return backendMatch
  }

  if (
    destination.value
    && normalizeKeyword(destination.value.name) === normalizedKeyword
    && destination.value.latitude != null
    && destination.value.longitude != null
  ) {
    return destination.value
  }

  return exactMatch || list[0] || null
}

async function resolveWaypointsForPlanning() {
  const resolved: Array<{ id: string; poi: PoiSuggestion }> = []

  for (const waypoint of waypoints.value) {
    const keyword = String(waypoint.keyword || '').trim()
    if (!keyword) continue

    const normalizedKeyword = normalizeKeyword(keyword)
    const currentPoi = waypoint.poi
    const currentValid = currentPoi
      && normalizeKeyword(currentPoi.name) === normalizedKeyword
      && (routeProvider.value === 'backend'
        ? currentPoi.source === 'backend-poi'
        : currentPoi.latitude != null && currentPoi.longitude != null)

    if (currentValid) {
      resolved.push({ id: waypoint.id, poi: currentPoi })
      continue
    }

    const list = await queryWaypoint(waypoint.id, keyword)
    const exactBackendPoiMatch = list.find((item) => item.source === 'backend-poi' && normalizeKeyword(item.name) === normalizedKeyword)
    const exactMatch = exactBackendPoiMatch || list.find((item) => normalizeKeyword(item.name) === normalizedKeyword)
    const nextPoi = routeProvider.value === 'backend'
      ? (exactBackendPoiMatch || exactMatch || null)
      : (exactMatch || list[0] || null)

    if (!nextPoi) {
      ElMessage.warning(routeProvider.value === 'backend'
        ? '后端接口模式下，途经点需要从下拉结果中选择 POI'
        : ('无法识别途经点：' + keyword))
      return null
    }

    if (routeProvider.value === 'backend' && !nextPoi.destinationId) {
      ElMessage.warning('途经点 ' + keyword + ' 缺少 destinationId，无法调用后端路径规划')
      return null
    }

    resolved.push({ id: waypoint.id, poi: nextPoi })
  }

  return resolved
}

function normalizeKeyword(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}
</script>

<style scoped>
.route-planner-page {
  min-height: 100vh;
  padding: 88px 20px 20px;
  background:
    radial-gradient(circle at 8% 12%, rgba(56, 94, 69, 0.38), transparent 24%),
    radial-gradient(circle at 88% 8%, rgba(200, 169, 107, 0.18), transparent 20%),
    radial-gradient(circle at 50% 100%, rgba(61, 79, 94, 0.16), transparent 24%),
    linear-gradient(180deg, #0b0c0b 0%, #101411 48%, #141816 100%);
  color: #f5f1e8;
}

.glass-strip {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 18px 44px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(22px);
}

.topbar,
.topbar-main,
.topbar-side {
  display: flex;
}

.topbar {
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 22px;
  border-radius: 30px;
  margin-bottom: 20px;
}

.topbar-main {
  align-items: center;
  gap: 16px;
}

.section-kicker {
  margin: 0 0 6px;
  font-size: 0.74rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(245, 241, 232, 0.54);
}

.topbar h1 {
  font-size: clamp(2rem, 3vw, 3rem);
  line-height: 1;
  color: #fff7ea;
}

.topbar-subtitle {
  margin-top: 8px;
  color: rgba(245, 241, 232, 0.72);
}

.topbar-side {
  align-items: center;
  gap: 14px;
}

.area-badge {
  padding: 10px 14px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.05);
}

.area-badge span {
  display: block;
  font-size: 0.76rem;
  color: rgba(245, 241, 232, 0.52);
}

.area-badge strong {
  display: block;
  margin-top: 4px;
  color: #fff;
}

.back-btn {
  --el-button-bg-color: rgba(255, 255, 255, 0.06);
  --el-button-border-color: rgba(255, 255, 255, 0.12);
  --el-button-text-color: #fff;
}

.planner-layout {
  display: grid;
  grid-template-columns: minmax(300px, 25%) minmax(0, 50%) minmax(300px, 25%);
  gap: 20px;
  height: calc(100vh - 148px);
}

@media (max-width: 1200px) {
  .planner-layout {
    grid-template-columns: minmax(280px, 30%) minmax(0, 40%) minmax(280px, 30%);
  }
}

@media (max-width: 980px) {
  .planner-layout {
    grid-template-columns: 1fr;
    height: auto;
  }
}

@media (max-width: 768px) {
  .route-planner-page {
    padding: 78px 12px 18px;
  }

  .topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .topbar-side {
    justify-content: space-between;
  }
}
</style>
