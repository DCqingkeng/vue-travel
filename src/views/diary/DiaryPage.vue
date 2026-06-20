<template>
  <div class="diary-page">
    <aside class="left-panel">
      <div class="left-shell glass-panel">
        <div class="ambient ambient-green"></div>
        <div class="ambient ambient-gold"></div>
        <div class="ambient ambient-blue"></div>

        <section class="glass-card profile-card">
          <p class="section-kicker">Traveler Profile</p>
          <div class="profile-row">
            <div class="avatar-shell">{{ profile.initials }}</div>
            <div>
              <h2>{{ profile.name }}</h2>
              <p class="muted-line">{{ profile.level }}</p>
            </div>
          </div>
          <div class="metric-inline">
            <span class="metric-pill">已发布 {{ diaries.length }}</span>
            <span class="metric-pill">已评分 {{ aggregateStats.ratingCount }}</span>
          </div>
        </section>

        <section class="glass-card stats-card">
          <div class="stats-head">
            <div>
              <p class="section-kicker">Journal Metrics</p>
              <h3>旅途数据</h3>
            </div>
            <span class="live-dot">Live</span>
          </div>
          <div class="stats-grid">
            <div class="stat-tile">
              <span class="stat-label">浏览量</span>
              <strong>{{ formatNumber(aggregateStats.views) }}</strong>
            </div>
            <div class="stat-tile">
              <span class="stat-label">评分数</span>
              <strong>{{ formatNumber(aggregateStats.ratingCount) }}</strong>
            </div>
            <div class="stat-tile">
              <span class="stat-label">平均分</span>
              <strong>{{ aggregateStats.avgRating.toFixed(1) }}</strong>
            </div>
            <div class="stat-tile">
              <span class="stat-label">城市数</span>
              <strong>{{ footprintCount }}</strong>
            </div>
          </div>
        </section>

        <section class="glass-card tag-card">
          <div class="stats-head">
            <div>
              <p class="section-kicker">Hot Keywords</p>
              <h3>热门标签</h3>
            </div>
          </div>
          <div class="chip-cloud">
            <button
              v-for="tag in topTags"
              :key="tag.name"
              :class="['tag-chip', { active: filters.tag === tag.name }]"
              @click="toggleTag(tag.name)"
            >
              <span>#{{ tag.name }}</span>
              <small>{{ tag.count }}</small>
            </button>
          </div>
        </section>

        <section class="glass-card footprint-card">
          <div class="stats-head">
            <div>
              <p class="section-kicker">Travel Footprint</p>
              <h3>旅行足迹</h3>
            </div>
          </div>
          <div class="footprint-map">
            <div
              v-for="city in footprintCities"
              :key="city"
              class="footprint-node"
            >
              {{ city }}
            </div>
          </div>
          <p class="footprint-caption">已在 {{ footprintCount }} 座城市留下记忆。</p>
        </section>
      </div>
    </aside>

    <section class="right-panel">
      <div class="right-shell">
        <header class="hero-row">
          <div class="hero-copy">
            <p class="section-kicker">Curated Journal</p>
            <h1 class="artistic-title">旅行日记</h1>
            <p class="subtitle">在与推荐页一致的沉浸式旅行氛围中，记录路上的故事、风景与情绪。</p>
          </div>

          <div class="hero-actions">
            <button class="hero-btn ai-btn" type="button" @click="showAiNotice">
              <span>AI 旅行故事生成</span>
              <small>后端接口暂未开放</small>
            </button>
            <button class="hero-btn create-btn" type="button" @click="openCreatePanel">
              <span>撰写日记</span>
              <small>支持文字、图片地址与视频地址</small>
            </button>
          </div>
        </header>

        <section class="control-shell glass-panel">
          <div class="search-mode-row">
            <button
              type="button"
              :class="['mode-chip', { active: filters.mode === 'content' }]"
              @click="setSearchMode('content')"
            >
              全文检索日记内容
            </button>
            <button
              type="button"
              :class="['mode-chip', { active: filters.mode === 'title' }]"
              @click="setSearchMode('title')"
            >
              精确查询日记标题
            </button>
            <button
              type="button"
              :class="['mode-chip', { active: filters.mode === 'hot' }]"
              @click="setSearchMode('hot')"
            >
              浏览热门日记
            </button>
          </div>

          <div class="search-stack">
            <label class="pill-input">
              <span class="pill-label">搜索</span>
              <input
                v-model.trim="filters.keyword"
                type="text"
                :placeholder="currentPlaceholder"
                @keydown.enter="runSearch"
              />
            </label>

            <label class="pill-input mode-select">
              <span class="pill-label">排序</span>
              <select v-model="filters.sort">
                <option value="latest">最新发布</option>
                <option value="hot">最热日记</option>
                <option value="rating">评分最高</option>
                <option value="views">浏览最多</option>
              </select>
            </label>

            <button class="search-btn" type="button" @click="runSearch">搜索</button>
          </div>

          <div class="signal-row">
            <div class="signal-text">
              <strong>{{ statusTitle }}</strong>
              <p>{{ statusDescription }}</p>
            </div>
            <button
              v-if="filters.tag || filters.keyword || filters.mode !== 'hot'"
              class="ghost-btn"
              type="button"
              @click="resetFilters"
            >
              重置
            </button>
          </div>
        </section>

        <section v-if="recommendedDiaries.length" class="recommend-shell glass-panel">
          <div class="recommend-head">
            <div>
              <p class="section-kicker">Recommendation Demo</p>
              <h2>推荐日记</h2>
              <p class="recommend-copy">{{ recommendationSummary }}</p>
            </div>
            <div class="recommend-factor-row">
              <span
                v-for="factor in recommendationFactors"
                :key="factor"
                class="recommend-factor"
              >
                {{ factor }}
              </span>
            </div>
          </div>

          <div class="recommend-grid">
            <article
              v-for="item in recommendedDiaries"
              :key="`recommend-${item.id}`"
              class="recommend-card"
              @click="openDiary(item.id)"
            >
              <div class="recommend-media">
                <img
                  v-if="item.heroImage"
                  :src="item.heroImage"
                  :alt="item.title"
                  class="recommend-image"
                />
                <div v-else class="recommend-fallback">{{ item.destinationLabel }}</div>
                <span class="recommend-score">推荐分 {{ item.recommendation.score }}</span>
              </div>

              <div class="recommend-body">
                <div class="recommend-meta">
                  <span>{{ item.destinationLabel }}</span>
                  <span>{{ formatDate(item.createdAt) }}</span>
                </div>
                <h3>{{ item.title }}</h3>
                <p class="recommend-reason">{{ item.recommendation.reasonText }}</p>

                <div class="recommend-reason-list">
                  <span
                    v-for="reason in item.recommendation.reasons.slice(0, 3)"
                    :key="reason"
                    class="reason-pill"
                  >
                    {{ reason }}
                  </span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="content-head">
          <div>
            <p class="section-kicker">Journal Stream</p>
            <h2>沉浸式日记流</h2>
          </div>
          <span class="content-count">{{ sortedDiaries.length }} 篇内容</span>
        </section>

        <div v-if="loading" class="state-card glass-panel">正在加载日记...</div>
        <div v-else-if="errorMessage" class="state-card glass-panel state-error">{{ errorMessage }}</div>
        <div v-else-if="!sortedDiaries.length" class="state-card glass-panel">
          没有找到匹配的日记，试试更换目的地、标题或关键词。
        </div>

        <div v-else ref="masonryRef" class="journal-grid">
          <div class="grid-sizer"></div>
          <article
            v-for="(diary, index) in sortedDiaries"
            :key="diary.id"
            class="journal-card"
            :style="getCardStyle(diary, index)"
            @click="openDiary(diary.id)"
          >
            <div class="card-media">
              <img
                v-if="diary.heroImage"
                :src="diary.heroImage"
                :alt="diary.title"
                class="card-image"
                @load="refreshMasonry"
              />
              <div v-else class="card-fallback">
                <span>{{ diary.destinationLabel }}</span>
              </div>
              <div class="card-gradient"></div>
            </div>

            <div class="card-content">
              <div class="card-meta">
                <span class="meta-location">地点 {{ diary.destinationLabel }}</span>
                <span class="meta-date">{{ formatDate(diary.createdAt) }}</span>
              </div>

              <h3>{{ diary.title }}</h3>
              <p class="card-summary">{{ diary.briefDesc || diary.content || '这段旅程正在等待被展开。' }}</p>

              <div class="tag-row">
                <span v-for="tag in diary.tags.slice(0, 4)" :key="tag" class="tag-pill">#{{ tag }}</span>
              </div>

              <div class="card-footer">
                <div class="metric-group">
                  <span>浏览 {{ formatNumber(diary.views) }}</span>
                  <span>评分 {{ formatScore(diary.avgRating) }}</span>
                  <span>评价 {{ formatNumber(diary.ratingCount) }}</span>
                </div>
                <span class="read-link">阅读故事</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreatePanel">
      <div class="create-modal glass-panel" @click.stop>
        <div class="modal-head">
          <div>
            <p class="section-kicker">Create Journal</p>
            <h2>发布新的旅行故事</h2>
          </div>
          <button class="close-btn" type="button" @click="closeCreatePanel">X</button>
        </div>

        <form class="create-form" @submit.prevent="submitDiary">
          <div class="form-grid">
            <label class="field">
              <span>标题</span>
              <input v-model.trim="draft.title" type="text" placeholder="例如：青海湖的风" required />
            </label>

            <label class="field">
              <span>旅行日期</span>
              <input v-model="draft.travelDate" type="date" />
            </label>
          </div>

          <label class="field">
            <span>目的地搜索</span>
            <input
              v-model.trim="draft.destinationKeyword"
              type="text"
              placeholder="搜索并绑定一个后端目的地"
              @input="debouncedDestinationLookup"
            />
          </label>

          <div v-if="destinationOptions.length" class="destination-options">
            <button
              v-for="item in destinationOptions"
              :key="item.id"
              type="button"
              :class="['destination-option', { active: draft.destinationId === item.id }]"
              @click="selectDestination(item)"
            >
              <strong>{{ item.name }}</strong>
              <span>{{ item.city || item.type || '旅行目的地' }}</span>
            </button>
          </div>

          <label class="field">
            <span>标签关键词</span>
            <input
              v-model.trim="draft.keywords"
              type="text"
              placeholder="摄影, 湖泊, 自驾"
            />
          </label>

          <label class="field">
            <span>图片与视频地址</span>
            <textarea
              v-model="draft.mediaText"
              rows="3"
              placeholder="每行填写一个媒体地址"
            ></textarea>
          </label>

          <label class="field">
            <span>正文内容</span>
            <textarea
              v-model.trim="draft.content"
              rows="8"
              placeholder="写下光线、天气、行走与情绪。"
              required
            ></textarea>
          </label>

          <label class="compress-toggle">
            <input v-model="draft.compress" type="checkbox" />
            <span>启用后端无损压缩存储</span>
          </label>

          <p v-if="createError" class="form-error">{{ createError }}</p>

          <div class="modal-actions">
            <button class="ghost-btn" type="button" @click="closeCreatePanel">取消</button>
            <button class="submit-btn" type="submit" :disabled="submitting">
              {{ submitting ? '发布中...' : '发布日记' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import Masonry from 'masonry-layout'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createDiary, getDiaryHotFeed, searchDestinationOptions, searchDiaryCollection } from '@/services/diaryApi'

const router = useRouter()

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

const imageCatalog = Object.entries(imageModules).map(([path, url]) => ({
  fileName: path.split('/').pop() || '',
  url
}))

const masonryRef = ref(null)
const loading = ref(false)
const submitting = ref(false)
const showCreateModal = ref(false)
const errorMessage = ref('')
const createError = ref('')
const diaries = ref([])
const destinationOptions = ref([])

const filters = reactive({
  keyword: '',
  mode: 'content',
  sort: 'latest',
  tag: ''
})

const draft = reactive({
  title: '',
  destinationKeyword: '',
  destinationId: null,
  keywords: '',
  mediaText: '',
  content: '',
  travelDate: '',
  compress: true
})

let masonryInstance = null
let searchTimer = null
let destinationLookupTimer = null

const profile = computed(() => {
  const user = readUserInfo()
  const name = user.nickname || user.username || 'Traveler'
  const journalCount = diaries.value.length

  return {
    name,
    initials: name.slice(0, 2).toUpperCase(),
    level: journalCount >= 10 ? 'Voyager Platinum' : journalCount >= 4 ? 'Voyager Gold' : 'Voyager Silver'
  }
})

const aggregateStats = computed(() => {
  if (!diaries.value.length) {
    return { views: 0, ratingCount: 0, avgRating: 0 }
  }

  const totals = diaries.value.reduce(
    (acc, item) => {
      acc.views += Number(item.views || item.heatScore || 0)
      acc.ratingCount += Number(item.ratingCount || 0)
      acc.ratingSum += Number(item.avgRating || 0)
      return acc
    },
    { views: 0, ratingCount: 0, ratingSum: 0 }
  )

  return {
    views: totals.views,
    ratingCount: totals.ratingCount,
    avgRating: totals.ratingSum / diaries.value.length
  }
})

const topTags = computed(() => {
  const map = new Map()

  diaries.value.forEach((diary) => {
    diary.tags.forEach((tag) => {
      map.set(tag, (map.get(tag) || 0) + 1)
    })
  })

  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
})

const footprintCities = computed(() => {
  const values = diaries.value
    .map((item) => item.destinationLabel)
    .filter(Boolean)

  return Array.from(new Set(values)).slice(0, 10)
})

const footprintCount = computed(() => footprintCities.value.length)

const currentPlaceholder = computed(() => {
  if (filters.mode === 'title') return '输入完整日记标题'
  if (filters.mode === 'content') return '输入一段日记正文内容或关键词'
  return '当前为热门浏览模式，点击上方切换搜索方式'
})

const recommendationFactors = computed(() => {
  const factors = []

  if (filters.tag) {
    factors.push(`标签匹配：${filters.tag}`)
  }

  if (filters.keyword) {
    factors.push(`关键词偏好：${filters.keyword}`)
  }

  factors.push('热度权重')
  factors.push('评分权重')
  factors.push('时间新鲜度')

  return factors
})

const sortedDiaries = computed(() => {
  const list = diaries.value
    .filter((item) => {
      if (!filters.tag) return true
      return item.tags.includes(filters.tag)
    })
    .slice()

  list.sort((a, b) => {
    if (filters.sort === 'hot' || filters.sort === 'views') {
      return Number(b.views || 0) - Number(a.views || 0)
    }

    if (filters.sort === 'rating') {
      return Number(b.avgRating || 0) - Number(a.avgRating || 0)
    }

    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  })

  return list
})

const recommendationSummary = computed(() => {
  if (filters.tag) {
    return `当前优先推荐与“${filters.tag}”标签最相关，同时兼顾热度、评分和发布时间的日记。`
  }

  if (filters.keyword) {
    return `当前优先推荐与关键词“${filters.keyword}”语义接近的日记，并综合热度、评分和新鲜度。`
  }

  return '当前使用默认推荐：综合热门程度、用户评分和发布时间，为首页展示挑选更值得先看的几篇日记。'
})

const recommendedDiaries = computed(() => {
  return sortedDiaries.value
    .map((diary) => ({
      ...diary,
      recommendation: buildRecommendationProfile(diary)
    }))
    .sort((a, b) => b.recommendation.total - a.recommendation.total)
    .slice(0, 4)
})

const statusTitle = computed(() => {
  if (filters.mode === 'title') return '标题精确查询'
  if (filters.mode === 'content') return '全文检索'
  return '热门日记流'
})

const statusDescription = computed(() => {
  if (filters.mode === 'title') return '后端使用哈希索引执行标题精确查找。'
  if (filters.mode === 'content') return '后端通过倒排索引执行全文检索。'
  return '当前浏览流使用后端热门日记接口作为统一入口。'
})

function readUserInfo() {
  try {
    const raw = localStorage.getItem('userInfo')
    return raw ? JSON.parse(raw) : {}
  } catch (error) {
    return {}
  }
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\.(jpg|jpeg|png|webp)$/i, '')
}

