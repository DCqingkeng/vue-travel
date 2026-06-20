import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  arriveEmergencyShelter,
  buildEmergencyInfo,
  getBrowserEmergencyLocation,
  getEvacuationPlans,
  getHotEmergencyDestinations,
  normalizeShelter,
  searchEmergencyDestinations
} from '@/services/emergency'
import type {
  DangerRoadItem,
  DangerZoneItem,
  DisasterType,
  EmergencyAlertItem,
  EmergencyDestinationItem,
  EmergencyInfo,
  EmergencyLocation,
  EmergencyMode,
  EmergencyRouteItem,
  EmergencyShelterType,
  EmergencyStrategy,
  LayerVisibility,
  ShelterItem
} from '@/types/emergency'

const FIXED_DESTINATIONS: EmergencyDestinationItem[] = [
  { id: 170, name: '北京航空航天大学', type: '校区', address: '学院路37号', latitude: 39.9819, longitude: 116.3480 },
  { id: 201, name: '上海交通大学闵行校区', type: '校区', address: '东川路800号', latitude: 31.025393, longitude: 121.436348 },
  { id: 202, name: '南京大学仙林校区', type: '校区', address: '仙林大道163号', latitude: 32.115, longitude: 118.955 }
]

const ALLOWED_DESTINATION_IDS = new Set(FIXED_DESTINATIONS.map((item) => Number(item.id)))

function nowText() {
  return new Date().toLocaleString('zh-CN', {
    hour12: false
  })
}

function createEmptyArrays() {
  return {
    alerts: [] as EmergencyAlertItem[],
    dangerZones: [] as DangerZoneItem[],
    dangerRoads: [] as DangerRoadItem[]
  }
}

function uniqueSheltersFromRoutes(routes: EmergencyRouteItem[], previousShelters: ShelterItem[]) {
  const previousMap = new Map(previousShelters.map((item) => [String(item.id), item]))
  return routes.map((route) => {
    const raw = (route.raw || {}) as any
    const old = previousMap.get(route.id)
    const lastPoint = route.coordinates[route.coordinates.length - 1]
    return {
      id: route.id,
      name: route.name.replace(/ 疏散方案$/, ''),
      type: 'shelter',
      lat: Number(raw.shelterLat ?? lastPoint?.lat ?? old?.lat ?? 0),
      lng: Number(raw.shelterLng ?? lastPoint?.lng ?? old?.lng ?? 0),
      capacity: Number.isFinite(Number(raw.capacityLeft)) ? Number(raw.capacityLeft) : null,
      occupancy: old?.occupancy ?? null,
      address: raw.address || raw.shelterAddress || old?.address || '',
      distance: route.distance ?? null,
      status: '推荐前往',
      services: ['临时安置', '路线指引', '基础补给']
    } satisfies ShelterItem
  })
}

