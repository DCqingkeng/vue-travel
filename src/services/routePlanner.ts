import http from './http'
import { amapWebService } from './amap'
import type {
  CoordinatePoint,
  IndoorFloor,
  PoiSuggestion,
  RouteLocationContext,
  RoutePlanOption,
  RoutePlannerPayload,
  RouteSceneMode,
  RouteSegment,
  RouteStep,
  RouteStrategy,
  RouteSummary,
  TransportMode
} from '@/types/route-planner'

export async function getCurrentLocation() {
  const point = await getBrowserLocation()
  return {
    id: null,
    areaName: '当前位置',
    regionName: '浏览器定位',
    sceneMode: 'UNKNOWN',
    buildingName: '',
    floorId: null,
    floorName: '',
    address: '',
    crowdLevel: '',
    avatar: '',
    location: {
      lat: point.lat,
      lng: point.lng,
      x: null,
      y: null,
      floorId: null,
      floorName: ''
    }
  } satisfies RouteLocationContext
}

export async function searchPOI(params: {
  keyword: string
  useBackend?: boolean
  sceneMode?: RouteSceneMode
  areaId?: string | number | null
  currentLat?: number | null
  currentLng?: number | null
}) {
  const keyword = String(params.keyword || '').trim()
  if (!keyword) return []

  const inferredDestinationId = params.useBackend
    ? inferDestinationIdByCoordinate(params.currentLat, params.currentLng)
    : null
  if (inferredDestinationId) {
    return [{
      id: `backend-poi-${inferredDestinationId}-${keyword}`,
      name: keyword,
      destinationId: inferredDestinationId,
      type: '',
      subtitle: '',
      address: '',
      latitude: null,
      longitude: null,
      buildingName: '',
      floorId: null,
      floorName: '',
      indoor: false,
      sceneMode: 'CAMPUS',
      source: 'backend-poi',
      raw: {
        destination_id: inferredDestinationId
      }
    }]
  }

  const [poiResults, destinationResults, amapResults] = await Promise.allSettled([
    params.useBackend ? requestBackendPoiSearch(params) : Promise.resolve([]),
    params.useBackend ? requestDestinationSearch(params) : Promise.resolve([]),
    requestAmapSearch(keyword)
  ])

  const backendPoi = poiResults.status === 'fulfilled' ? poiResults.value : []
  const backendDestination = destinationResults.status === 'fulfilled' ? destinationResults.value : []
  const amap = amapResults.status === 'fulfilled' ? amapResults.value : []

  if (!params.useBackend) {
    return dedupePoiSuggestions(amap)
  }

  if (backendPoi.length > 0) {
    return dedupePoiSuggestions(backendPoi)
  }

  return dedupePoiSuggestions([
    ...backendDestination,
    ...amap
  ])
}

export async function getRoutePlan(payload: RoutePlannerPayload) {
  const res = await http.get(resolveRoutePath(payload, false), {
    params: buildSingleRouteParams(payload)
  })
  console.debug('[routePlanner] single route raw response', res)
  return normalizeRoutePlans(res, payload)
}

export async function getMultiPointRoute(payload: RoutePlannerPayload) {
  const res = await http.get(resolveRoutePath(payload, true), {
    params: buildMultiRouteParams(payload)
  })
  console.debug('[routePlanner] multi route raw response', res)
  return normalizeRoutePlans(res, payload)
}

export async function getIndoorRoute(payload: RoutePlannerPayload) {
  const res = await http.get('/api/indoor/route', {
    params: buildIndoorParams(payload)
  })
  return normalizeRoutePlans(res, payload, true)
}

export async function getTransportationRoute(payload: RoutePlannerPayload) {
  const multi = payload.waypoints.length > 0
  const params = multi ? buildMultiRouteParams(payload) : buildSingleRouteParams(payload)

  try {
    const res = await http.get(resolveTransportPath(multi), {
      params
    })
    console.debug('[routePlanner] transport route raw response', res)
    return normalizeRoutePlans(res, payload)
  } catch (error: any) {
    const status = Number(error?.status || 0)
    const message = String(error?.message || '')

    if (status >= 500 || message === 'Internal Server Error') {
      throw new Error('交通工具路线规划失败：后端未返回可用路线，请确认起点、目标点和当前校区路网数据是否支持该 mixed 策略。')
    }

    throw error
  }
}