function splitRecommendationTokens(value) {
  return Array.from(
    new Set(String(value || '').toLowerCase().match(/[\u4e00-\u9fa5]+|[a-z0-9]+/gi) || [])
  )
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0))
}

function formatScore(value) {
  return Number(value || 0).toFixed(1)
}

function formatDate(value) {
  if (!value) return 'Recently'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(date)
}

function buildRecommendationProfile(diary) {
  const text = [
    diary.title,
    diary.briefDesc,
    diary.content,
    diary.destinationLabel,
    ...(diary.tags || [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const reasons = []
  let score = 0

  if (filters.tag && diary.tags.includes(filters.tag)) {
    score += 28
    reasons.push(`命中标签“${filters.tag}”`)
  }

  const keywordTokens = splitRecommendationTokens(filters.keyword)
  const matchedKeywords = keywordTokens.filter((token) => token && text.includes(token))

  if (matchedKeywords.length) {
    score += Math.min(36, matchedKeywords.length * 12)
    reasons.push(`匹配关键词 ${matchedKeywords.slice(0, 2).join(' / ')}`)
  }

  if (
    filters.mode === 'destination' &&
    filters.keyword &&
    text.includes(String(filters.keyword).toLowerCase())
  ) {
    score += 24
    reasons.push('目的地相关性高')
  }

  const hotScore = Math.log1p(Number(diary.views || 0)) * 6
  const ratingScore = Number(diary.avgRating || 0) * 5 + Math.min(Number(diary.ratingCount || 0), 20) * 0.8

  score += hotScore + ratingScore

  if (Number(diary.views || 0) > 0) {
    reasons.push('热门度表现较强')
  }

  if (Number(diary.avgRating || 0) >= 4) {
    reasons.push(`评分 ${Number(diary.avgRating).toFixed(1)}`)
  }

  const createdTime = new Date(diary.createdAt || 0).getTime()
  if (!Number.isNaN(createdTime) && createdTime > 0) {
    const ageDays = (Date.now() - createdTime) / (1000 * 60 * 60 * 24)
    const freshnessScore = Math.max(0, 18 - ageDays / 10)
    score += freshnessScore

    if (freshnessScore >= 8) {
      reasons.push('发布时间较新')
    }
  }

  if (!reasons.length) {
    reasons.push('综合质量稳定')
  }

  return {
    total: score,
    score: Math.round(score),
    reasons,
    reasonText: reasons.slice(0, 2).join('，')
  }
}

function diaryToCard(diary) {
  const tags = String(diary.keywords || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return {
    ...diary,
    tags,
    views: Number(diary.heatScore || 0),
    avgRating: Number(diary.avgRating || 0),
    ratingCount: Number(diary.ratingCount || 0),
    destinationLabel: resolveDestinationLabel(diary, tags),
    heroImage: resolveHeroImage(diary, tags),
    content: diary.content || '',
    briefDesc: diary.briefDesc || ''
  }
}

function resolveDestinationLabel(diary, tags = []) {
  const keyword = String(diary.keywords || '')
  if (keyword) {
    return keyword.split(',')[0]?.trim() || '旅程'
  }

  if (tags.length) return tags[0]
  if (diary.destinationId) return `Destination #${diary.destinationId}`
  return '旅程'
}

function resolveHeroImage(diary, tags = []) {
  if (diary.coverImage) {
    return diary.coverImage
  }

  const probes = [diary.title, diary.coverImage, resolveDestinationLabel(diary, tags), ...tags]
    .filter(Boolean)
    .map(normalizeText)

  const hit = imageCatalog.find((item) => {
    const normalized = normalizeText(item.fileName)
    return probes.some((probe) => probe && (normalized.includes(probe) || probe.includes(normalized)))
  })

  return hit?.url || ''
}

function getCardStyle(diary, index) {
  const seedSource = `${diary.id || index}${diary.title || ''}`
  const seed = seedSource.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)

  return {
    height: `${430 + (seed % 4) * 88}px`
  }
}

async function refreshMasonry() {
  await nextTick()
  if (!masonryRef.value) return

  if (!masonryInstance) {
    masonryInstance = new Masonry(masonryRef.value, {
      itemSelector: '.journal-card',
      columnWidth: '.grid-sizer',
      percentPosition: true,
      gutter: 28,
      transitionDuration: '0.2s'
    })
    return
  }

  masonryInstance.reloadItems()
  masonryInstance.layout()
}

function destroyMasonry() {
  masonryInstance?.destroy()
  masonryInstance = null
}

function toggleTag(tag) {
  filters.tag = filters.tag === tag ? '' : tag
}

function openDiary(id) {
  router.push({ name: 'DiaryDetail', params: { id } })
}

function openCreatePanel() {
  createError.value = ''
  showCreateModal.value = true
}

function closeCreatePanel() {
  showCreateModal.value = false
}

function resetDraft() {
  draft.title = ''
  draft.destinationKeyword = ''
  draft.destinationId = null
  draft.keywords = ''
  draft.mediaText = ''
  draft.content = ''
  draft.travelDate = ''
  draft.compress = true
  destinationOptions.value = []
}

function resetFilters() {
  filters.keyword = ''
  filters.mode = 'content'
  filters.sort = 'latest'
  filters.tag = ''
  loadHotFeed()
}

function setSearchMode(mode) {
  filters.mode = mode

  if (mode === 'hot') {
    filters.keyword = ''
    loadHotFeed()
  }
}

function showAiNotice() {
  window.alert('当前后端还没有提供 /api/diary/ai-generate，页面先保留 AI 入口位。')
}

async function loadHotFeed() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getDiaryHotFeed({ topK: 36 })
    diaries.value = response.map(diaryToCard)
  } catch (error) {
    errorMessage.value = error.message || '加载日记流失败。'
    diaries.value = []
  } finally {
    loading.value = false
    refreshMasonry()
  }
}

async function runSearch() {
  if (filters.mode === 'hot') {
    loadHotFeed()
    return
  }

  if (!filters.keyword) {
    errorMessage.value = '请输入关键词后再搜索。'
    diaries.value = []
    destroyMasonry()
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await searchDiaryCollection({
      mode: filters.mode,
      keyword: filters.keyword,
      topK: 36
    })

    diaries.value = response.map(diaryToCard)
  } catch (error) {
    errorMessage.value = error.message || '搜索失败。'
    diaries.value = []
  } finally {
    loading.value = false
    refreshMasonry()
  }
}

function debouncedDestinationLookup() {
  clearTimeout(destinationLookupTimer)

  if (!draft.destinationKeyword) {
    destinationOptions.value = []
    draft.destinationId = null
    return
  }

  destinationLookupTimer = window.setTimeout(async () => {
    try {
      destinationOptions.value = await searchDestinationOptions({
        keyword: draft.destinationKeyword,
        limit: 6
      })
    } catch (error) {
      destinationOptions.value = []
    }
  }, 240)
}

function selectDestination(item) {
  draft.destinationId = item.id
  draft.destinationKeyword = item.name
}

async function submitDiary() {
  createError.value = ''

  if (!draft.title || !draft.content) {
    createError.value = 'Title and story content are required.'
    return
  }

  submitting.value = true

  try {
    await createDiary({
      destinationId: draft.destinationId,
      title: draft.title,
      content: draft.content,
      keywords: draft.keywords,
      travelDate: draft.travelDate || null,
      mediaUrls: draft.mediaText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      compress: draft.compress
    })

    closeCreatePanel()
    resetDraft()
    filters.mode = 'content'
    filters.keyword = ''
    await loadHotFeed()
  } catch (error) {
      createError.value = error.message || '发布失败，请检查登录状态或后端接口。'
  } finally {
    submitting.value = false
  }
}

watch(
  () => [filters.sort, filters.tag],
  () => {
    refreshMasonry()
  },
  { deep: true }
)

watch(
  () => sortedDiaries.value,
  () => {
    refreshMasonry()
  },
  { deep: true }
)

watch(
  () => filters.mode,
  (mode) => {
    if (mode === 'hot') {
      errorMessage.value = ''
      filters.keyword = ''
      loadHotFeed()
    }
  }
)

watch(
  () => filters.keyword,
  () => {
    clearTimeout(searchTimer)
    searchTimer = window.setTimeout(() => {
      if (filters.mode === 'hot') {
        loadHotFeed()
      }
    }, 220)
  }
)

onMounted(() => {
  loadHotFeed()
  window.addEventListener('resize', refreshMasonry)
})

onBeforeUnmount(() => {
  clearTimeout(searchTimer)
  clearTimeout(destinationLookupTimer)
  window.removeEventListener('resize', refreshMasonry)
  destroyMasonry()
})
</script>

<style scoped>
.diary-page {
  display: flex;
  width: 100%;
  min-height: 100vh;
  padding: 84px 24px 0;
  gap: 24px;
  background:
    radial-gradient(circle at 8% 12%, rgba(56, 94, 69, 0.38), transparent 26%),
    radial-gradient(circle at 92% 8%, rgba(200, 169, 107, 0.14), transparent 18%),
    radial-gradient(circle at 55% 100%, rgba(61, 79, 94, 0.16), transparent 24%),
    linear-gradient(180deg, #050505 0%, #0a0f0d 46%, #0d1612 100%);
  color: #f5f1e8;
}

.left-panel {
  width: 24%;
  min-width: 320px;
  max-width: 380px;
}

.right-panel {
  flex: 1;
  min-width: 0;
}

.left-shell,
.right-shell {
  position: relative;
}

.left-shell {
  position: sticky;
  top: 84px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100vh - 96px);
  padding: 22px;
  border-radius: 30px;
  overflow: hidden;
}

.right-shell {
  padding-bottom: 48px;
}

.search-mode-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
}

