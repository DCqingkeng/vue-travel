<template>
  <section class="alert-shell glass-panel">
    <div class="alert-head">
      <div>
        <p class="section-kicker">Emergency Brief</p>
        <h3>{{ info?.title || '灾情说明' }}</h3>
      </div>
      <span class="level-badge">{{ info?.level || '--' }}</span>
    </div>

    <p class="alert-description">{{ info?.description || '等待返回灾情说明。' }}</p>

    <div class="tip-block">
      <strong>官方提示</strong>
      <p>{{ info?.officialTip || '等待返回官方提示。' }}</p>
    </div>

    <ul class="suggestion-list">
      <li v-for="item in info?.suggestions || []" :key="item">{{ item }}</li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { EmergencyInfo } from '@/types/emergency'

defineProps<{
  info: EmergencyInfo | null
}>()
</script>

<style scoped>
.alert-shell {
  padding: 20px;
  border-radius: 30px;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 18px 44px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(22px);
}

.alert-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.section-kicker {
  margin: 0 0 6px;
  font-size: 0.74rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(245, 241, 232, 0.54);
}

.alert-head h3,
.tip-block strong {
  color: #fff7ea;
}

.level-badge {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(220, 107, 74, 0.18);
  color: #ffd1c2;
  font-weight: 700;
}

.alert-description,
.tip-block p,
.suggestion-list li {
  color: rgba(245, 241, 232, 0.74);
  line-height: 1.75;
}

.tip-block {
  margin-top: 16px;
  padding: 16px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.suggestion-list {
  margin: 16px 0 0;
  padding-left: 18px;
}

.suggestion-list li + li {
  margin-top: 8px;
}
</style>
