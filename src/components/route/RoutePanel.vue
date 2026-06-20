<template>
  <aside class="route-panel">
    <div class="panel-flip" :class="{ indoor: viewMode === 'indoor' }">
      <section v-show="viewMode === 'outdoor' || !isMobile" class="panel-face glass-panel outdoor-face">
        <section class="panel-section location-section">
          <div class="section-head">
            <div>
              <p class="section-kicker">Current Context</p>
              <h2>当前位置</h2>
            </div>
            <el-button class="ghost-btn" text :loading="loadingLocation" @click="$emit('refresh-location')">
              刷新
            </el-button>
          </div>

          <div class="location-card">
            <div class="location-meta">
              <span class="scene-tag">{{ sceneModeLabel }}</span>
              <strong>{{ currentLocation?.areaName || '等待识别当前位置' }}</strong>
            </div>
            <p>{{ currentLocation?.regionName || '系统将自动识别景区、校区或室内位置' }}</p>
            <div class="location-grid">
              <div>
                <span>建筑</span>
                <strong>{{ currentLocation?.buildingName || '--' }}</strong>
              </div>
              <div>
                <span>楼层</span>
                <strong>{{ currentLocation?.floorName || '--' }}</strong>
              </div>
              <div>
                <span>拥挤度</span>
                <strong>{{ currentLocation?.crowdLevel || '--' }}</strong>
              </div>
              <div>
                <span>坐标</span>
                <strong>{{ coordinateText }}</strong>
              </div>
            </div>
          </div>
        </section>

        <section class="panel-section">
          <div class="section-head">
            <div>
              <p class="section-kicker">Manual Origin</p>
              <h2>手动起点坐标</h2>
            </div>
          </div>

          <div class="location-card">
            <div class="coordinate-input-grid">
              <el-input
                :model-value="manualLatitude"
                class="planner-input"
                placeholder="纬度，例如 32.060255"
                @update:model-value="(value) => $emit('update:manual-latitude', String(value || ''))"
              />
              <el-input
                :model-value="manualLongitude"
                class="planner-input"
                placeholder="经度，例如 118.796877"
                @update:model-value="(value) => $emit('update:manual-longitude', String(value || ''))"
              />
            </div>
            <div class="manual-origin-actions">
              <el-button class="solid-btn" @click="$emit('apply-manual-coordinate')">应用为起点</el-button>
              <span class="manual-origin-tip">地图点击获取到的坐标也会同步到这里</span>
            </div>
          </div>
        </section>

        <section class="panel-section">
          <div class="section-head">
            <div>
              <p class="section-kicker">Destination</p>
              <h2>目的地输入</h2>
            </div>
          </div>

          <el-autocomplete
            v-model="destinationKeyword"
            class="planner-input"
            clearable
            :fetch-suggestions="handleDestinationSearch"
            placeholder="搜索校区 POI"
            @update:model-value="handleDestinationInput"
            @select="handleDestinationSelect"
            @clear="clearDestination"
          >
            <template #default="{ item }">
              <div class="suggestion-row">
                <strong>{{ item.name }}</strong>
                <span>{{ item.source === 'amap' ? '高德地点' : (item.subtitle || item.type || '后端 POI') }}</span>
              </div>
            </template>
          </el-autocomplete>
          <p class="route-source-tip">{{ routeSourceTip }}</p>
        </section>

        <section class="panel-section">
          <div class="section-head">
            <div>
              <p class="section-kicker">Multi Stop</p>
              <h2>多目标点规划</h2>
            </div>
            <el-button class="solid-btn" @click="$emit('add-waypoint')">添加地点</el-button>
          </div>

          <div class="waypoint-list">
            <article
              v-for="(waypoint, index) in waypoints"
              :key="waypoint.id"
              class="waypoint-card"
              draggable="true"
              @dragstart="onDragStart(waypoint.id)"
              @dragover.prevent
              @drop="onDrop(waypoint.id)"
            >
              <span class="waypoint-index">{{ index + 1 }}</span>
              <div class="waypoint-body">
                <el-autocomplete
                  :model-value="waypoint.keyword"
                  class="planner-input waypoint-input"
                  clearable
                  :fetch-suggestions="(query, cb) => handleWaypointSearch(waypoint.id, query, cb)"
                  placeholder="添加目标点"
                  @update:model-value="(value) => updateWaypointKeyword(waypoint.id, value)"
                  @select="(item) => handleWaypointSelect(waypoint.id, item)"
                >
                  <template #default="{ item }">
                    <div class="suggestion-row">
                      <strong>{{ item.name }}</strong>
                      <span>{{ item.source === 'amap' ? '高德地点' : (item.subtitle || item.type || '后端 POI') }}</span>
                    </div>
                  </template>
                </el-autocomplete>
                <small>{{ waypoint.poi?.address || waypoint.poi?.buildingName || waypoint.poi?.floorName || '可拖拽排序；若已添加多目标点，目的地可以留空' }}</small>
              </div>
              <el-button class="ghost-icon" text @click="$emit('remove-waypoint', waypoint.id)">删除</el-button>
            </article>
          </div>
        </section>

        <section class="panel-section compact-section">
          <div class="section-head">
            <div>
              <p class="section-kicker">Provider</p>
              <h2>导航接口</h2>
            </div>
          </div>

          <el-radio-group :model-value="routeProvider" class="pill-group" @change="(value) => $emit('update:route-provider', value)">
            <el-radio-button value="amap">高德导航</el-radio-button>
            <el-radio-button value="backend">后端接口</el-radio-button>
          </el-radio-group>
        </section>

        <section class="panel-section compact-section">
          <div class="section-head">
            <div>
              <p class="section-kicker">Navigation View</p>
              <h2>导航界面</h2>
            </div>
          </div>

          <div class="view-mode-row">
            <el-button class="mode-btn" :type="viewMode === 'outdoor' ? 'primary' : 'default'" @click="$emit('toggle-view', 'outdoor')">
              室外界面
            </el-button>
            <el-button class="mode-btn" :type="viewMode === 'indoor' ? 'primary' : 'default'" @click="$emit('toggle-view', 'indoor')">
              室内导航
            </el-button>
          </div>
        </section>

        <section class="panel-section compact-section">
          <div class="section-head">
            <div>
              <p class="section-kicker">Strategy</p>
              <h2>规划策略</h2>
            </div>
          </div>

          <el-radio-group :model-value="strategy" class="pill-group" @change="(value) => $emit('update:strategy', value)">
            <el-radio-button value="distance">最短距离</el-radio-button>
            <el-radio-button value="time">最短时间</el-radio-button>
            <el-radio-button value="transport">交通工具路线</el-radio-button>
          </el-radio-group>
        </section>

        <section v-if="strategy === 'transport'" class="panel-section compact-section">
          <div class="section-head">
            <div>
              <p class="section-kicker">Transport Strategy</p>
              <h2>是否允许步行与骑车混合规划</h2>
            </div>
          </div>

          <div class="transport-toggle-row">
            <el-button
              class="transport-toggle-btn"
              :type="transportMixed ? 'primary' : 'default'"
              @click="$emit('update:transport-mixed', true)"
            >
              允许混合
            </el-button>
            <el-button
              class="transport-toggle-btn"
              :type="transportMixed ? 'default' : 'primary'"
              @click="$emit('update:transport-mixed', false)"
            >
              不混合
            </el-button>
          </div>
          <p class="route-source-tip">
            允许混合表示后端按 `mixed=true` 规划，可在同一路线中混用步行和骑车。
            不混合表示后端按 `mixed=false` 规划，全程按纯交通工具路线规划。
          </p>
        </section>

        <section class="panel-section action-section">
          <el-alert v-if="planningError" type="error" :closable="false" show-icon>
            {{ planningError }}
          </el-alert>
          <el-button class="plan-btn" type="primary" size="large" :loading="loading" @click="$emit('plan')">
            立即规划路线
          </el-button>
        </section>
      </section>

      <section v-show="viewMode === 'indoor' || !isMobile" class="panel-face glass-panel indoor-face">
        <section class="panel-section compact-section">
          <div class="section-head">
            <div>
              <p class="section-kicker">Navigation View</p>
              <h2>导航界面</h2>
            </div>
          </div>

          <div class="view-mode-row">
            <el-button class="mode-btn" :type="viewMode === 'outdoor' ? 'primary' : 'default'" @click="$emit('toggle-view', 'outdoor')">
              室外界面
            </el-button>
            <el-button class="mode-btn" :type="viewMode === 'indoor' ? 'primary' : 'default'" @click="$emit('toggle-view', 'indoor')">
              室内导航
            </el-button>
          </div>
        </section>

        <section class="panel-section">
          <div class="section-head">
            <div>
              <p class="section-kicker">Indoor API</p>
              <h2>室内导航参数</h2>
            </div>
          </div>

          <div class="location-card indoor-form-card">
            <div class="indoor-form-grid">
              <div class="indoor-field">
                <label>建筑物 ID</label>
                <el-input
                  :model-value="indoorRequest.buildingId"
                  class="planner-input"
                  placeholder="例如 1"
                  @update:model-value="(value) => $emit('update:indoor-request', { buildingId: String(value || '') })"
                />
              </div>

              <div class="indoor-field">
                <label>起点名称</label>
                <el-input
                  :model-value="indoorRequest.startNodeName"
                  class="planner-input"
                  placeholder="例如 1F 主入口"
                  @update:model-value="(value) => $emit('update:indoor-request', { startNodeName: String(value || '') })"
                />
              </div>

              <div class="indoor-field">
                <label>终点名称</label>
                <el-input
                  :model-value="indoorRequest.endNodeName"
                  class="planner-input"
                  placeholder="例如 2F 共享空间"
                  @update:model-value="(value) => $emit('update:indoor-request', { endNodeName: String(value || '') })"
                />
              </div>
            </div>
          </div>
        </section>

        <section class="panel-section compact-section">
          <div class="section-head">
            <div>
              <p class="section-kicker">Strategy</p>
              <h2>规划说明</h2>
            </div>
          </div>

          <div class="location-card">
            <p class="indoor-note">室内导航由后端按最短距离逻辑规划，这里不混用室外交通方式。</p>
          </div>
        </section>

        <section class="panel-section action-section">
          <el-alert v-if="planningError" type="error" :closable="false" show-icon>
            {{ planningError }}
          </el-alert>
          <el-button class="plan-btn" type="primary" size="large" :loading="loading" @click="$emit('plan')">
            立即规划室内路线
          </el-button>
        </section>
      </section>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { IndoorRouteRequest, PoiSuggestion, RouteLocationContext, RouteProvider, RouteStrategy, TransportMode, WaypointItem } from '@/types/route-planner'

