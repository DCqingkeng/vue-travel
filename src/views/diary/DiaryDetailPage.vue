<template>
  <div class="detail-page">
    <div class="hero-shell">
      <img v-if="heroImage" :src="heroImage" :alt="diary?.title || 'Diary cover'" class="hero-image" />
      <div v-else class="hero-fallback">{{ destinationLabel }}</div>
      <div class="hero-overlay"></div>

      <div class="hero-nav">
        <button class="ghost-btn" type="button" @click="goBack">返回</button>
        <button class="ghost-btn" type="button" @click="showAiNotice">AI 旅行故事</button>
      </div>

      <div class="hero-content">
        <p class="section-kicker">Travel Story</p>
        <h1>{{ diary?.title || '正在加载日记...' }}</h1>
        <div class="hero-meta">
          <span>地点 {{ destinationLabel }}</span>
          <span>{{ formatDate(diary?.createdAt) }}</span>
          <span>评分 {{ formatScore(stats.avgRating) }}</span>
          <span>浏览 {{ formatNumber(stats.viewCount) }}</span>
        </div>
      </div>
    </div>

    <div class="detail-layout">
      <article class="story-column">
        <section v-if="errorMessage" class="glass-panel state-card state-error">{{ errorMessage }}</section>
        <section v-else-if="loading" class="glass-panel state-card">正在加载日记详情...</section>
        <template v-else-if="diary">
          <section class="glass-panel content-card">
            <div class="content-head">
              <div>
                <p class="section-kicker">Narrative</p>
                <h2>旅途正文</h2>
              </div>
              <span class="metric-pill">{{ diary.contentCompressed ? '压缩存储' : '原文存储' }}</span>
            </div>

            <div class="content-body">
              <p v-for="(paragraph, index) in storyParagraphs" :key="index">{{ paragraph }}</p>
            </div>
          </section>

          <section class="glass-panel gallery-card">
            <div class="content-head">
              <div>
                <p class="section-kicker">Media</p>
                <h2>视觉氛围</h2>
              </div>
            </div>

            <div v-if="heroImage" class="gallery-grid">
              <img :src="heroImage" :alt="diary.title" />
              <img :src="heroImage" :alt="diary.title" class="gallery-offset" />
            </div>
            <p v-else class="media-note">
              当前后端详情接口还没有返回图片或视频列表，所以这里先用封面氛围和完整正文来呈现内容。
            </p>
          </section>
        </template>
      </article>

      <aside class="side-column">
        <section class="glass-panel side-card">
          <p class="section-kicker">Statistics</p>
          <div class="stats-list">
            <div>
              <span>浏览量</span>
              <strong>{{ formatNumber(stats.viewCount) }}</strong>
            </div>
            <div>
              <span>评分数</span>
              <strong>{{ formatNumber(stats.ratingCount) }}</strong>
            </div>
            <div>
              <span>平均分</span>
              <strong>{{ formatScore(stats.avgRating) }}</strong>
            </div>
          </div>
        </section>

        <section class="glass-panel side-card">
          <p class="section-kicker">Keywords</p>
          <div class="tag-row">
            <span v-for="tag in tags" :key="tag" class="tag-pill">#{{ tag }}</span>
            <span v-if="!tags.length" class="muted-line">暂无标签信息。</span>
          </div>
        </section>

        <section class="glass-panel side-card">
          <p class="section-kicker">Rate this journal</p>
          <div class="score-row">
            <button
              v-for="score in scoreOptions"
              :key="score"
              :class="['score-btn', { active: ratingDraft.score === score }]"
              type="button"
              @click="ratingDraft.score = score"
            >
              {{ score }}
            </button>
          </div>

          <textarea
            v-model.trim="ratingDraft.comment"
            rows="4"
            placeholder="写一句你的观感并一同提交评分。"
          ></textarea>

          <p v-if="rateMessage" :class="['feedback', rateSuccess ? 'success' : 'error']">{{ rateMessage }}</p>

          <button class="submit-btn" type="button" :disabled="submittingRate" @click="submitRating">
            {{ submittingRate ? '提交中...' : '提交评分' }}
          </button>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDiaryDetail, getDiaryStatistics, rateDiary } from '@/services/diaryApi'

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

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const submittingRate = ref(false)
const diary = ref(null)
const errorMessage = ref('')
const rateMessage = ref('')
const rateSuccess = ref(false)
const stats = reactive({
  viewCount: 0,
  ratingCount: 0,
  avgRating: 0
})
const ratingDraft = reactive({
  score: 5,
  comment: ''
})

const scoreOptions = [1, 2, 3, 4, 5]

const tags = computed(() =>
  String(diary.value?.keywords || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
)

const destinationLabel = computed(() => {
  if (!diary.value) return '旅程'
  if (tags.value.length) return tags.value[0]
  if (diary.value.destinationId) return `Destination #${diary.value.destinationId}`
  return '旅程'
})

const heroImage = computed(() => {
  const probes = [diary.value?.title, destinationLabel.value, ...tags.value]
    .filter(Boolean)
    .map(normalizeText)

  const hit = imageCatalog.find((item) => {
    const normalized = normalizeText(item.fileName)
    return probes.some((probe) => probe && (normalized.includes(probe) || probe.includes(normalized)))
  })

  return hit?.url || ''
})

const storyParagraphs = computed(() => {
  const content = String(diary.value?.content || '').trim()
  if (!content) {
    return ['这篇日记暂时还没有正文内容。']
  }

  return content
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean)
})

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\.(jpg|jpeg|png|webp)$/i, '')
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0))
}

