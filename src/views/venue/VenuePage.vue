<template>
  <div class="venue-page">
    <section class="venue-layout">
      <aside class="sidebar-panel">
        <div class="sidebar-scroll">
          <section class="search-panel glass-panel">
            <div class="panel-copy">
              <span class="eyebrow">Travel Map</span>
              <h1>场所探索</h1>
              <p>输入地点后自动定位，并在地图上联动展示附近场所与步行路线。</p>
            </div>

            <label class="search-box" :class="{ focused: searchFocused }">
              <span class="search-icon">⌕</span>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索地址、建筑、地标..."
                @focus="searchFocused = true"
                @blur="handleSearchBlur"
                @input="handleSearchInput"
                @keyup.enter="submitAddressSearch"
              >
              <button type="button" class="search-button" @click="submitAddressSearch">
                开始探索
              </button>
            </label>

            <div v-if="suggestions.length" class="suggestions-panel">
              <button
                v-for="tip in suggestions"
                :key="getTipKey(tip)"
                type="button"
                class="suggestion-item"
                @mousedown.prevent="applySuggestion(tip)"
              >
                <div>
                  <strong>{{ tip.name || tip.district || '未知地点' }}</strong>
                  <span>{{ formatTipAddress(tip) }}</span>
                </div>
                <span class="suggestion-tag">定位</span>
              </button>
            </div>
          </section>

          <section class="category-panel glass-panel">
            <div class="section-head">
              <div>
                <span class="eyebrow">Category</span>
                <h2>探索分类</h2>
              </div>
              <span class="section-note">{{ sortedPois.length }} 个结果</span>
            </div>

            <div class="category-scroll">
              <button
                v-for="category in categoryOptions"
                :key="category.value"
                type="button"
                :class="['category-pill', { active: activeCategory === category.value }]"
                @click="setActiveCategory(category.value)"
              >
                <span>{{ category.icon }}</span>
                <span>{{ category.label }}</span>
              </button>
            </div>
          </section>

          <section class="summary-grid">
            <article class="summary-card glass-panel">
              <span class="eyebrow">Location</span>
              <h3>{{ currentCenterLabel }}</h3>
              <p>{{ locationNarrative }}</p>
            </article>

            <article class="summary-card glass-panel">
              <span class="eyebrow">Quick Brief</span>
              <div class="brief-list">
                <div class="brief-item">
                  <span>定位来源</span>
                  <strong>{{ locationSource }}</strong>
                </div>
                <div class="brief-item">
                  <span>最近步行距离</span>
                  <strong>{{ nearestPoiDistance }}</strong>
                </div>
                <div class="brief-item">
                  <span>路线状态</span>
                  <strong>{{ routeSummaryLabel }}</strong>
                </div>
              </div>
            </article>
          </section>

          <section v-if="selectedPoi" class="selected-panel glass-panel">
            <div class="selected-cover" :style="getPoiCoverStyle(selectedPoi)">
              <div class="selected-cover-gradient"></div>
              <div class="selected-cover-meta">
                <span class="chip">{{ selectedPoi.typeLabel }}</span>
                <span class="chip" :class="{ open: selectedPoi.isOpen }">
                  {{ selectedPoi.isOpen ? '营业中' : '待确认' }}
                </span>
              </div>
            </div>

            <div class="selected-body">
              <div class="selected-head">
                <div>
                  <span class="eyebrow">Selected Place</span>
                  <h3>{{ selectedPoi.name }}</h3>
                  <p>{{ selectedPoi.address }}</p>
                </div>
                <div class="score-badge">
                  <strong>{{ selectedPoi.rating }}</strong>
                  <span>{{ selectedPoi.ratingLabel }}</span>
                </div>
              </div>

              <div class="selected-facts">
                <div class="fact-card">
                  <span>步行</span>
                  <strong>{{ routeInfo ? routeInfo.walkingText : selectedPoi.walkingText }}</strong>
                </div>
                <div class="fact-card">
                  <span>距离</span>
                  <strong>{{ routeInfo ? routeInfo.distanceText : selectedPoi.distanceText }}</strong>
                </div>
              </div>

              <div class="selected-actions">
                <button type="button" class="primary-action" @click="planRouteToPoi(selectedPoi)">
                  探索路线
                </button>
                <button type="button" class="secondary-action" @click="focusPoiOnMap(selectedPoi.id)">
                  地图聚焦
                </button>
              </div>
            </div>
          </section>

          <section class="poi-panel glass-panel">
            <div class="section-head">
              <div>
                <span class="eyebrow">Explore Nearby</span>
                <h2>旅行探索卡片</h2>
              </div>
              <p class="section-note">地图保持在右侧，卡片点击后会直接联动聚焦与步行路线。</p>
            </div>

            <div v-if="isSearchingPoi" class="state-card">
              <div class="spinner"></div>
              <p>正在搜索附近场所...</p>
            </div>

            <div v-else-if="!sortedPois.length" class="state-card">
              <div class="state-icon">◎</div>
              <p>{{ emptyStateMessage }}</p>
            </div>

            <div v-else class="poi-grid-shell">
              <AnimateGrid
                :cards="poiGridCards"
                text-glow-start-color="#d8c3a5"
                text-glow-end-color="#6f8a72"
                :perspective="1280"
                :rotate-x="8"
                :rotate-y="-8"
                :columns="2"
                :mobile-columns="1"
                :active-index="focusedPoiIndex"
                @card-enter="({ card }) => hoverPoi(card.id)"
                @card-leave="() => hoverPoi(null)"
                @card-click="({ card }) => selectPoi(card)"
              >
                <template #card="poi">
                  <article
                    :class="['poi-card', { active: poi.id === focusedPoiId, dimmed: shouldDimPoi(poi.id) }]"
                  >
                    <div class="poi-cover" :style="getPoiCoverStyle(poi)">
                      <div class="poi-cover-gradient"></div>
                      <div class="poi-cover-top">
                        <span class="chip">{{ poi.typeLabel }}</span>
                        <span class="chip" :class="{ open: poi.isOpen }">
                          {{ poi.isOpen ? '营业中' : '待确认' }}
                        </span>
                      </div>
                      <div class="poi-cover-bottom">
                        <strong>{{ poi.name }}</strong>
                        <span>{{ poi.shortAddress }}</span>
                      </div>
                    </div>

                    <div class="poi-body">
                      <p class="poi-description">{{ getPoiDescription(poi) }}</p>
                      <div class="poi-metrics">
                        <span>步行 {{ poi.walkingText }}</span>
                        <span>·</span>
                        <span>{{ poi.distanceText }}</span>
                      </div>
                      <button type="button" class="card-action" @click.stop="planRouteToPoi(poi)">
                        探索路线
                      </button>
                    </div>
                  </article>
                </template>
              </AnimateGrid>
            </div>
          </section>
        </div>
      </aside>

      <section class="map-panel">
        <div class="map-stage glass-panel">
          <div ref="mapRef" class="map-canvas"></div>
          <div class="map-vignette"></div>
          <div class="map-grain"></div>
          <div class="map-tint"></div>

          <div class="map-overlay top-left">
            <span class="eyebrow">Immersive Explore</span>
            <h2>{{ currentCenterLabel }}</h2>
            <p>地图会始终保留在右侧，搜索、切换分类与浏览卡片时不会再被覆盖。</p>
          </div>

          <div class="map-overlay top-right">
            <span class="floating-pill">{{ activeCategoryLabel }}</span>
            <span class="floating-pill">{{ sortedPois.length }} 个标记</span>
          </div>

          <div v-if="routeInfo" class="map-overlay bottom-right route-panel">
            <div class="route-head">
              <span class="eyebrow">Walking Route</span>
              <strong>{{ routeInfo.distanceText }}</strong>
            </div>
            <p>{{ routeInfo.walkingText }}</p>
            <div class="route-steps">
              <div v-for="(step, index) in routeSteps" :key="index" class="route-step">
                <span class="step-index">{{ index + 1 }}</span>
                <span>{{ step.instruction }}</span>
              </div>
            </div>
          </div>

          <div v-if="mapError" class="map-error">
            <strong>地图初始化失败</strong>
            <span>{{ mapError }}</span>
          </div>
        </div>
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AnimateGrid from '@/components/AnimateGrid.vue'
import { loadAmapSdk } from '@/services/amap'

