<template>
  <div class="food-detail-page">
    <div class="detail-shell">
      <div class="detail-topbar">
        <button class="ghost-btn" @click="goBack">Back 返回</button>
        <button class="primary-btn" :disabled="!detail" @click="addToRoute">Add to Route 加入路线</button>
      </div>

      <section v-if="loading" class="panel state-panel">
        <h2>Loading food detail 正在加载美食详情</h2>
        <p>Fetching detail from backend and local cache.</p>
      </section>

      <section v-else-if="detail" class="detail-grid">
        <article class="panel hero-panel">
          <div class="hero-media">
            <img v-if="detail.coverImage" :src="detail.coverImage" :alt="detail.restaurantName" class="hero-image" />
            <div v-else class="hero-placeholder">
              <span>{{ detail.cuisineType }}</span>
              <strong>{{ detail.restaurantName }}</strong>
            </div>
          </div>

          <div class="hero-copy">
            <p class="eyebrow">{{ detail.cuisineType }}</p>
            <h1>{{ detail.restaurantName }}</h1>
            <h2>{{ detail.foodName }}</h2>
            <p class="summary">{{ detail.description || buildSummary(detail) }}</p>

            <div class="stat-row">
              <div class="stat-card">
                <span>Rating</span>
                <strong>{{ formatRating(detail.rating) }}</strong>
              </div>
              <div class="stat-card">
                <span>Heat</span>
                <strong>{{ detail.heatScore }}</strong>
              </div>
              <div class="stat-card">
                <span>Distance</span>
                <strong>{{ formatDistance(detail.distance) }}</strong>
              </div>
            </div>
          </div>
        </article>

        <aside class="sidebar">
          <section class="panel info-panel">
            <h3>Quick Info</h3>
            <dl class="info-list">
              <div>
                <dt>Address</dt>
                <dd>{{ detail.address || detail.location || '暂无地址' }}</dd>
              </div>
              <div>
                <dt>Hours</dt>
                <dd>{{ detail.businessHours || '营业时间待补充' }}</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>{{ detail.price || '价格待补充' }}</dd>
              </div>
            </dl>
          </section>

          <section class="panel tags-panel">
            <h3>Tags</h3>
            <div class="tag-row">
              <span v-for="tag in detail.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </section>
        </aside>

        <section class="panel section-panel">
          <h3>Signature Dishes 招牌推荐</h3>
          <div v-if="signatureDishes.length" class="pill-row">
            <span v-for="item in signatureDishes" :key="item" class="pill">{{ item }}</span>
          </div>
          <p v-else>当前接口没有返回招牌菜，先展示当前主菜信息。</p>
        </section>

        <section class="panel section-panel">
          <h3>Gallery 图片</h3>
          <div v-if="gallery.length" class="gallery-grid">
            <img v-for="item in gallery" :key="item" :src="item" alt="food gallery" class="gallery-image" />
          </div>
          <p v-else>暂无更多图片。</p>
        </section>
      </section>

      <section v-else class="panel state-panel">
        <h2>Food detail not found 未找到美食详情</h2>
        <p>{{ errorMessage || '当前记录不存在，或后端尚未返回该 ID 的详情。' }}</p>
        <button class="ghost-btn" @click="goBack">Return 返回列表</button>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { normalizeFoodRecord } from './foodCatalog'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const detail = ref(null)
const errorMessage = ref('')

const gallery = computed(() => {
  if (!detail.value) return []
  if (Array.isArray(detail.value.gallery) && detail.value.gallery.length) return detail.value.gallery
  return detail.value.coverImage ? [detail.value.coverImage] : []
})

const signatureDishes = computed(() => {
  if (!detail.value) return []
  if (Array.isArray(detail.value.signatureDishes) && detail.value.signatureDishes.length) {
    return detail.value.signatureDishes
  }
  return detail.value.foodName ? [detail.value.foodName] : []
})

function getCachedFood(id) {
  try {
    const raw = sessionStorage.getItem('food-cache')
    if (!raw) return null
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) return null
    return list.find((item) => String(item.id) === String(id)) || null
  } catch (error) {
    console.warn('read food cache failed', error)
    return null
  }
}

