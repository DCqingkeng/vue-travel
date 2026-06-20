<template>
  <div class="stats-grid">
    <article v-for="item in items" :key="item.label" class="stat-card">
      <div class="stat-top">
        <span class="stat-label">{{ item.label }}</span>
        <span class="stat-badge">{{ item.badge }}</span>
      </div>
      <strong>{{ item.value }}</strong>
      <p>{{ item.caption }}</p>
    </article>
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.stat-card {
  padding: 18px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03)),
    rgba(15, 17, 21, 0.75);
  backdrop-filter: blur(20px);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.2);
}

.stat-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 18px;
}

.stat-label,
.stat-badge,
.stat-card p {
  color: #9ca3af;
}

.stat-label,
.stat-badge {
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.stat-card strong {
  display: block;
  color: #f8fafc;
  font-size: clamp(1.4rem, 2vw, 2rem);
  font-weight: 700;
  margin-bottom: 8px;
}

.stat-card p {
  font-size: 13px;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
