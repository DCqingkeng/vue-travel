<template>
  <div class="home-page">
    <section class="carousel-section">
      <Carousel3D :items="carouselImages" :width="420" :height="560" :interval="1800" />
    </section>
  </div>
</template>

<script setup>
import Carousel3D from '@/components/Carousel3D.vue'

const carouselImages = Array.from(
  { length: 9 },
  (_, index) => `/home-carousel/home-${index + 1}.jpg`
)
</script>

<style scoped>
.home-page {
  min-height: calc(100vh - var(--nav-height) - 24px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(0.5rem, 2vw, 1.5rem) 0 4rem;
  background: #000;
}

.carousel-section {
  position: relative;
  width: 100%;
  border-radius: 36px;
  overflow: hidden;
  padding: clamp(1.5rem, 4vw, 3rem) 0;
  background: #000;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
}

.carousel-section :deep(.carousel3d-shell) {
  position: relative;
  z-index: 1;
}

.carousel-section :deep(.carousel3d-stage) {
  height: clamp(430px, 56vw, 780px);
}

@media (max-width: 640px) {
  .home-page {
    padding-bottom: 2.5rem;
  }

  .carousel-section {
    border-radius: 28px;
    padding-top: 1rem;
  }
}
</style>
