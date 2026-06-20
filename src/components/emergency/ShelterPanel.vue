<template>
  <section class="shelter-shell glass-panel">
    <div class="panel-head">
      <div>
        <p class="section-kicker">Nearby Shelter</p>
        <h3>避难点列表</h3>
      </div>
      <el-select :model-value="selectedType" size="small" @change="(value) => $emit('update:type', value)">
        <el-option v-for="item in tabs" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>

    <div v-if="shelters.length" class="list-shell">
      <article v-for="item in shelters" :key="String(item.id)" class="shelter-card">
        <div class="card-top">
          <div>
            <strong>{{ item.name }}</strong>
            <p>{{ item.address || item.type }}</p>
          </div>
          <span class="distance">{{ formatDistance(item.distance) }}</span>
        </div>

        <div class="meta-row">
          <span>剩余容量 {{ remaining(item) }}</span>
          <span>{{ item.status || '开放中' }}</span>
        </div>

        <div class="tag-row">
          <span v-for="service in item.services.slice(0, 3)" :key="service" class="tag">{{ service }}</span>
        </div>

        <div class="action-row">
          <el-button class="ghost-btn" text @click="$emit('detail', item)">查看详情</el-button>
          <el-button v-if="!isPending(item)" class="solid-btn" @click="$emit('navigate', item)">导航前往</el-button>
          <el-button
            v-else
            class="confirm-btn"
            :loading="isArriving(item)"
            @click="$emit('arrive', item)"
          >
            确认到达
          </el-button>
        </div>
      </article>
    </div>

    <div v-else class="empty-block">
      <strong>暂无可展示的避难点</strong>
      <p>完成灾情路线规划后，关联避难点会显示在这里。</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EmergencyShelterType, ShelterItem } from '@/types/emergency'

const props = defineProps<{
  shelters: ShelterItem[]
  selectedType: EmergencyShelterType | 'all'
  pendingArrivalIds?: string[]
  arrivingShelterIds?: string[]
}>()

defineEmits<{
  (event: 'update:type', value: EmergencyShelterType | 'all'): void
  (event: 'detail', item: ShelterItem): void
  (event: 'navigate', item: ShelterItem): void
  (event: 'arrive', item: ShelterItem): void
}>()

const tabs = [
  { value: 'all', label: '全部' },
  { value: 'shelter', label: '避难所' },
  { value: 'temporary', label: '临时安置' },
  { value: 'medical', label: '医疗' },
  { value: 'supply', label: '物资' }
] satisfies { value: EmergencyShelterType | 'all'; label: string }[]

const pendingSet = computed(() => new Set((props.pendingArrivalIds || []).map(String)))
const arrivingSet = computed(() => new Set((props.arrivingShelterIds || []).map(String)))

function formatDistance(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return '--'
  return value >= 1000 ? `${(value / 1000).toFixed(1)} km` : `${Math.round(value)} m`
}

function remaining(item: ShelterItem) {
  if (item.capacity == null || item.occupancy == null) return '--'
  return Math.max(item.capacity - item.occupancy, 0)
}

function isPending(item: ShelterItem) {
  return pendingSet.value.has(String(item.id))
}

function isArriving(item: ShelterItem) {
  return arrivingSet.value.has(String(item.id))
}
</script>

<style scoped>
.shelter-shell {
  height: 100%;
  min-height: 0;
  padding: 20px;
  border-radius: 30px;
  display: flex;
  flex-direction: column;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 18px 44px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(22px);
}

.panel-head,
.card-top,
.meta-row,
.action-row {
  display: flex;
}

.panel-head,
.card-top,
.meta-row {
  justify-content: space-between;
  gap: 12px;
}

.section-kicker {
  margin: 0 0 6px;
  font-size: 0.74rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(245, 241, 232, 0.54);
}

.panel-head h3,
.shelter-card strong,
.empty-block strong {
  color: #fff7ea;
}

.list-shell {
  display: grid;
  gap: 12px;
  margin-top: 16px;
  min-height: 0;
  overflow-y: auto;
  padding-right: 6px;
}

.shelter-card,
.empty-block {
  padding: 16px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
}

.shelter-card p,
.meta-row,
.distance,
.empty-block p {
  color: rgba(245, 241, 232, 0.7);
}

.empty-block {
  margin-top: 16px;
}

.empty-block p {
  margin-top: 10px;
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
  background: rgba(169, 193, 140, 0.16);
  color: #dff2bf;
  font-size: 0.78rem;
}

.action-row {
  gap: 10px;
  margin-top: 12px;
  align-items: center;
}

.solid-btn,
.ghost-btn,
.confirm-btn {
  --el-button-bg-color: transparent;
  --el-button-border-color: rgba(255, 255, 255, 0.14);
  --el-button-text-color: #f5f1e8;
  --el-button-hover-text-color: #ffffff;
  --el-button-hover-bg-color: rgba(255, 255, 255, 0.1);
  --el-button-hover-border-color: rgba(255, 255, 255, 0.2);
}

.solid-btn,
.confirm-btn {
  border-radius: 999px;
}

.confirm-btn {
  --el-button-bg-color: rgba(169, 193, 140, 0.16);
  --el-button-border-color: rgba(169, 193, 140, 0.24);
  --el-button-text-color: #e5f6c8;
}
</style>
