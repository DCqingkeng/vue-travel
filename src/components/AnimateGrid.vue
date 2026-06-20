<script lang="ts" setup>
import { computed, ref } from 'vue'

interface CardItem {
  logo?: string
  [key: string]: unknown
}

interface Props {
  cards: CardItem[]
  textGlowStartColor?: string
  textGlowEndColor?: string
  perspective?: number
  rotateX?: number
  rotateY?: number
  activeIndex?: number | null
  columns?: number
  mobileColumns?: number
}

const props = withDefaults(defineProps<Props>(), {
  textGlowStartColor: '#f6821f',
  textGlowEndColor: '#ffd7b0',
  perspective: 1200,
  rotateX: 16,
  rotateY: -18,
  activeIndex: null,
  columns: 4,
  mobileColumns: 2
})

const emit = defineEmits<{
  (e: 'card-enter', payload: { card: CardItem; index: number }): void
  (e: 'card-leave', payload: { card: CardItem; index: number }): void
  (e: 'card-click', payload: { card: CardItem; index: number }): void
}>()

const hoverIndex = ref<number | null>(null)

const resolvedActiveIndex = computed(() => hoverIndex.value ?? props.activeIndex)

const gridStyle = computed(() => ({
  '--grid-perspective': `${props.perspective}px`,
  '--grid-rotate-x': `${props.rotateX}deg`,
  '--grid-rotate-y': `${props.rotateY}deg`,
  '--grid-glow-start': props.textGlowStartColor,
  '--grid-glow-end': props.textGlowEndColor,
  '--grid-columns': String(props.columns),
  '--grid-mobile-columns': String(props.mobileColumns)
}))

function getCardStyle(index: number) {
  const row = Math.floor(index / props.columns)
  const col = index % props.columns
  const center = (props.columns - 1) / 2
  const offsetX = (col - center) * 8
  const offsetY = row * -6
  const isActive = resolvedActiveIndex.value === index

  return {
    transform: `translate3d(${offsetX}px, ${offsetY}px, ${isActive ? 24 : 0}px)`,
    opacity: isActive || resolvedActiveIndex.value === null ? 1 : 0.72
  }
}

function handleEnter(card: CardItem, index: number) {
  hoverIndex.value = index
  emit('card-enter', { card, index })
}

function handleLeave(card: CardItem, index: number) {
  hoverIndex.value = null
  emit('card-leave', { card, index })
}

function handleClick(card: CardItem, index: number) {
  emit('card-click', { card, index })
}
</script>

<template>
  <div class="animate-grid-shell" :style="gridStyle">
    <div class="animate-grid">
      <article
        v-for="(card, index) in cards"
        :key="index"
        class="animate-card"
        :class="{ active: resolvedActiveIndex === index }"
        :style="getCardStyle(index)"
        @mouseenter="handleEnter(card, index)"
        @mouseleave="handleLeave(card, index)"
        @click="handleClick(card, index)"
      >
        <div class="card-glow"></div>
        <div class="card-inner">
          <slot name="card" v-bind="card">
            <slot name="logo" v-bind="card">
              <img
                v-if="card.logo"
                :src="card.logo"
                alt="Card logo"
                class="fallback-logo"
              >
            </slot>
          </slot>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.animate-grid-shell {
  width: 100%;
  perspective: var(--grid-perspective);
}

.animate-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), minmax(0, 1fr));
  gap: 16px;
  transform-style: preserve-3d;
  transform: rotateX(var(--grid-rotate-x)) rotateY(var(--grid-rotate-y));
}

.animate-card {
  position: relative;
  min-height: 116px;
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.03)),
    rgba(17, 23, 19, 0.72);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 18px 40px rgba(0, 0, 0, 0.22);
  cursor: pointer;
  transition:
    transform 240ms ease,
    opacity 240ms ease,
    border-color 240ms ease,
    box-shadow 240ms ease;
}

.animate-card.active {
  border-color: color-mix(in srgb, var(--grid-glow-start) 45%, white);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--grid-glow-start) 20%, transparent),
    0 22px 48px rgba(0, 0, 0, 0.26);
}

.card-glow {
  position: absolute;
  inset: auto -18% -36% -18%;
  height: 68%;
  background: radial-gradient(circle, var(--grid-glow-start), var(--grid-glow-end), transparent 72%);
  opacity: 0.28;
  filter: blur(22px);
  transition: opacity 240ms ease, transform 240ms ease;
}

.animate-card.active .card-glow {
  opacity: 0.66;
  transform: scale(1.06);
}

.card-inner {
  position: relative;
  z-index: 1;
  min-height: 116px;
  height: 100%;
}

.fallback-logo {
  display: block;
  width: auto;
  height: 40px;
  margin: 0 auto;
}

@media (max-width: 760px) {
  .animate-grid {
    grid-template-columns: repeat(var(--grid-mobile-columns), minmax(0, 1fr));
    transform: none;
  }
}
</style>
