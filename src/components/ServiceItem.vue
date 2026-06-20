<template>
  <div class="service-item">
    <div class="icon">✈️</div>
    <h4>贴心服务</h4>
    <p>为您提供全方位的旅行支持</p>
  </div>
</template>

<script setup>
</script>

<style scoped>
.service-item { background: #fff; padding: 24px 16px; border-radius: 10px; text-align:center; box-shadow: 0 8px 24px rgba(74, 74, 72, 0.08); border: 1px solid var(--morandi-border-light); transition: all 200ms ease; }
.service-item:hover { transform: translateY(-6px); box-shadow: 0 12px 32px rgba(74, 74, 72, 0.12); border-color: var(--morandi-sage); }
.service-item h4 { color: var(--morandi-text-primary); margin: 12px 0 8px; font-size: 16px; }
.service-item p { color: var(--morandi-text-secondary); font-size: 14px; margin: 0; }
.icon { font-size: 32px; margin-bottom: 8px; }
</style>
