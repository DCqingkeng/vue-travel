<template>
  <div class="login-page">
    <div class="background-media">
      <img :src="loginBackground" alt="travel background" />
      <div class="background-overlay"></div>
      <div class="background-glow glow-left"></div>
      <div class="background-glow glow-right"></div>
    </div>

    <div class="login-shell">
      <section class="login-card glass-panel">
        <div class="brand-row">
          <div class="brand-lockup">
            <span class="brand-icon">旅</span>
            <div>
              <p class="eyebrow">Travel Assistant</p>
              <h1>旅游助手</h1>
            </div>
          </div>
          <a href="/" class="browse-link">浏览首页</a>
        </div>

        <div class="intro-copy">
          <h2>{{ isLogin ? '欢迎回来' : '创建账号' }}</h2>
          <p>
            {{
              isLogin
                ? '登录后即可访问个人中心、路线收藏与个性化推荐。'
                : '注册一个新账号，开始你的旅行记录与推荐探索。'
            }}
          </p>
        </div>

        <form class="login-form" @submit.prevent="handleSubmit">
          <label class="field">
            <span>用户名</span>
            <input
              id="username"
              v-model="form.username"
              type="text"
              placeholder="请输入用户名"
              required
              :disabled="loading"
            />
          </label>

          <label v-if="!isLogin" class="field">
            <span>昵称</span>
            <input
              id="nickname"
              v-model="form.nickname"
              type="text"
              placeholder="请输入昵称（可选）"
              :disabled="loading"
            />
          </label>

          <label class="field">
            <span>密码</span>
            <div class="password-shell">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                required
                :disabled="loading"
              />
              <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                {{ showPassword ? '隐藏' : '显示' }}
              </button>
            </div>
          </label>

          <label v-if="!isLogin" class="field">
            <span>确认密码</span>
            <div class="password-shell">
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="请再次输入密码"
                required
                :disabled="loading"
              />
              <button type="button" class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
                {{ showConfirmPassword ? '隐藏' : '显示' }}
              </button>
            </div>
          </label>

          <div v-if="isLogin" class="form-options">
            <label class="remember-me">
              <input v-model="rememberMe" type="checkbox" />
              <span>保持登录</span>
            </label>
            <button type="button" class="text-action" @click="forgotPassword">忘记密码？</button>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="submit-btn" :disabled="loading || !isFormValid">
            <span v-if="loading" class="loading-spinner"></span>
            <span v-else>{{ isLogin ? '登录' : '注册' }}</span>
          </button>
        </form>

        <div class="switch-mode">
          <span>{{ isLogin ? '还没有账号？' : '已经有账号？' }}</span>
          <button type="button" class="text-action" @click="toggleMode">
            {{ isLogin ? '立即注册' : '立即登录' }}
          </button>
        </div>

        <div class="footer-links">
          <a href="#">帮助</a>
          <a href="#">隐私政策</a>
          <a href="#">使用条款</a>
          <a href="#">无障碍访问</a>
        </div>

        <div class="copyright">
          <p>© 2026 旅游助手 - 让旅行更轻松</p>
          <p class="powered-by">Powered by OpenClaw</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import userApi from '@/services/user'
import loginBackground from '../../../photo/首页图片/10.jpg'

const router = useRouter()

const isLogin = ref(true)
const loading = ref(false)
const error = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const form = reactive({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: ''
})

const isFormValid = computed(() => {
  if (!form.username || !form.password) return false
  if (!isLogin.value) {
    if (!form.confirmPassword) return false
    if (form.password !== form.confirmPassword) return false
  }
  return true
})

function resetForm() {
  form.username = ''
  form.nickname = ''
  form.password = ''
  form.confirmPassword = ''
}

function toggleMode() {
  isLogin.value = !isLogin.value
  error.value = ''
  resetForm()
}

function forgotPassword() {
  window.alert('密码重置功能开发中，请联系管理员。')
}

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    if (isLogin.value) {
      const res = await userApi.login({
        username: form.username,
        password: form.password
      })

      if (res && res.token) {
        localStorage.setItem('authToken', res.token)

        const info = res.user || {
          userId: res.userId,
          username: res.username,
          nickname: res.nickname
        }

        const userInfo = {
          userId: info.id || info.userId || info.user_id || null,
          username: info.username || info.name || info.userName || null,
          nickname: info.nickname || info.nick || info.displayName || ''
        }

        localStorage.setItem('userInfo', JSON.stringify(userInfo))

        if (rememberMe.value) {
          localStorage.setItem('rememberMe', 'true')
        }

        try {
          window.dispatchEvent(new Event('storage'))
        } catch (dispatchError) {
          console.warn('dispatch auth change failed', dispatchError)
        }

        router.push('/')
      } else {
        error.value = '登录失败，请检查用户名和密码。'
      }
    } else {
      if (form.password !== form.confirmPassword) {
        error.value = '两次输入的密码不一致。'
        loading.value = false
        return
      }

      await userApi.register({
        username: form.username,
        password: form.password,
        nickname: form.nickname || form.username
      })

      window.alert('注册成功，请使用新账号登录。')
      isLogin.value = true
      form.password = ''
      form.confirmPassword = ''
    }
  } catch (err) {
    console.error('API 调用失败:', err)
    if (err.code === 401 || err.status === 401) {
      error.value = '用户名或密码错误。'
    } else if (err.code === 404) {
      error.value = '用户不存在。'
    } else if (err.code === 409) {
      error.value = '用户名已存在。'
    } else if (err.message && err.message.includes('timeout')) {
      error.value = '请求超时，请检查网络连接。'
    } else {
      error.value = err.message || '网络错误，请稍后重试。'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: #f5f1e8;
}

.background-media {
  position: fixed;
  inset: 0;
}

.background-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.82) brightness(0.52);
}

