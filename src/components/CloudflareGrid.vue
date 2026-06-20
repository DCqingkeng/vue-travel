<script lang="ts" setup>
import AnimateGrid from './AnimateGrid.vue'
import cloudflare from './cloudflare.svg'

interface Props {
  textGlowStartColor: string
  perspective: number
  textGlowEndColor: string
  rotateX: number
  rotateY: number
}

const props = defineProps<Props>()

const cards = Array.from({ length: 16 }, () => ({
  logo: cloudflare
}))
</script>

<template>
  <div class="cloudflare-grid-shell">
    <AnimateGrid :cards="cards" v-bind="props">
      <template #logo="{ logo }">
        <img
          class="logo"
          :src="logo"
          alt="Cloudflare logo"
        >
      </template>
    </AnimateGrid>
  </div>
</template>

<style scoped>
.cloudflare-grid-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.logo {
  display: block;
  width: auto;
  height: 2.5rem;
  margin: 0 auto;
}
</style>
