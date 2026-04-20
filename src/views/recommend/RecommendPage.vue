<template>
  <div class="recommend-page">
    <div class="header-row">
      <div>
        <h1>🎯 旅游推荐</h1>
        <p class="subtitle">为您精选最热门的旅游目的地</p>
      </div>

      <div class="actions-row">
        <input v-model="searchQuery" placeholder="搜索目的地 / 标签 / 关键词" class="search-input" />
        <select v-model="sortBy" class="sort-select">
          <option value="popular">推荐排序</option>
          <option value="rating">按评分</option>
          <option value="priceAsc">价格从低到高</option>
          <option value="priceDesc">价格从高到低</option>
        </select>
      </div>
    </div>

    <div class="filters">
      <button
        v-for="category in categories"
        :key="category.value"
        :class="['filter-btn', { active: currentCategory === category.value }]"
        @click="selectCategory(category.value)"
      >
        {{ category.label }}
      </button>
    </div>

    <div class="tag-filter">
      <span class="tag-label">标签：</span>
      <button
        v-for="tag in allTags"
        :key="tag"
        :class="['tag-btn', { active: selectedTags.includes(tag) }]"
        @click="toggleTag(tag)"
      >
        {{ tag }}
      </button>
    </div>

    <div class="destinations">
      <div v-for="dest in paginatedDestinations" :key="dest.id" class="destination-card">
        <div class="image-placeholder">{{ dest.name }}</div>
        <div class="content">
          <div class="top-row">
            <h3>{{ dest.name }}</h3>
            <button class="fav-btn" @click="toggleFavorite(dest)">
              <span v-if="isFavorited(dest.id)">💖</span>
              <span v-else>🤍</span>
            </button>
          </div>
          <p class="location">📍 {{ dest.location }}</p>
          <p class="description">{{ dest.description }}</p>
          <div class="tags">
            <span v-for="tag in dest.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <div class="rating">
            <span class="stars">⭐ {{ dest.rating }}</span>
            <span class="price">{{ dest.price }}</span>
          </div>
          <div class="card-actions">
            <button class="btn-outline" @click="openDetail(dest)">查看详情</button>
            <button class="btn-primary" @click="startBooking(dest)">开始预订</button>
          </div>
        </div>
      </div>
    </div>

    <div class="pagination">
      <button :disabled="currentPage === 1" @click="currentPage--">上一页</button>
      <span>第 {{ currentPage }} / {{ totalPages }} 页</span>
      <button :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
    </div>

    <!-- 详情弹窗 -->
    <div v-if="showDetail" class="modal-overlay" @click="closeDetail">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedDest.name }}</h2>
          <button class="fav-btn" @click="toggleFavorite(selectedDest)">
            <span v-if="isFavorited(selectedDest.id)">💖 已收藏</span>
            <span v-else>🤍 收藏</span>
          </button>
        </div>
        <p class="location">📍 {{ selectedDest.location }}</p>
        <div class="modal-body">
          <div class="image-large">图片占位</div>
          <div class="info">
            <p>{{ selectedDest.description }}</p>
            <p><strong>评分：</strong> {{ selectedDest.rating }} / 5</p>
            <p><strong>参考价：</strong> {{ selectedDest.price }}</p>
            <div class="tags">
              <span v-for="t in selectedDest.tags" :key="t" class="tag">{{ t }}</span>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-outline" @click="closeDetail">关闭</button>
          <button class="btn-primary" @click="startBooking(selectedDest)">立即预订</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { introsort } from '../../utils/sort'
import api from '../../services/api'

const categories = [
  { label: '全部', value: 'all' },
  { label: '海岛', value: 'island' },
  { label: '山川', value: 'mountain' },
  { label: '城市', value: 'city' },
  { label: '古镇', value: 'ancient' }
]

const currentCategory = ref('all')
const searchQuery = ref('')
const selectedTags = ref([])
const sortBy = ref('popular')

const currentPage = ref(1)
const pageSize = ref(6)

const destinations = ref([])

// sample fallback data if API not available
const fallbackDestinations = [
  { id: 1, name: '三亚', location: '海南省', category: 'island', description: '阳光、沙滩、椰林，享受热带海岛风情。适合度假与海上活动。', tags: ['海滩', '度假', '潜水'], rating: 4.8, price: 2000 },
  { id: 2, name: '张家界', location: '湖南省', category: 'mountain', description: '奇峰异石，云雾缭绕，人间仙境，适合徒步与摄影。', tags: ['自然风光', '徒步', '摄影'], rating: 4.7, price: 1500 }
]

onMounted(async () => {
  try {
    const data = await api.getTopDestinations({ userId: 1, topK: 20 })
    // API may return array or wrapped result
    destinations.value = Array.isArray(data) ? data : (data && data.data) ? data.data : data || fallbackDestinations
  } catch (e) {
    console.warn('recommend fetch failed, using fallback', e)
    destinations.value = fallbackDestinations
  }
})

