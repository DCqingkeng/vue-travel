import http from './http'
import type {
  DisasterType,
  EmergencyDestinationItem,
  EmergencyInfo,
  EmergencyLocation,
  EmergencyRouteCoordinate,
  EmergencyRouteItem,
  EmergencyRouteRiskSegment,
  EmergencyRouteStep,
  EmergencyStrategy,
  ShelterItem
} from '@/types/emergency'

interface EvacuationPlanRequest {
  destinationId: string | number
  disasterType: DisasterType
  strategy: EmergencyStrategy
  lat?: number
  lng?: number
  intensity?: number
}

const ALLOWED_DESTINATION_IDS = new Set([170, 201, 202])

export async function getHotEmergencyDestinations(limit = 8) {
  const res = await http.get('/api/destination/hot', { params: { limit } })
  const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []
  return list
    .map(normalizeDestination)
    .filter((item): item is EmergencyDestinationItem => Boolean(item) && ALLOWED_DESTINATION_IDS.has(Number(item.id)))
}

export async function searchEmergencyDestinations(keyword: string, limit = 10) {
  const text = String(keyword || '').trim()
  if (!text) return getHotEmergencyDestinations(limit)
  const res = await http.get('/api/destination/search', { params: { keyword: text, limit } })
  const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []
  return list
    .map(normalizeDestination)
    .filter((item): item is EmergencyDestinationItem => Boolean(item) && ALLOWED_DESTINATION_IDS.has(Number(item.id)))
}

export async function getEvacuationPlans(params: EvacuationPlanRequest) {
  const res = await http.post('/api/disaster/evacuate', null, {
    params: {
      currentLat: params.lat,
      currentLng: params.lng,
      destinationId: params.destinationId,
      disasterType: params.disasterType,
      intensity: params.intensity ?? defaultIntensity(params.disasterType),
      strategy: params.strategy
    }
  })

  const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []
  return list.map((item: any, index: number) => normalizeEvacuationPlan(item, index)).filter(Boolean) as EmergencyRouteItem[]
}

export async function arriveEmergencyShelter(shelterId: string | number) {
  const res = await http.post('/api/disaster/arrive', null, {
    params: { shelterId }
  })
  return normalizeShelter(res?.data ?? res)
}

export async function getBrowserEmergencyLocation() {
  return new Promise<EmergencyLocation>((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Current browser does not support geolocation'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      () => reject(new Error('Failed to get location, please check permissions')),
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000
      }
    )
  })
}

export function buildEmergencyInfo(disasterType: DisasterType, destinationName?: string, routeCount = 0): EmergencyInfo {
  const levelMap: Record<DisasterType, string> = {
    EARTHQUAKE: '高风险',
    FLOOD_HIGH: '高风险',
    FIRE: '高风险'
  }

  const titleMap: Record<DisasterType, string> = {
    EARTHQUAKE: '地震疏散',
    FLOOD_HIGH: '洪水疏散',
    FIRE: '火灾疏散'
  }

  const suggestionMap: Record<DisasterType, string[]> = {
    EARTHQUAKE: ['远离玻璃与易倒塌结构', '优先前往开阔区域', '按照推荐路线前往避难点'],
    FLOOD_HIGH: ['避开低洼地带与下穿通道', '不要进入未知水深区域', '优先前往高处和固定避难点'],
    FIRE: ['避开浓烟区域', '弯腰低姿前进', '优先选择通风良好的疏散通道']
  }

  const areaText = destinationName ? `当前区域：${destinationName}。` : '请先选择景区或校区。'
  const routeText = routeCount > 0 ? `已生成 ${routeCount} 条疏散方案。` : '等待生成疏散路线。'

  return {
    disasterType,
    title: titleMap[disasterType],
    level: levelMap[disasterType],
    description: `${areaText}${routeText}`,
    suggestions: suggestionMap[disasterType],
    officialTip: '请优先遵循现场广播与应急人员指引。',
    updatedAt: new Date().toLocaleString('zh-CN', { hour12: false })
  }
}

export function normalizeShelter(raw: any): ShelterItem | null {
  if (!raw) return null
  const capacity = toNumber(raw.capacity)
  const occupancy = toNumber(raw.currentOccupancy ?? raw.occupancy)

  return {
    id: raw.id,
    name: raw.name || raw.shelterName || '',
    type: normalizeShelterType(raw.shelterType || raw.type || 'shelter'),
    lat: Number(raw.lat ?? raw.latitude),
    lng: Number(raw.lng ?? raw.longitude),
    capacity,
    occupancy,
    address: raw.address || '',
    distance: toNumber(raw.distance),
    status: raw.status || 'Open',
    services: createShelterServices(raw.shelterType || raw.type || 'shelter')
  }
}

function normalizeDestination(raw: any): EmergencyDestinationItem | null {
  if (!raw) return null
  return {
    id: raw.id ?? raw.destinationId,
    name: raw.name || raw.destinationName || '',
    type: raw.type || raw.category || '',
    address: raw.address || raw.city || '',
    latitude: toNumber(raw.latitude ?? raw.lat),
    longitude: toNumber(raw.longitude ?? raw.lng)
  }
}

