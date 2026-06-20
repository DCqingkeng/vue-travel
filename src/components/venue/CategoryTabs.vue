<template>
  <div class="tabs">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      :class="['tab', { active: modelValue === tab.value }]"
      @click="$emit('update:modelValue', tab.value)"
    >
      <span class="tab-icon">{{ tab.icon }}</span>
      <span>{{ tab.label }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  tabs: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: String,
    default: 'all'
  }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #cbd5e1;
  cursor: pointer;
  transition: transform 220ms ease, border-color 220ms ease, background 220ms ease, box-shadow 220ms ease;
}

.tab:hover {
  transform: translateY(-2px);
  border-color: rgba(125, 211, 252, 0.24);
  background: rgba(255, 255, 255, 0.07);
}

.tab.active {
  color: #eff6ff;
  border-color: rgba(125, 211, 252, 0.34);
  background: linear-gradient(135deg, rgba(125, 211, 252, 0.22), rgba(30, 41, 59, 0.45));
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.28);
}

.tab-icon {
  font-size: 14px;
}
</style>
