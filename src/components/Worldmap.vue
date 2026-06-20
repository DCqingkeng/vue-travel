<template>
  <section class="worldmap-section">
    <div class="worldmap-shell">
      <div class="worldmap-copy">
        <p class="worldmap-title">
          <span class="worldmap-title-main">Remote</span>
          <span class="worldmap-title-accent">
            <Motion
              v-for="(word, idx) in 'Connectivity'.split('')"
              :key="idx"
              as="span"
              class="worldmap-letter"
              :initial="{ y: 14, opacity: 0 }"
              :animate="{ y: 0, opacity: 1 }"
              :transition="{ duration: 0.45, delay: idx * 0.04 }"
            >
              {{ word }}
            </Motion>
          </span>
        </p>
        <p class="worldmap-description">
          Break free from traditional boundaries. Work from anywhere, at the comfort of your own
          studio apartment. Perfect for nomads and travellers.
        </p>
      </div>

      <div class="worldmap-stage">
        <svg
          class="worldmap-svg"
          viewBox="0 0 1200 620"
          role="img"
          aria-label="World map with animated travel routes"
        >
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.2" />
              <stop offset="50%" stop-color="#0ea5e9" stop-opacity="0.95" />
              <stop offset="100%" stop-color="#22d3ee" stop-opacity="0.25" />
            </linearGradient>
            <filter id="routeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect class="worldmap-ocean" x="0" y="0" width="1200" height="620" rx="28" />

          <g class="worldmap-grid" aria-hidden="true">
            <line v-for="x in gridX" :key="`x-${x}`" :x1="x" y1="0" :x2="x" y2="620" />
            <line v-for="y in gridY" :key="`y-${y}`" x1="0" :y1="y" x2="1200" :y2="y" />
          </g>

          <g class="worldmap-land" aria-hidden="true">
            <path
              v-for="(continent, index) in continents"
              :key="index"
              :d="continent"
            />
          </g>

          <g aria-hidden="true">
            <path
              v-for="(route, index) in projectedRoutes"
              :key="`route-${index}`"
              class="worldmap-route-glow"
              :d="route.path"
            />
            <path
              v-for="(route, index) in projectedRoutes"
              :key="`route-main-${index}`"
              class="worldmap-route"
              :d="route.path"
              :style="{ animationDelay: `${index * 0.45}s` }"
            />
          </g>

          <g aria-hidden="true">
            <circle
              v-for="(route, index) in projectedRoutes"
              :key="`start-${index}`"
              class="worldmap-dot worldmap-dot-start"
              :cx="route.start.x"
              :cy="route.start.y"
              r="5.5"
            />
            <circle
              v-for="(route, index) in projectedRoutes"
              :key="`end-${index}`"
              class="worldmap-dot worldmap-dot-end"
              :cx="route.end.x"
              :cy="route.end.y"
              r="5.5"
            />
          </g>
        </svg>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { usePreferredDark } from '@vueuse/core'
import { Motion } from 'motion-v'

const isDark = usePreferredDark()

const dots = [
  {
    start: { lat: 64.2008, lng: -149.4937 },
    end: { lat: 34.0522, lng: -118.2437 },
  },
  {
    start: { lat: 64.2008, lng: -149.4937 },
    end: { lat: -15.7975, lng: -47.8919 },
  },
  {
    start: { lat: -15.7975, lng: -47.8919 },
    end: { lat: 38.7223, lng: -9.1393 },
  },
  {
    start: { lat: 51.5074, lng: -0.1278 },
    end: { lat: 28.6139, lng: 77.209 },
  },
  {
    start: { lat: 28.6139, lng: 77.209 },
    end: { lat: 43.1332, lng: 131.9113 },
  },
  {
    start: { lat: 28.6139, lng: 77.209 },
    end: { lat: -1.2921, lng: 36.8219 },
  },
]

const continents = [
  'M110 170 C160 110 250 95 320 135 C360 158 362 215 336 245 C308 276 274 289 238 321 C213 344 164 348 136 328 C104 304 72 272 68 236 C64 206 82 186 110 170 Z',
  'M258 352 C282 336 322 348 346 374 C372 402 374 444 360 486 C346 526 320 560 288 574 C264 584 240 572 232 544 C220 506 220 478 228 444 C234 416 234 376 258 352 Z',
  'M506 136 C558 110 620 110 686 122 C754 134 798 160 846 196 C872 216 886 248 874 284 C858 334 792 338 752 322 C714 306 684 284 644 282 C598 280 566 312 528 300 C482 286 454 238 466 196 C474 168 488 148 506 136 Z',
  'M602 326 C632 314 676 320 712 346 C746 370 764 404 756 434 C746 470 700 478 670 466 C646 456 630 438 610 420 C588 400 574 376 580 352 C584 340 592 332 602 326 Z',
  'M886 386 C926 368 978 376 1022 402 C1064 428 1088 466 1080 500 C1072 532 1030 550 986 542 C950 536 922 510 900 486 C878 462 866 432 872 410 C874 400 878 392 886 386 Z',
  'M1004 164 C1046 144 1092 152 1128 176 C1156 196 1166 230 1144 252 C1120 274 1084 278 1050 262 C1014 244 986 220 986 198 C986 184 994 170 1004 164 Z',
]