const DEFAULT_CENTER = { lng: 118.9111, lat: 32.117, label: '南京大学仙林校区' }
const SEARCH_RADIUS = 2000

const categoryOptions = [
  { value: 'all', label: '全部', icon: '✦', keyword: '' },
  { value: 'cafe', label: '咖啡馆', icon: '☕', keyword: '咖啡馆' },
  { value: 'teaching', label: '教学楼', icon: '⌂', keyword: '教学楼' },
  { value: 'library', label: '图书馆', icon: '✎', keyword: '图书馆' },
  { value: 'canteen', label: '食堂', icon: '🍽', keyword: '食堂' },
  { value: 'sports', label: '操场', icon: '⚑', keyword: '操场' },
  { value: 'gym', label: '体育馆', icon: '✺', keyword: '体育馆' },
  { value: 'dormitory', label: '宿舍', icon: '☾', keyword: '宿舍' },
  { value: 'lab', label: '实验楼', icon: '✧', keyword: '实验楼' },
  { value: 'office', label: '行政楼', icon: '▣', keyword: '行政楼' },
  { value: 'supermarket', label: '超市', icon: '◈', keyword: '超市' },
  { value: 'hospital', label: '校医院', icon: '✚', keyword: '医院' },
  { value: 'gate', label: '校门', icon: '⬢', keyword: '校门' },
  { value: 'bus', label: '公交站', icon: '⇄', keyword: '公交站' }
]

const categoryStyles = {
  cafe: { label: '咖啡馆', icon: '☕', marker: 'linear-gradient(135deg, #dcc6a6, #8a694e)' },
  teaching: { label: '教学楼', icon: '⌂', marker: 'linear-gradient(135deg, #b0c3af, #5f7765)' },
  library: { label: '图书馆', icon: '✎', marker: 'linear-gradient(135deg, #d9ceb6, #6f6550)' },
  canteen: { label: '食堂', icon: '🍽', marker: 'linear-gradient(135deg, #d8a98a, #8f5d3f)' },
  sports: { label: '操场', icon: '⚑', marker: 'linear-gradient(135deg, #a8bf9d, #47614a)' },
  gym: { label: '体育馆', icon: '✺', marker: 'linear-gradient(135deg, #9ea986, #536149)' },
  dormitory: { label: '宿舍', icon: '☾', marker: 'linear-gradient(135deg, #c6b7a2, #6f6456)' },
  lab: { label: '实验楼', icon: '✧', marker: 'linear-gradient(135deg, #b8c1b3, #5b6b60)' },
  office: { label: '行政楼', icon: '▣', marker: 'linear-gradient(135deg, #c9c4b5, #6d6859)' },
  supermarket: { label: '超市', icon: '◈', marker: 'linear-gradient(135deg, #dac7a0, #8d7651)' },
  hospital: { label: '校医院', icon: '✚', marker: 'linear-gradient(135deg, #d9c0b7, #926b62)' },
  gate: { label: '校门', icon: '⬢', marker: 'linear-gradient(135deg, #b7b59d, #5e5d48)' },
  bus: { label: '公交站', icon: '⇄', marker: 'linear-gradient(135deg, #d3bf9d, #756245)' },
  default: { label: '附近场所', icon: '✦', marker: 'linear-gradient(135deg, #d8c3a5, #5f6c58)' }
}

