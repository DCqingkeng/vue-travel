<template>
  <div class="venue-page">
    <h1>📍 场所查询</h1>
    <p class="subtitle">查找景点、酒店、餐厅等场所信息</p>
    
    <div class="search-section">
      <div class="search-bar">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索景点、酒店、餐厅..."
          @keyup.enter="search"
        />
        <button @click="search">🔍 搜索</button>
      </div>
      
      <div class="filter-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.value"
          :class="['tab-btn', { active: currentTab === tab.value }]"
          @click="currentTab = tab.value"
        >
          {{ tab.icon }} {{ tab.label }}
        </button>
      </div>
    </div>
    
    <div class="results-section">
      <div v-for="venue in filteredVenues" :key="venue.id" class="venue-card">
        <div class="venue-image">{{ venue.type }}</div>
        <div class="venue-info">
          <h3>{{ venue.name }}</h3>
          <p class="address">📍 {{ venue.address }}</p>
          <p class="description">{{ venue.description }}</p>
          <div class="venue-meta">
            <span class="rating">⭐ {{ venue.rating }}</span>
            <span class="price">{{ venue.price }}</span>
            <span class="distance">📍 {{ venue.distance }}</span>
          </div>
          <div class="tags">
            <span v-for="tag in venue.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <div class="actions">
            <button class="btn-detail">查看详情</button>
            <button class="btn-route">规划路线</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api'

const searchQuery = ref('')
const currentTab = ref('all')

const tabs = [
  { label: '全部', value: 'all', icon: '📋' },
  { label: '景点', value: 'attraction', icon: '🏛️' },
  { label: '酒店', value: 'hotel', icon: '🏨' },
  { label: '餐厅', value: 'restaurant', icon: '🍽️' },
  { label: '购物', value: 'shopping', icon: '🛍️' }
]

const venues = ref([])

const fallbackVenues = [
  {
    id: 1,
    name: '故宫博物院',
    type: '景点',
    address: '北京市东城区景山前街4号',
    description: '中国明清两代的皇家宫殿，世界文化遗产',
    rating: 4.9,
    price: '¥60',
    distance: '2.5km',
    tags: ['历史', '文化', '必游'],
    category: 'attraction'
  }
]

onMounted(async () => {
  try {
    const results = await api.getHotDestinations({ limit: 20 })
    venues.value = Array.isArray(results) ? results : (results && results.data) ? results.data : results || fallbackVenues
  } catch (e) {
    console.warn('venue fetch failed', e)
    venues.value = fallbackVenues
  }
})

const filteredVenues = computed(() => {
  let result = venues.value
  if (currentTab.value !== 'all') {
    result = result.filter(v => v.category === currentTab.value)
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(v => 
      v.name.toLowerCase().includes(query) ||
      v.description.toLowerCase().includes(query)
    )
  }
  return result
})

const search = () => {
  // 搜索逻辑已在 computed 中实现
}
</script>

<style scoped>
.venue-page {
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

.search-section {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.search-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-bar input {
  flex: 1;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
}

.search-bar button {
  padding: 1rem 2rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.filter-tabs {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active,
.tab-btn:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.results-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.venue-card {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1.5rem;
  background: white;
  padding: 1.5rem;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.venue-image {
  height: 150px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}

.venue-info h3 {
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.address {
  color: #718096;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.description {
  color: #4a5568;
  margin-bottom: 1rem;
}

.venue-meta {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.rating {
  color: #f6ad55;
  font-weight: bold;
}

.price {
  color: #e53e3e;
  font-weight: bold;
}

.distance {
  color: #718096;
}

.tags {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  background: #edf2f7;
  color: #4a5568;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
}

.actions {
  display: flex;
  gap: 1rem;
}

.actions button {
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-detail {
  background: #667eea;
  color: white;
  border: none;
}

.btn-route {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}
</style>
