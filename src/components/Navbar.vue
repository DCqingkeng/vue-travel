<template>
  <nav :class="['navbar', { scrolled }]">
    <div class="container nav-inner">
      <div class="logo">智游无界</div>
      <ul class="nav-menu">
        <li><router-link to="/">首页</router-link></li>
        <li><router-link to="/recommend">推荐</router-link></li>
        <li><router-link to="/food">美食</router-link></li>
        <li><router-link to="/route">路线</router-link></li>
        <li><router-link to="/venue">场所</router-link></li>
        <li><router-link to="/diary">日记</router-link></li>
        <li><router-link to="/disaster">灾情预防</router-link></li>
      </ul>
      <div class="nav-actions">
        <template v-if="!isLoggedIn">
          <button class="btn btn-ghost" @click="handleLoginClick">登录 / 注册</button>
        </template>
        <template v-else>
          <router-link to="/user" class="btn btn-ghost">个人中心</router-link>
          <button class="btn primary" @click="logout">退出登录</button>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const scrolled = ref(false)
const isLoggedIn = ref(!!localStorage.getItem('authToken'))

function onScroll() {
  scrolled.value = window.scrollY > 20
}

function checkLoginStatus() {
  isLoggedIn.value = !!localStorage.getItem('authToken')
}

function logout() {
  localStorage.removeItem('authToken')
  localStorage.removeItem('userInfo')
  isLoggedIn.value = false
  router.push('/login')
}

function handleLoginClick() {
  if (isLoggedIn.value) {
    window.alert('你已经登录')
    return
  }
  router.push('/login')
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('storage', checkLoginStatus)
  window.addEventListener('auth-changed', checkLoginStatus)
  onScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('storage', checkLoginStatus)
  window.removeEventListener('auth-changed', checkLoginStatus)
})
</script>

<style scoped>
.navbar {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  height: var(--nav-height);
  display: flex;
  align-items: center;
  transition: background 300ms var(--transition), backdrop-filter 300ms var(--transition);
  z-index: 1200;
  background: rgba(8, 10, 9, 0.78);
}

.navbar.scrolled {
  background: rgba(8, 10, 9, 0.9);
  backdrop-filter: blur(20px);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.28);
}

.container {
  width: min(100%, var(--container-max));
  margin: 0 auto;
  display: flex;
  align-items: center;
  padding: 0 var(--container-gutter, 16px);
}

.nav-inner {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 16px;
}

.logo {
  color: #fff;
  font-weight: 800;
  width: 220px;
  font-size: 18px;
}

.nav-menu {
  list-style: none;
  display: flex;
  gap: 28px;
  margin: 0;
  padding: 0;
  flex: 1;
  justify-content: center;
}

.nav-menu a {
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  position: relative;
  padding: 6px 0;
}

.nav-menu a::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -6px;
  height: 2px;
  width: 0;
  background: var(--theme);
  transition: width 220ms var(--transition);
}

.nav-menu a:hover::after,
.nav-menu a.router-link-active::after {
  width: 100%;
}

.nav-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn {
  padding: 8px 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.16);
  cursor: pointer;
  transition: all 0.2s;
}

.btn.primary {
  background: var(--morandi-sage);
  color: #fff;
  border: none;
}

.btn.primary:hover {
  background: var(--morandi-accent-hover);
}

.btn.btn-ghost:hover {
  border-color: var(--morandi-sage);
  color: var(--morandi-sage);
}

@media (max-width: 980px) {
  .nav-menu {
    gap: 18px;
  }
}

@media (max-width: 720px) {
  .nav-menu {
    display: none;
  }

  .logo {
    width: auto;
  }

  .nav-actions {
    width: auto;
  }
}
</style>