const coverImages = {
  cafe: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
  teaching: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1200&q=80',
  library: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80',
  canteen: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
  sports: 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1200&q=80',
  gym: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80',
  dormitory: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  lab: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=1200&q=80',
  office: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
  supermarket: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
  hospital: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
  gate: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80',
  bus: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1200&q=80',
  default: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
}

const descriptionMap = {
  cafe: '适合短暂停留，点一杯咖啡后从这里继续展开散步路线。',
  teaching: '校园建筑线条与树影交织，步行体验通常最直接。',
  library: '安静而有目的地的停留点，适合作为探索中的休息站。',
  canteen: '补给感最强的节点，适合把路线安排成一段轻松的小旅行。',
  sports: '开阔视野与呼吸感最强，适合黄昏时慢慢走过去。',
  gym: '更有活力的运动目的地，常常能成为路线中的节奏切换点。',
  dormitory: '生活气息最浓的区域，更接近日常漫游的真实场景。',
  lab: '偏安静的研究空间，建筑感与路径层次通常更丰富。',
  office: '行政区域通常交通清晰，适合作为地图定位的参照点。',
  supermarket: '最实用的补给站，适合在探索中顺路停靠。',
  hospital: '应急与健康服务点，路线规划会更强调快速可达。',
  gate: '非常适合作为进入或离开区域时的起终点。',
  bus: '公共交通节点，适合衔接更远的探索路线。'
}

const mapRef = ref<HTMLElement | null>(null)
const mapReady = ref(false)
const mapError = ref('')
const searchQuery = ref('')
const searchFocused = ref(false)
const suggestions = ref<any[]>([])
const activeCategory = ref('all')
const pois = ref<any[]>([])
const selectedPoiId = ref<string | null>(null)
const hoveredPoiId = ref<string | null>(null)
const currentCenter = ref({ ...DEFAULT_CENTER })
const locationSource = ref('默认位置')
const isSearchingPoi = ref(false)
const routeLoading = ref(false)
const durationRankingLoading = ref(false)
const routeInfo = ref<any>(null)

let AMapRef: any = null
let mapInstance: any = null
let geocoderInstance: any = null
let autoCompleteInstance: any = null
let walkingInstance: any = null
let rankingWalkingService: any = null
let startMarker: any = null
let searchTimer: number | null = null
let poiSearchGeneration = 0
const markerStore = new Map<string, any>()

const activeCategoryLabel = computed(() => {
  const category = categoryOptions.find((item) => item.value === activeCategory.value)
  return category ? category.label : '全部'
})

const currentCenterLabel = computed(() => currentCenter.value.label || '未定位')
const focusedPoiId = computed(() => hoveredPoiId.value || selectedPoiId.value)
const routeSteps = computed(() => routeInfo.value?.steps?.slice(0, 4) || [])

const sortedPois = computed(() => {
  return [...pois.value].sort((a, b) => comparePoisByWalkingDuration(a, b))
})

const selectedPoi = computed(() => {
  return sortedPois.value.find((item) => item.id === selectedPoiId.value) || null
})

const poiGridCards = computed(() => sortedPois.value.slice(0, 12))

const focusedPoiIndex = computed(() => {
  if (!focusedPoiId.value) return null
  const index = poiGridCards.value.findIndex((poi) => poi.id === focusedPoiId.value)
  return index >= 0 ? index : null
})

const nearestPoiDistance = computed(() => {
  return sortedPois.value.length ? sortedPois.value[0].distanceText : '--'
})

const routeSummaryLabel = computed(() => {
  if (routeLoading.value) return '规划中'
  if (durationRankingLoading.value) return '排序中'
  if (routeInfo.value) return routeInfo.value.walkingText
  return '待规划'
})

const emptyStateMessage = computed(() => {
  if (!mapReady.value) return '正在初始化地图服务，请稍候。'
  return '输入地址或切换分类后，这里会显示附近场所结果。'
})

const locationNarrative = computed(() => {
  return `以 ${currentCenterLabel.value} 为中心，地图会自动联动附近场所、步行距离与路线细节。`
})

function getTipKey(tip: any) {
  return `${tip.name || 'tip'}-${tip.adcode || ''}-${tip.location || tip.address || ''}`
}

function formatTipAddress(tip: any) {
  return [tip.district, tip.address].filter(Boolean).join(' · ') || '点击后定位到该位置'
}

function getPoiCoverStyle(poi: any) {
  const image = coverImages[poi.typeKey as keyof typeof coverImages] || coverImages.default
  return {
    backgroundImage: `linear-gradient(180deg, rgba(11, 15, 13, 0.08), rgba(11, 15, 13, 0.72)), url(${image})`
  }
}