export async function getAmapRoutePlan(payload: RoutePlannerPayload) {
  const waypointList = Array.isArray(payload?.waypoints) ? payload.waypoints : []
  const points = [
    payload.currentLocation?.location,
    ...waypointList.map((item) => ({ lat: item.latitude ?? null, lng: item.longitude ?? null })),
    payload.destination ? { lat: payload.destination.latitude ?? null, lng: payload.destination.longitude ?? null } : null
  ]
    .filter(Boolean)
    .filter((item: any) => item.lng != null && item.lat != null) as CoordinatePoint[]

  if (points.length < 2) {
    throw new Error('高德路线规划至少需要起点和终点坐标')
  }

  const segments = []
  const fullPath: CoordinatePoint[] = []
  let totalDistance = 0
  let totalDuration = 0

  for (let index = 0; index < points.length - 1; index += 1) {
    const origin = points[index]
    const destination = points[index + 1]
    const leg = await requestAmapRoute(origin, destination)
    totalDistance += Number(leg.distance || 0)
    totalDuration += Number(leg.duration || 0)

    const segmentPath = leg.path
    if (segmentPath.length) {
      if (!fullPath.length) fullPath.push(...segmentPath)
      else fullPath.push(...segmentPath.slice(1))
    }

    segments.push({
      id: String(index + 1),
      mode: '高德路线',
      visualType: 'walk',
      fromName: index === 0 ? (payload.currentLocation?.areaName || '起点') : (payload.waypoints[index - 1]?.name || `途经点${index}`),
      toName: index === points.length - 2 ? (payload.destination?.name || '终点') : (payload.waypoints[index]?.name || `途经点${index + 1}`),
      distance: Number(leg.distance || 0),
      duration: normalizeDurationValue(leg.duration),
      path: segmentPath
    })
  }

  const plan: RoutePlanOption = {
    id: 'amap-1',
    name: '高德路线',
    strategy: payload.strategy,
    transportMode: payload.transportMode,
    summary: {
      totalDistance,
      estimatedDuration: normalizeDurationValue(totalDuration),
      congestionLevel: '',
      calories: null,
      shuttleDistance: null,
      bikeDistance: null
    },
    steps: (Array.isArray(segments) ? segments : []).map((segment, index) => ({
      id: String(index + 1),
      title: `${segment.fromName || '璧风偣'} -> ${segment.toName || '缁堢偣'}`,
      description: '高德地图路线规划',
      distance: segment.distance ?? null,
      duration: segment.duration ?? null,
      transportMode: 'walk',
      floorName: ''
    })),
    path: fullPath,
    segments,
    indoor: false,
    floors: [],
    currentFloorId: null,
    raw: { provider: 'amap' }
  }

  return {
    plans: [plan],
    activePlanId: plan.id
  }
}

async function requestDestinationSearch(params: { keyword: string; sceneMode?: RouteSceneMode; areaId?: string | number | null }) {
  const res = await http.get('/api/destination/search', {
    params: {
      keyword: params.keyword,
      limit: 10
    }
  })

  const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []
  return list.map((item) => normalizePoiSuggestion(item, 'backend-destination')).filter(Boolean) as PoiSuggestion[]
}

async function requestBackendPoiSearch(params: { keyword: string; sceneMode?: RouteSceneMode; areaId?: string | number | null }) {
  return []
}

async function requestAmapSearch(keyword: string) {
  const trimmedKeyword = String(keyword || '').trim()
  if (!trimmedKeyword) return []

  const [placeResult, tipResult] = await Promise.allSettled([
    requestAmapPlaceSearch(trimmedKeyword),
    requestAmapTipSearch(trimmedKeyword)
  ])

  const places = placeResult.status === 'fulfilled' ? placeResult.value : []
  const tips = tipResult.status === 'fulfilled' ? tipResult.value : []

  return dedupePoiSuggestions([
    ...places,
    ...tips
  ])
}

