<template>
  <section v-if="plan?.indoor" class="indoor-card">
    <div class="card-head">
      <div>
        <p class="section-kicker">Indoor Navigator</p>
        <h3>室内导航模式</h3>
      </div>
      <span class="floor-badge">{{ activeFloorName }}</span>
    </div>

    <div v-if="plan.floors.length" class="floor-switcher">
      <button
        v-for="floor in plan.floors"
        :key="String(floor.id)"
        :class="['floor-btn', { active: floor.id === activeFloorId }]"
        @click="$emit('change-floor', floor.id)"
      >
        {{ floor.name }}
      </button>
    </div>

    <div class="node-summary">
      <div>
        <span>电梯节点</span>
        <strong>{{ elevatorCount }}</strong>
      </div>
      <div>
        <span>楼梯节点</span>
        <strong>{{ stairCount }}</strong>
      </div>
      <div>
        <span>房间节点</span>
        <strong>{{ roomCount }}</strong>
      </div>
    </div>

    <div class="indoor-steps">
      <article v-for="step in floorSteps" :key="step.id" class="step-card">
        <strong>{{ step.title }}</strong>
        <p>{{ step.description || '后端返回的室内路线步骤将在这里展示。' }}</p>
        <small>{{ step.floorName || activeFloorName }}</small>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RoutePlanOption } from '@/types/route-planner'

const props = defineProps<{
  plan: RoutePlanOption | null
  activeFloorId: string | number | null
}>()

defineEmits<{
  (event: 'change-floor', floorId: string | number): void
}>()

const activeFloor = computed(() => props.plan?.floors.find((item) => item.id === props.activeFloorId) || props.plan?.floors[0] || null)
const activeFloorName = computed(() => activeFloor.value?.name || props.plan?.currentFloorId || '未识别楼层')
const floorSteps = computed(() => props.plan?.steps.filter((item) => !item.floorName || item.floorName === activeFloor.value?.name) || [])
const floorNodes = computed(() => activeFloor.value?.nodes || [])

const elevatorCount = computed(() => floorNodes.value.filter((item) => String(item.type || '').toLowerCase().includes('elevator')).length)
const stairCount = computed(() => floorNodes.value.filter((item) => String(item.type || '').toLowerCase().includes('stair')).length)
const roomCount = computed(() => floorNodes.value.filter((item) => String(item.type || '').toLowerCase().includes('room')).length)
</script>

<style scoped>
.indoor-card {
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.section-kicker {
  margin: 0 0 6px;
  font-size: 0.74rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(245, 241, 232, 0.54);
}

.card-head h3 {
  color: #fff7ea;
}

.floor-badge,
.floor-btn {
  border-radius: 999px;
}

.floor-badge {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.08);
  color: #dff2bf;
}

.floor-switcher {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.floor-btn {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  padding: 8px 14px;
  cursor: pointer;
}

.floor-btn.active {
  background: rgba(169, 193, 140, 0.18);
  border-color: rgba(169, 193, 140, 0.2);
  color: #dff2bf;
}

.node-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.node-summary div,
.step-card {
  padding: 14px;
  border-radius: 18px;
  background: rgba(0, 0, 0, 0.14);
}

.node-summary span,
.step-card small {
  color: rgba(245, 241, 232, 0.56);
}

.node-summary strong {
  display: block;
  margin-top: 6px;
  color: #fff;
}

.indoor-steps {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.step-card strong {
  color: #fff;
}

.step-card p {
  margin: 8px 0;
  color: rgba(245, 241, 232, 0.74);
  line-height: 1.65;
}

@media (max-width: 768px) {
  .node-summary {
    grid-template-columns: 1fr;
  }
}
</style>