function getPoiDescription(poi: any) {
  return descriptionMap[poi.typeKey as keyof typeof descriptionMap] || '适合沿着地图慢慢探索，作为步行路线中的自然停靠点。'
}

function handleSearchBlur() {
  window.setTimeout(() => {
    searchFocused.value = false
    suggestions.value = []
  }, 120)
}

function handleSearchInput() {
  const keyword = searchQuery.value.trim()
  if (!keyword || !autoCompleteInstance) {
    suggestions.value = []
    return
  }

  if (searchTimer) window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    autoCompleteInstance.search(keyword, (status: string, result: any) => {
      if (status === 'complete' && result?.tips) {
        suggestions.value = result.tips.filter((tip: any) => tip.name)
        return
      }
      suggestions.value = []
    })
  }, 180)
}

async function submitAddressSearch() {
  const keyword = searchQuery.value.trim()
  if (!keyword) return
  suggestions.value = []
  await locateByAddress(keyword)
}

async function applySuggestion(tip: any) {
  searchQuery.value = tip.name || searchQuery.value
  suggestions.value = []
  if (tip.location) {
    await updateCenter(
      {
        lng: tip.location.lng,
        lat: tip.location.lat,
        label: [tip.name, tip.district].filter(Boolean).join(' · ')
      },
      '自动完成定位'
    )
    return
  }
  await locateByAddress([tip.name, tip.district, tip.address].filter(Boolean).join(' '))
}

async function initMap() {
  try {
    AMapRef = await loadAmapSdk({
      plugins: [
        'AMap.AutoComplete',
        'AMap.Geocoder',
        'AMap.PlaceSearch',
        'AMap.Walking',
        'AMap.Scale',
        'AMap.ToolBar'
      ]
    })

    mapInstance = new AMapRef.Map(mapRef.value, {
      zoom: 16,
      center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
      viewMode: '3D',
      pitch: 52,
      rotation: -18,
      mapStyle: 'amap://styles/grey'
    })

    mapInstance.addControl(new AMapRef.Scale())
    mapInstance.addControl(new AMapRef.ToolBar({ position: 'RB' }))

    geocoderInstance = new AMapRef.Geocoder()
    autoCompleteInstance = new AMapRef.AutoComplete({ city: '全国' })
    walkingInstance = new AMapRef.Walking({
      map: mapInstance,
      hideMarkers: false,
      autoFitView: true
    })
    rankingWalkingService = new AMapRef.Walking({
      hideMarkers: true,
      autoFitView: false
    })

    mapReady.value = true
    setStartMarker(currentCenter.value)
    await locateCurrentUser()
  } catch (error: any) {
    console.error('AMap init failed', error)
    mapError.value = error.message || '高德地图加载失败'
  }
}