function formatScore(value) {
  return Number(value || 0).toFixed(1)
}

function formatDate(value) {
  if (!value) return '最近'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '最近'

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: '2-digit'
  }).format(date)
}

async function loadDiary() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [detail, statistic] = await Promise.all([
      getDiaryDetail(route.params.id),
      getDiaryStatistics(route.params.id)
    ])

    diary.value = detail
    stats.viewCount = Number(statistic.viewCount || detail.heatScore || 0)
    stats.ratingCount = Number(statistic.ratingCount || detail.ratingCount || 0)
    stats.avgRating = Number(statistic.avgRating || detail.avgRating || 0)
  } catch (error) {
    errorMessage.value = error.message || '加载日记详情失败。'
  } finally {
    loading.value = false
  }
}

async function submitRating() {
  if (!diary.value) return

  submittingRate.value = true
  rateMessage.value = ''

  try {
    await rateDiary({
      diaryId: diary.value.id,
      score: ratingDraft.score,
      comment: ratingDraft.comment
    })

    rateSuccess.value = true
    rateMessage.value = '评分已提交。'
    await loadDiary()
  } catch (error) {
    rateSuccess.value = false
    rateMessage.value = error.message || '评分失败，请检查登录状态。'
  } finally {
    submittingRate.value = false
  }
}

function goBack() {
  router.push({ name: 'Diary' })
}

function showAiNotice() {
  window.alert('当前后端还没有提供 /api/diary/ai-generate，详情页先保留入口位。')
}

onMounted(() => {
  loadDiary()
})
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(56, 94, 69, 0.36), transparent 26%),
    radial-gradient(circle at 90% 0%, rgba(200, 169, 107, 0.16), transparent 22%),
    linear-gradient(180deg, #050505 0%, #0a0f0d 42%, #0d1612 100%);
  color: #f5f1e8;
}

.hero-shell {
  position: relative;
  height: 70vh;
  min-height: 520px;
  overflow: hidden;
}

.hero-image,
.hero-fallback,
.hero-overlay {
  position: absolute;
  inset: 0;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-fallback {
  display: grid;
  place-items: center;
  background:
    linear-gradient(145deg, rgba(183, 209, 141, 0.16), rgba(7, 11, 9, 0.16)),
    radial-gradient(circle at top left, rgba(215, 197, 138, 0.16), transparent 42%),
    #111613;
  font-size: 56px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.hero-overlay {
  background: linear-gradient(180deg, rgba(5, 6, 6, 0.12), rgba(5, 6, 6, 0.32) 45%, rgba(5, 6, 6, 0.88) 100%);
}

.hero-nav,
.hero-content,
.content-head,
.hero-meta,
.detail-layout,
.tag-row,
.score-row {
  position: relative;
  z-index: 1;
}

.hero-nav {
  display: flex;
  justify-content: space-between;
  padding: 26px 28px 0;
}

.hero-content {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0 28px 38px;
}

.hero-content h1,
.content-head h2 {
  margin: 0;
  font-size: clamp(38px, 6vw, 72px);
  font-weight: 900;
  line-height: 0.95;
}

.section-kicker {
  margin: 0 0 10px;
  font-size: 11px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(215, 197, 138, 0.82);
}

.hero-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 18px;
  color: rgba(255, 255, 255, 0.8);
}

.hero-meta span,
.metric-pill {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(300px, 0.72fr);
  gap: 24px;
  padding: 26px 24px 48px;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 20px 60px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(20px);
}

.content-card,
.gallery-card,
.side-card,
.state-card {
  padding: 24px;
  border-radius: 30px;
}

.story-column,
.side-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.content-head h2 {
  font-size: 30px;
}

.content-body {
  margin-top: 20px;
}

.content-body p,
.media-note,
.muted-line {
  margin: 0 0 18px;
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.85;
  font-size: 16px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.gallery-grid img {
  width: 100%;
  height: 240px;
  object-fit: cover;
  border-radius: 24px;
}

.gallery-offset {
  filter: saturate(0.86) brightness(0.9);
}

.stats-list {
  display: grid;
  gap: 16px;
}

.stats-list div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.stats-list span,
textarea,
.feedback {
  color: rgba(255, 255, 255, 0.72);
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.score-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin: 10px 0 14px;
}

.score-btn,
.ghost-btn,
.submit-btn {
  min-height: 48px;
  border: none;
  border-radius: 18px;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.score-btn,
.ghost-btn,
textarea {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #fff;
}

.score-btn.active {
  border-color: rgba(183, 209, 141, 0.48);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.22);
}

textarea {
  width: 100%;
  padding: 16px 18px;
  border-radius: 20px;
  resize: vertical;
  outline: none;
  min-height: 120px;
  font: inherit;
}

.submit-btn {
  width: 100%;
  margin-top: 14px;
  background: linear-gradient(135deg, rgba(183, 209, 141, 0.88), rgba(140, 162, 95, 0.88));
  color: #0d1511;
  font-weight: 700;
}

.feedback.success {
  color: #c3e2a8;
}

.feedback.error,
.state-error {
  color: #ffb8b8;
}

@media (max-width: 980px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .hero-shell {
    min-height: 460px;
  }

  .hero-nav {
    padding: 18px 16px 0;
  }

  .hero-content {
    padding: 0 16px 28px;
  }

  .detail-layout {
    padding: 18px 16px 40px;
  }

  .gallery-grid,
  .score-row {
    grid-template-columns: 1fr;
  }
}
</style>
