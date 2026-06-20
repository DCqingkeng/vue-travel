<template>
  <section class="map-shell">
    <div class="map-stage">
      <div class="map-noise"></div>
      <div class="map-route route-a"></div>
      <div class="map-route route-b"></div>

      <div class="map-head">
        <div>
          <span class="eyebrow">Spatial Discovery</span>
          <h2>{{ title }}</h2>
        </div>
        <span class="map-badge">实时联动</span>
      </div>

      <div class="map-grid"></div>

      <button
        v-for="place in places"
        :key="place.id"
        type="button"
        :class="['marker', `marker-${place.type}`, { active: focusId === place.id, soft: focusId && focusId !== place.id }]"
        :style="{ left: `${place.mapPosition.x}%`, top: `${place.mapPosition.y}%` }"
        @mouseenter="$emit('hover', place.id)"
        @mouseleave="$emit('hover', null)"
        @click="$emit('select', place.id)"
      >
        <span class="marker-pulse"></span>
        <span class="marker-core">{{ place.icon }}</span>
      </button>

      <aside v-if="selectedPlace" class="map-panel">
        <span class="panel-tag">{{ selectedPlace.typeLabel }}</span>
        <h3>{{ selectedPlace.name }}</h3>
        <p>{{ selectedPlace.description }}</p>

        <div class="panel-stats">
          <div>
            <span>距离</span>
            <strong>{{ selectedPlace.distanceText }}</strong>
          </div>
          <div>
            <span>步行</span>
            <strong>{{ selectedPlace.walkingTime }}</strong>
          </div>
        </div>

        <div class="panel-footer">
          <span>{{ selectedPlace.address }}</span>
          <span>{{ selectedPlace.isOpen ? '当前营业中' : '预计即将关闭' }}</span>
        </div>
      </aside>

      <div class="compass">
        <span>N</span>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  places: {
    type: Array,
    default: () => []
  },
  selectedPlace: {
    type: Object,
    default: null
  },
  focusId: {
    type: [String, Number],
    default: null
  },
  title: {
    type: String,
    default: '鼓楼校区空间探索图'
  }
})

defineEmits(['hover', 'select'])
</script>

<style scoped>
.map-shell {
  position: sticky;
  top: 84px;
  height: calc(100vh - 108px);
}

.map-stage {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-radius: 36px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at 20% 20%, rgba(125, 211, 252, 0.16), transparent 28%),
    radial-gradient(circle at 80% 10%, rgba(59, 130, 246, 0.12), transparent 22%),
    linear-gradient(180deg, rgba(14, 23, 37, 0.92), rgba(7, 10, 18, 0.98));
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.32);
}

.map-noise,
.map-grid {
  position: absolute;
  inset: 0;
}

.map-noise {
  opacity: 0.18;
  background:
    linear-gradient(transparent 0, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, transparent 0, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 30px 30px;
}

.map-grid {
  opacity: 0.24;
  background:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 82px 82px;
  mask-image: radial-gradient(circle at center, #000 48%, transparent 100%);
}

.map-route {
  position: absolute;
  border-radius: 999px;
  filter: blur(0.2px);
  opacity: 0.55;
}

.route-a {
  left: 18%;
  top: 44%;
  width: 54%;
  height: 2px;
  transform: rotate(-16deg);
  background: linear-gradient(90deg, transparent, rgba(125, 211, 252, 0.8), transparent);
}

.route-b {
  left: 22%;
  top: 30%;
  width: 46%;
  height: 2px;
  transform: rotate(36deg);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.42), transparent);
}

.map-head {
  position: absolute;
  top: 28px;
  left: 28px;
  right: 28px;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.eyebrow,
.map-badge,
.panel-tag,
.panel-footer span,
.panel-stats span {
  font-size: 12px;
  letter-spacing: 0.06em;
}

.eyebrow {
  display: inline-block;
  margin-bottom: 10px;
  color: #93c5fd;
  text-transform: uppercase;
}

.map-head h2 {
  color: #f8fafc;
  font-size: clamp(1.4rem, 2vw, 2rem);
}

.map-badge {
  height: fit-content;
  padding: 10px 14px;
  border-radius: 999px;
  color: #e0f2fe;
  background: rgba(125, 211, 252, 0.12);
  border: 1px solid rgba(125, 211, 252, 0.18);
}

.marker {
  position: absolute;
  z-index: 2;
  width: 52px;
  height: 52px;
  margin-left: -26px;
  margin-top: -26px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: transform 220ms ease, opacity 220ms ease, filter 220ms ease;
}

.marker.active {
  transform: scale(1.2);
  filter: drop-shadow(0 0 18px rgba(125, 211, 252, 0.52));
}

.marker.soft {
  opacity: 0.5;
}

.marker-pulse,
.marker-core {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}

.marker-pulse {
  background: rgba(125, 211, 252, 0.12);
  animation: pulse 2.6s infinite;
}

.marker-core {
  inset: 7px;
  display: grid;
  place-items: center;
  color: #eff6ff;
  font-size: 19px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.96), rgba(14, 165, 233, 0.82));
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 16px 32px rgba(14, 165, 233, 0.28);
}

.marker-cafe .marker-core {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.95), rgba(217, 119, 6, 0.84));
}

.marker-teaching .marker-core {
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.95), rgba(37, 99, 235, 0.84));
}

.marker-canteen .marker-core {
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.95), rgba(220, 38, 38, 0.84));
}

.marker-sports .marker-core {
  background: linear-gradient(135deg, rgba(52, 211, 153, 0.95), rgba(5, 150, 105, 0.84));
}

.marker-library .marker-core {
  background: linear-gradient(135deg, rgba(192, 132, 252, 0.95), rgba(126, 34, 206, 0.84));
}

.map-panel {
  position: absolute;
  left: 28px;
  right: 28px;
  bottom: 28px;
  z-index: 2;
  padding: 22px 22px 20px;
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.04)),
    rgba(9, 12, 20, 0.76);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(22px);
}

.panel-tag {
  display: inline-flex;
  padding: 7px 10px;
  margin-bottom: 14px;
  border-radius: 999px;
  color: #dbeafe;
  background: rgba(125, 211, 252, 0.1);
}

.map-panel h3 {
  color: #f8fafc;
  font-size: 1.25rem;
  margin-bottom: 8px;
}

.map-panel p {
  color: #cbd5e1;
  line-height: 1.6;
  margin-bottom: 18px;
}

.panel-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.panel-stats div {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
}

.panel-stats span,
.panel-footer span {
  color: #94a3b8;
}

.panel-stats strong {
  display: block;
  margin-top: 6px;
  color: #f8fafc;
}

.panel-footer {
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.compass {
  position: absolute;
  right: 28px;
  bottom: 184px;
  z-index: 2;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.72);
}

@keyframes pulse {
  0% {
    transform: scale(0.9);
    opacity: 0.75;
  }

  70% {
    transform: scale(1.35);
    opacity: 0;
  }

  100% {
    transform: scale(1.35);
    opacity: 0;
  }
}

@media (max-width: 1024px) {
  .map-shell {
    position: relative;
    top: auto;
    height: 560px;
  }
}

@media (max-width: 640px) {
  .map-stage {
    border-radius: 28px;
  }

  .map-head,
  .map-panel {
    left: 18px;
    right: 18px;
  }

  .map-head {
    top: 18px;
  }

  .map-panel {
    bottom: 18px;
  }

  .panel-footer {
    flex-direction: column;
  }

  .compass {
    right: 18px;
    bottom: 230px;
  }
}
</style>
