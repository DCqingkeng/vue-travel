<template>
  <section class="selector-card glass-card">
    <div class="selector-head">
      <div>
        <p class="section-kicker">Disaster Type</p>
        <h3>灾情类型切换</h3>
      </div>
    </div>

    <div class="selector-row">
      <button
        v-for="item in options"
        :key="item.value"
        :class="['type-card', { active: modelValue === item.value }]"
        @click="$emit('update:modelValue', item.value)"
      >
        <span class="type-emoji">{{ item.icon }}</span>
        <strong>{{ item.label }}</strong>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { DisasterType } from '@/types/emergency'

defineProps<{
  modelValue: DisasterType
}>()

defineEmits<{
  (event: 'update:modelValue', value: DisasterType): void
}>()

const options = [
  { value: 'EARTHQUAKE', label: '地震', icon: '🏚️' },
  { value: 'FLOOD_HIGH', label: '强降雨 / 洪水', icon: '💧' },
  { value: 'FIRE', label: '火灾', icon: '🔥' }
] satisfies { value: DisasterType; label: string; icon: string }[]
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(212, 205, 192, 0.7);
  box-shadow: 0 16px 40px rgba(123, 103, 74, 0.08);
  backdrop-filter: blur(18px);
}

.selector-card {
  padding: 18px;
  border-radius: 28px;
}

.section-kicker {
  margin: 0 0 6px;
  font-size: 0.74rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #867d72;
}

.selector-head h3 {
  color: #3f362e;
}

.selector-row {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  overflow-x: auto;
}

.type-card {
  min-width: 120px;
  padding: 14px 16px;
  border-radius: 22px;
  border: 1px solid #e6ddd2;
  background: rgba(255, 252, 247, 0.92);
  color: #5a4f43;
  cursor: pointer;
}

.type-card.active {
  background: linear-gradient(135deg, #e6f0db 0%, #f8ead8 100%);
  border-color: #c8d7b3;
  color: #2f4632;
}

.type-emoji {
  display: block;
  font-size: 1.4rem;
  margin-bottom: 8px;
}
</style>
