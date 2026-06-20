<template>
  <div class="user-center">
    <h2>用户中心</h2>
    <div v-if="!user">请先 <router-link to="/login">登录</router-link></div>
    <div v-else>
      <p>用户名：{{ user.username }}</p>
      <p v-if="user.nickname">昵称：{{ user.nickname }}</p>
      <p>用户ID：{{ user.id }}</p>

      <h3>我的收藏</h3>
      <ul>
        <li v-for="f in user.favorites" :key="f">{{ f }}</li>
      </ul>

      <h3>我的日记</h3>
      <ul>
        <li v-for="d in diaries" :key="d.id">
          <router-link :to="{ name: 'Diary' }">{{ d.title || d.id }}</router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import userSvc from '@/services/userService'
import diarySvc from '@/services/diaryService'
export default {
  name: 'UserCenter',
  data() { return { user: null, diaries: [] } },
  created() { this.load() },
  mounted() { window.addEventListener('storage', this.load) },
  beforeUnmount() { window.removeEventListener('storage', this.load) },
  methods: {
    load() {
      // Prefer client-stored profile (set by login flow). Fallback to in-memory userSvc if available.
      try {
        const raw = localStorage.getItem('userInfo')
        if (raw) {
          const info = JSON.parse(raw)
          this.user = {
            username: info.username || info.userId || null,
            nickname: info.nickname || '',
            id: info.userId || info.id || null,
            favorites: info.favorites || []
          }
        } else {
          const token = localStorage.getItem('authToken')
          if (!token) {
            this.user = null
            this.diaries = []
            return
          }
          // fallback to in-memory user service (may be null for real backend tokens)
          this.user = userSvc.getUserByToken(token)
        }

        if (this.user) {
          this.diaries = (this.user.diaryIds || []).map(id => diarySvc.get(id)).filter(Boolean)
        } else {
          this.diaries = []
        }
      } catch (e) {
        console.warn('load user failed', e)
        this.user = null
        this.diaries = []
      }
    },
    doLogout() {
      const token = localStorage.getItem('authToken')
      if (token) userSvc.logout(token)
      localStorage.removeItem('authToken')
      this.user = null
      this.$router.push({ name: 'Home' })
    }
  }
}
</script>

<style scoped>
.user-center { max-width: 800px; margin: 20px auto }
</style>
