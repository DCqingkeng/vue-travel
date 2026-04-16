<template>
  <div class="page-login">
    <h2>登录</h2>
    <form @submit.prevent="doLogin">
      <div>
        <label>用户名</label>
        <input v-model="username" />
      </div>
      <div>
        <label>密码</label>
        <input type="password" v-model="password" />
      </div>
      <div>
        <button type="submit">登录</button>
      </div>
    </form>
    <p>没有账号？ <router-link to="/register">注册</router-link></p>
  </div>
</template>

<script>
import userSvc from '@/services/userService'
export default {
  name: 'LoginPage',
  data() {
    return { username: '', password: '' }
  },
  methods: {
    doLogin() {
      try {
        const { token, user } = userSvc.login({ username: this.username, password: this.password })
        localStorage.setItem('authToken', token)
        this.$router.push({ name: 'UserCenter' })
      } catch (e) {
        alert(e.message)
      }
    }
  }
}
</script>

<style scoped>
.page-login { max-width: 420px; margin: 20px auto }
</style>