async function locateCurrentUser() {
  if (!navigator.geolocation) {
    await updateCenter({ ...DEFAULT_CENTER }, '默认位置')
    return
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      await updateCenter(
        {
          lng: position.coords.longitude,
          lat: position.coords.latitude,
          label: '当前位置'
        },
        '浏览器定位'
      )
    },
    async () => {
      await updateCenter({ ...DEFAULT_CENTER }, '默认位置')
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

async function locateByAddress(address: string) {
  if (!geocoderInstance) return

  geocoderInstance.getLocation(address, async (status: string, result: any) => {
    if (status === 'complete' && result?.geocodes?.length) {
      const geocode = result.geocodes[0]
      await updateCenter(
        {
          lng: geocode.location.lng,
          lat: geocode.location.lat,
          label: geocode.formattedAddress || address
        },
        '地址解析'
      )
      return
    }

    mapError.value = '地址解析失败，请尝试更换关键词'
  })
}

async function updateCenter(center: { lng: number; lat: number; label: string }, source: string) {
  currentCenter.value = center
  locationSource.value = source
  mapError.value = ''

  if (mapInstance) {
    mapInstance.setCenter([center.lng, center.lat])
    mapInstance.setZoom(16)
  }

  setStartMarker(center)
  await searchNearbyPois()
}

function setStartMarker(center: { lng: number; lat: number }) {
  if (!mapInstance || !AMapRef) return

  const position = new AMapRef.LngLat(center.lng, center.lat)
  const content = `
    <div style="
      width: 26px;
      height: 26px;
      border-radius: 999px;
      background: radial-gradient(circle at 30% 30%, #fff8ec, #d8c3a5 62%, #5f6c58 100%);
      border: 2px solid rgba(245, 239, 229, 0.95);
      box-shadow: 0 0 0 10px rgba(216, 195, 165, 0.16), 0 14px 32px rgba(11, 15, 13, 0.35);
    "></div>
  `

  if (!startMarker) {
    startMarker = new AMapRef.Marker({
      position,
      content,
      offset: new AMapRef.Pixel(-13, -13),
      zIndex: 300
    })
    startMarker.setMap(mapInstance)
  } else {
    startMarker.setPosition(position)
  }
}

async function searchNearbyPois() {
  if (!mapReady.value || !mapInstance || !AMapRef) return

  const generation = ++poiSearchGeneration
  isSearchingPoi.value = true
  durationRankingLoading.value = true
  routeInfo.value = null

  const center = [currentCenter.value.lng, currentCenter.value.lat]
  const categoriesToSearch =
    activeCategory.value === 'all'
      ? categoryOptions.filter((item) => item.value !== 'all')
      : categoryOptions.filter((item) => item.value === activeCategory.value)

  try {
    const results = await Promise.all(
      categoriesToSearch.map((category) => searchByCategory(category, center))
    )

    const merged = mergePois(results.flat())
    if (generation !== poiSearchGeneration) return

    pois.value = merged
    renderMarkers()

    if (merged.length) {
      selectPoi(merged[0], { planRoute: false, pan: false })
      fitMapToVisibleMarkers()
      await enrichTopPoisWithWalkingDuration(merged, generation)
    } else {
      selectedPoiId.value = null
      hoveredPoiId.value = null
      clearPoiMarkers()
    }
  } catch (error: any) {
    console.error('search nearby failed', error)
    mapError.value = error.message || '附近场所搜索失败'
  } finally {
    isSearchingPoi.value = false
    if (generation === poiSearchGeneration) {
      durationRankingLoading.value = false
    }
  }
}

function searchByCategory(category: { value: string; label: string; keyword: string }, center: number[]) {
  return new Promise<any[]>((resolve, reject) => {
    const placeSearch = new AMapRef.PlaceSearch({
      pageSize: 12,
      extensions: 'all'
    })

    placeSearch.searchNearBy(category.keyword, center, SEARCH_RADIUS, (status: string, result: any) => {
      if (status !== 'complete') {
        if (status === 'no_data') {
          resolve([])
          return
        }
        reject(new Error(`搜索${category.label}失败`))
        return
      }

      const list = (result?.poiList?.pois || []).map((item: any, index: number) =>
        normalizePoi(item, category.value, index)
      )
      resolve(list)
    })
  })
}

function normalizePoi(item: any, categoryKey: string, index: number) {
  const style = categoryStyles[categoryKey as keyof typeof categoryStyles] || categoryStyles.default
  const lng = item.location?.lng
  const lat = item.location?.lat
  const distanceMeters = computeDistanceMeters(
    currentCenter.value.lat,
    currentCenter.value.lng,
    lat,
    lng
  )
  const walkingMinutes = Math.max(1, Math.round(distanceMeters / 78))

  return {
    id: item.id || `${item.name}-${categoryKey}-${index}`,
    name: item.name || '未知场所',
    typeKey: categoryKey,
    typeLabel: style.label,
    icon: style.icon,
    markerColor: style.marker,
    location: { lng, lat },
    address: item.address || item.name || '附近场所',
    shortAddress: (item.address || item.name || '').slice(0, 18) || '附近场所',
    rating: (4.5 + ((index % 4) * 0.1)).toFixed(1),
    ratingLabel: ['高热度', '推荐', '常去', '值得逛逛'][index % 4],
    isOpen: index % 5 !== 4,
    distanceMeters,
    distanceText: formatDistance(distanceMeters),
    walkingText: `约 ${walkingMinutes} 分钟`,
    walkingDurationSeconds: null,
    walkingDistanceMeters: null
  }
}

function mergePois(list: any[]) {
  const map = new Map<string, any>()
  list.forEach((poi) => {
    const key = poi.id || `${poi.name}-${poi.location.lng}-${poi.location.lat}`
    if (!map.has(key) || map.get(key).distanceMeters > poi.distanceMeters) {
      map.set(key, poi)
    }
  })
  return Array.from(map.values()).sort((a, b) => a.distanceMeters - b.distanceMeters)
}

function renderMarkers() {
  clearPoiMarkers()

  sortedPois.value.forEach((poi) => {
    const marker = new AMapRef.Marker({
      position: [poi.location.lng, poi.location.lat],
      offset: new AMapRef.Pixel(-18, -18),
      content: createMarkerContent(poi, poi.id === focusedPoiId.value),
      zIndex: poi.id === selectedPoiId.value ? 220 : 180
    })

    marker.on('click', () => selectPoi(poi))
    marker.on('mouseover', () => hoverPoi(poi.id))
    marker.on('mouseout', () => hoverPoi(null))

    marker.setMap(mapInstance)
    marker.setAnimation('AMAP_ANIMATION_DROP')
    markerStore.set(poi.id, marker)
  })
}

function clearPoiMarkers() {
  markerStore.forEach((marker) => marker.setMap(null))
  markerStore.clear()
}

function createMarkerContent(poi: any, active: boolean) {
  const size = active ? 40 : 34
  const glow = active
    ? '0 0 0 12px rgba(216,195,165,0.16), 0 18px 34px rgba(11,15,13,0.34)'
    : '0 14px 28px rgba(11,15,13,0.24)'
  const scale = active ? 1.08 : 1

  return `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      color: #f7f2e8;
      font-size: 15px;
      font-weight: 700;
      background: ${poi.markerColor};
      border: 1px solid rgba(255,244,226,0.42);
      box-shadow: ${glow};
      transform: scale(${scale});
      transition: all 220ms ease;
    ">
      ${poi.icon}
    </div>
  `
}

function updateMarkerStates() {
  markerStore.forEach((marker, id) => {
    const poi = sortedPois.value.find((item) => item.id === id)
    if (!poi) return

    const active = id === focusedPoiId.value
    marker.setContent(createMarkerContent(poi, active))
    marker.setzIndex(id === selectedPoiId.value ? 220 : 180)
    marker.setAnimation(active ? 'AMAP_ANIMATION_BOUNCE' : null)
  })
}

function hoverPoi(id: string | null) {
  hoveredPoiId.value = id
  updateMarkerStates()
  if (id) {
    focusPoiOnMap(id, { zoom: false })
  }
}

function selectPoi(poi: any, options: { planRoute?: boolean; pan?: boolean } = {}) {
  const { planRoute = true, pan = true } = options
  selectedPoiId.value = poi.id
  updateMarkerStates()

  if (pan) {
    focusPoiOnMap(poi.id)
  }

  if (planRoute) {
    planRouteToPoi(poi)
  }
}

function shouldDimPoi(id: string) {
  return Boolean(focusedPoiId.value) && focusedPoiId.value !== id
}

function focusPoiOnMap(id: string, options: { zoom?: boolean } = {}) {
  const { zoom = true } = options
  const poi = sortedPois.value.find((item) => item.id === id)
  if (!poi || !mapInstance) return

  mapInstance.panTo([poi.location.lng, poi.location.lat])
  if (zoom) {
    mapInstance.setZoom(17)
  }
}

function fitMapToVisibleMarkers() {
  if (!mapInstance || !markerStore.size) return
  const overlays = [startMarker, ...Array.from(markerStore.values())].filter(Boolean)
  mapInstance.setFitView(overlays, false, [80, 80, 80, 80])
}

function setActiveCategory(category: string) {
  activeCategory.value = category
  searchNearbyPois()
}

async function enrichTopPoisWithWalkingDuration(list: any[], generation: number) {
  if (!rankingWalkingService || !list.length) return

  const topPois = [...list]
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, 10)

  const enriched = await Promise.all(
    topPois.map(async (poi) => {
      try {
        const route = await getWalkingRouteSummary(poi)
        return {
          ...poi,
          walkingDurationSeconds: route.time,
          walkingDistanceMeters: route.distance,
          walkingText: `约 ${Math.max(1, Math.round(route.time / 60))} 分钟`,
          distanceText: formatDistance(route.distance)
        }
      } catch {
        return poi
      }
    })
  )

  if (generation !== poiSearchGeneration) return

  const enrichedMap = new Map(enriched.map((poi) => [poi.id, poi]))
  pois.value = list.map((poi) => enrichedMap.get(poi.id) || poi)
  renderMarkers()

  const currentSelectedId = selectedPoiId.value
  const currentList = sortedPois.value
  const selectedAfterSort =
    currentList.find((poi) => poi.id === currentSelectedId) ||
    currentList[0] ||
    null

  if (selectedAfterSort) {
    selectedPoiId.value = selectedAfterSort.id
    updateMarkerStates()
  }
}

function getWalkingRouteSummary(poi: any) {
  return new Promise<{ time: number; distance: number }>((resolve, reject) => {
    const start = new AMapRef.LngLat(currentCenter.value.lng, currentCenter.value.lat)
    const end = new AMapRef.LngLat(poi.location.lng, poi.location.lat)

    rankingWalkingService.search(start, end, (status: string, result: any) => {
      if (status !== 'complete' || !result?.routes?.length) {
        reject(new Error('walking summary failed'))
        return
      }

      const route = result.routes[0]
      resolve({ time: route.time, distance: route.distance })
    })
  })
}

function planRouteToPoi(poi: any) {
  if (!walkingInstance || !mapReady.value) return

  routeLoading.value = true
  selectedPoiId.value = poi.id
  updateMarkerStates()
  walkingInstance.clear()

  const start = new AMapRef.LngLat(currentCenter.value.lng, currentCenter.value.lat)
  const end = new AMapRef.LngLat(poi.location.lng, poi.location.lat)

  walkingInstance.search(start, end, (status: string, result: any) => {
    routeLoading.value = false
    if (status !== 'complete' || !result?.routes?.length) {
      routeInfo.value = null
      mapError.value = '步行路线规划失败，请重试'
      return
    }

    const route = result.routes[0]
    routeInfo.value = {
      distanceText: formatDistance(route.distance),
      walkingText: `步行约 ${Math.max(1, Math.round(route.time / 60))} 分钟`,
      steps: (route.steps || []).map((step: any) => ({
        instruction: step.instruction
      }))
    }
    mapError.value = ''
  })
}

function comparePoisByWalkingDuration(a: any, b: any) {
  const aHasReal = Number.isFinite(a.walkingDurationSeconds)
  const bHasReal = Number.isFinite(b.walkingDurationSeconds)

  if (aHasReal && bHasReal) return a.walkingDurationSeconds - b.walkingDurationSeconds
  if (aHasReal) return -1
  if (bHasReal) return 1
  return a.distanceMeters - b.distanceMeters
}

function computeDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return 0
  const toRad = (value: number) => (value * Math.PI) / 180
  const earthRadius = 6378137
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * earthRadius * Math.asin(Math.sqrt(a)))
}

