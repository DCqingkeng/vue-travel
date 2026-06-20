<template>
  <section class="hero-carousel" :style="{ '--bg-url': `url(${current.background || ''})` }">
    <div class="hero-inner" ref="heroInner">
      <div class="hero-content">
        <h1 class="title" ref="heroTitle">{{ current.title }}</h1>
        <p class="subtitle" ref="heroSubtitle">{{ current.subtitle }}</p>
        <div class="ctas">
          <button class="btn primary">立即探索</button>
          <button class="btn ghost">了解更多</button>
        </div>
      </div>
    </div>

    <div class="indicators">
      <button
        v-for="(slide, idx) in slides"
        :key="slide.id"
        :class="['dot', { active: idx === index }]"
        @click="go(idx)"
      />
    </div>
  </section>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import gsap from 'gsap'
import img1 from '../../photo/1.png'
import img2 from '../../photo/2.png'
import img3 from '../../photo/3.png'
import img4 from '../../photo/4.png'
import img5 from '../../photo/5.png'
import img6 from '../../photo/6.png'
import img7 from '../../photo/7.png'
import img8 from '../../photo/8.png'
import img9 from '../../photo/9.png'

const slides = [
  { id: 1, background: img1, title: '探索未知', subtitle: '发现世界每一个角落的美丽与惊喜' },
  { id: 2, background: img2, title: '山水之间', subtitle: '感受大自然的宁静与壮阔' },
  { id: 3, background: img3, title: '城市漫步', subtitle: '在繁华都市中寻找独特风景' },
  { id: 4, background: img4, title: '古韵悠长', subtitle: '穿越时空，体验千年文化的魅力' },
  { id: 5, background: img5, title: '海滨度假', subtitle: '让海风带走所有疲惫与烦恼' },
  { id: 6, background: img6, title: '美食之旅', subtitle: '用味蕾记录每一段旅程的精彩' },
  { id: 7, background: img7, title: '星空露营', subtitle: '在璀璨星河下享受静谧夜晚' },
  { id: 8, background: img8, title: '古镇风情', subtitle: '漫步青石板路，感受岁月静好' },
  { id: 9, background: img9, title: '极地探险', subtitle: '挑战极限，见证世界尽头的壮美' }
]

const index = ref(0)
const current = ref(slides[0])
const heroTitle = ref(null)
const heroSubtitle = ref(null)
let timer = null

function go(i) {
  index.value = i
  current.value = slides[i]

  gsap.fromTo(
    [heroTitle.value, heroSubtitle.value],
    { y: 24, opacity: 0 },
    { y: 0, opacity: 1, stagger: 0.06, duration: 0.6, ease: 'power3.out' }
  )
}

onMounted(() => {
  timer = setInterval(() => {
    go((index.value + 1) % slides.length)
  }, 4000)

  gsap.from([heroTitle.value, heroSubtitle.value], {
    y: 40,
    opacity: 0,
    stagger: 0.12,
    duration: 0.9,
    ease: 'power3.out'
  })
})

onUnmounted(() => clearInterval(timer))
watch(index, (n) => {
  current.value = slides[n]
})
</script>

<style scoped>
.hero-carousel {
  height: 50vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background-image: linear-gradient(180deg, rgba(45, 45, 43, 0.3), rgba(45, 45, 43, 0.5)), var(--bg-url);
  background-size: cover;
  background-position: center;
  border-radius: 0 0 20px 20px;
}

.hero-inner {
  max-width: 1200px;
  width: 100%;
  display: flex;
  gap: 2rem;
  align-items: center;
  padding: 1.5rem 2rem;
}

.hero-content {
  flex: 1 1 100%;
  color: var(--text);
  text-align: center;
}

.title {
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -1px;
  margin: 12px 0;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  margin-bottom: 8px;
}

.ctas {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  font-weight: 600;
  font-size: 14px;
}

.btn.primary {
  background: var(--morandi-sage);
  color: #fff;
  transition: all 0.3s ease;
}

.btn.primary:hover {
  background: var(--morandi-accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(156, 175, 136, 0.4);
}

.btn.ghost {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.btn.ghost:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
}

.indicators {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.dot {
  width: 48px;
  height: 2px;
  background: rgba(255, 255, 255, 0.35);
  border: none;
  cursor: pointer;
}

.dot.active {
  background: white;
}

@media (max-width: 900px) {
  .hero-inner {
    padding: 1rem;
  }

  .title {
    font-size: 2rem;
  }

  .hero-carousel {
    height: 40vh;
  }
}
</style>
