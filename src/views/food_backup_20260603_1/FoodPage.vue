<template>
  <div class="food-page">
    <aside class="left-panel">
      <div class="left-shell glass-panel">
        <div class="ambient ambient-green"></div>
        <div class="ambient ambient-gold"></div>
        <div class="ambient ambient-blue"></div>

        <div class="time-block">
          <p class="time-text">{{ currentTime }}</p>
          <p class="day-text">{{ currentDay }}</p>
        </div>

        <section class="glass-card destination-chooser">
          <p class="section-kicker">Destination Selector 景点 / 学校选择</p>
          <div class="destination-filters">
            <button
              v-for="item in DESTINATION_TYPE_OPTIONS"
              :key="item.value || 'all'"
              :class="['type-chip', { active: destinationType === item.value }]"
              @click="changeDestinationType(item.value)"
            >
              {{ item.label }}
            </button>
          </div>

          <div class="destination-search">
            <input
              v-model.trim="destinationKeyword"
              type="text"
              class="destination-input"
              placeholder="Search destination 搜索景点或学校"
              @keyup.enter="loadDestinations(true)"
            />
            <button class="panel-button small" :disabled="destinationLoading" @click="loadDestinations(true)">
              {{ destinationLoading ? 'Loading...' : 'Search 搜索' }}
            </button>
          </div>

          <p class="helper-copy">先选景点或学校，再调用后端美食推荐。</p>

          <div class="destination-list">
            <button
              v-for="item in destinationOptions"
              :key="item.id"
              :class="['destination-pill', { active: activeDestination && activeDestination.id === item.id }]"
              @click="selectDestination(item)"
            >
              <div>
                <strong>{{ item.name }}</strong>
                <small>{{ item.typeLabel }}</small>
              </div>
              <span>{{ formatDestinationRating(item.rating) }}</span>
            </button>
          </div>
        </section>

        <section class="glass-card city-card">
          <p class="section-kicker">Current Spot 当前选择</p>
          <div class="city-main">
            <div>
              <h3>{{ activeDestination ? activeDestination.name : 'Select a destination 请选择目的地' }}</h3>
              <p>{{ activeDestination ? activeDestination.typeLabel : 'Scenic spot or school first 先选景点或学校' }}</p>
            </div>
            <div class="city-temp">{{ activeDestination ? Math.round(activeDestination.heatScore || 0) : '--' }}</div>
          </div>
        </section>

        <section class="glass-card ai-brief-card">
          <p class="section-kicker">AI Food Brief 美食速览</p>
          <h2 class="ai-copy">{{ aiBriefTitle }}</h2>
          <div class="brief-tags">
            <span v-for="item in aiBriefTags" :key="item" class="floating-chip">{{ item }}</span>
          </div>
          <button class="panel-button" :disabled="!activeDestination || loading" @click="loadRecommendations('comprehensive')">
            Generate Picks 生成推荐
          </button>
        </section>

        <section class="glass-card ranking-card">
          <div class="ranking-header">
            <div>
              <p class="section-kicker">Hot Board 热门榜</p>
              <h3>Top Food Picks</h3>
            </div>
            <span class="map-badge">TOP 3</span>
          </div>
          <div class="ranking-list">
            <div v-for="(item, index) in hotFoodsTop3" :key="item.id" class="ranking-item">
              <span class="ranking-index">TOP {{ index + 1 }}</span>
              <div>
                <p class="ranking-name">{{ item.foodName }}</p>
                <p class="ranking-note">{{ item.restaurantName }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="glass-card stats-card">
          <div class="stat-row">
            <span>Favorite Count 收藏数</span>
            <strong>{{ favoriteIds.size }}</strong>
          </div>
          <div class="stat-row">
            <span>Food Score 探索指数</span>
            <strong>{{ foodScore }}</strong>
          </div>
        </section>
      </div>
    </aside>

    <section class="right-panel">
      <div class="right-shell">
        <header class="hero-header">
          <div class="hero-copy">
            <p class="section-kicker">CULINARY JOURNEY 美食探索</p>
            <h1 class="artistic-title">Food Discovery</h1>
            <p class="headline">Discover restaurants returned by your backend database, around the selected destination.</p>
            <p class="subtitle">heat score | rating | distance | cuisine filter | fuzzy search</p>
          </div>

          <div class="hero-actions glass-panel">
            <div class="search-shell">
              <input
                v-model.trim="keyword"
                class="search-input"
                type="text"
                placeholder="Search food / cuisine / restaurant 搜索美食 / 菜系 / 餐厅"
                :disabled="!activeDestination"
                @keyup.enter="runFoodSearch"
              />
              <button class="hero-search-btn" :disabled="!activeDestination || loading" @click="runFoodSearch">
                Search 搜索
              </button>
            </div>

            <div class="control-row">
              <select v-model="sortBy" class="sort-select" :disabled="!activeDestination" @change="refreshResults">
                <option v-for="item in FOOD_SORT_OPTIONS" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
              <button class="secondary-btn" :disabled="!activeDestination || loading" @click="clearFoodSearch">
                Reset 重置
              </button>
            </div>
          </div>
        </header>

        <section class="inline-ai glass-card">
          <div>
            <p class="section-kicker">Workflow 产品链路</p>
            <h2>Destination -> Food -> Route -> Diary</h2>
            <p>
              当前页面严格按后端模型工作：
              先选景点或学校，再基于 <code>destinationId</code> 调用
              <code>/api/food/recommend</code>，完成排序、菜系过滤、模糊查询和 Top-K 推荐。
            </p>
          </div>
          <button class="panel-button large" :disabled="!activeDestination || loading" @click="loadRecommendations(sortBy)">
            Refresh List 刷新列表
          </button>
        </section>

        <div class="chip-row">
          <button
            v-for="item in cuisineOptions"
            :key="item.value"
            :class="['chip-btn', { active: item.value === activeCategory }]"
            @click="selectCategory(item.value)"
          >
            {{ item.label }}
          </button>
        </div>

        <section class="content-layout">
          <div class="cards-column">
            <div class="section-head">
              <div>
                <p class="section-kicker">Current Query 当前查询</p>
                <h2>{{ resultsTitle }}</h2>
              </div>
              <p class="results-meta">{{ resultsLabel }}</p>
            </div>

            <div v-if="!activeDestination" class="empty-state glass-card">
              <h3>Select destination first 先选择景点或学校</h3>
              <p>页面不会再默认帮你选东京之类的第一个热门目的地，必须按后端目的地数据手动选择后再查美食。</p>
            </div>

            <div v-else-if="loading" class="empty-state glass-card">
              <h3>Loading backend results 正在加载后端美食结果</h3>
              <p>Using backend filtering and Top-K sorting for the current destination.</p>
            </div>

            <div v-else-if="displayFoods.length" class="masonry-grid">
              <article
                v-for="(item, index) in displayFoods"
                :key="item.id"
                :class="['food-card', { featured: index % 3 === 0, active: highlightedFoodId === item.id }]"
                @mouseenter="highlightFood(item.id)"
              >
                <button class="fav-btn card-fav-btn" @click.stop="toggleFavorite(item)">
                  <span>{{ favoriteIds.has(item.id) ? '♥' : '♡' }}</span>
                </button>
                <button class="map-chip" @click.stop="highlightFood(item.id)">Map 地图联动</button>

                <div class="card-image-wrap" @click="openDetail(item.id)">
                  <img v-if="item.coverImage" :src="item.coverImage" :alt="item.restaurantName" class="card-image" />
                  <div v-else class="card-image placeholder-image">
                    <div class="placeholder-copy">
                      <span>{{ item.cuisineType }}</span>
                      <strong>{{ item.restaurantName }}</strong>
                    </div>
                  </div>
                  <div class="card-overlay"></div>
                  <div class="card-copy">
                    <p class="card-kicker">{{ item.cuisineType }}</p>
                    <h3>{{ item.restaurantName }}</h3>
                    <p class="card-food">{{ item.foodName }}</p>
                  </div>
                </div>

                <div class="card-body">
                  <div class="meta-line card-stats">
                    <span class="stars">★ {{ formatRating(item.rating) }}</span>
                    <span>Heat {{ item.heatScore }}</span>
                    <span>{{ formatDistance(item.distance) }}</span>
                  </div>
                  <p v-if="item.location" class="card-location">{{ item.location }}</p>
                  <div class="tag-row">
                    <span v-for="tag in item.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
                  </div>
                  <p class="card-description">
                    {{ buildCardDescription(item) }}
                  </p>
                  <div class="action-row">
                    <button class="btn-outline" @click="openDetail(item.id)">View Detail 查看详情</button>
                    <button class="btn-primary" @click="addToRoute(item)">Add to Route 加入路线</button>
                  </div>
                </div>
              </article>
            </div>

            <div v-else class="empty-state glass-card">
              <h3>No food returned 当前没有结果</h3>
              <p>换一个景点、菜系或关键词试试；当前结果完全以数据库中的 food + restaurant 记录为准。</p>
            </div>
          </div>

          <aside class="map-column">
            <div class="map-shell glass-card">
              <div class="map-header">
                <div>
                  <p class="section-kicker">Live Map 实时地图</p>
                  <h3>Map Sync</h3>
                </div>
                <span class="map-badge">{{ displayFoods.length }}</span>
              </div>

              <div class="map-stage">
                <div class="map-grid"></div>
                <div
                  v-for="item in mapFoods"
                  :key="item.id"
                  :class="['map-point', { active: highlightedFoodId === item.id }]"
                  :style="getMapPointStyle(item)"
                  @click="highlightFood(item.id)"
                >
                  <span>{{ item.restaurantName }}</span>
                </div>

                <div v-if="highlightedFood" class="map-focus glass-panel">
                  <p class="section-kicker">Focused Spot 当前高亮</p>
                  <h4>{{ highlightedFood.restaurantName }}</h4>
                  <p>{{ highlightedFood.foodName }} | {{ formatDistance(highlightedFood.distance) }}</p>
                </div>
              </div>

              <div class="map-list">
                <button
                  v-for="item in mapFoods"
                  :key="item.id"
                  :class="['map-list-item', { active: highlightedFoodId === item.id }]"
                  @click="highlightFood(item.id)"
                >
                  <div>
                    <strong>{{ item.restaurantName }}</strong>
                    <p>{{ item.cuisineType }} | ★ {{ formatRating(item.rating) }}</p>
                  </div>
                  <span>{{ formatDistance(item.distance) }}</span>
                </button>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import {
  DESTINATION_TYPE_OPTIONS,
  FOOD_SORT_OPTIONS,
  normalizeDestinationRecord,
  normalizeFoodRecord
} from './foodCatalog'

const router = useRouter()
const destinationKeyword = ref('')
const destinationType = ref('')
const destinationLoading = ref(false)
const destinationOptions = ref([])
const activeDestination = ref(null)

const activeCategory = ref('all')
const sortBy = ref('comprehensive')
const keyword = ref('')
const loading = ref(false)
const foods = ref([])
const hotFoods = ref([])
const highlightedFoodId = ref(null)
const favoriteIds = ref(new Set())
const now = ref(new Date())

let clockTimer = null

const currentTime = computed(() => now.value.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }))
const currentDay = computed(() => now.value.toLocaleDateString('en-US', { weekday: 'long' }))

