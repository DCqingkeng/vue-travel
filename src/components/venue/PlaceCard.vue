<template>
  <article
    :class="['place-card', { active, dimmed }]"
    @mouseenter="$emit('hover', place.id)"
    @mouseleave="$emit('hover', null)"
    @click="$emit('select', place.id)"
  >
    <div class="place-cover" :style="{ background: place.cover }">
      <div class="cover-overlay"></div>
      <div class="cover-top">
        <span class="cover-type">{{ place.typeLabel }}</span>
        <span class="cover-status" :class="{ open: place.isOpen }">
          {{ place.isOpen ? '营业中' : '即将关闭' }}
        </span>
      </div>
      <div class="cover-bottom">
        <strong>{{ place.name }}</strong>
        <p>{{ place.address }}</p>
      </div>
    </div>

    <div class="place-body">
      <div class="place-headline">
        <div>
          <h3>{{ place.name }}</h3>
          <p>{{ place.description }}</p>
        </div>
        <div class="rating-block">
          <span class="rating-value">★ {{ place.rating }}</span>
          <span class="rating-meta">{{ place.reviewText }}</span>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">距离</span>
          <strong>📍 {{ place.distanceText }}</strong>
        </div>
        <div class="meta-item">
          <span class="meta-label">步行</span>
          <strong>{{ place.walkingTime }}</strong>
        </div>
        <div class="meta-item">
          <span class="meta-label">推荐</span>
          <strong>{{ place.recommendation }}</strong>
        </div>
      </div>

      <div class="tag-row">
        <span v-for="tag in place.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>

      <div class="place-actions">
        <button type="button" class="primary-btn">导航</button>
        <button type="button" class="ghost-btn">详情</button>
      </div>
    </div>
  </article>
</template>

<script setup>
defineProps({
  place: {
    type: Object,
    required: true
  },
  active: {
    type: Boolean,
    default: false
  },
  dimmed: {
    type: Boolean,
    default: false
  }
})

defineEmits(['hover', 'select'])
</script>

<style scoped>
.place-card {
  display: grid;
  gap: 0;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
    rgba(15, 17, 21, 0.82);
  backdrop-filter: blur(22px);
  box-shadow: 0 20px 46px rgba(0, 0, 0, 0.24);
  cursor: pointer;
  transition: transform 240ms ease, border-color 240ms ease, box-shadow 240ms ease, opacity 240ms ease;
}

.place-card:hover,
.place-card.active {
  transform: translateY(-6px);
  border-color: rgba(125, 211, 252, 0.34);
  box-shadow: 0 24px 56px rgba(15, 23, 42, 0.4);
}

.place-card.dimmed {
  opacity: 0.56;
}

.place-cover {
  position: relative;
  min-height: 188px;
  padding: 18px;
  background-size: 120% 120%;
  background-position: center;
  transition: background-size 260ms ease;
}

.place-card:hover .place-cover,
.place-card.active .place-cover {
  background-size: 132% 132%;
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(5, 8, 15, 0.05), rgba(5, 8, 15, 0.72));
}

.cover-top,
.cover-bottom {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.cover-bottom {
  margin-top: 90px;
  flex-direction: column;
  justify-content: flex-end;
}

.cover-type,
.cover-status {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.11);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #eff6ff;
  font-size: 12px;
}

.cover-status.open {
  color: #dcfce7;
}

.cover-bottom strong {
  color: #fff;
  font-size: 1.4rem;
  font-weight: 700;
}

.cover-bottom p {
  color: rgba(241, 245, 249, 0.76);
  font-size: 13px;
}

.place-body {
  display: grid;
  gap: 18px;
  padding: 22px;
}

.place-headline {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.place-headline h3 {
  color: #f8fafc;
  font-size: 1.1rem;
  margin-bottom: 8px;
}

.place-headline p,
.rating-meta,
.meta-label {
  color: #9ca3af;
}

.place-headline p {
  line-height: 1.6;
  font-size: 13px;
}

.rating-block {
  min-width: 88px;
  display: grid;
  justify-items: end;
  gap: 4px;
}

.rating-value {
  color: #fde68a;
  font-weight: 700;
}

.rating-meta {
  font-size: 12px;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.meta-item {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.meta-label {
  display: block;
  font-size: 12px;
  margin-bottom: 8px;
}

.meta-item strong {
  color: #f3f4f6;
  font-size: 14px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(125, 211, 252, 0.08);
  border: 1px solid rgba(125, 211, 252, 0.12);
  color: #cfeeff;
  font-size: 12px;
}

.place-actions {
  display: flex;
  gap: 12px;
}

.primary-btn,
.ghost-btn {
  flex: 1;
  min-height: 46px;
  border-radius: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 220ms ease, border-color 220ms ease, background 220ms ease;
}

.primary-btn {
  border: 1px solid rgba(125, 211, 252, 0.22);
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.95), rgba(14, 165, 233, 0.82));
  color: #eff6ff;
}

.ghost-btn {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: #e5e7eb;
}

.primary-btn:hover,
.ghost-btn:hover {
  transform: translateY(-2px);
}

@media (max-width: 640px) {
  .meta-grid {
    grid-template-columns: 1fr;
  }

  .place-headline {
    flex-direction: column;
  }

  .rating-block {
    justify-items: start;
  }
}
</style>