export const useEmergencyStore = defineStore('emergency', () => {
  const mode = ref<EmergencyMode>('emergency')
  const disasterType = ref<DisasterType>('EARTHQUAKE')
  const strategy = ref<EmergencyStrategy>('SAFEST')
  const intensity = ref(defaultIntensityByType('EARTHQUAKE'))
  const selectedShelterType = ref<EmergencyShelterType | 'all'>('all')
  const currentLocation = ref<EmergencyLocation | null>(null)
  const emergencyInfo = ref<EmergencyInfo | null>(buildEmergencyInfo('EARTHQUAKE'))
  const alerts = ref<EmergencyAlertItem[]>([])
  const shelters = ref<ShelterItem[]>([])
  const nearestShelter = ref<ShelterItem | null>(null)
  const selectedShelter = ref<ShelterItem | null>(null)
  const dangerZones = ref<DangerZoneItem[]>([])
  const routes = ref<EmergencyRouteItem[]>([])
  const activeRouteId = ref('')
  const dangerRoads = ref<DangerRoadItem[]>([])
  const loading = ref(false)
  const loadingLocation = ref(false)
  const errorMessage = ref('')
  const lastUpdatedAt = ref(nowText())
  const networkStatus = ref<'ok' | 'error' | 'upgrading'>('ok')
  const refreshTimer = ref<number | null>(null)
  const destinations = ref<EmergencyDestinationItem[]>([...FIXED_DESTINATIONS])
  const destinationKeyword = ref('')
  const activeDestination = ref<EmergencyDestinationItem | null>(restoreDestination())
  const manualStartLocation = ref<EmergencyLocation | null>(null)

  const layerVisibility = ref<LayerVisibility>({
    shelters: true,
    dangerZones: true,
    safeRoutes: true,
    userLocation: true,
    medicalPoints: true,
    supplyPoints: true
  })

  const activeRoute = computed(() => routes.value.find((item) => item.id === activeRouteId.value) || routes.value[0] || null)
  const filteredShelters = computed(() => {
    if (selectedShelterType.value === 'all') return shelters.value
    if (selectedShelterType.value === 'medical') {
      return shelters.value.filter((item) => String(item.type).toLowerCase().includes('medical'))
    }
    if (selectedShelterType.value === 'supply') {
      return shelters.value.filter((item) => String(item.type).toLowerCase().includes('supply'))
    }
    if (selectedShelterType.value === 'temporary') {
      return shelters.value.filter((item) => String(item.type).toLowerCase().includes('temporary'))
    }
    return shelters.value.filter((item) => String(item.type).toLowerCase().includes('shelter'))
  })

  async function initialize() {
    await refreshLocation()
    await loadDestinations()
    emergencyInfo.value = buildEmergencyInfo(disasterType.value, activeDestination.value?.name, routes.value.length)
  }

  async function refreshLocation() {
    loadingLocation.value = true
    try {
      currentLocation.value = await getBrowserEmergencyLocation()
      manualStartLocation.value = null
      networkStatus.value = 'ok'
    } catch (error: any) {
      errorMessage.value = error?.message || '定位失败'
      networkStatus.value = 'error'
    } finally {
      loadingLocation.value = false
    }
  }

  async function loadDestinations(keyword = destinationKeyword.value) {
    destinationKeyword.value = keyword
    try {
      const backendList = keyword.trim()
        ? await searchEmergencyDestinations(keyword.trim(), 10)
        : await getHotEmergencyDestinations(8)

      const backendMap = new Map(backendList.map((item) => [Number(item.id), item]))
      destinations.value = FIXED_DESTINATIONS.map((item) => backendMap.get(Number(item.id)) || item)
    } catch (error: any) {
      destinations.value = [...FIXED_DESTINATIONS]
      errorMessage.value = error?.message || '区域列表加载失败'
    }
  }

  async function fetchAll() {
    emergencyInfo.value = buildEmergencyInfo(disasterType.value, activeDestination.value?.name, routes.value.length)
    if (!currentLocation.value) {
      errorMessage.value = '请先完成定位'
      networkStatus.value = 'error'
      return
    }

    if (!activeDestination.value?.id) {
      clearEmergencyData()
      errorMessage.value = '请先选择景区或校区'
      networkStatus.value = 'ok'
      emergencyInfo.value = buildEmergencyInfo(disasterType.value)
      return
    }

    loading.value = true
    errorMessage.value = ''
    networkStatus.value = 'upgrading'

    try {
      const routeList = await getEvacuationPlans({
        destinationId: activeDestination.value.id,
        disasterType: disasterType.value,
        strategy: strategy.value,
        intensity: intensity.value,
        lat: (manualStartLocation.value || currentLocation.value).lat,
        lng: (manualStartLocation.value || currentLocation.value).lng
      })

      routes.value = routeList
      shelters.value = uniqueSheltersFromRoutes(routeList, shelters.value)
      nearestShelter.value = shelters.value[0] || null
      activeRouteId.value = routeList[0]?.id || ''
      selectedShelter.value = shelters.value.find((item) => String(item.id) === activeRouteId.value) || shelters.value[0] || null

      const empty = createEmptyArrays()
      alerts.value = empty.alerts
      dangerZones.value = empty.dangerZones
      dangerRoads.value = empty.dangerRoads
      emergencyInfo.value = buildEmergencyInfo(disasterType.value, activeDestination.value.name, routeList.length)
      lastUpdatedAt.value = nowText()
      networkStatus.value = 'ok'
      startPolling()
    } catch (error: any) {
      clearEmergencyData()
      errorMessage.value = (error?.status === 401 || error?.code === 401 || String(error?.message || '').includes('未登录'))
        ? '灾情疏散接口需要先登录，当前登录态已失效或不存在。'
        : (error?.message || '应急数据加载失败')
      networkStatus.value = 'error'
      emergencyInfo.value = buildEmergencyInfo(disasterType.value, activeDestination.value?.name)
    } finally {
      loading.value = false
    }
  }

  async function refreshRoutes() {
    await fetchAll()
  }

  function setMode(value: EmergencyMode) {
    mode.value = value
    emergencyInfo.value = buildEmergencyInfo(disasterType.value, activeDestination.value?.name, routes.value.length)
  }

  function setDisasterType(value: DisasterType) {
    stopPolling()
    disasterType.value = value
    intensity.value = defaultIntensityByType(value)
    clearEmergencyData()
    networkStatus.value = 'ok'
    emergencyInfo.value = buildEmergencyInfo(value, activeDestination.value?.name, 0)
  }

  function setStrategy(value: EmergencyStrategy) {
    stopPolling()
    strategy.value = value
    clearEmergencyData()
    networkStatus.value = 'ok'
    emergencyInfo.value = buildEmergencyInfo(disasterType.value, activeDestination.value?.name, 0)
  }

  function setIntensity(value: number) {
    stopPolling()
    intensity.value = clampIntensity(value)
    clearEmergencyData()
    networkStatus.value = 'ok'
    emergencyInfo.value = buildEmergencyInfo(disasterType.value, activeDestination.value?.name, 0)
  }

  function setShelterType(value: EmergencyShelterType | 'all') {
    selectedShelterType.value = value
  }

  function setSelectedShelter(item: ShelterItem | null) {
    selectedShelter.value = item
    if (!item) return
    activeRouteId.value = String(item.id)
  }

  function setActiveRoute(routeId: string) {
    activeRouteId.value = routeId
    selectedShelter.value = shelters.value.find((item) => String(item.id) === routeId) || selectedShelter.value
  }

  function setActiveDestination(item: EmergencyDestinationItem | null) {
    if (item && !ALLOWED_DESTINATION_IDS.has(Number(item.id))) return
    stopPolling()
    activeDestination.value = item
    persistDestination(item)
    emergencyInfo.value = buildEmergencyInfo(disasterType.value, activeDestination.value?.name, routes.value.length)
    routes.value = []
    shelters.value = []
    dangerZones.value = []
    dangerRoads.value = []
    activeRouteId.value = ''
    selectedShelter.value = null
  }

  function setManualStartLocation(location: EmergencyLocation | null) {
    manualStartLocation.value = location
    if (location) {
      currentLocation.value = location
    }
  }

  async function markShelterArrived(item: ShelterItem) {
    const shelter = await arriveEmergencyShelter(item.id)
    if (!shelter) return
    const nextShelter = normalizeShelter({
      ...shelter,
      distance: item.distance,
      address: item.address
    })
    if (!nextShelter) return
    shelters.value = shelters.value.map((current) => (String(current.id) === String(item.id) ? nextShelter : current))
    if (selectedShelter.value && String(selectedShelter.value.id) === String(item.id)) {
      selectedShelter.value = nextShelter
    }
    if (nearestShelter.value && String(nearestShelter.value.id) === String(item.id)) {
      nearestShelter.value = nextShelter
    }
  }

  function updateLayerVisibility(key: keyof LayerVisibility, value: boolean) {
    layerVisibility.value = {
      ...layerVisibility.value,
      [key]: value
    }
  }

  function startPolling() {
    stopPolling()
    refreshTimer.value = window.setInterval(() => {
      if (activeDestination.value?.id) void fetchAll()
    }, 60000)
  }

  function stopPolling() {
    if (refreshTimer.value) {
      window.clearInterval(refreshTimer.value)
      refreshTimer.value = null
    }
  }

  function clearEmergencyData() {
    routes.value = []
    shelters.value = []
    nearestShelter.value = null
    selectedShelter.value = null
    activeRouteId.value = ''
    const empty = createEmptyArrays()
    alerts.value = empty.alerts
    dangerZones.value = empty.dangerZones
    dangerRoads.value = empty.dangerRoads
  }

  return {
    activeDestination,
    activeRoute,
    activeRouteId,
    alerts,
    currentLocation,
    dangerRoads,
    dangerZones,
    destinationKeyword,
    destinations,
    disasterType,
    emergencyInfo,
    errorMessage,
    fetchAll,
    filteredShelters,
    intensity,
    initialize,
    lastUpdatedAt,
    layerVisibility,
    loadDestinations,
    loading,
    loadingLocation,
    markShelterArrived,
    manualStartLocation,
    mode,
    nearestShelter,
    networkStatus,
    refreshLocation,
    routes,
    selectedShelter,
    selectedShelterType,
    setActiveDestination,
    setActiveRoute,
    setDisasterType,
    setIntensity,
    setManualStartLocation,
    setMode,
    setSelectedShelter,
    setShelterType,
    setStrategy,
    shelters,
    startPolling,
    stopPolling,
    strategy,
    updateLayerVisibility
  }
})

function defaultIntensityByType(disasterType: DisasterType) {
  if (disasterType === 'EARTHQUAKE') return 5.5
  if (disasterType === 'FIRE') return 3
  return 50
}

function clampIntensity(value: number) {
  const normalized = Number(value)
  if (!Number.isFinite(normalized)) return 2
  return Math.max(0.1, Math.min(normalized, 10))
}

function restoreDestination(): EmergencyDestinationItem | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('emergency-active-destination')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return ALLOWED_DESTINATION_IDS.has(Number(parsed?.id)) ? parsed : null
  } catch {
    return null
  }
}

function persistDestination(item: EmergencyDestinationItem | null) {
  if (typeof window === 'undefined') return
  try {
    if (item) {
      window.localStorage.setItem('emergency-active-destination', JSON.stringify(item))
    } else {
      window.localStorage.removeItem('emergency-active-destination')
    }
  } catch {
    // ignore storage errors
  }
}