async function loadDetail() {
  loading.value = true
  errorMessage.value = ''

  const id = route.params.id
  const cached = getCachedFood(id)
  if (cached) {
    detail.value = normalizeFoodRecord(cached)
  }

  try {
    const result = await api.getFoodDetail(id)
    detail.value = normalizeFoodRecord(result)
  } catch (error) {
    console.warn('load food detail failed', error)
    if (!detail.value) {
      errorMessage.value = error?.message || '加载失败'
    }
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

function addToRoute() {
  if (!detail.value) return
  router.push({
    name: 'Route',
    query: {
      poi: detail.value.restaurantName,
      lat: detail.value.restaurantLatitude,
      lng: detail.value.restaurantLongitude,
      from: 'food-detail'
    }
  })
}

function formatRating(value) {
  const num = Number(value || 0)
  return Number.isFinite(num) ? num.toFixed(1) : '0.0'
}

function formatDistance(value) {
  const num = Number(value || 0)
  if (!Number.isFinite(num) || num < 0) return '待补充'
  if (num < 1000) return `${Math.round(num)}m`
  return `${(num / 1000).toFixed(1)}km`
}

function buildSummary(item) {
  return [item.foodName, item.cuisineType, item.location].filter(Boolean).join(' | ')
}

onMounted(() => {
  void loadDetail()
})
</script>

<style scoped>
.food-detail-page {
  min-height: 100vh;
  padding: 96px 24px 32px;
  background:
    radial-gradient(circle at top left, rgba(135, 164, 101, 0.18), transparent 24%),
    radial-gradient(circle at top right, rgba(196, 157, 88, 0.16), transparent 22%),
    linear-gradient(180deg, #101311 0%, #171b18 100%);
  color: #f3efe7;
}

.detail-shell {
  max-width: 1280px;
  margin: 0 auto;
}

.detail-topbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 20px;
}

.panel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(18px);
  border-radius: 28px;
}

.hero-panel {
  display: grid;
  grid-template-columns: minmax(320px, 1.2fr) minmax(0, 1fr);
  gap: 20px;
  padding: 20px;
}

.hero-media {
  min-height: 440px;
  border-radius: 22px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
}

.hero-image,
.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 10px;
  padding: 28px;
  background:
    radial-gradient(circle at 20% 20%, rgba(143, 176, 110, 0.42), transparent 30%),
    linear-gradient(135deg, #212428 0%, #131714 100%);
}

.hero-placeholder span,
.eyebrow {
  color: rgba(243, 239, 231, 0.72);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.82rem;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-copy h1 {
  margin: 8px 0 4px;
  font-size: clamp(2rem, 4vw, 3.3rem);
  line-height: 1;
}

.hero-copy h2 {
  font-size: 1.35rem;
  color: #d9f0b5;
}

.summary {
  margin-top: 16px;
  line-height: 1.8;
  color: rgba(243, 239, 231, 0.8);
}

.stat-row,
.pill-row,
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stat-row {
  margin-top: 24px;
}

.stat-card {
  min-width: 120px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.stat-card span,
.info-list dt {
  display: block;
  font-size: 0.85rem;
  color: rgba(243, 239, 231, 0.68);
}

.stat-card strong {
  display: block;
  margin-top: 6px;
  font-size: 1.4rem;
}

.sidebar {
  display: grid;
  gap: 20px;
}

.info-panel,
.tags-panel,
.section-panel,
.state-panel {
  padding: 20px;
}

.info-list {
  display: grid;
  gap: 16px;
  margin-top: 14px;
}

.info-list dd {
  margin: 6px 0 0;
  line-height: 1.7;
}

.tag,
.pill {
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.section-panel {
  grid-column: 1 / -1;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin-top: 14px;
}

.gallery-image {
  height: 220px;
  border-radius: 20px;
}

.ghost-btn,
.primary-btn {
  border-radius: 999px;
  padding: 12px 18px;
  cursor: pointer;
  font-weight: 600;
}

.ghost-btn {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.primary-btn {
  border: none;
  color: #fff;
  background: linear-gradient(135deg, #8fb06e 0%, #5d9f81 100%);
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 960px) {
  .detail-grid,
  .hero-panel {
    grid-template-columns: 1fr;
  }

  .food-detail-page {
    padding: 84px 12px 24px;
  }
}
</style>
