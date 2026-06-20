<template>
  <div class="recommend-page">
    <aside class="left-panel">
      <div class="left-shell glass-panel">
        <div class="ambient ambient-green"></div>
        <div class="ambient ambient-gold"></div>
        <div class="ambient ambient-blue"></div>

        <div class="time-block">
          <p class="time-text">{{ currentTime }}</p>
          <p class="day-text">{{ currentDay }}</p>
        </div>

        <section class="glass-card ai-card">
          <p class="section-kicker">AI Travel Brief</p>
          <h2 class="ai-copy">{{ aiRecommendation }}</h2>
          <p class="ai-subcopy">跟随节奏出发，今天的灵感更偏向自然、远景与慢旅行。</p>
        </section>

        <section class="glass-card weather-card">
          <div class="weather-main">
            <div>
              <p class="section-kicker">Weather Window</p>
              <h3>{{ weatherInfo.city }}</h3>
            </div>
            <div class="weather-icon">{{ weatherInfo.icon }}</div>
          </div>
          <div class="weather-meta">
            <span class="weather-temp">{{ weatherInfo.temp }}</span>
            <span class="weather-desc">{{ weatherInfo.desc }}</span>
          </div>
        </section>

        <section class="glass-card map-card">
          <div class="map-card-header">
            <div>
              <p class="section-kicker">World Route</p>
              <h3>Global Inspiration</h3>
            </div>
            <span class="map-badge">Live</span>
          </div>
          <div class="map-wrap">
            <Worldmap />
          </div>
        </section>

        <section class="glass-card ranking-card">
          <div class="ranking-header">
            <div>
              <p class="section-kicker">Trending Destinations</p>
              <h3>热门目的地排行榜</h3>
            </div>
          </div>
          <div class="ranking-list">
            <div v-for="(item, index) in topRankings" :key="item.name" class="ranking-item">
              <span class="ranking-index">TOP {{ index + 1 }}</span>
              <div>
                <p class="ranking-name">{{ item.name }}</p>
                <p class="ranking-note">{{ item.note }}</p>
              </div>
            </div>
          </div>
        </section>

        <div class="quote-block">
          <p class="quote-bg">EXPLORE</p>
          <p class="quote-text">“The world is full of stories, and every route is a softer way of becoming.”</p>
        </div>
      </div>
    </aside>

    <section class="right-panel">
      <div class="right-shell">
        <header class="header-row">
          <div>
            <p class="section-kicker">Curated Journey</p>
            <h1 class="artistic-title">旅游推荐</h1>
            <p class="subtitle">更沉浸、更适合浏览的目的地瀑布流</p>
          </div>

          <div class="actions-row glass-panel">
            <input
              v-model="searchQuery"
              placeholder="搜索目的地 / 标签 / 关键词"
              class="search-input"
            />
            <select v-model="sortBy" class="sort-select">
              <option value="popular">推荐排序</option>
              <option value="rating">评分优先</option>
            </select>
          </div>
        </header>

        <div class="tag-filter">
          <span class="tag-label">筛选</span>
          <button
            :class="['tag-btn', { active: currentCategory === 'all' }]"
            @click="selectCategory('all')"
          >
            全部
          </button>
          <button
            v-for="tag in paginatedTags"
            :key="tag"
            :class="['tag-btn', { active: selectedTags.includes(tag) }]"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </button>
          <div v-if="totalTagPages > 1" class="tag-pagination">
            <button
              :disabled="currentTagPage === 1"
              class="tag-nav-btn"
              @click="currentTagPage--"
            >
              ‹
            </button>
            <span class="tag-page-info">{{ currentTagPage }} / {{ totalTagPages }}</span>
            <button
              :disabled="currentTagPage === totalTagPages"
              class="tag-nav-btn"
              @click="currentTagPage++"
            >
              ›
            </button>
          </div>
        </div>

        <div ref="masonryRef" class="destinations">
          <div class="grid-sizer"></div>
          <article
            v-for="(dest, index) in paginatedDestinations"
            :key="dest.id"
            class="destination-card"
            :style="getCardStyle(dest, index)"
          >
            <img
              v-if="getDestinationImage(dest)"
              :src="getDestinationImage(dest)"
              :alt="dest.name"
              class="destination-image"
              @load="refreshMasonry"
            />
            <div v-else class="image-placeholder">
              <span>{{ dest.name }}</span>
            </div>

            <button class="fav-btn card-fav-btn" @click="toggleFavorite(dest)">
              <span v-if="isFavorited(dest.id)">♥</span>
              <span v-else>♡</span>
            </button>

            <div class="card-gradient"></div>

            <div class="card-base">
              <h3 class="destination-title">{{ dest.name }}</h3>
              <p class="city-text">{{ getDestinationCity(dest) }}</p>
              <div class="rating compact-rating">
                <span class="stars">★ {{ formatRating(dest.rating) }}</span>
              </div>
              <div class="tags compact-tags">
                <span v-for="tag in dest.tags.slice(0, 4)" :key="tag" class="tag">{{ tag }}</span>
              </div>
            </div>

            <div class="card-hover">
              <p class="hover-description">{{ dest.description || '暂未提供景点简介。' }}</p>
              <div class="card-actions">
                <button class="btn-outline" @click="openDetail(dest)">查看详情</button>
                <button class="btn-primary" @click="startBooking(dest)">开始预订</button>
              </div>
            </div>
          </article>
        </div>

        <div class="pagination">
          <button :disabled="currentPage === 1" @click="currentPage--">上一页</button>
          <span>第 {{ currentPage }} / {{ totalPages }} 页</span>
          <button :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
        </div>
      </div>
    </section>

    <div v-if="showDetail && selectedDest" class="modal-overlay" @click="closeDetail">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <div>
            <h2>{{ selectedDest.name }}</h2>
            <p class="modal-city">{{ getDestinationCity(selectedDest) }}</p>
          </div>
          <button class="fav-btn modal-fav-btn" @click="toggleFavorite(selectedDest)">
            <span v-if="isFavorited(selectedDest.id)">♥ 已收藏</span>
            <span v-else>♡ 收藏</span>
          </button>
        </div>

        <div class="modal-body">
          <img
            v-if="getDestinationImage(selectedDest)"
            :src="getDestinationImage(selectedDest)"
            :alt="selectedDest.name"
            class="image-large"
          />
          <div v-else class="image-large image-large-placeholder">暂无图片</div>

          <div class="info">
            <p>{{ selectedDest.description || '暂未提供景点简介。' }}</p>
            <p><strong>评分:</strong> {{ formatRating(selectedDest.rating) }}</p>
            <p v-if="selectedDest.latitude && selectedDest.longitude">
              <strong>坐标:</strong> {{ formatCoordinate(selectedDest.latitude, selectedDest.longitude) }}
            </p>
            <div class="tags modal-tags">
              <span v-for="tag in selectedDest.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-outline" @click="closeDetail">关闭</button>
          <button class="btn-primary" @click="startBooking(selectedDest)">开始预订</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Masonry from 'masonry-layout'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Worldmap from '@/components/Worldmap.vue'