.background-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(8, 12, 10, 0.86), rgba(14, 22, 18, 0.72)),
    radial-gradient(circle at 18% 18%, rgba(143, 176, 110, 0.18), transparent 22%),
    radial-gradient(circle at 82% 12%, rgba(200, 169, 107, 0.14), transparent 18%);
}

.background-glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(90px);
  opacity: 0.85;
}

.glow-left {
  left: -80px;
  top: 15%;
  width: 240px;
  height: 240px;
  background: rgba(100, 146, 103, 0.22);
}

.glow-right {
  right: -60px;
  bottom: 12%;
  width: 220px;
  height: 220px;
  background: rgba(200, 169, 107, 0.18);
}

.login-shell {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 96px 20px 32px;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 24px 80px rgba(0, 0, 0, 0.34);
  backdrop-filter: blur(24px);
}

.login-card {
  width: min(100%, 520px);
  padding: 28px;
  border-radius: 32px;
}

.brand-row,
.brand-lockup,
.form-options,
.footer-links {
  display: flex;
}

.brand-row {
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
}

.brand-lockup {
  align-items: center;
  gap: 14px;
}

.brand-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(143, 176, 110, 0.86), rgba(93, 159, 129, 0.82));
  color: #102116;
  font-size: 1.35rem;
  font-weight: 800;
}

.eyebrow {
  margin: 0 0 4px;
  color: rgba(245, 241, 232, 0.66);
  font-size: 0.76rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.brand-lockup h1 {
  margin: 0;
  font-size: 1.9rem;
  color: #fff8ee;
}

.browse-link,
.text-action,
.footer-links a {
  color: #d7f5b2;
  text-decoration: none;
}

.browse-link,
.text-action {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
}

.intro-copy {
  margin-bottom: 24px;
}

.intro-copy h2 {
  margin: 0 0 10px;
  font-size: 1.8rem;
  color: #fff8ee;
}

.intro-copy p {
  margin: 0;
  color: rgba(245, 241, 232, 0.72);
  line-height: 1.7;
}

.login-form {
  display: grid;
  gap: 16px;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: rgba(245, 241, 232, 0.86);
  font-size: 0.92rem;
}

.field input {
  width: 100%;
  min-height: 54px;
  padding: 0 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  color: #fff8ee;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  caret-color: #d7f5b2;
  -webkit-text-fill-color: #fff8ee;
}

.field input::placeholder {
  color: rgba(245, 241, 232, 0.42);
}

.field input:focus {
  border-color: rgba(143, 176, 110, 0.42);
  box-shadow: 0 0 0 4px rgba(143, 176, 110, 0.12);
  background: rgba(255, 255, 255, 0.08);
}

.field input:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.password-shell {
  position: relative;
}

.password-shell input {
  padding-right: 84px;
}

.toggle-password {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  color: rgba(245, 241, 232, 0.72);
  cursor: pointer;
  font-size: 0.9rem;
}

.form-options {
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.remember-me {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(245, 241, 232, 0.82);
  cursor: pointer;
}

.remember-me input {
  accent-color: #8fb06e;
}

.error-message {
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(146, 46, 46, 0.2);
  border: 1px solid rgba(255, 145, 145, 0.22);
  color: #ffd1d1;
}

.submit-btn {
  min-height: 54px;
  border: none;
  border-radius: 18px;
  background: linear-gradient(135deg, #8fb06e 0%, #5d9f81 100%);
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.2s ease, filter 0.2s ease, opacity 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

.submit-btn:disabled {
  opacity: 0.56;
  cursor: not-allowed;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.32);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.switch-mode {
  margin-top: 22px;
  padding-top: 22px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  text-align: center;
  color: rgba(245, 241, 232, 0.72);
}

.switch-mode .text-action {
  margin-left: 6px;
  font-weight: 700;
}

.footer-links {
  justify-content: center;
  gap: 18px;
  flex-wrap: wrap;
  margin: 24px 0 18px;
}

.footer-links a {
  color: rgba(245, 241, 232, 0.66);
  font-size: 0.88rem;
}

.copyright {
  text-align: center;
  color: rgba(245, 241, 232, 0.48);
  font-size: 0.78rem;
}

.copyright p {
  margin: 4px 0;
}

.powered-by {
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

@media (max-width: 640px) {
  .login-shell {
    padding-top: 80px;
  }

  .login-card {
    padding: 22px;
    border-radius: 24px;
  }

  .brand-row,
  .form-options {
    flex-direction: column;
    align-items: flex-start;
  }

  .browse-link {
    padding-left: 0;
  }
}
</style>