const gridX = [150, 300, 450, 600, 750, 900, 1050]
const gridY = [110, 220, 330, 440, 550]

const oceanFill = computed(() => (isDark.value ? '#020817' : '#eff6ff'))
const gridStroke = computed(() =>
  isDark.value ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.28)'
)
const landFill = computed(() =>
  isDark.value ? 'rgba(15, 23, 42, 0.95)' : 'rgba(148, 163, 184, 0.35)'
)
const landStroke = computed(() =>
  isDark.value ? 'rgba(125, 211, 252, 0.14)' : 'rgba(71, 85, 105, 0.18)'
)

function projectPoint(point) {
  const x = ((point.lng + 180) / 360) * 1200
  const y = ((90 - point.lat) / 180) * 620
  return { x, y }
}

function buildArc(start, end) {
  const midpointX = (start.x + end.x) / 2
  const midpointY = (start.y + end.y) / 2
  const distance = Math.hypot(end.x - start.x, end.y - start.y)
  const lift = Math.max(42, Math.min(150, distance * 0.18))
  const controlY = midpointY - lift
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} Q ${midpointX.toFixed(2)} ${controlY.toFixed(2)} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`
}

const projectedRoutes = computed(() =>
  dots.map((dot) => {
    const start = projectPoint(dot.start)
    const end = projectPoint(dot.end)

    return {
      start,
      end,
      path: buildArc(start, end),
    }
  })
)
</script>

<style scoped>
.worldmap-section {
  width: 100%;
  padding: clamp(4rem, 8vw, 6rem) 0;
  background:
    radial-gradient(circle at top, rgba(14, 165, 233, 0.18), transparent 28%),
    linear-gradient(180deg, #03131b 0%, #02070b 100%);
}

.worldmap-shell {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: clamp(2rem, 4vw, 3rem);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 32px;
  background: rgba(3, 7, 18, 0.72);
  box-shadow: 0 24px 90px rgba(2, 8, 23, 0.42);
  backdrop-filter: blur(18px);
}

.worldmap-copy {
  max-width: 720px;
  margin: 0 auto 2rem;
  text-align: center;
}

.worldmap-title {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  font-size: clamp(2rem, 5vw, 4rem);
  font-weight: 800;
  line-height: 1.08;
  color: #f8fafc;
}

.worldmap-title-main {
  color: #ffffff;
}

.worldmap-title-accent {
  display: inline-flex;
  color: #7dd3fc;
}

.worldmap-letter {
  display: inline-block;
}

.worldmap-description {
  margin: 1.2rem auto 0;
  max-width: 640px;
  font-size: clamp(0.98rem, 1.5vw, 1.1rem);
  line-height: 1.8;
  color: rgba(226, 232, 240, 0.78);
}

.worldmap-stage {
  position: relative;
}

.worldmap-svg {
  width: 100%;
  height: auto;
  display: block;
}

.worldmap-ocean {
  fill: v-bind(oceanFill);
}

.worldmap-grid line {
  stroke: v-bind(gridStroke);
  stroke-width: 1;
}

.worldmap-land path {
  fill: v-bind(landFill);
  stroke: v-bind(landStroke);
  stroke-width: 2;
}

.worldmap-route-glow {
  fill: none;
  stroke: rgba(56, 189, 248, 0.18);
  stroke-width: 10;
  stroke-linecap: round;
  filter: url(#routeGlow);
}

.worldmap-route {
  fill: none;
  stroke: url(#routeGradient);
  stroke-width: 3.5;
  stroke-linecap: round;
  stroke-dasharray: 10 12;
  animation: route-flow 4.8s linear infinite;
}

.worldmap-dot {
  transform-origin: center;
  animation: dot-pulse 2.8s ease-in-out infinite;
}

.worldmap-dot-start {
  fill: #e2e8f0;
}

.worldmap-dot-end {
  fill: #38bdf8;
}

@keyframes route-flow {
  from {
    stroke-dashoffset: 110;
  }

  to {
    stroke-dashoffset: 0;
  }
}

@keyframes dot-pulse {
  0%,
  100% {
    opacity: 0.7;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.22);
  }
}

@media (max-width: 768px) {
  .worldmap-shell {
    width: min(100% - 20px, 1180px);
    padding: 1.25rem;
    border-radius: 24px;
  }

  .worldmap-copy {
    margin-bottom: 1.25rem;
  }

  .worldmap-title {
    gap: 0.2rem 0.45rem;
  }

  .worldmap-description {
    line-height: 1.65;
  }
}
</style>