import { introsort } from '../../utils/sort'
import { getTopDestinations } from '@/services'

const imageModules = {
  ...import.meta.glob('../../../photo/recommand_pictures/*.{jpg,jpeg,png,webp}', {
    eager: true,
    import: 'default'
  }),
  ...import.meta.glob('../../../photo/recommand_pictures_2/*.{jpg,jpeg,png,webp}', {
    eager: true,
    import: 'default'
  })
}

const IMAGE_FILES = Object.entries(imageModules).map(([path, url]) => ({
  fileName: path.split('/').pop() || '',
  url
}))

const CITY_MAP = {
  上海中心大厦: '上海',
  上海迪士尼: '上海',
  上海外滩: '上海',
  东方明珠: '上海',
  南京路步行街: '上海',
  乐山大佛: '乐山',
  凤凰古城: '湘西',
  四姑娘山: '阿坝',
  大理古城: '大理',
  大雁塔: '西安',
  天坛公园: '北京',
  张家界: '张家界',
  故宫: '北京',
  布达拉宫: '拉萨',
  武当山: '十堰',
  泸沽湖: '丽江',
  洱海: '大理',
  纳木错湖: '拉萨',
  苏州园林: '苏州',
  茶卡盐湖: '海西',
  长城: '北京',
  桂林山水: '桂林',
  珠穆朗玛峰: '日喀则',
  稻城亚丁: '甘孜',
  西湖: '杭州',
  雅鲁藏布大峡谷: '林芝',
  黄山: '黄山',
  黄山风景区: '黄山',
  青海湖: '青海',
  颐和园: '北京',
  香格里拉: '迪庆',
  秦始皇兵马俑: '西安',
  三亚亚龙湾: '三亚',
  成都大熊猫基地: '成都'
}

