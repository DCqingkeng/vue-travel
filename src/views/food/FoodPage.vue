<template>
  <div class="food-page">
    <h1>🍜 美食推荐</h1>
    <p class="subtitle">发现各地特色美食，满足您的味蕾</p>
    
    <div class="food-categories">
      <div 
        v-for="cat in categories" 
        :key="cat.value"
        :class="['category-card', { active: currentCategory === cat.value }]"
        @click="currentCategory = cat.value"
      >
        <div class="icon">{{ cat.icon }}</div>
        <span>{{ cat.label }}</span>
      </div>
    </div>
    
    <div class="food-grid">
      <div v-for="food in filteredFoods" :key="food.id" class="food-card">
        <div class="food-image">{{ food.name }}</div>
        <div class="food-info">
          <div class="header">
            <h3>{{ food.name }}</h3>
            <span class="rating">⭐ {{ food.rating }}</span>
          </div>
          <p class="location">📍 {{ food.location }}</p>
          <p class="description">{{ food.description }}</p>
          <div class="tags">
            <span v-for="tag in food.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <div class="footer">
            <span class="price">{{ food.price }}</span>
            <div class="actions">
              <button class="btn-like" @click="food.likes++">
                ❤️ {{ food.likes }}
              </button>
              <button class="btn-detail">查看详情</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api'

const currentCategory = ref('all')

const categories = [
  { label: '全部', value: 'all', icon: '🍽️' },
  { label: '川菜', value: 'sichuan', icon: '🌶️' },
  { label: '粤菜', value: 'cantonese', icon: '🥟' },
  { label: '湘菜', value: 'hunan', icon: '🍖' },
  { label: '江浙菜', value: 'jiangzhe', icon: '🦐' },
  { label: '小吃', value: 'snack', icon: '🥡' },
  { label: '甜品', value: 'dessert', icon: '🍰' }
]

const foods = ref([])

const fallbackFoods = [
  { id: 1, name: '北京烤鸭', location: '北京', category: 'all', description: '皮脆肉嫩，肥而不腻，中华美食的代表', tags: ['老字号', '必吃', '传统'], rating: 4.8, price: '¥200/人', likes: 328 }
]

onMounted(async () => {
  try {
    // backend does not provide a food endpoint yet; using hot destinations as placeholder
    const list = await api.getHotDestinations({ limit: 20 })
    foods.value = Array.isArray(list) ? list : (list && list.data) ? list.data : list || fallbackFoods
  } catch (e) {
    console.warn('food fetch failed', e)
    foods.value = fallbackFoods
  }
})

const filteredFoods = computed(() => {
  if (currentCategory.value === 'all') return foods.value
  return foods.value.filter(f => f.category === currentCategory.value || f.category === 'all')
})
</script>

<style scoped>
.food-page {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #718096;
  margin-bottom: 2rem;
}

.food-categories {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: white;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  min-width: 80px;
}

.category-card:hover,
.category-card.active {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
}

.category-card .icon {
  font-size: 2rem;
}

.food-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
}

.food-card {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}

.food-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.food-image {
  height: 200px;
  background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
}

.food-info {
  padding: 1.5rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.header h3 {
  color: #2d3748;
}

.rating {
  color: #f6ad55;
  font-weight: bold;
}

.location {
  color: #718096;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.description {
  color: #4a5568;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.tags {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.tag {
  background: #fff5f5;
  color: #e53e3e;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.price {
  color: #e53e3e;
  font-weight: bold;
  font-size: 1.1rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.actions button {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-like {
  background: #fff5f5;
  color: #e53e3e;
  border: none;
}

.btn-like:hover {
  background: #fed7d7;
}

.btn-detail {
  background: #667eea;
  color: white;
  border: none;
}

.btn-detail:hover {
  background: #5a67d8;
}
</style>
