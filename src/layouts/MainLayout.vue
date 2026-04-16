<template>
  <div class="main-layout">
    <header class="header">
      <div class="logo">🌍 旅游助手</div>
      <nav class="nav">
        <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">首页</router-link>
        <router-link to="/recommend" class="nav-item" :class="{ active: $route.path === '/recommend' }">旅游推荐</router-link>
        <router-link to="/route" class="nav-item" :class="{ active: $route.path === '/route' }">路线规划</router-link>
        <router-link to="/venue" class="nav-item" :class="{ active: $route.path === '/venue' }">场所查询</router-link>
        <router-link to="/diary" class="nav-item" :class="{ active: $route.path === '/diary' }">旅游日记</router-link>
        <router-link to="/community" class="nav-item" :class="{ active: $route.path === '/community' }">日记交流</router-link>
        <router-link to="/food" class="nav-item" :class="{ active: $route.path === '/food' }">美食推荐</router-link>
      </nav>
    </header>
    
    <main class="main-content">
      <router-view />
    </main>
    
    <footer class="footer">
      <p>© 2026 旅游助手 - 让旅行更美好</p>
    </footer>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
const $route = useRoute()
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
}

.nav {
  display: flex;
  gap: 1.5rem;
}

.nav-item {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.nav-item:hover,
.nav-item.active {
  background: rgba(255,255,255,0.2);
}

.main-content {
  flex: 1;
  padding: 2rem;
  background: #f5f7fa;
}

.footer {
  background: #2d3748;
  color: white;
  text-align: center;
  padding: 1rem;
}
</style>
