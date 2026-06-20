<template>
  <aside class="result-shell glass-panel">
    <div class="result-head">
      <div>
        <p class="section-kicker">Route Result</p>
        <h2>路径结果区</h2>
      </div>
      <span class="result-count">{{ plans.length }} 方案</span>
    </div>

    <div v-if="viewMode === 'indoor'" class="indoor-preview">
      <IndoorNavigator3D
        :plan="activePlan"
        :active-floor-id="activeFloorId"
        :building-id="indoorRequest.buildingId"
        @change-floor="(floorId) => $emit('change-floor', floorId)"
      />
    </div>

    <div v-if="loading" class="state-block">
      <el-skeleton :rows="6" animated />
    </div>

    <div v-else-if="!plans.length" class="state-block empty-block">
      <strong>{{ viewMode === 'indoor' ? '等待室内规划结果' : '等待规划结果' }}</strong>
      <p v-if="viewMode === 'indoor'">
        请输入建筑物、起点和终点后发起规划。若点击规划后仍没有结果，请检查节点名称是否与后端室内导航数据完全一致。
      </p>
      <p v-else>
        路线摘要、步骤详情、多方案切换和室内楼层信息会显示在这里。
      </p>
    </div>

    <template v-else-if="plans.length">
      <el-tabs
        :model-value="activePlanId"
        class="route-tabs"
        @tab-change="(name) => $emit('change-plan', String(name))"
      >
        <el-tab-pane v-for="plan in plans" :key="plan.id" :label="plan.name" :name="plan.id" />
      </el-tabs>

      <div v-if="activePlan" class="summary-grid">
        <article class="summary-card">
          <span>总距离</span>
          <strong>{{ formatDistance(activePlan.summary.totalDistance) }}</strong>
        </article>
        <article class="summary-card">
          <span>预计时间</span>
          <strong>{{ formatDuration(activePlan.summary.estimatedDuration) }}</strong>
        </article>
        <article class="summary-card">
          <span>拥挤度</span>
          <strong>{{ activePlan.summary.congestionLevel || '--' }}</strong>
        </article>
        <article class="summary-card">
          <span>热量消耗</span>
          <strong>{{ activePlan.summary.calories ? `${Math.round(activePlan.summary.calories)} kcal` : '--' }}</strong>
        </article>
        <article class="summary-card">
          <span>观光车路段</span>
          <strong>{{ formatDistance(activePlan.summary.shuttleDistance) }}</strong>
        </article>
        <article class="summary-card">
          <span>自行车路段</span>
          <strong>{{ formatDistance(activePlan.summary.bikeDistance) }}</strong>
        </article>
      </div>

      <IndoorNavigator
        v-if="viewMode !== 'indoor' && activePlan?.indoor"
        :plan="activePlan"
        :active-floor-id="activeFloorId"
        @change-floor="(floorId) => $emit('change-floor', floorId)"
      />

      <section v-if="activePlan && !(viewMode === 'indoor' && activePlan.indoor)" class="detail-card">
        <div class="card-title-row">
          <div>
            <p class="section-kicker">Step By Step</p>
            <h3>路线步骤卡片</h3>
          </div>
        </div>

        <el-collapse accordion>
          <el-collapse-item v-for="step in activePlan.steps" :key="step.id" :title="step.title" :name="step.id">
            <p class="step-description">{{ step.description || '这里会显示路线步骤详情。' }}</p>
            <div class="step-meta">
              <span>{{ formatDistance(step.distance) }}</span>
              <span>{{ formatDuration(step.duration) }}</span>
              <span>{{ step.transportMode || '--' }}</span>
            </div>
          </el-collapse-item>
        </el-collapse>
      </section>

      <section v-if="activePlan?.segments?.length && !(viewMode === 'indoor' && activePlan.indoor)" class="detail-card">
        <div class="card-title-row">
          <div>
            <p class="section-kicker">Segment Insight</p>
            <h3>分段路线详情</h3>
          </div>
        </div>

        <div class="segment-list">
          <article v-for="segment in activePlan.segments" :key="segment.id" class="segment-card">
            <div class="segment-top">
              <strong>{{ segment.fromName || '起点' }} -> {{ segment.toName || '终点' }}</strong>
              <span>{{ segment.mode || '路线' }}</span>
            </div>
            <div class="segment-meta">
              <span>{{ formatDistance(segment.distance) }}</span>
              <span>{{ formatDuration(segment.duration) }}</span>
            </div>
          </article>
        </div>
      </section>
    </template>
  </aside>
</template>

<script setup lang="ts">
import IndoorNavigator from './IndoorNavigator.vue'
import IndoorNavigator3D from './IndoorNavigator3D.vue'
import type { IndoorRouteRequest, RoutePlanOption } from '@/types/route-planner'

defineProps<{
  plans: RoutePlanOption[]
  activePlan: RoutePlanOption | null
  activePlanId: string
  activeFloorId: string | number | null
  indoorRequest: IndoorRouteRequest
  viewMode: 'outdoor' | 'indoor'
  loading: boolean
}>()

defineEmits<{
  (event: 'change-plan', planId: string): void
  (event: 'change-floor', floorId: string | number): void
}>()

function formatDistance(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return '--'
  if (value >= 1000) return `${(value / 1000).toFixed(1)} km`
  return `${Math.round(value)} m`
}

function formatDuration(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return '--'
  if (value >= 60) {
    const hour = Math.floor(value / 60)
    const minute = Math.round(value % 60)
    return `${hour}h ${minute}m`
  }
  return `${Math.round(value)} min`
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
.segment-top,
.step-meta,
.segment-meta {
  display: flex;
}

.result-head,
.card-title-row,
.segment-top {
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

.indoor-preview {
  margin-top: 18px;
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

.route-tabs {
  margin-top: 16px;
}

.route-tabs :deep(.el-tabs__item) {
  color: rgba(245, 241, 232, 0.7);
}

.route-tabs :deep(.is-active) {
  color: #fff7ea;
}

.route-tabs :deep(.el-tabs__active-bar) {
  background: #8fb06e;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.summary-card,
.detail-card,
.segment-card {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
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

.detail-card {
  margin-top: 18px;
  padding: 18px;
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

.step-meta,
.segment-meta {
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
  color: rgba(245, 241, 232, 0.6);
}

.segment-list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.segment-card {
  padding: 14px;
}

.segment-top strong {
  color: #fff;
}

.segment-top span {
  color: #dff2bf;
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
