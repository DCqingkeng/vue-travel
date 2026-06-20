<template>
  <div class="product-grid">
    <!-- 产品卡片区域 - 预留，后续可添加 ProductCard 组件 -->
  </div>
</template>

<script setup>
// ProductCard 组件已移除，后续需要时可重新添加
// import ProductCard from './ProductCard.vue'
</script>

<style scoped>
.product-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
  gap: 16px;
  min-height: 100px;
}
</style>
