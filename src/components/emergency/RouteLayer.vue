<template>
  <div class="route-layer">
    <article v-for="item in routes" :key="item.id" :class="['route-chip', { active: item.id === activeRouteId }]" @click="$emit('change-route', item.id)">
      <strong>{{ item.name }}</strong>
      <span>{{ formatDistance(item.distance) }} · {{ formatDuration(item.duration) }}</span>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { EmergencyRouteItem } from '@/types/emergency'

defineProps<{
  routes: EmergencyRouteItem[]
  activeRouteId: string
}>()

defineEmits<{
  (event: 'change-route', routeId: string): void
}>()

function formatDistance(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return '--'
  return value >= 1000 ? `${(value / 1000).toFixed(1)}km` : `${Math.round(value)}m`
}

function formatDuration(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return '--'
  return value >= 60 ? `${Math.floor(value / 60)}h ${Math.round(value % 60)}m` : `${Math.round(value)}min`
}
</script>

<style scoped>
.route-layer {
  display: flex;
  gap: 10px;
  overflow-x: auto;
}

.route-chip {
  min-width: 168px;
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid rgba(212, 205, 192, 0.7);
  background: rgba(255, 252, 247, 0.9);
  color: #5b4f43;
  cursor: pointer;
}

.route-chip.active {
  background: linear-gradient(135deg, #e6f0db 0%, #eef6e3 100%);
  border-color: #c7d8b1;
  color: #2f4632;
}

.route-chip strong {
  display: block;
}

.route-chip span {
  display: block;
  margin-top: 4px;
  font-size: 0.84rem;
}
</style>