.mode-chip {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(245, 241, 232, 0.82);
  padding: 10px 16px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-chip.active {
  color: #08100c;
  background: linear-gradient(135deg, #e7d39c, #d2b873);
  border-color: transparent;
}

.recommend-shell {
  margin: 24px 0 28px;
  padding: 24px;
  border-radius: 28px;
}

.recommend-head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.recommend-head h2 {
  margin: 6px 0 10px;
  font-size: 1.75rem;
}

.recommend-copy {
  max-width: 700px;
  margin: 0;
  color: rgba(245, 241, 232, 0.78);
  line-height: 1.7;
}

.recommend-factor-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.recommend-factor,
.reason-pill {
  border: 1px solid rgba(232, 211, 168, 0.2);
  background: rgba(255, 255, 255, 0.04);
  color: #ead8ad;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.82rem;
}

.recommend-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.recommend-card {
  overflow: hidden;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: transform 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
}

.recommend-card:hover {
  transform: translateY(-4px);
  border-color: rgba(232, 211, 168, 0.34);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.22);
}

.recommend-media {
  position: relative;
  height: 180px;
  background: linear-gradient(135deg, rgba(70, 106, 88, 0.55), rgba(10, 15, 13, 0.92));
}

.recommend-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recommend-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 20px;
  font-size: 1.15rem;
  letter-spacing: 0.08em;
}

