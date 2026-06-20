import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  getAmapRoutePlan,
  getCurrentLocation,
  getIndoorRoute,
  getMultiPointRoute,
  getRoutePlan,
  getTransportationRoute,
  searchPOI
} from '@/services/routePlanner'
import type {
  CoordinatePoint,
  IndoorRouteRequest,
  PoiSuggestion,
  RouteLocationContext,
  RoutePlanOption,
  RouteProvider,
  RouteSceneMode,
  RouteStrategy,
  TransportMode,
  WaypointItem
} from '@/types/route-planner'

function createWaypoint(): WaypointItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    keyword: '',
    poi: null
  }
}

export const useRoutePlannerStore = defineStore('routePlanner', () => {
  const currentLocation = ref<RouteLocationContext | null>(null)
  const destination = ref<PoiSuggestion | null>(null)
  const suggestions = ref<PoiSuggestion[]>([])
  const waypointSuggestions = ref<Record<string, PoiSuggestion[]>>({})
  const waypoints = ref<WaypointItem[]>([])
  const strategy = ref<RouteStrategy>('distance')
  const transportMode = ref<TransportMode>('bike')
  const transportMixed = ref(true)
  const routeProvider = ref<RouteProvider>('amap')
  const plans = ref<RoutePlanOption[]>([])
  const activePlanId = ref('')
  const activeFloorId = ref<string | number | null>(null)
  const loading = ref(false)
  const loadingLocation = ref(false)
  const searching = ref(false)
  const planningError = ref('')
  const searchKeyword = ref('')
  const selectedCoordinate = ref<CoordinatePoint | null>(null)
  const indoorRequest = ref<IndoorRouteRequest>({
    buildingId: '1',
    startNodeName: '',
    endNodeName: ''
  })

  const activePlan = computed(() => plans.value.find((item) => item.id === activePlanId.value) || null)
  const indoorMode = computed(() => Boolean(activePlan.value?.indoor))
  const sceneMode = computed<RouteSceneMode>(() => currentLocation.value?.sceneMode || 'UNKNOWN')
  const transportOptions = computed(() => [
    { label: '自行车', value: 'bike' },
    { label: '步行', value: 'walk' }
  ])

  function ensureWaypoints() {
    if (!waypoints.value.length) {
      waypoints.value = [createWaypoint()]
    }
  }

  async function initialize() {
    ensureWaypoints()
    await refreshCurrentLocation()
  }

  async function refreshCurrentLocation() {
    loadingLocation.value = true
    try {
      currentLocation.value = await getCurrentLocation()
      planningError.value = ''
      syncTransportMode()
    } catch (error: any) {
      currentLocation.value = null
      planningError.value = error?.message || '当前位置获取失败'
    } finally {
      loadingLocation.value = false
    }
  }

  function setSelectedCoordinate(point: CoordinatePoint | null) {
    selectedCoordinate.value = point
  }

  function applySelectedCoordinate() {
    if (!selectedCoordinate.value || selectedCoordinate.value.lat == null || selectedCoordinate.value.lng == null) return

    const base: RouteLocationContext = currentLocation.value || {
      id: null,
      areaName: '手动选点',
      regionName: '地图坐标',
      sceneMode: 'UNKNOWN',
      buildingName: '',
      floorId: null,
      floorName: '',
      address: '',
      crowdLevel: '',
      avatar: '',
      location: null
    }

    currentLocation.value = {
      ...base,
      areaName: base.areaName || '手动选点',
      regionName: '地图坐标',
      location: {
        ...selectedCoordinate.value,
        x: null,
        y: null,
        floorId: null,
        floorName: ''
      }
    }
  }

  async function queryDestination(keyword: string) {
    searchKeyword.value = keyword
    if (!keyword.trim()) {
      suggestions.value = []
      return []
    }

    searching.value = true
    try {
      suggestions.value = await searchPOI({
        keyword,
        useBackend: routeProvider.value === 'backend',
        sceneMode: sceneMode.value,
        areaId: currentLocation.value?.id,
        currentLat: currentLocation.value?.location?.lat ?? null,
        currentLng: currentLocation.value?.location?.lng ?? null
      })
      return suggestions.value
    } catch {
      suggestions.value = []
      return []
    } finally {
      searching.value = false
    }
  }

  async function queryWaypoint(waypointId: string, keyword: string) {
    if (!keyword.trim()) {
      waypointSuggestions.value = { ...waypointSuggestions.value, [waypointId]: [] }
      return []
    }

    try {
      const results = await searchPOI({
        keyword,
        useBackend: routeProvider.value === 'backend',
        sceneMode: sceneMode.value,
        areaId: currentLocation.value?.id,
        currentLat: currentLocation.value?.location?.lat ?? null,
        currentLng: currentLocation.value?.location?.lng ?? null
      })
      waypointSuggestions.value = { ...waypointSuggestions.value, [waypointId]: results }
      return results
    } catch {
      waypointSuggestions.value = { ...waypointSuggestions.value, [waypointId]: [] }
      return []
    }
  }

  function setDestination(poi: PoiSuggestion | null) {
    destination.value = poi
    syncTransportMode()
  }

  function addWaypoint() {
    waypoints.value.push(createWaypoint())
  }

  function removeWaypoint(id: string) {
    waypoints.value = waypoints.value.filter((item) => item.id !== id)
    const next = { ...waypointSuggestions.value }
    delete next[id]
    waypointSuggestions.value = next
    ensureWaypoints()
  }

  function updateWaypointKeyword(id: string, keyword: string) {
    const target = waypoints.value.find((item) => item.id === id)
    if (!target) return
    target.keyword = keyword
    if (!keyword) target.poi = null
  }

  function setWaypointPoi(id: string, poi: PoiSuggestion | null) {
    const target = waypoints.value.find((item) => item.id === id)
    if (!target) return
    target.poi = poi
    target.keyword = poi?.name || target.keyword
  }

  function reorderWaypoints(fromId: string, toId: string) {
    const list = [...waypoints.value]
    const fromIndex = list.findIndex((item) => item.id === fromId)
    const toIndex = list.findIndex((item) => item.id === toId)
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return
    const [moved] = list.splice(fromIndex, 1)
    list.splice(toIndex, 0, moved)
    waypoints.value = list
  }

  function setStrategy(value: RouteStrategy) {
    strategy.value = value
    syncTransportMode()
  }

  function setTransportMode(value: TransportMode) {
    transportMode.value = value
  }

  function setTransportMixed(value: boolean) {
    transportMixed.value = value
  }

  function setRouteProvider(value: RouteProvider) {
    routeProvider.value = value
  }

  function setActivePlan(planId: string) {
    activePlanId.value = planId
    activeFloorId.value = plans.value.find((item) => item.id === planId)?.currentFloorId || null
  }

  function setActiveFloor(floorId: string | number | null) {
    activeFloorId.value = floorId
  }

  async function planRoutes(options?: { preferIndoor?: boolean }) {
    if (options?.preferIndoor) {
      if (!indoorRequest.value.buildingId || !indoorRequest.value.startNodeName || !indoorRequest.value.endNodeName) {
        planningError.value = '请完整填写室内导航所需的建筑物、起点和终点'
        return
      }
    } else if (!currentLocation.value) {
      return
    }

    loading.value = true
    planningError.value = ''
    try {
      const selectedWaypoints = waypoints.value
        .map((item) => item.poi)
        .filter(Boolean) as PoiSuggestion[]

      const payload = {
        strategy: strategy.value,
        transportMode: transportMode.value,
        transportMixed: transportMixed.value,
        currentLocation: currentLocation.value,
        destination: destination.value,
        waypoints: selectedWaypoints,
        indoorRequest: indoorRequest.value
      }

      const canUseIndoorRoute = Boolean(options?.preferIndoor)
      const hasTarget = Boolean(destination.value) || selectedWaypoints.length > 0
      const hasMultiPoint = selectedWaypoints.length > 0
      const useTransportRoute = strategy.value === 'transport'
      const useBackendRoute = routeProvider.value === 'backend'

      if (!canUseIndoorRoute && !hasTarget) {
        planningError.value = '请至少选择一个目的地或多目标点'
        plans.value = []
        activePlanId.value = ''
        return
      }

      if (!canUseIndoorRoute && useBackendRoute) {
        const primaryPoi = destination.value || selectedWaypoints[0] || null
        const inferredDestinationId = Number(primaryPoi?.destinationId ?? null)
        if (!Number.isFinite(inferredDestinationId)) {
          planningError.value = '后端接口模式下，请先选择同一校区内的有效 POI 目标点'
          plans.value = []
          activePlanId.value = ''
          return
        }
      }

      const response = canUseIndoorRoute
        ? await getIndoorRoute(payload)
        : !useBackendRoute
          ? await getAmapRoutePlan(payload)
          : useTransportRoute
            ? await getTransportationRoute(payload)
            : hasMultiPoint
              ? await getMultiPointRoute(payload)
              : await getRoutePlan(payload)

      const nextPlans = Array.isArray(response?.plans) ? response.plans : []
      plans.value = nextPlans
      activePlanId.value = response?.activePlanId || nextPlans[0]?.id || ''
      activeFloorId.value = nextPlans[0]?.currentFloorId || null

      if (canUseIndoorRoute && !nextPlans.length) {
        planningError.value = '室内导航接口未返回可展示的路线，请检查 buildingId、起点名称和终点名称是否正确。'
      }
    } catch (error: any) {
      planningError.value = error?.message || '路线规划失败'
      plans.value = []
      activePlanId.value = ''
    } finally {
      loading.value = false
    }
  }

  function syncTransportMode() {
    const options = transportOptions.value.map((item) => item.value)
    if (!options.includes(transportMode.value)) {
      transportMode.value = options[0] as TransportMode
    }
  }

  function updateIndoorRequest(patch: Partial<IndoorRouteRequest>) {
    indoorRequest.value = {
      ...indoorRequest.value,
      ...patch
    }
  }

  return {
    activeFloorId,
    activePlan,
    activePlanId,
    currentLocation,
    destination,
    indoorRequest,
    indoorMode,
    loading,
    loadingLocation,
    plans,
    planningError,
    routeProvider,
    sceneMode,
    searchKeyword,
    selectedCoordinate,
    searching,
    strategy,
    suggestions,
    transportMixed,
    transportMode,
    transportOptions,
    waypointSuggestions,
    waypoints,
    addWaypoint,
    initialize,
    planRoutes,
    queryDestination,
    queryWaypoint,
    refreshCurrentLocation,
    removeWaypoint,
    reorderWaypoints,
    applySelectedCoordinate,
    setSelectedCoordinate,
    setActiveFloor,
    setActivePlan,
    setDestination,
    setRouteProvider,
    updateIndoorRequest,
    setStrategy,
    setTransportMode,
    setTransportMixed,
    setWaypointPoi,
    updateWaypointKeyword
  }
})
