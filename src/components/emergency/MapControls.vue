<template>
  <div class="controls-shell">
    <el-button circle class="control-btn" @click="$emit('relocate')">定位</el-button>
    <el-button circle class="control-btn" @click="$emit('toggle-fullscreen')">全屏</el-button>
    <el-button circle class="control-btn" @click="$emit('refresh')">刷新</el-button>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  (event: 'relocate'): void
  (event: 'toggle-fullscreen'): void
  (event: 'refresh'): void
}>()
</script>

<style scoped>
.controls-shell {
  position: absolute;
  right: 18px;
  top: 88px;
  z-index: 12;
  display: grid;
  gap: 10px;
}

.control-btn {
  --el-button-bg-color: rgba(255, 252, 247, 0.92);
  --el-button-border-color: rgba(212, 205, 192, 0.82);
  --el-button-text-color: #4d4135;
  box-shadow: 0 12px 24px rgba(108, 90, 67, 0.12);
}
</style>