const aiBriefTags = computed(() => {
  const set = new Set()
  ;[...hotFoods.value, ...foods.value].forEach((item) => {
    if (item.cuisineType) set.add(item.cuisineType)
  })
  return Array.from(set).slice(0, 3)
})

const aiBriefTitle = computed(() => {
  if (!activeDestination.value) return 'Choose destination first 先选择景点或学校'
  return aiBriefTags.value.length
    ? `Best around ${activeDestination.value.name}: ${aiBriefTags.value.join(' / ')}`
    : `Best around ${activeDestination.value.name}`
})

const cuisineOptions = computed(() => {
  const set = new Set()
  ;[...foods.value, ...hotFoods.value].forEach((item) => {
    if (item.cuisineType) set.add(item.cuisineType)
  })
  return [
    { label: 'All 全部', value: 'all' },
    ...Array.from(set).map((value) => ({ label: value, value }))
  ]
})

const displayFoods = computed(() => {
  if (activeCategory.value === 'all') return foods.value
  return foods.value.filter((item) => item.cuisineType === activeCategory.value)
})

const hotFoodsTop3 = computed(() => hotFoods.value.slice(0, 3))
const mapFoods = computed(() => displayFoods.value.slice(0, 6))
const highlightedFood = computed(() => displayFoods.value.find((item) => item.id === highlightedFoodId.value) || displayFoods.value[0] || null)
const foodScore = computed(() => {
  const base = displayFoods.value.slice(0, 5)
  if (!base.length) return '--'
  const avg = base.reduce((sum, item) => sum + Number(item.rating || 0) * 20, 0) / base.length
  return Math.round(avg).toString()
})