const props = defineProps<{
  currentLocation: RouteLocationContext | null
  destination: PoiSuggestion | null
  waypoints: WaypointItem[]
  strategy: RouteStrategy
  transportMode: TransportMode
  transportMixed: boolean
  routeProvider: RouteProvider
  transportOptions: { label: string; value: string }[]
  viewMode: 'outdoor' | 'indoor'
  planningError: string
  loading: boolean
  loadingLocation: boolean
  manualLatitude: string
  manualLongitude: string
  indoorRequest: IndoorRouteRequest
  searchDestination: (keyword: string) => Promise<PoiSuggestion[]>
  searchWaypoint: (waypointId: string, keyword: string) => Promise<PoiSuggestion[]>
}>()

const emit = defineEmits<{
  (event: 'refresh-location'): void
  (event: 'update:manual-latitude', value: string): void
  (event: 'update:manual-longitude', value: string): void
  (event: 'apply-manual-coordinate'): void
  (event: 'update:destination', poi: PoiSuggestion | null): void
  (event: 'add-waypoint'): void
  (event: 'remove-waypoint', id: string): void
  (event: 'reorder-waypoints', fromId: string, toId: string): void
  (event: 'update-waypoint-keyword', id: string, keyword: string): void
  (event: 'update-waypoint-poi', id: string, poi: PoiSuggestion | null): void
  (event: 'update:strategy', value: RouteStrategy): void
  (event: 'update:transport-mode', value: TransportMode): void
  (event: 'update:transport-mixed', value: boolean): void
  (event: 'update:route-provider', value: RouteProvider): void
  (event: 'update:indoor-request', value: Partial<IndoorRouteRequest>): void
  (event: 'toggle-view', value: 'outdoor' | 'indoor'): void
  (event: 'plan'): void
}>()