const WEATHER_BY_CITY = {
  上海: { temp: '24°C', desc: '多云转晴', icon: '☁' },
  北京: { temp: '21°C', desc: '晴朗微风', icon: '☀' },
  拉萨: { temp: '16°C', desc: '高原晴空', icon: '☀' },
  桂林: { temp: '26°C', desc: '薄雾山景', icon: '⛅' },
  杭州: { temp: '23°C', desc: '湖畔轻风', icon: '🌤' },
  三亚: { temp: '29°C', desc: '海风舒适', icon: '🌴' },
  热门目的地: { temp: '22°C', desc: '适合出发', icon: '✦' }
}

const PRIORITY_DESTINATIONS = ['香格里拉', '布达拉宫', '青海湖', '天坛公园']

const currentCategory = ref('all')
const searchQuery = ref('')
const selectedTags = ref([])
const sortBy = ref('popular')
const currentPage = ref(1)
const pageSize = ref(6)
const currentTagPage = ref(1)
const tagsPerPage = ref(10)
const destinations = ref([])
const favorites = ref(new Set())
const showDetail = ref(false)
const selectedDest = ref(null)
const masonryRef = ref(null)
const now = ref(new Date())

let masonryInstance = null
let loadTimer = null
let clockTimer = null

function normalizePlaceName(value) {
  return String(value || '')
    .replace(/\.(jpg|jpeg|png|webp)$/i, '')
    .replace(/风景区|景区|旅游区|度假区/g, '')
    .replace(/\s+/g, '')
    .trim()
}

function hashSeed(value) {
  return String(value)
    .split('')
    .reduce((total, char) => total + char.charCodeAt(0), 0)
}

const currentTime = computed(() =>
  now.value.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
)

const currentDay = computed(() =>
  now.value.toLocaleDateString('en-US', {
    weekday: 'long'
  })
)

const aiRecommendation = computed(() => {
  const hour = now.value.getHours()
  if (hour < 11) return '今天适合探索自然与山川'
  if (hour < 17) return '午后适合前往视野开阔的目的地'
  if (hour < 21) return '傍晚适合去城市灯火与湖海之间漫游'
  return '今晚更适合收藏下一段远方灵感'
})

const topRankings = computed(() => {
  const rankingSeed = ['西藏', '桂林', '稻城亚丁']
  return rankingSeed.map((name, index) => ({
    name,
    note: ['高原秘境与纯净光线', '山水倒影与轻舟夜色', '雪山草甸与长线徒步'][index]
  }))
})

const weatherInfo = computed(() => {
  const city = getDestinationCity(destinations.value[0] || { city: '热门目的地', name: '热门目的地' })
  return {
    city,
    ...(WEATHER_BY_CITY[city] || WEATHER_BY_CITY['热门目的地'])
  }
})

function getCardStyle(dest, index) {
  const seed = hashSeed(dest.id || dest.name || index)
  return {
    height: `${440 + (seed % 5) * 84}px`
  }
}

function getDestinationImage(dest) {
  const normalizedDestName = normalizePlaceName(dest.name)
  const matchedFile = IMAGE_FILES.find((file) => {
    const normalizedFileName = normalizePlaceName(file.fileName)
    return normalizedDestName === normalizedFileName
      || normalizedDestName.includes(normalizedFileName)
      || normalizedFileName.includes(normalizedDestName)
  })

  return matchedFile ? matchedFile.url : ''
}

function getDestinationCity(dest) {
  if (!dest) return '热门目的地'
  if (dest.city) return dest.city
  if (CITY_MAP[dest.name]) return CITY_MAP[dest.name]

  const matchedName = Object.keys(CITY_MAP).find(
    (name) => String(dest.name || '').includes(name) || name.includes(String(dest.name || ''))
  )

  return matchedName ? CITY_MAP[matchedName] : '热门目的地'
}

function formatRating(rating) {
  const value = Number(rating || 0)
  return Number.isFinite(value) ? value.toFixed(1) : '0.0'
}

