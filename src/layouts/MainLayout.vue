<template>
  <div class="main-layout">
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--morandi-bg-primary);
}

.main-content {
  flex: 1;
  background: var(--morandi-bg-primary);
  width: 100%;
}
</style>