const destinationKeyword = ref('')
const dragSourceId = ref('')
const isMobile = ref(false)

watch(
  () => props.destination,
  (value) => {
    destinationKeyword.value = value?.name || ''
  },
  { immediate: true }
)

onMounted(() => {
  syncViewport()
  window.addEventListener('resize', syncViewport)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncViewport)
})

const sceneModeLabel = computed(() => {
  if (props.currentLocation?.sceneMode === 'SCENIC') return '景区模式'
  if (props.currentLocation?.sceneMode === 'CAMPUS') return '校区模式'
  if (props.currentLocation?.sceneMode === 'INDOOR') return '室内模式'
  return '自动识别'
})

const coordinateText = computed(() => {
  const point = props.currentLocation?.location
  if (!point || point.lat == null || point.lng == null) return '--'
  return `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`
})

const routeSourceTip = computed(() => {
  if (props.routeProvider === 'backend') {
    return '当前为后端接口模式，目标点需要命中后端 POI；如果已经添加多目标点，目的地输入可以留空。'
  }
  return '当前为高德导航模式，可直接输入地点名称，系统会自动解析坐标并规划路线。'
})

function handleDestinationSearch(queryString: string, cb: (items: PoiSuggestion[]) => void) {
  props.searchDestination(queryString).then(cb).catch(() => cb([]))
}