function formatCoordinate(lat, lng) {
  if (lat == null || lng == null) return ''
  return `${Number(lat).toFixed(4)}°, ${Number(lng).toFixed(4)}°`
}

async function refreshMasonry() {
  await nextTick()
  if (!masonryRef.value) return

  if (!masonryInstance) {
    masonryInstance = new Masonry(masonryRef.value, {
      itemSelector: '.destination-card',
      columnWidth: '.grid-sizer',
      percentPosition: true,
      gutter: 32,
      transitionDuration: '0.25s'
    })
    return
  }

  masonryInstance.reloadItems()
  masonryInstance.layout()
}

function destroyMasonry() {
  if (!masonryInstance) return
  masonryInstance.destroy()
  masonryInstance = null
}

function handleResize() {
  if (masonryInstance) masonryInstance.layout()
}

function mapDestination(d) {
  const lat = d.latitude != null ? String(d.latitude) : ''
  const lon = d.longitude != null ? String(d.longitude) : ''
  const tags = Array.isArray(d.tags)
    ? d.tags
    : (d.keywords ? String(d.keywords).split(',').map((item) => item.trim()).filter(Boolean) : [])

  return {
    id: d.id,
    name: d.name || d.title || '未命名景点',
    city: d.city || '',
    location: lat && lon ? `${lat}, ${lon}` : '',
    latitude: d.latitude,
    longitude: d.longitude,
    category: d.type ? String(d.type).toLowerCase() : (d.category ? String(d.category).toLowerCase() : 'all'),
    description: d.description || '',
    tags,
    rating: typeof d.heat_score === 'number' ? d.heat_score : (d.heatScore || 0)
  }
}

async function loadDestinations(keyword = '') {
  try {
    const params = { userId: 1, topK: 50 }
    if (keyword && keyword.trim()) params.keyword = keyword.trim()

    const list = await getTopDestinations(params)
    destinations.value = Array.isArray(list) ? list.map(mapDestination) : []
  } catch (error) {
    console.warn('getTopDestinations failed', error)
    destinations.value = []
  }

  if (!destinations.value.length) {
    destinations.value = [
      { id: 's1', name: '故宫', city: '北京', latitude: 39.9163, longitude: 116.3972, description: '明清皇宫，世界文化遗产。', tags: ['古建筑', '摄影', '历史', '皇家', '宫殿'], rating: 9850, category: 'all' },
      { id: 's2', name: '长城', city: '北京', latitude: 40.4319, longitude: 116.5704, description: '万里长城，中华民族象征。', tags: ['登山', '徒步', '摄影', '历史', '奇迹'], rating: 9720, category: 'all' },
      { id: 's3', name: '黄山风景区', city: '黄山', latitude: 30.1333, longitude: 118.1666, description: '五岳归来不看山。', tags: ['登山', '摄影', '徒步', '奇松', '怪石'], rating: 9670, category: 'all' },
      { id: 's4', name: '秦始皇兵马俑', city: '西安', latitude: 34.3841, longitude: 109.2785, description: '世界第八大奇迹。', tags: ['历史', '博物馆', '摄影', '考古', '秦代'], rating: 9650, category: 'all' },
      { id: 's5', name: '上海迪士尼', city: '上海', latitude: 31.1413, longitude: 121.6618, description: '童话王国，主题乐园。', tags: ['亲子', '娱乐', '摄影', '童话', '城堡'], rating: 9600, category: 'all' },
      { id: 's6', name: '三亚亚龙湾', city: '三亚', latitude: 18.2325, longitude: 109.5128, description: '天下第一湾，热带海滨。', tags: ['海滩', '摄影', '度假', '潜水', '椰林'], rating: 9560, category: 'all' }
    ]
  }
}

const allTags = computed(() => {
  const tags = new Set()
  destinations.value.forEach((dest) => dest.tags.forEach((tag) => tags.add(tag)))
  return Array.from(tags)
})

const totalTagPages = computed(() => Math.max(1, Math.ceil(allTags.value.length / tagsPerPage.value)))

const paginatedTags = computed(() => {
  const start = (currentTagPage.value - 1) * tagsPerPage.value
  return allTags.value.slice(start, start + tagsPerPage.value)
})