function normalizeEvacuationPlan(raw: any, index: number): EmergencyRouteItem | null {
  if (!raw) return null

  const coordinates = Array.isArray(raw.path)
    ? raw.path
        .map((item: any) => normalizeCoordinate(item))
        .filter(Boolean) as EmergencyRouteCoordinate[]
    : []

  if (Number.isFinite(raw.shelterLng) && Number.isFinite(raw.shelterLat)) {
    const last = coordinates[coordinates.length - 1]
    const shelterLng = Number(raw.shelterLng)
    const shelterLat = Number(raw.shelterLat)
    if (!last || last.lng !== shelterLng || last.lat !== shelterLat) {
      coordinates.push({
        lng: shelterLng,
        lat: shelterLat,
        riskWeight: coordinates[coordinates.length - 1]?.riskWeight ?? null
      })
    }
  }

  const safetyScore = toNumber(raw.safetyScore)
  return {
    id: String(raw.shelterId ?? index + 1),
    name: raw.shelterName ? `${raw.shelterName} Evacuation Plan` : `Plan ${index + 1}`,
    type: 'evacuation',
    coordinates,
    distance: toNumber(raw.distance),
    duration: normalizeDurationMinutes(raw.estimatedTime),
    riskScore: safetyScore == null ? null : Math.max(0, Math.round((1 - safetyScore) * 100)),
    recommendation: safetyScore == null ? null : Math.round(safetyScore * 100),
    avoidedDangerCount: null,
    riskSegments: normalizeRiskSegments(raw, coordinates, safetyScore),
    steps: createRouteSteps(raw, coordinates),
    raw
  }
}

function normalizeCoordinate(raw: any): EmergencyRouteCoordinate | null {
  const lng = Number(raw?.longitude ?? raw?.lng)
  const lat = Number(raw?.latitude ?? raw?.lat)
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null

  return {
    id: raw?.id ?? raw?.nodeId,
    nodeId: raw?.nodeId ?? raw?.id,
    lng,
    lat,
    riskWeight: readRiskWeight(raw)
  }
}

function normalizeRiskSegments(raw: any, coordinates: EmergencyRouteCoordinate[], safetyScore: number | null) {
  const explicitSegments = Array.isArray(raw?.riskSegments)
    ? raw.riskSegments
    : Array.isArray(raw?.segments)
      ? raw.segments
      : Array.isArray(raw?.edges)
        ? raw.edges
        : []

  if (explicitSegments.length) {
    return explicitSegments
      .map((segment: any, index: number) => {
        const from = normalizeCoordinate(segment.from || segment.start || segment.startNode || segment.source)
        const to = normalizeCoordinate(segment.to || segment.end || segment.endNode || segment.target)
        if (!from || !to) return null
        return {
          id: String(segment.id ?? `risk-segment-${index + 1}`),
          from,
          to,
          weight: readRiskWeight(segment)
        } satisfies EmergencyRouteRiskSegment
      })
      .filter(Boolean) as EmergencyRouteRiskSegment[]
  }

  return coordinates.slice(0, -1).map((point, index) => ({
    id: `risk-segment-${index + 1}`,
    from: point,
    to: coordinates[index + 1],
    weight: point.riskWeight ?? coordinates[index + 1]?.riskWeight ?? (safetyScore == null ? null : 1 - safetyScore)
  }))
}

function createRouteSteps(raw: any, coordinates: Array<{ lng: number; lat: number }>) {
  const steps: EmergencyRouteStep[] = []
  const shelterName = raw.shelterName || 'target shelter'
  const duration = normalizeDurationMinutes(raw.estimatedTime)

  steps.push({
    id: `start-${raw.shelterId ?? Math.random()}`,
    title: 'Start from the selected point',
    description: 'Move along the highlighted evacuation line and keep watching for on-site guidance.'
  })

  if (coordinates.length > 2) {
    steps.push({
      id: `mid-${raw.shelterId ?? Math.random()}`,
      title: 'Continue along the main evacuation path',
      description: `Current route distance is about ${formatDistance(raw.distance)}. Stay on the recommended path as much as possible.`
    })
  }

  steps.push({
    id: `end-${raw.shelterId ?? Math.random()}`,
    title: `Arrive at ${shelterName}`,
    description: duration == null ? 'Follow staff instructions after arrival.' : `Estimated arrival in about ${Math.max(1, Math.round(duration))} minutes.`,
    time: duration == null ? '' : `${Math.max(1, Math.round(duration))}min`
  })

  return steps
}

function createShelterServices(type: string) {
  const text = String(type || '').toLowerCase()
  if (text.includes('medical')) return ['Medical aid', 'Emergency medicine', 'Basic supplies']
  if (text.includes('supply')) return ['Supply pickup', 'Drinking water', 'Emergency food']
  if (text.includes('temporary')) return ['Temporary shelter', 'Rest area', 'Registration']
  return ['Temporary shelter', 'Route guidance', 'Basic supplies']
}

function normalizeShelterType(value: string) {
  const text = String(value || '').toLowerCase()
  if (text.includes('medical')) return 'medical'
  if (text.includes('supply')) return 'supply'
  if (text.includes('temporary')) return 'temporary'
  return 'shelter'
}

function defaultIntensity(disasterType: DisasterType) {
  if (disasterType === 'EARTHQUAKE') return 5.5
  if (disasterType === 'FIRE') return 3
  return 50
}

function readRiskWeight(raw: any) {
  return toNumber(
    raw?.riskWeight ??
    raw?.disasterWeight ??
    raw?.dangerWeight ??
    raw?.weight ??
    raw?.riskScore ??
    raw?.risk ??
    raw?.cost
  )
}

function normalizeDurationMinutes(value: unknown) {
  const seconds = toNumber(value)
  if (seconds == null) return null
  return Math.max(seconds / 60, 1)
}

function formatDistance(value: unknown) {
  const distance = toNumber(value)
  if (distance == null) return '--'
  return distance >= 1000 ? `${(distance / 1000).toFixed(1)}km` : `${Math.round(distance)}m`
}

function toNumber(value: unknown) {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}