function formatDistance(distanceMeters: number) {
  if (!distanceMeters || !Number.isFinite(distanceMeters)) return '--'
  if (distanceMeters >= 1000) return `${(distanceMeters / 1000).toFixed(1)} km`
  return `${Math.round(distanceMeters)} m`
}

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  if (searchTimer) window.clearTimeout(searchTimer)
  if (walkingInstance) walkingInstance.clear()
  if (rankingWalkingService) rankingWalkingService.clear()
  clearPoiMarkers()
  if (startMarker) startMarker.setMap(null)
  if (mapInstance) mapInstance.destroy()
})
</script>

<style scoped>
.venue-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(74, 93, 76, 0.18), transparent 26%),
    radial-gradient(circle at top right, rgba(216, 195, 165, 0.1), transparent 24%),
    linear-gradient(180deg, #0b0f0d 0%, #101714 46%, #151b17 100%);
}

.venue-layout {
  display: grid;
  grid-template-columns: minmax(380px, 520px) minmax(0, 1fr);
  gap: 20px;
  min-height: 100vh;
  padding: 86px 20px 20px;
}

.sidebar-panel {
  position: relative;
}

.sidebar-scroll {
  display: grid;
  gap: 18px;
  max-height: calc(100vh - 106px);
  overflow-y: auto;
  padding-right: 6px;
}