const filtered = computed(() => {
  let list = destinations.value.slice()

  if (currentCategory.value !== 'all') {
    list = list.filter((dest) => dest.category === currentCategory.value)
  }

  if (selectedTags.value.length) {
    list = list.filter((dest) => selectedTags.value.every((tag) => dest.tags.includes(tag)))
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter((dest) => {
      const cityText = getDestinationCity(dest).toLowerCase()
      return dest.name.toLowerCase().includes(q)
        || cityText.includes(q)
        || dest.description.toLowerCase().includes(q)
        || dest.tags.join(' ').toLowerCase().includes(q)
    })
  }

  const decorated = list.map((dest) => {
    const priorityIndex = PRIORITY_DESTINATIONS.findIndex((name) => name === dest.name)

    return {
      orig: dest,
      priority: priorityIndex === -1 ? 999 : priorityIndex,
      key: sortBy.value === 'rating' ? -dest.rating : -dest.rating
    }
  })

  introsort(decorated, (a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    return a.key - b.key
  })
  return decorated.map((item) => item.orig)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))

const paginatedDestinations = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

function openDetail(dest) {
  selectedDest.value = dest
  showDetail.value = true
}

function closeDetail() {
  showDetail.value = false
  selectedDest.value = null
}

function selectCategory(value) {
  currentCategory.value = value
  currentPage.value = 1
}

function toggleTag(tag) {
  const index = selectedTags.value.indexOf(tag)
  if (index === -1) selectedTags.value.push(tag)
  else selectedTags.value.splice(index, 1)
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
  alert(`开始预订：${dest.name}（示例）`)
}

watch(searchQuery, (value) => {
  clearTimeout(loadTimer)
  loadTimer = setTimeout(() => {
    loadDestinations(value || '')
    currentPage.value = 1
  }, 300)
})

watch(allTags, () => {
  currentTagPage.value = 1
})

watch([filtered, pageSize], () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
})

watch(currentPage, (value) => {
  if (value < 1) currentPage.value = 1
  if (value > totalPages.value) currentPage.value = totalPages.value
})

watch(paginatedDestinations, () => {
  refreshMasonry()
}, { deep: true })

watch([currentPage, sortBy, currentCategory, selectedTags], () => {
  refreshMasonry()
}, { deep: true })

try {
  const raw = localStorage.getItem('favorites')
  if (raw) JSON.parse(raw).forEach((id) => favorites.value.add(id))
} catch (error) {
  console.warn('restore favorites failed', error)
}

watch(favorites, (value) => {
  try {
    localStorage.setItem('favorites', JSON.stringify(Array.from(value)))
  } catch (error) {
    console.warn('persist favorites failed', error)
  }
}, { deep: true })

onMounted(() => {
  loadDestinations()
  window.addEventListener('resize', handleResize)
  clockTimer = window.setInterval(() => {
    now.value = new Date()
  }, 60000)
})

onBeforeUnmount(() => {
  clearTimeout(loadTimer)
  if (clockTimer) window.clearInterval(clockTimer)
  window.removeEventListener('resize', handleResize)
  destroyMasonry()
})
</script>

