<template>
  <div class="search-shell">
    <label class="search-bar" :class="{ focused: isFocused }">
      <span class="search-icon">⌕</span>
      <input
        :value="modelValue"
        type="text"
        :placeholder="placeholder"
        @input="$emit('update:modelValue', $event.target.value)"
        @keyup.enter="$emit('submit')"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />
      <button type="button" class="search-action" @click="$emit('submit')">探索</button>
    </label>

    <div class="search-hints">
      <span class="hint-chip">{{ locationLabel }}</span>
      <span class="hint-chip">{{ resultCount }} 个空间节点已接入</span>
      <span class="hint-chip">按距离智能排序</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '搜索地址、建筑、地点...'
  },
  locationLabel: {
    type: String,
    default: '当前位置已锁定'
  },
  resultCount: {
    type: Number,
    default: 0
  }
})

defineEmits(['update:modelValue', 'submit'])

const isFocused = ref(false)
</script>

<style scoped>
.search-shell {
  display: grid;
  gap: 14px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 72px;
  padding: 12px 12px 12px 20px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.05)),
    rgba(9, 12, 20, 0.78);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -16px 28px rgba(0, 0, 0, 0.16),
    0 26px 48px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(24px);
  transition: border-color 220ms ease, transform 220ms ease, box-shadow 220ms ease;
}

.search-bar.focused {
  border-color: rgba(125, 211, 252, 0.46);
  transform: translateY(-2px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 0 0 1px rgba(125, 211, 252, 0.18),
    0 26px 56px rgba(15, 23, 42, 0.45);
}

.search-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  color: #dbeafe;
  font-size: 20px;
  background: rgba(255, 255, 255, 0.08);
}

.search-bar input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: #f3f4f6;
  font-size: 1rem;
}

.search-bar input::placeholder {
  color: #9ca3af;
}

.search-action {
  min-width: 96px;
  padding: 14px 18px;
  border: 1px solid rgba(125, 211, 252, 0.22);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.92), rgba(14, 165, 233, 0.82));
  color: #eff6ff;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: transform 220ms ease, box-shadow 220ms ease;
  box-shadow: 0 14px 28px rgba(14, 165, 233, 0.28);
}

.search-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 36px rgba(14, 165, 233, 0.34);
}

.search-hints {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hint-chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  font-size: 12px;
  letter-spacing: 0.02em;
}

@media (max-width: 640px) {
  .search-bar {
    min-height: 64px;
    padding: 10px 10px 10px 16px;
  }

  .search-action {
    min-width: 84px;
    padding: 12px 14px;
  }
}
</style>