// 处理 tags 列表
const allTags = computed(() => {
  const s = new Set()
  destinations.value.forEach(d => d.tags.forEach(t => s.add(t)))
  return Array.from(s)
})

const favorites = ref(new Set())
// 从 localStorage 恢复收藏
try {
  const raw = localStorage.getItem('favorites')
  if (raw) JSON.parse(raw).forEach(id => favorites.value.add(id))
} catch (e) {
  // ignore
}

watch(favorites, (v) => {
  try { localStorage.setItem('favorites', JSON.stringify(Array.from(v))) } catch (e) {}
}, { deep: true })

// Use shared introsort implementation from utils/sort.js (imported at top)


const filtered = computed(() => {
  let list = destinations.value.slice()
  if (currentCategory.value !== 'all') {
    list = list.filter(d => d.category === currentCategory.value)
  }
  if (selectedTags.value.length) {
    list = list.filter(d => selectedTags.value.every(t => d.tags.includes(t)))
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(d => (
      d.name.toLowerCase().includes(q) ||
      d.location.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.tags.join(' ').toLowerCase().includes(q)
    ))
  }

  // 排序：使用混合排序 Introsort（快速排序 + 堆排序）对包装数组进行排序
  const makeDecorated = (keyFunc) => list.map(d => ({ orig: d, key: keyFunc(d) }))
  let decorated
  if (sortBy.value === 'rating') {
    // 按评分降序
    decorated = makeDecorated(d => -d.rating)
  } else if (sortBy.value === 'priceAsc') {
    // 价格升序
    decorated = makeDecorated(d => d.price)
  } else if (sortBy.value === 'priceDesc') {
    // 价格降序
    decorated = makeDecorated(d => -d.price)
  } else {
    // 默认：按评分降序
    decorated = makeDecorated(d => -d.rating)
  }

  // 使用 introsort 对 decorated 按 key 升序排序（key 已处理为希望的方向）
  introsort(decorated, (a, b) => (a.key - b.key))
  list = decorated.map(x => x.orig)

  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))

watch([filtered, pageSize], () => { if (currentPage.value > totalPages.value) currentPage.value = totalPages.value })

const paginatedDestinations = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

// 详情与收藏
const showDetail = ref(false)
const selectedDest = ref(null)

function openDetail(dest) {
  selectedDest.value = dest
  showDetail.value = true
}

function closeDetail() {
  showDetail.value = false
  selectedDest.value = null
}

function selectCategory(val) {
  currentCategory.value = val
  currentPage.value = 1
}

function toggleTag(tag) {
  const idx = selectedTags.value.indexOf(tag)
  if (idx === -1) selectedTags.value.push(tag)
  else selectedTags.value.splice(idx, 1)
  currentPage.value = 1
}

function toggleFavorite(dest) {
  const id = dest.id
  if (favorites.value.has(id)) favorites.value.delete(id)
  else favorites.value.add(id)
}

function isFavorited(id) {
  return favorites.value.has(id)
}

function startBooking(dest) {
  // 占位：真实项目应跳转到预订流程或打开第三方
  alert(`开始预订：${dest.name}（示例）`)
}

// 简化价格显示
const formatPrice = (p) => (typeof p === 'number' ? `¥${p}` : p)

// 当前页数不能超过总页数
watch(currentPage, (v) => {
  if (v < 1) currentPage.value = 1
  if (v > totalPages.value) currentPage.value = totalPages.value
})

</script>

<style scoped>
.recommend-page {
  max-width: 1200px;
  margin: 0 auto;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

h1 {
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: #718096;
  margin-bottom: 1rem;
}

.actions-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.search-input {
  padding: 0.6rem 0.8rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  min-width: 260px;
}

.sort-select {
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
}

.filters {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 1.2rem;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn.active,
.filter-btn:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.tag-filter {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tag-label {
  color: #4a5568;
}

.tag-btn {
  padding: 0.35rem 0.8rem;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  cursor: pointer;
}

.tag-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.destinations {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.destination-card {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.destination-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.image-placeholder {
  height: 180px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  font-weight: bold;
}

.content {
  padding: 1rem 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}

.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fav-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
}

.location {
  color: #718096;
  font-size: 0.9rem;
}

.description {
  color: #4a5568;
  margin-bottom: 0.25rem;
  line-height: 1.6;
  flex: 1;
}

.tags {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  background: #edf2f7;
  color: #4a5568;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
}

.rating {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stars { color: #f6ad55 }
.price { color: #e53e3e; font-weight: bold }

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-primary {
  padding: 0.6rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.btn-outline {
  padding: 0.55rem 0.9rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin: 1.5rem 0;
  align-items: center;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
}

.modal-header { display: flex; justify-content: space-between; align-items: center }
.modal-body { display: flex; gap: 1rem; margin-top: 1rem }
.image-large { width: 45%; height: 220px; background: #f7fafc; border-radius: 8px; display:flex;align-items:center;justify-content:center }
.info { flex:1 }
.modal-actions { display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem }

</style>