function handleDestinationInput(value: string) {
  const next = String(value || '')
  if (props.destination?.name && props.destination.name !== next) {
    emit('update:destination', null)
  }
}

function handleDestinationSelect(item: PoiSuggestion) {
  emit('update:destination', item)
}

function clearDestination() {
  emit('update:destination', null)
}

function handleWaypointSearch(waypointId: string, queryString: string, cb: (items: PoiSuggestion[]) => void) {
  props.searchWaypoint(waypointId, queryString).then(cb).catch(() => cb([]))
}

function handleWaypointSelect(waypointId: string, poi: PoiSuggestion) {
  emit('update-waypoint-poi', waypointId, poi)
}

function updateWaypointKeyword(waypointId: string, keyword: string) {
  emit('update-waypoint-keyword', waypointId, keyword)
}

function onDragStart(id: string) {
  dragSourceId.value = id
}

function onDrop(targetId: string) {
  if (!dragSourceId.value || dragSourceId.value === targetId) return
  emit('reorder-waypoints', dragSourceId.value, targetId)
  dragSourceId.value = ''
}

function syncViewport() {
  isMobile.value = window.innerWidth <= 768
}
</script>

<style scoped>
.route-panel {
  position: relative;
  height: 100%;
  perspective: 1600px;
}

.panel-flip {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.7s ease;
}

.panel-flip.indoor {
  transform: rotateY(180deg);
}

.panel-face {
  position: absolute;
  inset: 0;
  padding: 20px;
  border-radius: 30px;
  overflow-y: auto;
  backface-visibility: hidden;
}

.indoor-face {
  transform: rotateY(180deg);
}

.glass-panel {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 18px 44px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(22px);
}

