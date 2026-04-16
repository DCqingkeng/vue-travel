<template>
  <div class="notfound-page">
    <h1>404</h1>
    <p>抱歉，您访问的页面不存在。</p>
    <router-link to="/" class="btn-home">返回首页</router-link>
  </div>
</template>

<script setup>
</script>

<style scoped>
.notfound-page {
  max-width: 800px;
  margin: 6rem auto;
  text-align: center;
}

.notfound-page h1 {
  font-size: 6rem;
  color: #667eea;
  margin-bottom: 1rem;
}

.notfound-page p {
  color: #718096;
  margin-bottom: 2rem;
}

.btn-home {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border-radius: 8px;
  text-decoration: none;
}
</style>