async function requestAmapPlaceSearch(keyword: string) {
  const data = await amapWebService('/v3/place/text', {
    keywords: keyword,
    offset: 10,
    page: 1,
    extensions: 'base'
  })

  const pois = Array.isArray(data?.pois) ? data.pois : []
  return pois
    .map((item: any) => {
      const [lng, lat] = String(item.location || '')
        .split(',')
        .map((value) => Number(value))

      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null

      return normalizePoiSuggestion({
        id: item.id || item.name,
        name: item.name,
        address: item.address,
        district: item.pname && item.city ? `${item.pname} ${item.city}` : (item.pname || item.city || item.adname || ''),
        type: item.type,
        location: { lng, lat }
      }, 'amap')
    })
    .filter(Boolean) as PoiSuggestion[]
}

async function requestAmapTipSearch(keyword: string) {
  const data = await amapWebService('/v3/assistant/inputtips', {
    keywords: keyword,
    datatype: 'all',
    citylimit: false
  })

  const tips = Array.isArray(data?.tips) ? data.tips : []
  return tips
    .map((item: any) => {
      const [lng, lat] = String(item.location || '')
        .split(',')
        .map((value) => Number(value))

      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null

      return normalizePoiSuggestion({
        id: item.id || item.name,
        name: item.name,
        address: item.address,
        district: item.district,
        location: { lng, lat }
      }, 'amap')
    })
    .filter(Boolean) as PoiSuggestion[]
}

async function requestAmapWalkingRoute(origin: CoordinatePoint, destination: CoordinatePoint) {
  const data = await amapWebService('/v3/direction/walking', {
    origin: `${origin.lng},${origin.lat}`,
    destination: `${destination.lng},${destination.lat}`
  })

  const route = data?.route?.paths?.[0]
  if (!route) {
    throw new Error('高德未返回可用步行路线')
  }

  const stepPaths = Array.isArray(route.steps) ? route.steps : []
  const path = stepPaths.flatMap((step: any, stepIndex: number) => {
    const points = String(step.polyline || '')
      .split(';')
      .map((pair: string, pointIndex: number) => {
        const [lng, lat] = pair.split(',').map((value) => Number(value))
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
        return {
          lng,
          lat,
          seq: `${stepIndex}-${pointIndex}`
        }
      })
      .filter(Boolean)

    return points
  })

  return {
    mode: 'walk',
    distance: Number(route.distance || 0),
    duration: Number(route.duration || 0),
    path
  }
}

async function requestAmapDrivingRoute(origin: CoordinatePoint, destination: CoordinatePoint) {
  const data = await amapWebService('/v3/direction/driving', {
    origin: `${origin.lng},${origin.lat}`,
    destination: `${destination.lng},${destination.lat}`,
    extensions: 'base',
    strategy: 0
  })

  const route = data?.route?.paths?.[0]
  if (!route) {
    throw new Error('高德未返回可用驾车路线')
  }

  const stepPaths = Array.isArray(route.steps) ? route.steps : []
  const path = stepPaths.flatMap((step: any, stepIndex: number) => {
    const points = String(step.polyline || '')
      .split(';')
      .map((pair: string, pointIndex: number) => {
        const [lng, lat] = pair.split(',').map((value) => Number(value))
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
        return {
          lng,
          lat,
          seq: `${stepIndex}-${pointIndex}`
        }
      })
      .filter(Boolean)

    return points
  })

  return {
    mode: 'drive',
    distance: Number(route.distance || 0),
    duration: Number(route.duration || 0),
    path
  }
}