const resultsTitle = computed(() => {
  if (!activeDestination.value) return 'Backend-driven food exploration'
  return `${activeDestination.value.name} | ${activeDestination.value.typeLabel}`
})

const resultsLabel = computed(() => {
  const sortLabel = FOOD_SORT_OPTIONS.find((item) => item.value === sortBy.value)?.label || sortBy.value
  return `${displayFoods.value.length} items | ${sortLabel}`
})

function persistFavorites() {
  try {
    localStorage.setItem('food-favorites', JSON.stringify(Array.from(favoriteIds.value)))
  } catch (error) {
    console.warn('persist food favorites failed', error)
  }
}

function restoreFavorites() {
  try {
    const raw = localStorage.getItem('food-favorites')
    if (!raw) return
    favoriteIds.value = new Set(JSON.parse(raw))
  } catch (error) {
    console.warn('restore food favorites failed', error)
  }
}

function cacheFoods(list) {
  try {
    sessionStorage.setItem('food-cache', JSON.stringify(list))
  } catch (error) {
    console.warn('cache foods failed', error)
  }
}

function setHighlightedDefault(list) {
  if (!list.length) {
    highlightedFoodId.value = null
    return
  }
  if (!highlightedFoodId.value || !list.find((item) => item.id === highlightedFoodId.value)) {
    highlightedFoodId.value = list[0].id
  }
}

