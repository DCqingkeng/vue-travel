export type RouteSceneMode = 'SCENIC' | 'CAMPUS' | 'INDOOR' | 'UNKNOWN'
export type RouteStrategy = 'distance' | 'time' | 'transport'
export type TransportMode = 'walk' | 'bike' | 'shuttle' | 'hybrid' | 'indoor'
export type RouteProvider = 'amap' | 'backend'

export interface CoordinatePoint {
  lat: number | null
  lng: number | null
  x?: number | null
  y?: number | null
  floorId?: string | number | null
  floorName?: string
  type?: string
  label?: string
  seq?: number
}

export interface RouteLocationContext {
  id?: string | number | null
  areaName: string
  regionName?: string
  sceneMode: RouteSceneMode
  buildingName?: string
  floorId?: string | number | null
  floorName?: string
  address?: string
  location?: CoordinatePoint | null
  avatar?: string
  crowdLevel?: string
}

export interface PoiSuggestion {
  id: string | number
  name: string
  destinationId?: string | number | null
  type?: string
  subtitle?: string
  address?: string
  latitude?: number | null
  longitude?: number | null
  buildingName?: string
  floorId?: string | number | null
  floorName?: string
  indoor?: boolean
  sceneMode?: RouteSceneMode
  source?: 'backend-poi' | 'backend-destination' | 'amap'
  raw?: unknown
}

export interface WaypointItem {
  id: string
  keyword: string
  poi: PoiSuggestion | null
}

export interface RouteSummary {
  totalDistance?: number | null
  estimatedDuration?: number | null
  congestionLevel?: string
  calories?: number | null
  shuttleDistance?: number | null
  bikeDistance?: number | null
}

export interface RouteStep {
  id: string
  title: string
  description?: string
  distance?: number | null
  duration?: number | null
  transportMode?: string
  floorName?: string
}

export interface RouteSegment {
  id: string
  mode?: string
  visualType?: string
  name?: string
  fromName?: string
  toName?: string
  distance?: number | null
  duration?: number | null
  path?: CoordinatePoint[]
}

export interface IndoorFloor {
  id: string | number
  name: string
  level?: number
  nodes?: CoordinatePoint[]
}

export interface RoutePlanOption {
  id: string
  name: string
  strategy: RouteStrategy
  transportMode: TransportMode
  summary: RouteSummary
  steps: RouteStep[]
  path: CoordinatePoint[]
  segments: RouteSegment[]
  indoor: boolean
  floors: IndoorFloor[]
  currentFloorId?: string | number | null
  raw?: unknown
}

export interface IndoorRouteRequest {
  buildingId: string
  startNodeName: string
  endNodeName: string
}

export interface RoutePlannerPayload {
  strategy: RouteStrategy
  transportMode: TransportMode
  transportMixed?: boolean
  currentLocation: RouteLocationContext | null
  destination: PoiSuggestion | null
  waypoints: PoiSuggestion[]
  indoorRequest?: IndoorRouteRequest | null
}