.recommend-score {
  position: absolute;
  right: 14px;
  bottom: 14px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(5, 5, 5, 0.68);
  color: #f8f1da;
  font-size: 0.82rem;
}

.recommend-body {
  padding: 18px;
}

.recommend-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: rgba(245, 241, 232, 0.62);
  font-size: 0.82rem;
}

.recommend-body h3 {
  margin: 12px 0 10px;
  font-size: 1.05rem;
  line-height: 1.5;
}

.recommend-reason {
  margin: 0 0 14px;
  color: rgba(245, 241, 232, 0.8);
  line-height: 1.65;
  min-height: 52px;
}

.recommend-reason-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.glass-panel,
.glass-card {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 20px 60px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(20px);
}

.glass-card {
  border-radius: 28px;
  padding: 20px;
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
  background: rgba(113, 154, 112, 0.22);
}

.ambient-gold {
  top: 160px;
  right: -60px;
  width: 160px;
  height: 160px;
  background: rgba(215, 197, 138, 0.16);
}

.ambient-blue {
  bottom: 20px;
  left: 18px;
  width: 180px;
  height: 180px;
  background: rgba(87, 112, 121, 0.12);
}

.section-kicker {
  margin: 0 0 10px;
  font-size: 11px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(215, 197, 138, 0.8);
}

