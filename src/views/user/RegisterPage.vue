<template>
  <div class="page-register">
    <h2>注册</h2>
    <form @submit.prevent="doRegister">
      <div>
        <label>用户名</label>
        <input v-model="username" />
      </div>
      <div>
        <label>密码</label>
        <input type="password" v-model="password" />
      </div>
      <div>
        <label>确认密码</label>
        <input type="password" v-model="confirm" />
      </div>
      <div>
        <button type="submit">注册</button>
      </div>
    </form>
    <p>已有账号？ <router-link to="/login">登录</router-link></p>
  </div>
</template>

<script>
import userSvc from '@/services/userService'
export default {
  name: 'RegisterPage',
  data() { return { username: '', password: '', confirm: '' } },
  methods: {
    doRegister() {
      if (this.password !== this.confirm) return alert('密码不匹配')
      try {
        userSvc.register({ username: this.username, password: this.password })
        alert('注册成功，请登录')
        this.$router.push({ name: 'Login' })
      } catch (e) { alert(e.message) }
    }
  }
}
</script>

<style scoped>
.page-register { max-width: 420px; margin: 20px auto }
</style>