async function loadDestinations(forceSearch = false) {
  destinationLoading.value = true
  try {
    let list = []
    if (forceSearch && destinationKeyword.value) {
      list = await api.searchDestinations({
        keyword: destinationKeyword.value,
        type: destinationType.value || undefined,
        limit: 12
      })
    } else {
      list = await api.getHotDestinations({
        type: destinationType.value || undefined,
        limit: 12
      })
    }

    destinationOptions.value = (Array.isArray(list) ? list : [])
      .map(normalizeDestinationRecord)
      .filter(Boolean)
  } catch (error) {
    console.warn('load destinations failed', error)
    destinationOptions.value = []
  } finally {
    destinationLoading.value = false
  }
}

async function requestFoods(extra = {}) {
  if (!activeDestination.value) return []

  const list = await api.getFoodRecommendations({
    destinationId: activeDestination.value.id,
    currentLat: activeDestination.value.latitude || undefined,
    currentLng: activeDestination.value.longitude || undefined,
    sortBy: extra.sortBy || sortBy.value,
    cuisineType: extra.cuisineType,
    keyword: extra.keyword,
    topK: extra.topK || 10
  })

  return (Array.isArray(list) ? list : []).map(normalizeFoodRecord).filter(Boolean)
}

async function loadRecommendations(sortValue = sortBy.value) {
  if (!activeDestination.value) return
  loading.value = true
  try {
    foods.value = await requestFoods({
      sortBy: sortValue,
      cuisineType: activeCategory.value === 'all' ? undefined : activeCategory.value,
      keyword: keyword.value || undefined,
      topK: 10
    })
    cacheFoods(foods.value)
    setHighlightedDefault(foods.value)
    await loadHotFoods()
  } catch (error) {
    console.warn('load recommendations failed', error)
    foods.value = []
    hotFoods.value = []
    highlightedFoodId.value = null
  } finally {
    loading.value = false
  }
}

