<template>
  <aside class="result-shell glass-panel">
    <div class="result-head">
      <div>
        <p class="section-kicker">Evacuation Result</p>
        <h2>灾情疏散结果</h2>
      </div>
      <span class="result-count">{{ route ? '已生成方案' : '等待规划' }}</span>
    </div>

    <div class="request-card">
      <div class="card-title-row">
        <div>
          <p class="section-kicker">Current Request</p>
          <h3>本次调用参数</h3>
        </div>
      </div>

      <div class="summary-grid">
        <article class="summary-card">
          <span>灾情类型</span>
          <strong>{{ disasterTypeLabel }}</strong>
        </article>
        <article class="summary-card">
          <span>规划策略</span>
          <strong>{{ strategyLabel }}</strong>
        </article>
        <article class="summary-card">
          <span>灾情强度</span>
          <strong>{{ formatIntensity(intensity) }}</strong>
        </article>
        <article class="summary-card">
          <span>目标景区</span>
          <strong>{{ destinationName || '--' }}</strong>
        </article>
      </div>
    </div>

    <div v-if="!route" class="state-block empty-block">
      <strong>等待疏散路径结果</strong>
      <p>路线摘要、疏散步骤和风险提示会在这里展示。</p>
    </div>

    <template v-else>
      <div class="summary-grid route-grid">
        <article class="summary-card">
          <span>总距离</span>
          <strong>{{ formatDistance(route.distance) }}</strong>
        </article>
        <article class="summary-card">
          <span>预计时间</span>
          <strong>{{ formatDuration(route.duration) }}</strong>
        </article>
        <article class="summary-card">
          <span>风险等级</span>
          <strong>{{ route.riskScore ?? '--' }}</strong>
        </article>
        <article class="summary-card">
          <span>推荐指数</span>
          <strong>{{ route.recommendation ?? '--' }}</strong>
        </article>
        <article class="summary-card">
          <span>方案名称</span>
          <strong>{{ route.name }}</strong>
        </article>
        <article class="summary-card">
          <span>避开危险区</span>
          <strong>{{ route.avoidedDangerCount ?? '--' }}</strong>
        </article>
      </div>

      <section class="detail-card">
        <div class="card-title-row">
          <div>
            <p class="section-kicker">Step By Step</p>
            <h3>疏散步骤卡片</h3>
          </div>
        </div>

        <el-collapse accordion>
          <el-collapse-item v-for="step in route.steps" :key="step.id" :title="step.title" :name="step.id">
            <p class="step-description">{{ step.description || '等待后端返回更详细的步骤说明。' }}</p>
            <div class="step-meta">
              <span>{{ step.time || '--' }}</span>
            </div>
          </el-collapse-item>
        </el-collapse>
      </section>
    </template>

    <section class="detail-card">
      <div class="card-title-row">
        <div>
          <p class="section-kicker">Danger Roads</p>
          <h3>高风险路段提醒</h3>
        </div>
      </div>

      <div v-if="dangerRoads.length" class="warning-list">
        <article v-for="item in dangerRoads" :key="String(item.id)" class="warning-item">
          <strong>{{ item.name }}</strong>
          <p>{{ item.reason }}</p>
          <span>{{ item.status }}</span>
        </article>
      </div>
      <div v-else class="state-block empty-block compact-empty">
        <strong>暂无额外危险路段信息</strong>
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DangerRoadItem, DisasterType, EmergencyRouteItem, EmergencyStrategy } from '@/types/emergency'

const props = defineProps<{
  route: EmergencyRouteItem | null
  dangerRoads: DangerRoadItem[]
  disasterType: DisasterType
  strategy: EmergencyStrategy
  intensity: number
  destinationName?: string
}>()

const disasterTypeLabel = computed(() => {
  const map: Record<DisasterType, string> = {
    EARTHQUAKE: '地震',
    FLOOD_HIGH: '强降雨 / 洪水',
    FIRE: '火灾'
  }
  return map[props.disasterType]
})

const strategyLabel = computed(() => {
  const map: Record<EmergencyStrategy, string> = {
    FASTEST: '最快路线',
    SAFEST: '最安全路线',
    BALANCED: '平衡策略'
  }
  return map[props.strategy]
})

function formatIntensity(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return '--'
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function formatDistance(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return '--'
  return value >= 1000 ? `${(value / 1000).toFixed(1)} km` : `${Math.round(value)} m`
}

function formatDuration(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return '--'
  return value >= 60 ? `${Math.floor(value / 60)}h ${Math.round(value % 60)}m` : `${Math.round(value)} min`
}
</script>

<style scoped>
.result-shell {
  height: 100%;
  padding: 20px;
  border-radius: 30px;
  overflow-y: auto;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 18px 44px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(22px);
}

.result-head,
.card-title-row,
.step-meta {
  display: flex;
}

.result-head,
.card-title-row {
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

.result-head h2,
.card-title-row h3 {
  color: #fff7ea;
}

.result-count {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #dff2bf;
}

.request-card,
.detail-card {
  margin-top: 18px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.summary-card,
.detail-card,
.warning-item,
.request-card {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
}

.request-card,
.detail-card {
  padding: 18px;
}

.summary-card {
  padding: 16px;
}

.summary-card span {
  display: block;
  font-size: 0.82rem;
  color: rgba(245, 241, 232, 0.56);
}

.summary-card strong {
  display: block;
  margin-top: 8px;
  color: #fff;
  font-size: 1.06rem;
}

.state-block {
  margin-top: 18px;
  border-radius: 24px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.04);
}

.empty-block strong {
  color: #fff;
}

.empty-block p {
  margin-top: 10px;
  color: rgba(245, 241, 232, 0.68);
  line-height: 1.75;
}

.compact-empty {
  margin-top: 16px;
}

.detail-card :deep(.el-collapse) {
  border: none;
  background: transparent;
}

.detail-card :deep(.el-collapse-item__header),
.detail-card :deep(.el-collapse-item__wrap) {
  background: transparent;
  color: #f5f1e8;
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.step-description {
  color: rgba(245, 241, 232, 0.74);
  line-height: 1.75;
}

.step-meta {
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
  color: rgba(245, 241, 232, 0.6);
}

.warning-list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.warning-item {
  padding: 14px;
}

.warning-item strong {
  color: #fff;
}

.warning-item p,
.warning-item span {
  color: rgba(245, 241, 232, 0.7);
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
