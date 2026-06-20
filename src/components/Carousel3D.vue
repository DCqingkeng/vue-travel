<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
  items: string[]
  width?: number
  height?: number
  autoplay?: boolean
  interval?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 450,
  height: 600,
  autoplay: true,
  interval: 3200
})

const activeIndex = ref(0)
const timer = ref<number | null>(null)

const visibleItems = computed(() => props.items.filter(Boolean))
const perspectiveStyle = computed(() => ({
  '--card-width': `${props.width}px`,
  '--card-height': `${props.height}px`
}))

function normalizeOffset(index: number) {
  const total = visibleItems.value.length

  if (total === 0) {
    return 0
  }

  let offset = index - activeIndex.value
  const half = total / 2

  if (offset > half) {
    offset -= total
  } else if (offset < -half) {
    offset += total
  }

  return offset
}

function cardStyle(index: number) {
  const offset = normalizeOffset(index)
  const depth = Math.abs(offset)
  const spread = Math.min(props.width * 0.42, 180)
  const translateX = offset * spread
  const translateZ = Math.max(280 - depth * 92, 0)
  const rotateY = offset * -24
  const scale = Math.max(1 - depth * 0.09, 0.7)
  const opacity = Math.max(1 - depth * 0.16, 0.25)
  const brightness = Math.max(1 - depth * 0.12, 0.56)

  return {
    zIndex: String(visibleItems.value.length - depth),
    opacity: opacity.toString(),
    filter: `brightness(${brightness}) blur(${depth > 3 ? 1.2 : 0}px)`,
    pointerEvents: depth > 4 ? 'none' : 'auto',
    transform: [
      'translate(-50%, -50%)',
      `translateX(${translateX}px)`,
      `translateZ(${translateZ}px)`,
      `rotateY(${rotateY}deg)`,
      `scale(${scale})`
    ].join(' ')
  }
}

function goTo(index: number) {
  if (!visibleItems.value.length) {
    return
  }

  activeIndex.value =
    (index + visibleItems.value.length) % visibleItems.value.length
}

function next() {
  goTo(activeIndex.value + 1)
}

function prev() {
  goTo(activeIndex.value - 1)
}

function stopAutoplay() {
  if (timer.value !== null) {
    window.clearInterval(timer.value)
    timer.value = null
  }
}

function startAutoplay() {
  stopAutoplay()

  if (!props.autoplay || visibleItems.value.length < 2) {
    return
  }

  timer.value = window.setInterval(next, props.interval)
}

watch(
  () => props.items,
  () => {
    activeIndex.value = 0
    startAutoplay()
  }
)

onMounted(startAutoplay)
onUnmounted(stopAutoplay)
</script>

<template>
  <div
    class="carousel3d-shell"
    :style="perspectiveStyle"
    @mouseenter="stopAutoplay"
    @mouseleave="startAutoplay"
  >
    <button class="carousel3d-nav prev" type="button" aria-label="Previous" @click="prev">
      &lt;
    </button>

    <div class="carousel3d-stage">
      <div class="carousel3d-track">
        <article
          v-for="(item, index) in visibleItems"
          :key="`${item}_${index}`"
          class="carousel3d-card"
          :class="{ active: index === activeIndex }"
          :style="cardStyle(index)"
          @click="goTo(index)"
        >
          <img :src="item" :alt="`Travel image ${index + 1}`" draggable="false" />
        </article>
      </div>
    </div>

    <button class="carousel3d-nav next" type="button" aria-label="Next" @click="next">
      &gt;
    </button>

    <div class="carousel3d-dots">
      <button
        v-for="(_, index) in visibleItems"
        :key="`dot_${index}`"
        type="button"
        :class="['dot', { active: index === activeIndex }]"
        :aria-label="`Go to slide ${index + 1}`"
        @click="goTo(index)"
      />
    </div>
  </div>
</template>

<style scoped>
.carousel3d-shell {
  position: relative;
  width: min(100%, 1200px);
  margin: 0 auto;
  padding: 2rem 4.75rem 5rem;
}

.carousel3d-stage {
  position: relative;
  width: 100%;
  height: clamp(420px, 52vw, 760px);
  perspective: 1800px;
  perspective-origin: center center;
}

.carousel3d-track {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.carousel3d-card {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(var(--card-width), 68vw);
  aspect-ratio: var(--card-width) / var(--card-height);
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    0 24px 70px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.04) inset;
  transition:
    transform 0.7s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.45s ease,
    filter 0.45s ease,
    box-shadow 0.45s ease;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
}

.carousel3d-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent 35%),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.12), transparent 30%);
  pointer-events: none;
}

.carousel3d-card.active {
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}

.carousel3d-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
}

.carousel3d-nav {
  position: absolute;
  top: calc(50% - 28px);
  z-index: 30;
  width: 48px;
  height: 48px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #f7f3ee;
  font-size: 1.8rem;
  line-height: 1;
  cursor: pointer;
  transform: translateY(-50%);
  backdrop-filter: blur(12px);
  transition:
    background 0.25s ease,
    border-color 0.25s ease,
    transform 0.25s ease;
}

.carousel3d-nav:hover {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.28);
  transform: translateY(-50%) scale(1.04);
}

.carousel3d-nav.prev {
  left: 0;
}

.carousel3d-nav.next {
  right: 0;
}

.carousel3d-dots {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  margin-top: 1.4rem;
}

.dot {
  width: 0.75rem;
  height: 0.75rem;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.24);
  cursor: pointer;
  transition:
    transform 0.25s ease,
    background 0.25s ease,
    width 0.25s ease;
}

.dot.active {
  width: 2rem;
  background: #d6c8bb;
}

@media (max-width: 900px) {
  .carousel3d-shell {
    padding: 1rem 3.25rem 4rem;
  }

  .carousel3d-stage {
    height: clamp(360px, 70vw, 640px);
  }
}

@media (max-width: 640px) {
  .carousel3d-shell {
    padding: 0.75rem 1rem 3rem;
  }

  .carousel3d-stage {
    height: clamp(320px, 88vw, 540px);
  }

  .carousel3d-nav {
    width: 42px;
    height: 42px;
    top: auto;
    bottom: 0.5rem;
    transform: none;
  }

  .carousel3d-nav:hover {
    transform: scale(1.04);
  }

  .carousel3d-nav.prev {
    left: calc(50% - 58px);
  }

  .carousel3d-nav.next {
    right: calc(50% - 58px);
  }
}
</style>