async function runFoodSearch() {
  if (!activeDestination.value) return
  loading.value = true
  try {
    foods.value = await requestFoods({
      keyword: keyword.value || undefined,
      cuisineType: activeCategory.value === 'all' ? undefined : activeCategory.value,
      topK: 10
    })
    cacheFoods(foods.value)
    setHighlightedDefault(foods.value)
  } catch (error) {
    console.warn('food search failed', error)
    foods.value = []
    highlightedFoodId.value = null
  } finally {
    loading.value = false
  }
}

async function loadHotFoods() {
  if (!activeDestination.value) return
  try {
    hotFoods.value = await requestFoods({
      sortBy: 'heat',
      topK: 3
    })
  } catch (error) {
    console.warn('load hot foods failed', error)
    hotFoods.value = []
  }
}

function selectDestination(item) {
  activeDestination.value = item
  activeCategory.value = 'all'
  keyword.value = ''
  void loadRecommendations()
}

function changeDestinationType(value) {
  destinationType.value = value
  activeDestination.value = null
  foods.value = []
  hotFoods.value = []
  highlightedFoodId.value = null
  void loadDestinations(Boolean(destinationKeyword.value))
}

function selectCategory(value) {
  activeCategory.value = value
  refreshResults()
}

function clearFoodSearch() {
  keyword.value = ''
  activeCategory.value = 'all'
  void loadRecommendations()
}

function refreshResults() {
  if (!activeDestination.value) return
  if (keyword.value) {
    void runFoodSearch()
  } else {
    void loadRecommendations()
  }
}

async function toggleFavorite(item) {
  const nextState = !favoriteIds.value.has(item.id)
  if (nextState) favoriteIds.value.add(item.id)
  else favoriteIds.value.delete(item.id)
  favoriteIds.value = new Set(favoriteIds.value)
  persistFavorites()

  try {
    await api.favoriteFood({
      foodId: item.id,
      restaurantId: item.restaurantId,
      favorite: nextState
    })
  } catch (error) {
    console.warn('favorite food failed', error)
  }
}

function highlightFood(id) {
  highlightedFoodId.value = id
}

function openDetail(id) {
  router.push({ name: 'FoodDetail', params: { id } })
}

function addToRoute(item) {
  router.push({
    name: 'Route',
    query: {
      poi: item.restaurantName,
      lat: item.restaurantLatitude,
      lng: item.restaurantLongitude,
      from: 'food'
    }
  })
}

function formatRating(value) {
  const num = Number(value || 0)
  return Number.isFinite(num) ? num.toFixed(1) : '0.0'
}

function formatDistance(value) {
  const num = Number(value || 0)
  if (!Number.isFinite(num) || num < 0) return 'Distance pending 距离待定'
  if (num < 1000) return `${Math.round(num)}m`
  return `${(num / 1000).toFixed(1)}km`
}

function formatDestinationRating(value) {
  const num = Number(value || 0)
  return Number.isFinite(num) && num > 0 ? num.toFixed(1) : '--'
}

function buildCardDescription(item) {
  const parts = [
    item.foodName,
    item.cuisineType,
    `Heat ${item.heatScore}`,
    formatDistance(item.distance)
  ]
  return parts.filter(Boolean).join(' | ')
}

function getMapPointStyle(item) {
  const latSeed = Math.abs(Number(item.restaurantLatitude || 0) * 1000)
  const lngSeed = Math.abs(Number(item.restaurantLongitude || 0) * 1000)
  return {
    left: `${14 + (lngSeed % 72)}%`,
    top: `${10 + (latSeed % 74)}%`
  }
}

watch(displayFoods, (list) => {
  setHighlightedDefault(list)
}, { deep: true })

onMounted(async () => {
  restoreFavorites()
  await loadDestinations(false)
  clockTimer = window.setInterval(() => {
    now.value = new Date()
  }, 60000)
})

onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer)
})
</script>