async function requestAmapRoute(origin: CoordinatePoint, destination: CoordinatePoint) {
  const directDistance = estimateDistanceMeters(origin, destination)

  if (directDistance > 50000) {
    return requestAmapDrivingRoute(origin, destination)
  }

  try {
    return await requestAmapWalkingRoute(origin, destination)
  } catch (error: any) {
    const message = String(error?.message || '')
    if (message.includes('OVER_DIRECTION_RANGE')) {
      return requestAmapDrivingRoute(origin, destination)
    }
    throw error
  }
}

function buildCommonRouteParams(payload: RoutePlannerPayload) {
  const destination = payload.destination
  const waypointList = Array.isArray(payload?.waypoints) ? payload.waypoints : []
  const primaryPoi = destination || waypointList[0] || null
  const currentLocation = payload.currentLocation?.location
  const destinationAreaId = getPoiDestinationId(primaryPoi)
    ?? inferDestinationIdByCoordinate(currentLocation?.lat, currentLocation?.lng)
  const areaId = destinationAreaId ?? null

  return {
    strategy: payload.strategy,
    transportMode: payload.transportMode,
    sceneMode: payload.currentLocation?.sceneMode,
    sceneType: 'SCHOOL',
    mixed: payload.transportMixed ?? true,
    areaId,
    destinationId: areaId,
    currentLat: currentLocation?.lat,
    currentLng: currentLocation?.lng,
    destinationPoiId: resolveDestinationPoiId(primaryPoi)
  }
}

function buildSingleRouteParams(payload: RoutePlannerPayload) {
  return {
    ...buildCommonRouteParams(payload),
    targetPoiName: payload.destination?.name
  }
}

function buildMultiRouteParams(payload: RoutePlannerPayload) {
  const waypointList = Array.isArray(payload?.waypoints) ? payload.waypoints : []
  const poiNames = [...waypointList.map((item) => item.name), payload.destination?.name]
    .filter(Boolean)
    .map((item) => String(item).trim())
    .filter(Boolean)

  return {
    ...buildCommonRouteParams(payload),
    targetPoiNames: poiNames.join(',')
  }
}

function buildIndoorParams(payload: RoutePlannerPayload) {
  const request = payload.indoorRequest

  return {
    buildingId: request?.buildingId,
    startNodeName: request?.startNodeName,
    endNodeName: request?.endNodeName
  }
}

function resolveRoutePath(payload: RoutePlannerPayload, multi: boolean) {
  if (payload.strategy === 'time') {
    return multi ? '/api/route/multi-stop-shortest-time' : '/api/route/plan-shortest-time'
  }
  return multi ? '/api/route/multi-stop' : '/api/route/plan'
}

function resolveTransportPath(multi: boolean) {
  return multi ? '/api/route/multi-stop-transport' : '/api/route/plan-transport'
}

export function normalizeLocationContext(raw: any): RouteLocationContext {
  const data = raw?.data ?? raw ?? {}
  const areaName = data.areaName || data.destinationName || data.regionName || data.currentAreaName || 'Unknown Area'
  const sceneMode = normalizeSceneMode(data.sceneMode || data.areaType || data.mode)

  return {
    id: data.areaId ?? data.destinationId ?? data.id ?? null,
    areaName,
    regionName: data.regionName || data.parentName || '',
    sceneMode,
    buildingName: data.buildingName || '',
    floorId: data.floorId ?? null,
    floorName: data.floorName || '',
    address: data.address || '',
    crowdLevel: data.crowdLevel || data.crowdStatus || '',
    avatar: data.avatar || '',
    location: normalizePoint(data.location || data.position || data)
  }
}

