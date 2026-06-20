<template>
  <div class="layer-legend">
    <article v-for="item in zones" :key="String(item.id)" class="legend-card">
      <span class="dot" :style="{ background: getRiskColor(item.riskLevel) }"></span>
      <div>
        <strong>{{ item.name }}</strong>
        <p>{{ item.description || item.riskLevel }}</p>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { DangerZoneItem } from '@/types/emergency'

defineProps<{
  zones: DangerZoneItem[]
}>()

function getRiskColor(level: string) {
  const text = String(level || '').toLowerCase()
  if (text.includes('high') || text.includes('高')) return 'rgba(220,38,38,0.75)'
  if (text.includes('medium') || text.includes('中')) return 'rgba(245,158,11,0.75)'
  return 'rgba(59,130,246,0.65)'
}
</script>

<style scoped>
.layer-legend {
  display: grid;
  gap: 10px;
}

.legend-card {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(255, 252, 247, 0.88);
  border: 1px solid rgba(212, 205, 192, 0.7);
}

.legend-card strong {
  color: #3f362e;
}

.legend-card p {
  margin-top: 4px;
  color: #6d6256;
  font-size: 0.88rem;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}
</style>
