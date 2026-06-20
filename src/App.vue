<template>
  <div :class="['app-root', { 'home-theme': isHomeRoute }]">
    <Navbar :class="{ 'home-theme': isHomeRoute }" />
    <div :class="['app-content', { 'home-theme': isHomeRoute }]">
      <router-view />
    </div>
    <FooterBar :class="{ 'home-theme': isHomeRoute }" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import FooterBar from '@/components/FooterBar.vue'

const route = useRoute()
const isHomeRoute = computed(() => route.path === '/')
</script>

<style>
/* 使用莫兰迪色系，覆盖黑色主题 */
:root{
  --bg-main: var(--morandi-bg-primary);
  --bg-secondary: var(--morandi-bg-secondary);
  --card-bg: #fff;
  --theme: var(--morandi-sage);
  --accent: var(--morandi-dusty-rose);
  --text: var(--morandi-text-primary);
  --muted: var(--morandi-text-muted);
  --muted-2: var(--morandi-text-secondary);
  --border: var(--morandi-border);
  --container-max: 1720px;
  --container-gutter: clamp(20px, 4vw, 56px);
  --nav-height: 64px;
  --spacing-block: 64px;
  --transition: cubic-bezier(0.16,1,0.3,1);
  --hero-title: 48px;
}

*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, Noto Sans, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background: var(--morandi-bg-primary);
  color: var(--morandi-text-primary);
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
}

.container{
  width:min(100%, var(--container-max));
  margin:0 auto;
  padding-left:var(--container-gutter);
  padding-right:var(--container-gutter)
}

.app-root{min-height:100vh;display:flex;flex-direction:column}
.app-root.home-theme{background:#000}
.app-content{
  width:100%;
  margin:0 auto;
  padding-left:var(--container-gutter);
  padding-right:var(--container-gutter);
  padding-top:calc(var(--nav-height) + 24px)
}
.app-content.home-theme{background:#000}

/* Global utilities */
.section{padding-top:var(--spacing-block);padding-bottom:var(--spacing-block)}

</style>
