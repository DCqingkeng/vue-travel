<template>
  <div class="page-root">
    <main class="container" role="main">
      <section class="card" aria-labelledby="login-title">
        <h1 id="login-title">登录</h1>

        <p class="lead">使用您的账号登录以访问个人中心、收藏与日记。</p>

        <form class="form" @submit.prevent="doLogin" novalidate>
          <label class="field">
            <span class="label-text">用户名</span>
            <input
              v-model="username"
              :disabled="loading"
              class="input"
              type="text"
              id="username"
              name="username"
              autocomplete="username"
              required
              :aria-invalid="!!error"
              aria-describedby="err-msg"
            />
          </label>

          <label class="field">
            <span class="label-text">密码</span>
            <input
              v-model="password"
              :disabled="loading"
              class="input"
              type="password"
              id="password"
              name="password"
              autocomplete="current-password"
              required
              :aria-invalid="!!error"
              aria-describedby="err-msg"
            />
          </label>

          <div class="actions">
            <button
              class="btn"
              type="submit"
              :disabled="loading || !canSubmit"
              :aria-busy="loading ? 'true' : 'false'"
              aria-live="polite"
            >
              <span class="btn-content">
                <span class="btn-icon" aria-hidden>🔒</span>
                <span v-if="!loading && !success">登录</span>
                <span v-else-if="loading" class="sr-only">登录中</span>
                <span v-else-if="success" class="success-icon" aria-hidden>✔</span>
              </span>
            </button>
            <router-link to="/register" class="link">注册新账号</router-link>
          </div>
        </form>

        <div v-if="error" class="error" role="alert">
          {{ error }}
          <div class="error-action">
            <button class="link-btn" @click="focusUsername">检查用户名</button>
            <button class="link-btn" @click="clearPassword">清除密码并重试</button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import userApi from '@/services/user'
import userSvc from '@/services/userService'
import { useRouter } from 'vue-router'

const router = useRouter()

const username = ref('')
const password = ref('')
const loading = ref(false)
const success = ref(false)
const error = ref('')

const canSubmit = computed(() => username.value.trim().length > 0 && password.value.length > 0)

function focusUsername() {
  const el = document.querySelector('input[name="username"]')
  if (el) el.focus()
}

function clearPassword() {
  password.value = ''
  const el = document.querySelector('input[name="password"]')
  if (el) el.focus()
}