.sidebar-scroll::-webkit-scrollbar {
  width: 8px;
}

.sidebar-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
}

.glass-panel {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03)),
    rgba(18, 24, 20, 0.6);
  backdrop-filter: blur(24px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 20px 50px rgba(0, 0, 0, 0.22);
}

.eyebrow {
  display: inline-block;
  color: #d8c3a5;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.search-panel,
.category-panel,
.summary-card,
.selected-panel,
.poi-panel,
.map-stage {
  border-radius: 28px;
}

.search-panel,
.category-panel,
.selected-panel,
.poi-panel {
  padding: 22px;
}

.panel-copy h1,
.section-head h2,
.selected-head h3,
.map-overlay h2 {
  color: #f6f1e7;
}

.panel-copy h1 {
  margin: 10px 0 10px;
  font-size: clamp(2.4rem, 4vw, 4rem);
  line-height: 0.95;
  letter-spacing: -0.05em;
}

.panel-copy p,
.selected-head p,
.map-overlay p,
.section-note,
.poi-description,
.route-panel p,
.state-card p {
  color: rgba(237, 231, 221, 0.72);
}

.panel-copy p,
.selected-head p,
.map-overlay p,
.route-panel p,
.state-card p {
  line-height: 1.7;
}

.search-box {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) 128px;
  gap: 14px;
  align-items: center;
  min-height: 72px;
  margin-top: 20px;
  padding: 14px 14px 14px 18px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 250, 244, 0.04);
  transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
}

.search-box.focused {
  transform: translateY(-1px);
  border-color: rgba(216, 195, 165, 0.34);
  box-shadow: 0 0 0 4px rgba(216, 195, 165, 0.08);
}

.search-icon {
  color: #f5e7cf;
  font-size: 18px;
}

.search-box input {
  border: none;
  outline: none;
  background: transparent;
  color: #f9f4ea;
  font-size: 1rem;
}

.search-box input::placeholder {
  color: rgba(237, 231, 221, 0.46);
}

.search-button,
.primary-action,
.secondary-action,
.card-action,
.category-pill,
.suggestion-item {
  transition:
    transform 220ms ease,
    border-color 220ms ease,
    background 220ms ease,
    box-shadow 220ms ease,
    opacity 220ms ease;
}

.search-button,
.primary-action,
.card-action {
  min-height: 48px;
  border: 1px solid rgba(216, 195, 165, 0.3);
  border-radius: 16px;
  background: linear-gradient(135deg, #d8c3a5, #8c7758);
  color: #171b18;
  font-weight: 700;
  cursor: pointer;
}

.search-button:hover,
.primary-action:hover,
.secondary-action:hover,
.card-action:hover,
.category-pill:hover,
.suggestion-item:hover {
  transform: translateY(-2px);
}

.suggestions-panel {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}

.suggestion-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 14px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 250, 244, 0.04);
  text-align: left;
  cursor: pointer;
}

.suggestion-item strong {
  display: block;
  margin-bottom: 6px;
  color: #f9f4ea;
}

.suggestion-tag,
.chip,
.floating-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.08);
  color: #f8f1e4;
  font-size: 12px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: end;
  margin-bottom: 16px;
}

.section-head h2 {
  margin-top: 10px;
  font-size: 1.55rem;
  letter-spacing: -0.04em;
}

.section-note {
  font-size: 13px;
  max-width: 280px;
  text-align: right;
}

.category-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.category-scroll::-webkit-scrollbar {
  height: 8px;
}

.category-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
}

.category-pill {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 250, 244, 0.04);
  color: #f0ebdf;
  cursor: pointer;
}

.category-pill.active {
  border-color: rgba(216, 195, 165, 0.4);
  background: linear-gradient(135deg, rgba(216, 195, 165, 0.18), rgba(94, 108, 88, 0.2));
}

.summary-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 18px;
}

.summary-card {
  padding: 22px;
}

.summary-card h3 {
  margin: 12px 0 10px;
  color: #f6f1e7;
  font-size: 2.4rem;
  line-height: 0.96;
  letter-spacing: -0.05em;
}

.brief-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.brief-item,
.fact-card {
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 250, 244, 0.04);
}

.brief-item span,
.fact-card span,
.score-badge span,
.poi-cover-bottom span,
.poi-metrics,
.route-head span {
  color: rgba(237, 231, 221, 0.62);
}

.brief-item strong,
.fact-card strong,
.score-badge strong,
.poi-cover-bottom strong,
.route-head strong {
  display: block;
  margin-top: 6px;
  color: #f6f1e7;
}

.selected-panel {
  overflow: hidden;
}

.selected-cover,
.poi-cover {
  position: relative;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}

.selected-cover {
  min-height: 210px;
  border-radius: 22px;
}

.selected-cover-gradient,
.poi-cover-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(11, 15, 13, 0.06), rgba(11, 15, 13, 0.78));
}