function normalizePoiSuggestion(raw: any, source: 'backend-poi' | 'backend-destination' | 'amap' = 'backend-destination'): PoiSuggestion | null {
  if (!raw) return null

  const point = normalizePoint(raw.location || raw.position || raw)
  const sceneMode = normalizeSceneMode(raw.sceneMode || raw.mode || raw.type)
  return {
    id: raw.id ?? raw.poiId ?? raw.destinationId ?? raw.name,
    name: raw.poiName || raw.name || raw.title || raw.nodeName || '',
    destinationId: raw.destination_id ?? raw.destinationId ?? raw.areaId ?? null,
    type: raw.type || raw.category || raw.poiType || '',
    subtitle: raw.subtitle || raw.address || raw.district || raw.categoryName || '',
    address: raw.address || '',
    latitude: point?.lat ?? null,
    longitude: point?.lng ?? null,
    buildingName: raw.buildingName || '',
    floorId: raw.floorId ?? null,
    floorName: raw.floorName || '',
    indoor: Boolean(raw.indoor || raw.isIndoor || raw.floorId || sceneMode === 'INDOOR'),
    sceneMode,
    source,
    raw
  }
}

function dedupePoiSuggestions(list: PoiSuggestion[]) {
  const seen = new Set<string>()
  return list.filter((item) => {
    const key = `${item.source || 'backend'}:${item.destinationId ?? ''}:${item.name}:${item.latitude ?? ''}:${item.longitude ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function normalizeKeyword(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}

function getPoiDestinationId(item: PoiSuggestion | null | undefined) {
  if (!item) return null

  return item.destinationId
    ?? (item.raw as any)?.destination_id
    ?? (item.raw as any)?.destinationId
    ?? (item.raw as any)?.areaId
    ?? null
}

function inferDestinationIdByCoordinate(lat: number | null | undefined, lng: number | null | undefined) {
  if (lat == null || lng == null) return null

  if (lat >= 31.015 && lat <= 31.035 && lng >= 121.425 && lng <= 121.445) {
    return 201
  }

  if (lat >= 32.108 && lat <= 32.122 && lng >= 118.947 && lng <= 118.963) {
    return 202
  }

  if (lat >= 39.974 && lat <= 39.989 && lng >= 116.339 && lng <= 116.357) {
    return 170
  }

  return null
}

function resolveDestinationPoiId(item: PoiSuggestion | null | undefined) {
  if (!item) return null
  if (item.source !== 'backend-poi') return null
  if (!item.raw || typeof item.raw !== 'object') return null

  const rawPoiId = (item.raw as any).poiId ?? (item.raw as any).id ?? null
  const numericPoiId = Number(rawPoiId)
  return Number.isFinite(numericPoiId) ? numericPoiId : null
}

export function normalizeRoutePlans(raw: any, payload: RoutePlannerPayload, forceIndoor = false) {
  const source = raw?.data ?? raw ?? {}

  if (Array.isArray(source.path) || Array.isArray(source.fullPath)) {
    const directPlan = normalizeDirectRoutePlan(source, payload, forceIndoor)
    return {
      plans: directPlan ? [directPlan] : [],
      activePlanId: directPlan?.id || ''
    }
  }

  const candidates = Array.isArray(source.plans)
    ? source.plans
    : Array.isArray(source.routes)
      ? source.routes
      : [source]

  const plans = (Array.isArray(candidates) ? candidates : [])
    .map((item: any, index: number) => normalizeRoutePlan(item, payload, forceIndoor, index))
    .filter(Boolean) as RoutePlanOption[]

  return {
    plans,
    activePlanId: plans[0]?.id || ''
  }
}

function normalizeDirectRoutePlan(raw: any, payload: RoutePlannerPayload, forceIndoor: boolean): RoutePlanOption | null {
  if (!raw || typeof raw !== 'object') return null

  const path = normalizePath(raw.path || raw.fullPath || [])
  const segmentsFromResponse = normalizeSegments(raw.segments || raw.legs || [], payload.transportMode)
  const segments = segmentsFromResponse.length
    ? segmentsFromResponse
    : [{
      id: '1',
      mode: inferTransportLabel(payload.transportMode),
      visualType: normalizeVisualType(payload.transportMode, 0),
      fromName: payload.currentLocation?.areaName || '起点',
      toName: raw.targetPoi?.poiName || payload.destination?.name || '终点',
      distance: toNumber(raw.totalDistance ?? raw.distance),
      duration: normalizeDurationValue(raw.totalTime ?? raw.duration ?? raw.estimatedTime),
      path
    }]

  const steps = normalizeSteps(raw.steps || raw.instructions || raw.pathSteps || segments, segments)
  const floors = normalizeFloors(raw.floors || raw.floorList || raw.indoorFloors || [], raw.path || raw.fullPath || [])
  const indoor = forceIndoor || Boolean(raw.indoor || raw.isIndoor || floors.length)

  return {
    id: String(raw.id ?? raw.planId ?? 'direct-1'),
    name: raw.name || raw.planName || '路线方案',
    strategy: normalizeStrategy(raw.strategy || payload.strategy),
    transportMode: normalizeTransport(raw.transportMode || raw.mode || payload.transportMode),
    summary: normalizeSummary(raw.summary || raw.metrics || raw, payload.transportMode, segments),
    steps,
    path,
    segments,
    indoor,
    floors,
    currentFloorId: raw.currentFloorId ?? path[0]?.floorId ?? floors[0]?.id ?? null,
    raw
  }
}

function normalizeRoutePlan(raw: any, payload: RoutePlannerPayload, forceIndoor: boolean, index: number): RoutePlanOption | null {
  if (!raw || typeof raw !== 'object') return null

  const path = normalizePath(raw.path || raw.fullPath || raw.polyline || raw.points || raw.routePath || [])
  const segments = normalizeSegments(raw.segments || raw.legs || [], payload.transportMode)
  const steps = normalizeSteps(raw.steps || raw.instructions || raw.pathSteps || segments)
  const floors = normalizeFloors(raw.floors || raw.floorList || raw.indoorFloors || [], raw.path || raw.fullPath || [])
  const indoor = forceIndoor || Boolean(raw.indoor || raw.isIndoor || floors.length)

  return {
    id: String(raw.id ?? raw.planId ?? index + 1),
    name: raw.name || raw.planName || `鏂规 ${String.fromCharCode(65 + index)}`,
    strategy: normalizeStrategy(raw.strategy || payload.strategy),
    transportMode: normalizeTransport(raw.transportMode || raw.mode || payload.transportMode),
    summary: normalizeSummary(raw.summary || raw.metrics || raw, payload.transportMode, segments),
    steps,
    path,
    segments,
    indoor,
    floors,
    currentFloorId: raw.currentFloorId ?? path[0]?.floorId ?? floors[0]?.id ?? null,
    raw
  }
}

function normalizeSummary(raw: any, transportMode?: TransportMode, segments: RouteSegment[] = []): RouteSummary {
  const shuttleDistance = toNumber(raw.shuttleDistance ?? raw.electricCarDistance)
  const bikeDistance = toNumber(raw.bikeDistance ?? raw.bicycleDistance)
  const inferredDistance = sumSegmentDistanceByType(segments, transportMode)
  return {
    totalDistance: toNumber(raw.totalDistance ?? raw.distance),
    estimatedDuration: normalizeDurationValue(raw.totalTime ?? raw.estimatedDuration ?? raw.duration ?? raw.estimatedTime),
    congestionLevel: raw.congestionLevel || raw.crowdLevel || raw.congestion || '',
    calories: toNumber(raw.calories ?? raw.consumeCalories),
    shuttleDistance: shuttleDistance ?? inferredDistance.shuttleDistance,
    bikeDistance: bikeDistance ?? inferredDistance.bikeDistance
  }
}

function normalizeSteps(raw: any[], fallbackSegments: RouteSegment[]): RouteStep[] {
  const source = Array.isArray(raw) && raw.length ? raw : fallbackSegments

  return source.map((item: any, index: number) => ({
    id: String(item.id ?? item.stepId ?? index + 1),
    title: item.title || item.instruction || item.name || `${index + 1}. 路线步骤`,
    description: item.description || item.desc || (item.fromName && item.toName ? `${item.fromName} -> ${item.toName}` : ''),
    distance: toNumber(item.distance),
    duration: normalizeDurationValue(item.duration ?? item.time ?? item.timeCost),
    transportMode: item.transportMode || item.mode || item.edgeType || item.visualType || '',
    floorName: item.floorName || item.fromNode?.floorName || (item.fromNode?.floor != null ? `F${item.fromNode.floor}` : '')
  }))
}

function normalizeSegments(raw: any[], transportMode?: TransportMode): RouteSegment[] {
  if (!Array.isArray(raw)) return []

  return raw.map((item: any, index: number) => ({
    id: String(item.id ?? index + 1),
    mode: item.mode || item.transportMode || item.edgeType || inferTransportLabel(item.edgeType || transportMode),
    visualType: normalizeVisualType(item.edgeType || item.mode || item.transportMode || transportMode, index),
    name: item.name || '',
    fromName: item.fromName || item.startName || '',
    toName: item.toName || item.endName || '',
    distance: toNumber(item.distance),
    duration: normalizeDurationValue(item.duration ?? item.time ?? item.timeCost),
    path: normalizePath(item.path || item.points || item.polyline || buildIndoorSegmentPath(item))
  }))
}

function normalizeFloors(raw: any[], fallbackPath: any[] = []): IndoorFloor[] {
  if (Array.isArray(raw) && raw.length) {
    return raw.map((item: any, index: number) => ({
      id: item.id ?? item.floorId ?? index + 1,
      name: item.name || item.floorName || `F${index + 1}`,
      level: toNumber(item.level),
      nodes: normalizePath(item.nodes || item.path || item.points || [])
    }))
  }

  const path = Array.isArray(fallbackPath) ? fallbackPath : []
  const floorMap = new Map<string | number, CoordinatePoint[]>()
  path.forEach((item: any) => {
    const point = normalizePoint(item)
    const floorKey = item.floor ?? item.floorId ?? item.floorName
    if (!point || floorKey == null) return
    const current = floorMap.get(floorKey) || []
    current.push({
      ...point,
      type: item.nodeType || item.type || '',
      floorId: floorKey,
      floorName: item.floorName || `F${floorKey}`
    })
    floorMap.set(floorKey, current)
  })

  return Array.from(floorMap.entries()).map(([key, nodes], index) => ({
    id: key,
    name: typeof key === 'number' || /^\d+$/.test(String(key)) ? `F${key}` : String(key),
    level: Number(key) || index + 1,
    nodes
  }))
}

function normalizePath(raw: any): CoordinatePoint[] {
  if (!Array.isArray(raw)) return []

  return raw
    .map((item: any, index: number) => {
      const point = normalizePoint(item)
      if (!point) return null

      return {
        ...point,
        floorId: item.floorId ?? item.floor ?? point.floorId ?? null,
        floorName: item.floorName || (item.floor != null ? `F${item.floor}` : ''),
        type: item.nodeType || item.type || '',
        label: item.nodeName || item.name || point.label || '',
        seq: item.seq ?? index
      }
    })
    .filter(Boolean) as CoordinatePoint[]
}

function normalizePoint(raw: any): CoordinatePoint | null {
  if (!raw) return null

  const lat = toNumber(raw.lat ?? raw.latitude)
  const lng = toNumber(raw.lng ?? raw.longitude ?? raw.lon)
  const x = toNumber(raw.posX ?? raw.x)
  const y = toNumber(raw.posY ?? raw.y)

  if (lat == null && lng == null && x == null && y == null) return null

  return {
    lat,
    lng,
    x,
    y,
    floorId: raw.floorId ?? raw.floor ?? null,
    floorName: raw.floorName || (raw.floor != null ? `F${raw.floor}` : ''),
    type: raw.nodeType || raw.type || '',
    label: raw.nodeName || raw.name || ''
  }
}

function normalizeSceneMode(value: unknown): RouteSceneMode {
  const text = String(value || '').toUpperCase()
  if (text.includes('SCENIC')) return 'SCENIC'
  if (text.includes('CAMPUS') || text.includes('SCHOOL')) return 'CAMPUS'
  if (text.includes('INDOOR') || text.includes('BUILDING')) return 'INDOOR'
  return 'UNKNOWN'
}

function normalizeTransport(value: unknown): TransportMode {
  const text = String(value || '').toLowerCase()
  if (text.includes('bike')) return 'bike'
  if (text.includes('shuttle') || text.includes('electric')) return 'shuttle'
  if (text.includes('hybrid') || text.includes('mixed')) return 'hybrid'
  if (text.includes('indoor')) return 'indoor'
  return 'walk'
}

function normalizeStrategy(value: unknown): RouteStrategy {
  const text = String(value || '').toLowerCase()
  if (text.includes('distance') || text.includes('short')) return 'distance'
  if (text.includes('time') || text.includes('fast')) return 'time'
  if (text.includes('transport') || text.includes('bike') || text.includes('shuttle') || text.includes('electric') || text.includes('mixed')) return 'transport'
  return 'distance'
}

function toNumber(value: unknown) {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function estimateDistanceMeters(origin: CoordinatePoint, destination: CoordinatePoint) {
  if (origin.lat == null || origin.lng == null || destination.lat == null || destination.lng == null) {
    return 0
  }

  const R = 6371000
  const dLat = toRadians(destination.lat - origin.lat)
  const dLng = toRadians(destination.lng - origin.lng)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRadians(origin.lat)) * Math.cos(toRadians(destination.lat))
    * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRadians(value: number) {
  return value * Math.PI / 180
}

function normalizeSceneType(value: unknown) {
  const text = String(value || '').toUpperCase()
  if (text.includes('SCENIC')) return 'SCENIC_SPOT'
  if (text.includes('CAMPUS')) return 'SCHOOL'
  return text || undefined
}

function normalizeDurationValue(value: unknown) {
  const num = toNumber(value)
  if (num == null) return null
  return num > 300 ? num / 60 : num
}

function inferTransportLabel(value: unknown) {
  const text = String(value || '').toUpperCase()
  if (text.includes('ELEVATOR')) return '电梯'
  if (text.includes('STAIRS')) return '楼梯'
  if (text.includes('BIKE')) return '自行车'
  if (text.includes('SHUTTLE') || text.includes('ELECTRIC')) return '电瓶车'
  if (text.includes('HYBRID')) return '混合模式'
  return '步行'
}

function normalizeVisualType(value: unknown, index: number) {
  const text = String(value || '').toUpperCase()
  if (text.includes('ELEVATOR')) return 'elevator'
  if (text.includes('STAIRS')) return 'stairs'
  if (text.includes('BIKE')) return 'bike'
  if (text.includes('SHUTTLE') || text.includes('ELECTRIC')) return 'shuttle'
  if (text.includes('HYBRID')) return index % 2 === 0 ? 'walk' : 'shuttle'
  return 'walk'
}

function buildIndoorSegmentPath(item: any) {
  if (!item?.fromNode || !item?.toNode) return []
  return [item.fromNode, item.toNode]
}

function sumSegmentDistanceByType(segments: RouteSegment[], transportMode?: TransportMode) {
  const result = {
    shuttleDistance: null as number | null,
    bikeDistance: null as number | null
  }

  const shuttle = segments
    .filter((item) => item.visualType === 'shuttle')
    .reduce((sum, item) => sum + Number(item.distance || 0), 0)
  const bike = segments
    .filter((item) => item.visualType === 'bike')
    .reduce((sum, item) => sum + Number(item.distance || 0), 0)

  if (shuttle > 0) result.shuttleDistance = shuttle
  else if (transportMode === 'shuttle') result.shuttleDistance = segments.reduce((sum, item) => sum + Number(item.distance || 0), 0)

  if (bike > 0) result.bikeDistance = bike
  else if (transportMode === 'bike') result.bikeDistance = segments.reduce((sum, item) => sum + Number(item.distance || 0), 0)

  return result
}

function getBrowserLocation() {
  return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('当前浏览器不支持定位'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      () => {
        reject(new Error('浏览器定位失败，请检查定位权限'))
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000
      }
    )
  })
}


