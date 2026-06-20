export type EmergencyMode = 'normal' | 'emergency'
export type DisasterType = 'EARTHQUAKE' | 'FLOOD_HIGH' | 'FIRE'
export type EmergencyStrategy = 'FASTEST' | 'SAFEST' | 'BALANCED'
export type EmergencyShelterType = 'shelter' | 'temporary' | 'medical' | 'supply'
export type DangerStatus = 'blocked' | 'restricted' | 'caution'

export interface EmergencyLocation {
  lat: number
  lng: number
  address?: string
}

export interface EmergencyDestinationItem {
  id: string | number
  name: string
  type?: string
  address?: string
  latitude?: number | null
  longitude?: number | null
}

export interface EmergencyInfo {
  disasterType: DisasterType
  title: string
  level: string
  description: string
  suggestions: string[]
  officialTip: string
  updatedAt?: string
}

export interface EmergencyAlertItem {
  id: string | number
  title: string
  level: string
  content: string
  status?: string
  updatedAt?: string
}

export interface ShelterItem {
  id: string | number
  name: string
  type: EmergencyShelterType | string
  lat: number
  lng: number
  capacity?: number | null
  occupancy?: number | null
  address?: string
  distance?: number | null
  status?: string
  services: string[]
}

export interface DangerZoneItem {
  id: string | number
  name: string
  riskLevel: string
  polygon: Array<[number, number]>
  description?: string
}

export interface EmergencyRouteCoordinate {
  lat: number
  lng: number
  id?: string | number
  nodeId?: string | number
  riskWeight?: number | null
}

export interface EmergencyRouteItem {
  id: string
  name: string
  type?: string
  coordinates: EmergencyRouteCoordinate[]
  distance?: number | null
  duration?: number | null
  riskScore?: number | null
  recommendation?: number | null
  avoidedDangerCount?: number | null
  riskSegments?: EmergencyRouteRiskSegment[]
  steps: EmergencyRouteStep[]
  raw?: unknown
}

export interface EmergencyRouteRiskSegment {
  id: string
  from: EmergencyRouteCoordinate
  to: EmergencyRouteCoordinate
  weight?: number | null
}

export interface EmergencyRouteStep {
  id: string
  title: string
  description?: string
  time?: string
}

export interface DangerRoadItem {
  id: string | number
  name: string
  reason: string
  riskLevel: string
  status: DangerStatus | string
}

export interface LayerVisibility {
  shelters: boolean
  dangerZones: boolean
  safeRoutes: boolean
  userLocation: boolean
  medicalPoints: boolean
  supplyPoints: boolean
}

export interface EmergencyRealtimeState {
  networkStatus: 'ok' | 'error' | 'upgrading'
  lastUpdatedAt: string
  disasterLevel: string
}