async function doLogin() {
  error.value = ''
  if (!canSubmit.value) { error.value = '请输入用户名和密码（密码至少1个字符）。'; focusUsername(); return }
  loading.value = true
  success.value = false
  try {
    const data = await userApi.login({ username: username.value, password: password.value })
    const token = data && data.token
    if (token) localStorage.setItem('authToken', token)
    // best-effort local demo login for UI
    try { userSvc.login({ username: username.value, password: password.value }) } catch (e) {}
    success.value = true
    // small delay to show success micro-interaction
    setTimeout(() => router.push({ name: 'UserCenter' }), 450)
  } catch (e) {
    // give actionable error messages
    if (e && e.code === 401) {
      error.value = '账号或密码错误。请检查后重试，或点击“注册新账号”。'
    } else if (e && e.message) {
      error.value = e.message
    } else {
      error.value = '网络或服务器错误，稍后重试。'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');

:root{
  --scale-base: 1rem; /* 16px */
  --ratio: 1.25;
  --space-1: 8px; --space-2: 16px; --space-3: 24px; --space-4: 32px; --space-5: 48px;
  --max-width: 1280px;
  --body-max-ch: 65ch;
  --transition-fast: 150ms;
  --transition-page: 400ms;
  --easing: cubic-bezier(0.16, 1, 0.3, 1);
  /* Theme tokens per request */
  --accent: oklch(60% 0.20 250); /* main blue */
  --warm-gray: oklch(95% 0.02 90); /* warm background (slightly yellowish) */
  --card: oklch(100% 0.01 100); /* near white card */
  --text-primary: oklch(12% 0.02 120); /* dark text for AA contrast on light bg */
  --muted: oklch(45% 0.02 100);
  --danger: oklch(60% 0.18 30);
}

.page-root{
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, var(--warm-gray), color-mix(in oklch, var(--warm-gray) 70%, white 30%));
  padding: var(--space-4);
  font-family: 'DM Sans', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
  color: var(--text-primary);
}

.container{
  width: 100%;
  max-width: var(--max-width);
  display:flex;
  align-items:center;
  justify-content:center;
  padding: var(--space-4);
}

.card{
  width: 100%;
  max-width: 420px;
  background: linear-gradient(180deg, var(--card), color-mix(in oklch, var(--card) 90%, var(--warm-gray) 10%));
  padding: calc(var(--space-3));
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(20,24,30,0.06), 0 2px 6px rgba(20,24,30,0.04);
  transition: transform var(--transition-page) var(--easing), box-shadow var(--transition-page) var(--easing), opacity var(--transition-page) var(--easing);
  will-change: transform, opacity;
  /* entrance animation */
  opacity: 0;
  transform: translateY(16px);
  animation: slideUp var(--transition-page) var(--easing) both;
}
.card:focus-within{ transform: translateY(-2px) scale(1.0); box-shadow: 0 12px 30px rgba(20,24,30,0.08); }

/* hover elevate with subtle scale and shadow */
.card:hover{
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 18px 40px rgba(20,24,30,0.12);
}

h1{ font-size: calc(var(--scale-base) * var(--ratio) * var(--ratio)); margin:0 0 var(--space-2); }
.lead{ margin: 0 0 var(--space-3); color: color-mix(in oklch, var(--muted) 70%, var(--text-primary) 30%); max-width: var(--body-max-ch); }

.form{ display:flex; flex-direction:column; gap: var(--space-2); }
.field{ display:flex; flex-direction:column; gap:8px; }
.label-text{ font-weight:500; font-size: 0.95rem; color: color-mix(in oklch, var(--text-primary) 60%, var(--muted) 40%); }

.input{
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid color-mix(in oklch, var(--muted) 80%, black 20%);
  background: oklch(99% 0.01 100);
  color: var(--text-primary);
  font-size: 1rem;
  transition: box-shadow var(--transition-fast) var(--easing), transform var(--transition-fast) var(--easing), border-color var(--transition-fast) var(--easing);
}
.input:focus{ outline: none; box-shadow: 0 6px 18px color-mix(in oklch, var(--accent) 12%, black 88%); transform: translateY(-1px); border-color: var(--accent); }

.actions{ display:flex; align-items:center; gap: var(--space-2); margin-top: var(--space-2); }
.btn{
  background: linear-gradient(180deg, color-mix(in oklch, var(--accent) 90%, white 10%), var(--accent));
  color: white;
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  box-shadow: 0 6px 18px color-mix(in oklch, var(--accent) 14%, black 86%);
  transition: transform var(--transition-fast) var(--easing), box-shadow var(--transition-fast) var(--easing), filter var(--transition-fast) var(--easing);
}
.btn:disabled{ opacity: 0.6; cursor: not-allowed; transform: none }
.btn:focus{ box-shadow: 0 8px 30px rgba(102,126,234,0.2); }

.btn{ display:inline-flex; align-items:center; gap:10px }
.btn:hover:not(:disabled){ transform: translateY(-2px); box-shadow: 0 10px 30px rgba(102,126,234,0.12); }
.btn-icon{ display:inline-block; width:1.1em }
.success-icon{ color: #28a745; font-weight:700 }
.btn-content{ display:inline-flex; align-items:center; gap:8px }

.sr-only{ position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden }

.link{ color: color-mix(in oklch, var(--muted) 70%, var(--text-primary) 30%); font-size:0.95rem; text-decoration:none }
.link-btn{ background:none; border:none; color:var(--accent); cursor:pointer; margin-left:8px }

.error{ margin-top: var(--space-2); padding: 12px; background: oklch(98% 0.01 100); border-left: 4px solid var(--danger); border-radius:8px; color: color-mix(in oklch, var(--danger) 60%, black 40%); }
.error-action{ margin-top:8px; display:flex; gap:12px }

.skeleton{ background: linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.02) 37%, rgba(0,0,0,0.06) 63%); background-size: 400% 100%; animation: shimmer 1.2s linear infinite; display:inline-block }
.skeleton-text{ height:1rem; display:inline-block }

@keyframes shimmer{ 0%{background-position:200% 0} 100%{background-position:-200% 0} }

@keyframes slideUp{
  from { transform: translateY(16px); opacity: 0 }
  to   { transform: translateY(0); opacity: 1 }
}

/* Respect user preference for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .card{ animation: none !important; transition: none !important; transform: none !important; }
  .btn, .input, .card, .skeleton{ transition: none !important; animation: none !important }
}

</style>
