<template>
  <div class="emergency-page">
    <header class="topbar glass-strip">
      <div class="topbar-main">
        <div>
          <p class="section-kicker">Emergency Navigation</p>
          <h1>灾情预防与疏散规划</h1>
          <p class="topbar-subtitle">{{ activeDestination?.name || '选择景区后开始规划灾情疏散路线' }}</p>
        </div>
      </div>

      <div class="topbar-side">
        <div class="area-badge">
          <span>当前状态</span>
          <strong>{{ statusLabel }}</strong>
        </div>
        <div class="area-badge">
          <span>最近更新</span>
          <strong>{{ lastUpdatedAt }}</strong>
        </div>
      </div>
    </header>

    <main class="planner-layout">
      <aside class="control-shell glass-panel">
        <section class="panel-section">
          <div class="section-head">
            <div>
              <p class="section-kicker">Current Context</p>
              <h2>当前状态</h2>
            </div>
            <el-button class="ghost-btn" text :loading="loading" @click="refreshLocation">刷新定位</el-button>
          </div>

          <div class="info-card">
            <div class="info-top">
              <span class="scene-tag">{{ emergencyInfo?.level || '--' }}</span>
              <strong>{{ activeDestination?.name || '暂未选择景区' }}</strong>
            </div>
            <p>{{ emergencyInfo?.description || '请先选择景区、灾情类型和策略。' }}</p>
            <div class="info-grid">
              <div>
                <span>当前时间</span>
                <strong>{{ nowText }}</strong>
              </div>
              <div>
                <span>当前位置</span>
                <strong>{{ coordinateText }}</strong>
              </div>
            </div>
          </div>
        </section>

        <section class="panel-section">
          <div class="section-head">
            <div>
              <p class="section-kicker">Disaster Type</p>
              <h2>灾情场景</h2>
            </div>
          </div>

          <div class="selector-wrap">
            <DisasterSelector :model-value="disasterType" @update:modelValue="setDisasterType" />
          </div>
        </section>

        <section class="panel-section">
          <div class="section-head">
            <div>
              <p class="section-kicker">Destination</p>
              <h2>景区 / 校区</h2>
            </div>
          </div>

          <p class="destination-note">当前灾情预防仅对接后端支持的 3 个固定目的地。</p>

          <div class="destination-pills">
            <button
              v-for="item in destinations"
              :key="String(item.id)"
              :class="['destination-pill', { active: activeDestination?.id === item.id }]"
              @click="setActiveDestination(item)"
            >
              <strong>{{ item.name }}</strong>
              <span>{{ item.type || item.address || '可用于疏散规划' }}</span>
            </button>
          </div>
        </section>

        <section class="panel-section">
          <div class="section-head">
            <div>
              <p class="section-kicker">Planning Params</p>
              <h2>规划参数</h2>
            </div>
          </div>

          <div class="info-card">
            <div class="param-head">
              <strong>{{ intensityMeta.label }}</strong>
              <span>{{ intensityMeta.hint }}</span>
            </div>

            <el-slider
              :model-value="intensity"
              :min="intensityMeta.min"
              :max="intensityMeta.max"
              :step="intensityMeta.step"
              show-input
              input-size="small"
              @update:model-value="(value) => setIntensity(Number(value))"
            />

            <div class="request-grid">
              <div>
                <span>destinationId</span>
                <strong>{{ activeDestination?.id || '--' }}</strong>
              </div>
              <div>
                <span>currentLat</span>
                <strong>{{ formatCoordinate((manualStartLocation || currentLocation)?.lat) }}</strong>
              </div>
              <div>
                <span>currentLng</span>
                <strong>{{ formatCoordinate((manualStartLocation || currentLocation)?.lng) }}</strong>
              </div>
              <div>
                <span>intensity</span>
                <strong>{{ intensity }}</strong>
              </div>
            </div>
          </div>
        </section>

        <section class="panel-section compact-section">
          <div class="section-head">
            <div>
              <p class="section-kicker">Strategy</p>
              <h2>疏散策略</h2>
            </div>
          </div>

          <el-radio-group :model-value="strategy" class="pill-group" @change="(value) => setStrategy(value)">
            <el-radio-button value="FASTEST">最快路线</el-radio-button>
            <el-radio-button value="SAFEST">最安全路线</el-radio-button>
            <el-radio-button value="BALANCED">平衡策略</el-radio-button>
          </el-radio-group>
        </section>

        <section class="panel-section compact-section">
          <div class="section-head">
            <div>
              <p class="section-kicker">Map Layers</p>
              <h2>地图图层</h2>
            </div>
          </div>

          <div class="layer-list">
            <div v-for="item in layerItems" :key="item.key" class="layer-row">
              <span>{{ item.label }}</span>
              <el-switch :model-value="layerVisibility[item.key]" @change="(value) => updateLayerVisibility(item.key, Boolean(value))" />
            </div>
          </div>
        </section>

        <section class="panel-section action-section">
          <el-alert v-if="errorMessage" type="error" :closable="false" show-icon>
            {{ errorMessage }}
          </el-alert>
          <div class="quick-actions">
            <el-button class="ghost-btn" text @click="callEmergency">应急电话</el-button>
            <el-button class="ghost-btn" text @click="callSOS">SOS</el-button>
          </div>
          <p class="action-note">当前仅对接后端支持的 3 个目的地：`170`、`201`、`202`。</p>
          <el-button class="plan-btn" type="primary" size="large" :loading="loading" @click="handlePlanRoute">
            开始规划
          </el-button>
        </section>
      </aside>

      <section class="map-shell glass-panel">
        <EmergencyMap
          :current-location="currentLocation"
          :destination="activeDestination"
          :shelters="shelters"
          :danger-zones="dangerZones"
          :routes="routes"
          :active-route-id="activeRouteId"
          :disaster-type="disasterType"
          :layer-visibility="layerVisibility"
          @change-route="setActiveRoute"
          @pick-coordinate="handlePickCoordinate"
          @relocate="refreshLocation"
          @refresh="fetchAll"
          @select-shelter="handleShelterDetail"
        />
      </section>

      <aside class="result-column">
        <RoutePanel
          :route="activeRoute"
          :danger-roads="dangerRoads"
          :disaster-type="disasterType"
          :strategy="strategy"
          :intensity="intensity"
          :destination-name="activeDestination?.name"
        />
        <ShelterPanel
          :shelters="filteredShelters"
          :selected-type="selectedShelterType"
          :pending-arrival-ids="pendingArrivalIds"
          :arriving-shelter-ids="arrivingShelterIds"
          @update:type="setShelterType"
          @detail="handleShelterDetail"
          @navigate="handleNavigateShelter"
          @arrive="handleArriveShelter"
        />
      </aside>
    </main>

    <el-dialog v-model="detailVisible" width="520px" destroy-on-close>
      <template #header>
        <h3>{{ selectedShelter?.name || '避难点详情' }}</h3>
      </template>
      <div v-if="selectedShelter" class="detail-body">
        <p><strong>类型：</strong>{{ selectedShelter.type }}</p>
        <p><strong>地址：</strong>{{ selectedShelter.address || '--' }}</p>
        <p><strong>剩余容量：</strong>{{ remainingCapacity }}</p>
        <p><strong>当前收容：</strong>{{ selectedShelter.occupancy ?? '--' }}</p>
        <div class="tag-row">
          <span v-for="service in selectedShelter.services" :key="service" class="tag">{{ service }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import DisasterSelector from './DisasterSelector.vue'
import EmergencyAlert from './EmergencyAlert.vue'
import EmergencyMap from './EmergencyMap.vue'
import RoutePanel from './RoutePanel.vue'
import ShelterPanel from './ShelterPanel.vue'
import { useEmergencyStore } from '@/stores/emergency'
import type { LayerVisibility, ShelterItem } from '@/types/emergency'

const store = useEmergencyStore()
const {
  activeDestination,
  activeRoute,
  activeRouteId,
  currentLocation,
  dangerRoads,
  dangerZones,
  destinations,
  disasterType,
  emergencyInfo,
  errorMessage,
  filteredShelters,
  intensity,
  lastUpdatedAt,
  layerVisibility,
  loading,
  manualStartLocation,
  networkStatus,
  routes,
  selectedShelter,
  selectedShelterType,
  shelters,
  strategy
} = storeToRefs(store)

const {
  fetchAll,
  initialize,
  loadDestinations,
  markShelterArrived,
  refreshLocation,
  setActiveDestination,
  setActiveRoute,
  setDisasterType,
  setIntensity,
  setManualStartLocation,
  setSelectedShelter,
  setShelterType,
  setStrategy,
  stopPolling,
  updateLayerVisibility
} = store

const detailVisible = ref(false)
const now = ref(new Date())
const pendingArrivalIds = ref<string[]>([])
const arrivedShelterIds = ref<string[]>([])
const arrivingShelterIds = ref<string[]>([])
let clockTimer: number | null = null

const nowText = computed(() => now.value.toLocaleTimeString('zh-CN', { hour12: false }))
const coordinateText = computed(() => {
  const point = manualStartLocation.value || currentLocation.value
  if (!point) return '--'
  return `${formatCoordinate(point.lat)}, ${formatCoordinate(point.lng)}`
})
const intensityMeta = computed(() => {
  if (disasterType.value === 'EARTHQUAKE') {
    return {
      min: 1,
      max: 10,
      step: 0.1,
      label: '震级强度',
      hint: ''
    }
  }

  if (disasterType.value === 'FIRE') {
    return {
      min: 1,
      max: 10,
      step: 1,
      label: '火情等级',
      hint: '后端 FIRE 场景下，intensity 表示火势等级 1-10。'
    }
  }

  return {
    min: 0,
    max: 500,
    step: 1,
    label: '降水量 mm/h',
    hint: '后端 FLOOD_HIGH 场景下，intensity 表示降水量强度。'
  }
})
const statusLabel = computed(() => {
  if (networkStatus.value === 'error') return '接口异常'
  if (networkStatus.value === 'upgrading') return '规划计算中'
  return '数据正常'
})
const remainingCapacity = computed(() => {
  if (!selectedShelter.value || selectedShelter.value.capacity == null || selectedShelter.value.occupancy == null) return '--'
  return Math.max(selectedShelter.value.capacity - selectedShelter.value.occupancy, 0)
})

const layerItems = [
  { key: 'shelters', label: '避难点' },
  { key: 'dangerZones', label: '危险区域' },
  { key: 'safeRoutes', label: '安全路线' },
  { key: 'userLocation', label: '我的位置' },
  { key: 'medicalPoints', label: '医疗点' },
  { key: 'supplyPoints', label: '补给点' }
] satisfies { key: keyof LayerVisibility; label: string }[]

onMounted(async () => {
  await initialize()
  clockTimer = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onBeforeUnmount(() => {
  stopPolling()
  if (clockTimer) window.clearInterval(clockTimer)
})

function handlePlanRoute() {
  void fetchAll()
}

function handlePickCoordinate(location: { lat: number; lng: number }) {
  setManualStartLocation(location)
}

function handleShelterDetail(item: ShelterItem) {
  setSelectedShelter(item)
  detailVisible.value = true
}

async function handleNavigateShelter(item: ShelterItem) {
  setSelectedShelter(item)
  const shelterId = String(item.id)
  if (!pendingArrivalIds.value.includes(shelterId)) {
    pendingArrivalIds.value = [...pendingArrivalIds.value, shelterId]
  }
  ElMessage.success(`Navigation started: ${item.name}. Click Confirm Arrival when you get there.`)
}

async function handleArriveShelter(item: ShelterItem) {
  const shelterId = String(item.id)
  if (arrivingShelterIds.value.includes(shelterId)) return

  arrivingShelterIds.value = [...arrivingShelterIds.value, shelterId]
  try {
    setSelectedShelter(item)
    await markShelterArrived(item)
    pendingArrivalIds.value = pendingArrivalIds.value.filter((id) => id !== shelterId)
    ElMessage.success(`Arrival recorded: ${item.name}`)
  } catch (error: any) {
    ElMessage.error(error?.message || 'Arrival record failed')
  } finally {
    arrivingShelterIds.value = arrivingShelterIds.value.filter((id) => id !== shelterId)
  }
}

function callEmergency() {
  window.alert('紧急情况下请及时联系 120 / 119 / 110，并结合现场广播与工作人员指引疏散。')
}

function callSOS() {
  window.alert('SOS 求助信号已触发，请尽快前往推荐避难点并保持通信。')
}

function formatCoordinate(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return '--'
  return value.toFixed(6)
}
</script>

<style scoped>
.emergency-page {
  min-height: 100vh;
  padding: 88px 20px 20px;
  background:
    radial-gradient(circle at 8% 12%, rgba(56, 94, 69, 0.38), transparent 24%),
    radial-gradient(circle at 88% 8%, rgba(200, 169, 107, 0.18), transparent 20%),
    radial-gradient(circle at 50% 100%, rgba(61, 79, 94, 0.16), transparent 24%),
    linear-gradient(180deg, #0b0c0b 0%, #101411 48%, #141816 100%);
  color: #f5f1e8;
}

.glass-strip,
.glass-panel {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 18px 44px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(22px);
}

.topbar,
.topbar-main,
.topbar-side,
.section-head,
.info-top,
.layer-row,
.quick-actions {
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

.planner-layout {
  display: grid;
  grid-template-columns: minmax(300px, 25%) minmax(0, 50%) minmax(300px, 25%);
  gap: 20px;
  height: calc(100vh - 148px);
}

.control-shell,
.map-shell {
  height: 100%;
  padding: 20px;
  border-radius: 30px;
  overflow-y: auto;
}

.result-column {
  display: grid;
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  gap: 20px;
  height: 100%;
  min-height: 0;
}

.result-column > * {
  min-height: 0;
}

.panel-section + .panel-section {
  margin-top: 18px;
}

.section-head,
.info-top,
.layer-row,
.indoor-head {
  justify-content: space-between;
  gap: 12px;
}

.section-head {
  align-items: center;
  margin-bottom: 14px;
}

.section-head h2 {
  font-size: 1.05rem;
  color: #fff7ea;
}

.info-card,
.selector-wrap {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
}

.selector-wrap {
  padding: 12px;
}

.info-card {
  padding: 18px;
}

.info-top strong,
.request-grid strong {
  color: #fff;
}

.scene-tag {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(169, 193, 140, 0.16);
  color: #dff2bf;
  font-size: 0.76rem;
}

.info-card p,
.param-head span {
  color: rgba(245, 241, 232, 0.7);
  line-height: 1.65;
}

.info-grid,
.request-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.info-grid div,
.request-grid div {
  padding: 12px;
  border-radius: 18px;
  background: rgba(0, 0, 0, 0.14);
}

.info-grid span,
.request-grid span {
  display: block;
  font-size: 0.78rem;
  color: rgba(245, 241, 232, 0.54);
}

.destination-note {
  color: rgba(245, 241, 232, 0.62);
  font-size: 0.88rem;
  line-height: 1.6;
}

.destination-pills {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.destination-pill {
  padding: 14px 16px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  text-align: left;
  color: rgba(245, 241, 232, 0.74);
}

.destination-pill strong,
.destination-pill span {
  display: block;
}

.destination-pill strong {
  color: #fff;
}

.destination-pill span {
  margin-top: 6px;
  font-size: 0.84rem;
}

.destination-pill.active {
  border-color: rgba(169, 193, 140, 0.24);
  background: rgba(169, 193, 140, 0.12);
}

.info-grid strong,
.request-grid strong {
  display: block;
  margin-top: 6px;
}

.param-head {
  display: grid;
  gap: 6px;
  margin-bottom: 14px;
}

.param-head strong {
  color: #fff;
}

.compact-section .pill-group {
  display: flex;
  flex-wrap: wrap;
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

.layer-list {
  display: grid;
  gap: 12px;
}

.layer-row {
  color: rgba(245, 241, 232, 0.72);
}

.action-section {
  display: grid;
  gap: 14px;
}

.quick-actions {
  gap: 10px;
}

.action-note {
  color: rgba(245, 241, 232, 0.62);
  font-size: 0.84rem;
  line-height: 1.6;
}

.plan-btn {
  height: 54px;
  border: none;
  border-radius: 18px;
  background: linear-gradient(135deg, #8fb06e 0%, #5d9f81 100%);
  box-shadow: 0 18px 34px rgba(87, 129, 88, 0.28);
}

.ghost-btn {
  --el-button-bg-color: transparent;
  --el-button-border-color: rgba(255, 255, 255, 0.14);
  --el-button-text-color: #f5f1e8;
  --el-button-hover-text-color: #ffffff;
  --el-button-hover-bg-color: rgba(255, 255, 255, 0.1);
  --el-button-hover-border-color: rgba(255, 255, 255, 0.2);
}

.detail-body {
  color: #5c5146;
  line-height: 1.7;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.tag {
  padding: 5px 10px;
  border-radius: 999px;
  background: #f2ece3;
  color: #5c5146;
  font-size: 0.78rem;
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

  .result-column {
    height: auto;
  }
}

@media (max-width: 768px) {
  .emergency-page {
    padding: 78px 12px 18px;
  }

  .topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .topbar-side {
    justify-content: space-between;
  }

  .info-grid,
  .request-grid {
    grid-template-columns: 1fr;
  }
}
</style>