.panel-section + .panel-section {
  margin-top: 18px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.section-kicker {
  margin: 0 0 6px;
  font-size: 0.74rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(245, 241, 232, 0.54);
}

.section-head h2 {
  font-size: 1.05rem;
  color: #fff7ea;
}

.location-card,
.waypoint-card {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
}

.location-card {
  padding: 18px;
}

.location-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.location-meta strong {
  color: #fff;
  font-size: 1rem;
}

.scene-tag {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(169, 193, 140, 0.16);
  color: #dff2bf;
  font-size: 0.76rem;
}

.location-card p,
.waypoint-body small,
.manual-origin-tip,
.route-source-tip,
.indoor-note,
.indoor-field label {
  color: rgba(245, 241, 232, 0.7);
  line-height: 1.65;
}

.location-grid,
.coordinate-input-grid,
.indoor-form-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.indoor-form-grid {
  grid-template-columns: 1fr;
}

.location-grid div,
.indoor-field {
  padding: 12px;
  border-radius: 18px;
  background: rgba(0, 0, 0, 0.14);
}

.location-grid span {
  display: block;
  font-size: 0.78rem;
  color: rgba(245, 241, 232, 0.54);
}

.location-grid strong {
  display: block;
  margin-top: 6px;
  color: #fff;
}

.manual-origin-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
}

.planner-input {
  width: 100%;
}

.planner-input :deep(.el-input__wrapper) {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: none;
}

.suggestion-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.suggestion-row strong {
  color: #1b1f1c;
}

.suggestion-row span {
  color: #6d746d;
  font-size: 0.86rem;
}

.route-source-tip {
  margin-top: 10px;
  font-size: 0.92rem;
}

.waypoint-list {
  display: grid;
  gap: 10px;
}

.waypoint-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  cursor: grab;
}

.waypoint-index {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #8fb06e 0%, #5d9f81 100%);
  color: #fff;
  font-weight: 700;
  flex-shrink: 0;
}

.waypoint-body {
  flex: 1;
}

.waypoint-input {
  margin-bottom: 8px;
}

.pill-group {
  display: flex;
  flex-wrap: wrap;
}

.view-mode-row,
.transport-toggle-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.mode-btn,
.transport-toggle-btn {
  border-radius: 18px;
}

.pill-group :deep(.el-radio-button__inner) {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f5f1e8;
  box-shadow: none;
}

.pill-group :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: rgba(169, 193, 140, 0.18);
  border-color: rgba(169, 193, 140, 0.2);
  color: #e5f6c8;
}

.transport-toggle-btn {
  width: 100%;
}

.action-section {
  display: grid;
  gap: 14px;
}

.plan-btn {
  height: 54px;
  border: none;
  border-radius: 18px;
  background: linear-gradient(135deg, #8fb06e 0%, #5d9f81 100%);
  box-shadow: 0 18px 34px rgba(87, 129, 88, 0.28);
}

.solid-btn,
.ghost-btn,
.ghost-icon {
  --el-button-bg-color: transparent;
  --el-button-border-color: rgba(255, 255, 255, 0.14);
  --el-button-text-color: #f5f1e8;
  --el-button-hover-text-color: #ffffff;
  --el-button-hover-bg-color: rgba(255, 255, 255, 0.1);
  --el-button-hover-border-color: rgba(255, 255, 255, 0.2);
}

.solid-btn {
  border-radius: 999px;
}

.indoor-form-card {
  display: grid;
  gap: 14px;
}

@media (max-width: 768px) {
  .route-panel {
    height: auto;
    perspective: none;
  }

  .panel-flip,
  .panel-flip.indoor {
    transform: none;
  }

  .panel-face {
    position: relative;
    backface-visibility: visible;
  }

  .indoor-face {
    transform: none;
  }

  .location-grid,
  .coordinate-input-grid,
  .view-mode-row,
  .transport-toggle-row {
    grid-template-columns: 1fr;
  }

  .manual-origin-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
