<template>
  <div class="user-center">
    <h2>用户中心</h2>
    <div v-if="!user">请先 <router-link to="/login">登录</router-link></div>
    <div v-else>
      <p>用户名：{{ user.username }}</p>
      <p>用户ID：{{ user.id }}</p>
      <button @click="doLogout">登出</button>

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
  methods: {
    load() {
      const token = localStorage.getItem('authToken')
      if (!token) return
      this.user = userSvc.getUserByToken(token)
      if (this.user) {
        this.diaries = (this.user.diaryIds || []).map(id => diarySvc.get(id)).filter(Boolean)
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