.profile-row,
.stats-head,
.hero-row,
.content-head,
.modal-head,
.card-meta,
.card-footer,
.signal-row,
.modal-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.profile-row {
  justify-content: flex-start;
}

.avatar-shell {
  width: 62px;
  height: 62px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(183, 209, 141, 0.28), rgba(215, 197, 138, 0.18));
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 22px;
  font-weight: 700;
}

.profile-card h2,
.content-head h2,
.modal-head h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.muted-line,
.subtitle,
.signal-text p,
.card-summary,
.footprint-caption {
  margin: 0;
  color: rgba(255, 255, 255, 0.68);
  line-height: 1.65;
}

.metric-inline,
.stats-grid,
.chip-cloud,
.tag-row,
.metric-group,
.destination-options,
.create-form,
.form-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.metric-pill,
.content-count,
.live-dot {
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.stat-tile {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.stat-label {
  display: block;
  margin-bottom: 6px;
  color: rgba(255, 255, 255, 0.56);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.stat-tile strong {
  font-size: 22px;
}

.tag-chip,
.destination-option,
.ghost-btn,
.submit-btn,
.close-btn,
.search-btn,
.hero-btn {
  border: none;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.8);
}

.tag-chip.active,
.tag-chip:hover {
  transform: translateY(-2px);
  border-color: rgba(183, 209, 141, 0.4);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.24);
}

.footprint-map {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.footprint-node {
  padding: 14px 16px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
  border: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 13px;
}

.hero-row {
  align-items: flex-end;
  margin-bottom: 28px;
}

.hero-copy {
  flex: 1;
}

.artistic-title {
  margin: 0;
  font-size: clamp(52px, 8vw, 72px);
  line-height: 0.95;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.subtitle {
  margin-top: 18px;
  max-width: 620px;
  font-size: 17px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-btn {
  min-width: 190px;
  padding: 16px 20px;
  border-radius: 24px;
  text-align: left;
  color: #fff;
}

.hero-btn span,
.hero-btn small {
  display: block;
}

.hero-btn span {
  font-size: 16px;
  font-weight: 700;
}

.hero-btn small {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.64);
}

.ai-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(215, 197, 138, 0.42);
  box-shadow: 0 0 0 1px rgba(215, 197, 138, 0.08), 0 14px 40px rgba(112, 86, 33, 0.26);
}

.create-btn,
.submit-btn,
.search-btn {
  background: linear-gradient(135deg, rgba(183, 209, 141, 0.88), rgba(140, 162, 95, 0.88));
  color: #0d1511;
  box-shadow: 0 20px 36px rgba(120, 150, 95, 0.24);
}

.control-shell {
  padding: 20px;
  border-radius: 30px;
  margin-bottom: 26px;
}

.search-stack {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(180px, 0.7fr) minmax(180px, 0.7fr) auto;
  gap: 14px;
}

.pill-input {
  display: flex;
  align-items: center;
  gap: 14px;
  height: 60px;
  padding: 0 22px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.pill-label {
  flex: 0 0 auto;
  color: rgba(255, 255, 255, 0.55);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.pill-input input,
.pill-input select,
.field input,
.field textarea {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: #fff;
  font: inherit;
}

.pill-input select {
  appearance: none;
}

.search-btn {
  height: 60px;
  padding: 0 24px;
  border-radius: 999px;
  font-weight: 700;
}

.signal-row {
  margin-top: 16px;
}

.signal-text strong {
  display: block;
  margin-bottom: 6px;
  font-size: 16px;
}

.ghost-btn,
.close-btn {
  padding: 12px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.85);
}

.journal-grid {
  position: relative;
}

.grid-sizer,
.journal-card {
  width: calc(50% - 14px);
}

.journal-card {
  margin-bottom: 28px;
  border-radius: 30px;
  overflow: hidden;
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

.journal-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
}

.card-media,
.card-content {
  position: absolute;
  inset: 0;
}

.card-image,
.card-fallback {
  width: 100%;
  height: 100%;
}

.card-image {
  object-fit: cover;
  transition: transform 0.35s ease;
}

.journal-card:hover .card-image {
  transform: scale(1.05);
}

.card-fallback {
  display: grid;
  place-items: center;
  background:
    linear-gradient(145deg, rgba(183, 209, 141, 0.18), rgba(7, 11, 9, 0.15)),
    radial-gradient(circle at top left, rgba(215, 197, 138, 0.18), transparent 42%),
    #121816;
  color: rgba(255, 255, 255, 0.72);
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.card-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(6, 8, 7, 0.02) 12%, rgba(6, 8, 7, 0.72) 74%, rgba(6, 8, 7, 0.94) 100%);
}

.card-content {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 24px;
  z-index: 1;
}

.card-meta,
.card-footer {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
}

.card-content h3 {
  margin: 12px 0 10px;
  font-size: 28px;
  line-height: 1.1;
}

.card-summary {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 12px;
}

.metric-group {
  color: rgba(255, 255, 255, 0.78);
  font-size: 13px;
}

.read-link {
  color: #d7c58a;
}

.state-card {
  padding: 28px;
  border-radius: 28px;
  text-align: center;
  color: rgba(255, 255, 255, 0.78);
}

.state-error,
.form-error {
  color: #ffb8b8;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(4, 5, 5, 0.72);
  backdrop-filter: blur(16px);
}

.create-modal {
  width: min(880px, 100%);
  max-height: 88vh;
  overflow-y: auto;
  padding: 24px;
  border-radius: 30px;
}

.create-form {
  margin-top: 18px;
  flex-direction: column;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field span {
  color: rgba(255, 255, 255, 0.76);
  font-size: 14px;
}

.field input,
.field textarea {
  padding: 16px 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  resize: vertical;
}

.destination-option {
  flex: 1 1 220px;
  padding: 14px 16px;
  border-radius: 18px;
  text-align: left;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #fff;
}

.destination-option span {
  display: block;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.6);
}

.destination-option.active {
  border-color: rgba(183, 209, 141, 0.48);
}

.compress-toggle {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.submit-btn,
.ghost-btn {
  min-height: 48px;
}

.submit-btn {
  padding: 0 22px;
  border-radius: 16px;
  font-weight: 700;
}

.submit-btn:disabled {
  cursor: not-allowed;
  opacity: 0.64;
}

@media (max-width: 1180px) {
  .diary-page {
    flex-direction: column;
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

  .search-stack,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .recommend-head,
  .recommend-factor-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .recommend-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .diary-page {
    padding: 72px 16px 0;
  }

  .grid-sizer,
  .journal-card {
    width: 100%;
  }

  .hero-row,
  .content-head,
  .signal-row,
  .modal-head,
  .modal-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-actions {
    width: 100%;
  }

  .hero-btn,
  .search-btn {
    width: 100%;
  }

  .recommend-grid {
    grid-template-columns: 1fr;
  }
}
</style>