.selected-cover-meta,
.poi-cover-top,
.poi-cover-bottom {
  position: relative;
  z-index: 1;
}

.selected-cover-meta,
.poi-cover-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 18px;
}

.chip.open {
  color: #ecf2de;
}

.selected-body {
  display: grid;
  gap: 18px;
  padding-top: 18px;
}

.selected-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.selected-head h3 {
  margin: 8px 0 8px;
  font-size: 1.7rem;
  line-height: 1.02;
  color: #f6f1e7;
}

.score-badge {
  min-width: 78px;
  height: fit-content;
  padding: 14px 12px;
  border-radius: 18px;
  text-align: center;
  background: rgba(255, 250, 244, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.score-badge strong {
  margin-top: 0;
  font-size: 1.4rem;
}

.selected-facts,
.selected-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.secondary-action {
  min-height: 48px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 250, 244, 0.04);
  color: #f6f1e7;
  cursor: pointer;
}

.poi-grid-shell {
  min-height: 160px;
}

.poi-card {
  display: grid;
  height: 100%;
  overflow: hidden;
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03)),
    rgba(18, 24, 20, 0.64);
}

.poi-card.dimmed {
  opacity: 0.54;
}

.poi-cover {
  min-height: 176px;
}

.poi-cover-bottom {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 18px;
  display: grid;
  gap: 6px;
}

.poi-cover-bottom strong {
  font-size: 1.2rem;
}

.poi-body {
  display: grid;
  gap: 14px;
  padding: 18px;
}

.poi-description {
  min-height: 50px;
  margin: 0;
}

.poi-metrics {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 14px;
}

.card-action {
  width: 100%;
}

.state-card {
  min-height: 220px;
  display: grid;
  place-items: center;
  text-align: center;
}

.spinner {
  width: 44px;
  height: 44px;
  margin: 0 auto 16px;
  border: 4px solid rgba(255, 255, 255, 0.12);
  border-top-color: #d8c3a5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.state-icon {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  margin: 0 auto 16px;
  border-radius: 999px;
  background: rgba(216, 195, 165, 0.08);
  color: #f5e7cf;
  font-size: 24px;
}

.map-panel {
  position: relative;
}

.map-stage {
  position: sticky;
  top: 86px;
  height: calc(100vh - 106px);
  overflow: hidden;
}

.map-canvas {
  width: 100%;
  height: 100%;
  filter: saturate(0.78) contrast(0.9) brightness(0.82);
}

.map-vignette,
.map-grain,
.map-tint {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.map-vignette {
  background:
    radial-gradient(circle at center, transparent 42%, rgba(11, 15, 13, 0.4) 100%),
    linear-gradient(180deg, rgba(11, 15, 13, 0.42), transparent 26%, transparent 72%, rgba(11, 15, 13, 0.74));
}

.map-grain {
  opacity: 0.08;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 4px 4px;
  mix-blend-mode: soft-light;
}

.map-tint {
  background:
    linear-gradient(120deg, rgba(9, 14, 11, 0.42), rgba(21, 27, 23, 0.08) 40%, rgba(9, 14, 11, 0.52)),
    radial-gradient(circle at 25% 15%, rgba(216, 195, 165, 0.08), transparent 24%);
}

.map-overlay {
  position: absolute;
  z-index: 2;
  max-width: min(360px, 80%);
  padding: 18px 20px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03)),
    rgba(18, 24, 20, 0.66);
  backdrop-filter: blur(24px);
}

.map-overlay h2 {
  margin: 10px 0 8px;
  font-size: clamp(1.4rem, 2vw, 2rem);
  letter-spacing: -0.04em;
}

.top-left {
  top: 22px;
  left: 22px;
}

.top-right {
  top: 22px;
  right: 22px;
  display: flex;
  gap: 10px;
}

.bottom-right {
  right: 22px;
  bottom: 22px;
}

.route-panel {
  width: min(380px, 86%);
}

.route-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: end;
  margin-bottom: 8px;
}

.route-steps {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.route-step {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 12px 14px;
  color: #f0ebdf;
  border-radius: 18px;
  background: rgba(255, 250, 244, 0.04);
}

.step-index {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(216, 195, 165, 0.16);
  color: #f5e7cf;
  font-size: 12px;
  font-weight: 700;
}

.map-error {
  position: absolute;
  left: 22px;
  bottom: 22px;
  z-index: 3;
  display: grid;
  gap: 6px;
  max-width: 280px;
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(119, 46, 34, 0.88);
  color: #ffe3dc;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1180px) {
  .venue-layout {
    grid-template-columns: 1fr;
  }

  .sidebar-scroll {
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }

  .map-stage {
    position: relative;
    top: auto;
    height: 680px;
  }
}

@media (max-width: 760px) {
  .venue-layout {
    padding: 76px 14px 18px;
  }

  .search-box {
    grid-template-columns: 24px minmax(0, 1fr);
  }

  .search-button {
    grid-column: 1 / -1;
  }

  .summary-grid,
  .selected-facts,
  .selected-actions {
    grid-template-columns: 1fr;
  }

  .section-head,
  .selected-head,
  .route-head,
  .top-right {
    flex-direction: column;
    align-items: start;
  }

  .section-note {
    text-align: left;
    max-width: none;
  }

  .map-overlay {
    max-width: calc(100% - 32px);
  }

  .top-left,
  .top-right,
  .bottom-right {
    left: 16px;
    right: 16px;
  }
}
</style>