<style scoped>
.recommend-page {
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
  width: 28%;
  min-width: 320px;
  max-width: 440px;
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

.glass-panel,
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 18px 44px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(22px);
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

.time-block,
.quote-block,
.ai-card,
.weather-card,
.map-card,
.ranking-card {
  position: relative;
  z-index: 1;
}

.time-block {
  padding: 4px 2px 8px;
}

.time-text {
  font-size: clamp(3.4rem, 6vw, 5.3rem);
  line-height: 0.96;
  font-weight: 700;
  letter-spacing: -0.06em;
  color: #fff7ea;
}

.day-text {
  margin-top: 6px;
  font-size: 1rem;
  color: rgba(245, 241, 232, 0.72);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.section-kicker {
  margin: 0 0 8px;
  font-size: 0.76rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(245, 241, 232, 0.52);
}

.glass-card {
  padding: 18px 18px 20px;
  border-radius: 24px;
}

.ai-copy {
  font-size: 1.55rem;
  line-height: 1.2;
  font-weight: 700;
  color: #fff8ee;
}

.ai-subcopy {
  margin-top: 10px;
  color: rgba(245, 241, 232, 0.72);
  line-height: 1.7;
}

.weather-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.weather-main h3,
.map-card h3,
.ranking-card h3 {
  font-size: 1.2rem;
  font-weight: 600;
}

.weather-icon {
  font-size: 1.8rem;
}

.weather-meta {
  margin-top: 10px;
  display: flex;
  gap: 12px;
  align-items: baseline;
}

.weather-temp {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
}

.weather-desc {
  color: rgba(245, 241, 232, 0.72);
}

.map-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.map-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.map-badge {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #d8f0bc;
  font-size: 0.78rem;
}

.map-wrap {
  flex: 1;
  min-height: 250px;
  border-radius: 20px;
  overflow: hidden;
}

.map-wrap :deep(.worldmap-section) {
  padding: 0;
  background: transparent;
}

.map-wrap :deep(.worldmap-shell) {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 12px;
  border-radius: 20px;
  background: rgba(10, 14, 18, 0.5);
  border-color: rgba(255, 255, 255, 0.06);
  box-shadow: none;
}

.map-wrap :deep(.worldmap-copy) {
  display: none;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ranking-item {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 10px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.ranking-item:first-child {
  border-top: none;
  padding-top: 0;
}

.ranking-index {
  min-width: 58px;
  color: #c8a96b;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
}

.ranking-name {
  font-weight: 600;
  color: #fff;
}

.ranking-note {
  margin-top: 4px;
  color: rgba(245, 241, 232, 0.66);
  font-size: 0.92rem;
}

.quote-block {
  margin-top: auto;
  padding: 12px 4px 0;
}

.quote-bg {
  font-size: clamp(3rem, 6vw, 5.8rem);
  line-height: 0.9;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.04);
}

.quote-text {
  margin-top: -4px;
  max-width: 26ch;
  color: rgba(245, 241, 232, 0.68);
  line-height: 1.75;
}

.right-panel {
  width: 72%;
  min-width: 0;
  height: calc(100vh - 84px);
  overflow-y: auto;
  padding-right: 6px;
}

.right-shell {
  width: 100%;
  padding: 0 4px 48px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 28px;
  margin-bottom: 34px;
}

.artistic-title {
  font-size: clamp(3rem, 5vw, 4.4rem);
  line-height: 0.96;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: #f8f1e6;
}

.subtitle {
  margin-top: 10px;
  color: rgba(245, 240, 232, 0.72);
}

.actions-row {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 12px;
  border-radius: 22px;
}

.search-input,
.sort-select {
  padding: 13px 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  color: #f5f0e8;
  backdrop-filter: blur(20px);
}

.search-input {
  min-width: 320px;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.sort-select option {
  color: #111;
}

.tag-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 34px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.tag-label,
.tag-page-info {
  color: rgba(245, 240, 232, 0.62);
  white-space: nowrap;
}

.tag-btn,
.tag-nav-btn {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.08);
  color: #f5f0e8;
  border-radius: 999px;
  cursor: pointer;
  transition: 0.25s ease;
  white-space: nowrap;
  backdrop-filter: blur(10px);
}

.tag-btn {
  padding: 8px 14px;
}

.tag-btn.active,
.tag-btn:hover,
.tag-nav-btn:hover:not(:disabled) {
  background: rgba(169, 193, 140, 0.18);
  border-color: rgba(169, 193, 140, 0.2);
  color: #d7f5b2;
}

.tag-pagination {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.tag-nav-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
}

.tag-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.destinations {
  width: 100%;
}

.grid-sizer,
.destination-card {
  width: calc((100% - 32px) / 2);
}

.destination-card {
  position: relative;
  overflow: hidden;
  border-radius: 30px;
  margin-bottom: 32px;
  background: #17191c;
  box-shadow:
    0 14px 44px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.06),
    0 0 36px rgba(201, 165, 92, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.destination-card:hover {
  transform: translateY(-10px);
  box-shadow:
    0 22px 60px rgba(0, 0, 0, 0.42),
    0 0 0 1px rgba(255, 255, 255, 0.08),
    0 0 44px rgba(201, 165, 92, 0.14);
}

.destination-image,
.image-placeholder {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.destination-image {
  object-fit: cover;
  filter: brightness(0.76) saturate(1.04);
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 20% 20%, rgba(143, 176, 110, 0.42), transparent 30%),
    radial-gradient(circle at 82% 18%, rgba(200, 169, 107, 0.16), transparent 24%),
    linear-gradient(135deg, #212428 0%, #131714 100%);
  color: #fff;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.card-gradient {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.08) 28%, rgba(0, 0, 0, 0.46) 58%, rgba(0, 0, 0, 0.92) 100%);
}

.card-base,
.card-hover,
.card-fav-btn {
  position: absolute;
  z-index: 1;
}

.card-fav-btn {
  top: 20px;
  right: 20px;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.22);
  color: #fff;
  font-size: 1.25rem;
  backdrop-filter: blur(8px);
}

.fav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.card-base {
  left: 28px;
  right: 28px;
  bottom: 28px;
}

.destination-title {
  margin: 0 0 8px;
  font-size: clamp(2rem, 3vw, 2.55rem);
  line-height: 1.05;
  color: #fff;
}

.city-text {
  margin: 0 0 12px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 1.05rem;
}

.rating {
  display: flex;
  align-items: center;
  gap: 12px;
}

.compact-rating {
  margin-bottom: 16px;
}

.stars {
  color: #ffcf64;
  font-weight: 700;
}

.compact-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #f6f2ea;
  font-size: 0.82rem;
  backdrop-filter: blur(8px);
}

.card-hover {
  left: 28px;
  right: 28px;
  bottom: 28px;
  transform: translateY(18px);
  opacity: 0;
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.destination-card:hover .card-hover {
  opacity: 1;
  transform: translateY(0);
}

.destination-card:hover .card-base {
  opacity: 0;
  transform: translateY(16px);
}

.card-base {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.hover-description {
  margin: 0 0 16px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.75;
  max-height: 7.2em;
  overflow: hidden;
}

.card-actions {
  display: flex;
  gap: 12px;
}

.btn-primary,
.btn-outline {
  padding: 12px 18px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.25s ease;
}

.btn-primary {
  border: none;
  background: linear-gradient(135deg, #8fb06e 0%, #5d9f81 100%);
  color: #fff;
}

.btn-primary:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

.btn-outline {
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
}

.btn-outline:hover {
  background: rgba(255, 255, 255, 0.12);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 18px;
  margin-top: 8px;
  color: rgba(245, 240, 232, 0.74);
}

.pagination button {
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  color: #f5f0e8;
  cursor: pointer;
  backdrop-filter: blur(10px);
}

.pagination button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 2000;
}

.modal {
  width: min(960px, 100%);
  border-radius: 24px;
  padding: 28px;
  background: linear-gradient(180deg, #181a1f 0%, #0f1115 100%);
  color: #f5f0e8;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0 0 8px;
}

.modal-city {
  margin: 0;
  color: rgba(245, 240, 232, 0.66);
}

.modal-fav-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  color: #fff;
  padding: 10px 14px;
}

.modal-body {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 24px;
  align-items: stretch;
}

.image-large {
  width: 100%;
  min-height: 340px;
  object-fit: cover;
  border-radius: 20px;
}

.image-large-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #212428 0%, #0f1216 100%);
}

.info {
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: rgba(245, 240, 232, 0.84);
}

.info strong {
  color: #fff;
}

.modal-tags {
  margin-top: 8px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

@media (max-width: 1200px) {
  .recommend-page {
    gap: 18px;
    padding-inline: 18px;
  }

  .left-panel {
    width: 34%;
    min-width: 300px;
  }

  .right-panel {
    width: 66%;
  }
}

@media (max-width: 980px) {
  .recommend-page {
    flex-direction: column;
    padding-top: 84px;
  }

  .left-panel,
  .right-panel {
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

  .grid-sizer,
  .destination-card {
    width: calc((100% - 20px) / 2);
  }
}

@media (max-width: 768px) {
  .recommend-page {
    padding: 78px 12px 0;
    gap: 14px;
  }

  .header-row,
  .actions-row,
  .modal-body,
  .modal-header,
  .card-actions,
  .modal-actions {
    display: flex;
    flex-direction: column;
  }

  .header-row,
  .modal-header {
    align-items: stretch;
  }

  .search-input {
    min-width: 0;
    width: 100%;
  }

  .grid-sizer,
  .destination-card {
    width: 100%;
  }

  .destination-title {
    font-size: 1.7rem;
  }

  .modal {
    padding: 20px;
  }
}
</style>