<style scoped>
.food-page {
  display: flex;
  width: 100%;
  min-height: 100vh;
  padding: 84px 24px 0;
  gap: 24px;
  background:
    radial-gradient(circle at 8% 12%, rgba(56, 94, 69, 0.38), transparent 26%),
    radial-gradient(circle at 92% 8%, rgba(200, 169, 107, 0.14), transparent 18%),
    radial-gradient(circle at 55% 100%, rgba(61, 79, 94, 0.16), transparent 24%),
    linear-gradient(180deg, #0b0c0b 0%, #101411 48%, #141816 100%);
  color: #f5f1e8;
}

.left-panel {
  width: 20%;
  min-width: 320px;
  max-width: 380px;
}

.right-panel {
  width: 80%;
  min-width: 0;
  height: calc(100vh - 84px);
  overflow-y: auto;
  padding-right: 6px;
}

.left-shell {
  position: sticky;
  top: 84px;
  height: calc(100vh - 96px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 22px;
  border-radius: 30px;
}

.right-shell {
  width: 100%;
  padding: 0 4px 48px;
}

.glass-panel,
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 18px 44px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(22px);
}

.glass-card {
  position: relative;
  z-index: 1;
  padding: 18px;
  border-radius: 24px;
}

.ambient {
  position: absolute;
  border-radius: 999px;
  filter: blur(90px);
  pointer-events: none;
}

.ambient-green {
  top: -40px;
  left: -20px;
  width: 180px;
  height: 180px;
  background: rgba(87, 129, 88, 0.24);
}

.ambient-gold {
  top: 120px;
  right: -30px;
  width: 180px;
  height: 180px;
  background: rgba(200, 169, 107, 0.16);
}

.ambient-blue {
  bottom: 50px;
  left: 50%;
  width: 220px;
  height: 120px;
  transform: translateX(-50%);
  background: rgba(76, 110, 126, 0.16);
}

.time-text {
  font-size: clamp(3.4rem, 6vw, 5.3rem);
  line-height: 0.96;
  font-weight: 700;
  letter-spacing: -0.06em;
  color: #fff7ea;
}

.day-text,
.section-kicker,
.subtitle,
.headline,
.results-meta,
.city-main p,
.map-list-item p,
.ranking-note,
.helper-copy {
  color: rgba(245, 241, 232, 0.72);
}

.day-text {
  margin-top: 6px;
  font-size: 1rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.section-kicker {
  margin: 0 0 8px;
  font-size: 0.76rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.helper-copy {
  margin-top: 12px;
  line-height: 1.6;
  font-size: 0.92rem;
}

.destination-filters,
.brief-tags,
.tag-row,
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.destination-search {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.destination-input {
  flex: 1;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  color: #f5f0e8;
}

.destination-list {
  margin-top: 14px;
  display: grid;
  gap: 10px;
  max-height: 260px;
  overflow-y: auto;
}

.type-chip,
.destination-pill,
.floating-chip,
.tag,
.chip-btn,
.map-badge,
.map-chip {
  border-radius: 999px;
  backdrop-filter: blur(10px);
}

.type-chip,
.chip-btn {
  padding: 9px 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  cursor: pointer;
}

.type-chip.active,
.chip-btn.active,
.type-chip:hover,
.chip-btn:hover {
  background: rgba(169, 193, 140, 0.18);
  border-color: rgba(169, 193, 140, 0.2);
  color: #d7f5b2;
}

.destination-pill {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  cursor: pointer;
  text-align: left;
}

.destination-pill small {
  display: block;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.62);
}

.destination-pill.active {
  background: rgba(169, 193, 140, 0.18);
  border-color: rgba(169, 193, 140, 0.2);
}

.city-main,
.ranking-header,
.map-header,
.meta-line,
.action-row,
.control-row,
.hero-header,
.content-layout,
.section-head,
.stat-row {
  display: flex;
}

.city-main,
.ranking-header,
.map-header,
.meta-line,
.section-head,
.stat-row {
  justify-content: space-between;
  align-items: flex-start;
}

.city-temp {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
}

.ai-copy {
  font-size: 1.3rem;
  line-height: 1.3;
  font-weight: 700;
  color: #fff8ee;
}

.floating-chip,
.tag {
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #f6f2ea;
  font-size: 0.82rem;
}

.panel-button,
.btn-primary,
.btn-outline,
.hero-search-btn,
.secondary-btn {
  cursor: pointer;
  transition: 0.25s ease;
}

.panel-button,
.hero-search-btn,
.btn-primary {
  border: none;
  color: #fff;
  background: linear-gradient(135deg, #8fb06e 0%, #5d9f81 100%);
}

.panel-button {
  margin-top: 16px;
  width: 100%;
  padding: 12px 16px;
  border-radius: 14px;
  font-weight: 600;
}

.panel-button.small {
  margin-top: 0;
  width: auto;
  min-width: 94px;
}

.panel-button.large {
  width: auto;
  min-width: 160px;
}

.stats-card {
  display: grid;
  gap: 12px;
}

.hero-header {
  justify-content: space-between;
  align-items: flex-end;
  gap: 28px;
  margin-bottom: 24px;
}

.hero-copy {
  max-width: 46rem;
}

.artistic-title {
  font-size: clamp(3rem, 5vw, 4.6rem);
  line-height: 0.96;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: #f8f1e6;
}

.headline {
  margin-top: 10px;
  font-size: 1.15rem;
}

.hero-actions {
  width: min(620px, 100%);
  padding: 14px;
  border-radius: 26px;
}

.search-shell {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input,
.sort-select {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  color: #f5f0e8;
  backdrop-filter: blur(20px);
}

.search-input {
  flex: 1;
  height: 60px;
  padding: 0 24px;
  border-radius: 999px;
  font-size: 1rem;
}

.search-input::placeholder,
.destination-input::placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.hero-search-btn {
  min-width: 108px;
  height: 60px;
  border-radius: 999px;
  font-weight: 600;
}

.control-row {
  margin-top: 12px;
  gap: 12px;
}

.sort-select,
.secondary-btn {
  height: 48px;
  padding: 0 18px;
  border-radius: 16px;
}

.sort-select option {
  color: #111;
}

.secondary-btn,
.btn-outline {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}

.inline-ai {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.inline-ai p {
  margin-top: 8px;
  max-width: 48rem;
  line-height: 1.75;
  color: rgba(245, 241, 232, 0.76);
}

.chip-row {
  margin-bottom: 24px;
}

.content-layout {
  gap: 24px;
  align-items: flex-start;
}

.cards-column {
  flex: 1 1 auto;
  min-width: 0;
}

.map-column {
  width: 34%;
  min-width: 320px;
  position: sticky;
  top: 96px;
}

.masonry-grid {
  column-count: 2;
  column-gap: 24px;
}

.food-card {
  break-inside: avoid;
  margin-bottom: 24px;
  overflow: hidden;
  border-radius: 30px;
  background: #17191c;
  box-shadow:
    0 14px 44px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.06),
    0 0 36px rgba(201, 165, 92, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.food-card:hover,
.food-card.active {
  transform: translateY(-8px);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
}

.food-card.featured .card-image-wrap {
  height: 460px;
}

.card-image-wrap {
  position: relative;
  height: 420px;
  overflow: hidden;
  cursor: pointer;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.placeholder-image {
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding: 24px;
  background:
    radial-gradient(circle at 20% 20%, rgba(143, 176, 110, 0.42), transparent 30%),
    radial-gradient(circle at 82% 18%, rgba(200, 169, 107, 0.16), transparent 24%),
    linear-gradient(135deg, #212428 0%, #131714 100%);
}

.placeholder-copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #fff;
}

.placeholder-copy span {
  color: rgba(245, 241, 232, 0.72);
  font-size: 0.9rem;
}

.placeholder-copy strong {
  font-size: 1.8rem;
  line-height: 1.1;
}

.food-card:hover .card-image {
  transform: scale(1.05);
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.06) 0%, rgba(0, 0, 0, 0.08) 26%, rgba(0, 0, 0, 0.52) 72%, rgba(0, 0, 0, 0.92) 100%);
}

.card-copy,
.card-fav-btn,
.map-chip {
  position: absolute;
  z-index: 1;
}

.card-copy {
  left: 26px;
  right: 26px;
  bottom: 24px;
}

.card-copy h3 {
  font-size: clamp(2rem, 3vw, 2.5rem);
  line-height: 1.04;
  color: #fff;
}

.card-food,
.card-location,
.card-description {
  color: rgba(245, 241, 232, 0.74);
}

.card-food {
  margin-top: 8px;
  font-size: 1rem;
}

.card-body {
  padding: 20px 22px 22px;
}

.card-stats {
  gap: 12px;
  flex-wrap: wrap;
}

.stars {
  color: #ffcf64;
  font-weight: 700;
}

.card-location {
  margin-top: 10px;
}

.tag-row {
  margin-top: 14px;
}

.card-description {
  margin-top: 14px;
  line-height: 1.8;
}

.action-row {
  margin-top: 18px;
  gap: 12px;
}

.btn-primary,
.btn-outline {
  padding: 12px 18px;
  border-radius: 14px;
  font-weight: 600;
}

.card-fav-btn,
.map-chip {
  top: 18px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.24);
  color: #fff;
}

.card-fav-btn {
  right: 18px;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  font-size: 1.2rem;
}

.map-chip {
  left: 18px;
  padding: 10px 14px;
  font-size: 0.82rem;
}

.map-shell {
  padding: 18px;
}

.map-stage {
  position: relative;
  min-height: 360px;
  margin-top: 14px;
  border-radius: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 30%, rgba(98, 139, 173, 0.18), transparent 20%),
    radial-gradient(circle at 75% 20%, rgba(200, 169, 107, 0.18), transparent 22%),
    linear-gradient(180deg, rgba(10, 14, 18, 0.72), rgba(14, 18, 24, 0.92));
}

.map-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 56px 56px;
}

.map-point {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #c8a96b;
  box-shadow: 0 0 0 8px rgba(200, 169, 107, 0.18);
  cursor: pointer;
}

.map-point span {
  position: absolute;
  top: 26px;
  left: 50%;
  transform: translateX(-50%);
  min-width: max-content;
  font-size: 0.78rem;
  color: rgba(245, 241, 232, 0.76);
}

.map-point.active {
  background: #9ad691;
  box-shadow: 0 0 0 12px rgba(154, 214, 145, 0.18);
}

.map-focus {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 18px;
  padding: 16px;
  border-radius: 18px;
}

.map-focus h4 {
  margin: 4px 0 6px;
  font-size: 1.1rem;
}

.map-list {
  margin-top: 16px;
  display: grid;
  gap: 10px;
}

.map-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  cursor: pointer;
}

.map-list-item.active {
  background: rgba(169, 193, 140, 0.12);
  border-color: rgba(169, 193, 140, 0.2);
}

.empty-state {
  padding: 28px;
  line-height: 1.8;
}

.empty-state h3 {
  margin-bottom: 10px;
  color: #fff;
}

@media (max-width: 1280px) {
  .left-panel {
    width: 24%;
  }

  .right-panel {
    width: 76%;
  }

  .map-column {
    width: 36%;
    min-width: 280px;
  }
}

@media (max-width: 1100px) {
  .food-page {
    flex-direction: column;
    padding-top: 84px;
  }

  .left-panel,
  .right-panel,
  .map-column {
    width: 100%;
    max-width: none;
  }

  .left-shell {
    position: relative;
    top: 0;
    height: auto;
  }

  .right-panel {
    height: auto;
    overflow: visible;
  }

  .content-layout {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .food-page {
    padding: 78px 12px 0;
    gap: 14px;
  }

  .hero-header,
  .inline-ai,
  .search-shell,
  .control-row,
  .action-row,
  .destination-search {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-actions {
    width: 100%;
  }

  .masonry-grid {
    column-count: 1;
  }

  .card-image-wrap,
  .food-card.featured .card-image-wrap {
    height: 380px;
  }
}
</style>
