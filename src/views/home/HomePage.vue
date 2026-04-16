<template>
  <div class="home-page">
    <section class="hero" :style="heroStyle">
      <h1>探索世界的美好</h1>
      <p>发现精彩旅程，记录美好回忆</p>
      <div class="quick-actions">
        <router-link to="/recommend" class="action-btn primary">开始探索</router-link>
        <router-link to="/route" class="action-btn">规划路线</router-link>
      </div>
    </section>
    
    <section class="features">
      <div class="feature-card" @click="$router.push('/recommend')">
        <div class="icon">🎯</div>
        <h3>旅游推荐</h3>
        <p>智能推荐热门旅游目的地</p>
      </div>
      <div class="feature-card" @click="$router.push('/route')">
        <div class="icon">🗺️</div>
        <h3>路线规划</h3>
        <p>定制专属旅游路线</p>
      </div>
      <div class="feature-card" @click="$router.push('/venue')">
        <div class="icon">📍</div>
        <h3>场所查询</h3>
        <p>查找景点、酒店、餐厅</p>
      </div>
      <div class="feature-card" @click="$router.push('/diary')">
        <div class="icon">📖</div>
        <h3>旅游日记</h3>
        <p>记录旅途中的点滴</p>
      </div>
      <div class="feature-card" @click="$router.push('/community')">
        <div class="icon">💬</div>
        <h3>日记交流</h3>
        <p>分享旅行故事</p>
      </div>
      <div class="feature-card" @click="$router.push('/food')">
        <div class="icon">🍜</div>
        <h3>美食推荐</h3>
        <p>发现当地特色美食</p>
      </div>
    </section>
  </div>
</template>

<script setup>
// try to find the image in src/assets that contains the name '首页面'
let heroStyle = {}
try {
  const imgs = import.meta.glob('../../assets/*', { eager: true, as: 'url' })
  const urls = Object.values(imgs)
  const found = urls.find(u => u.includes('首页面')) || urls[0]
  if (found) heroStyle = { backgroundImage: `url(${found})` }
} catch (e) {
  // import.meta.glob may not be available in all builds; leave heroStyle empty for CSS fallback
}
</script>

<style scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  padding: 4rem 2rem;
  background-color: #667eea;
  background-blend-mode: overlay;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  border-radius: 20px;
  color: white;
  margin-bottom: 3rem;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.quick-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.action-btn {
  padding: 1rem 2rem;
  border-radius: 30px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
  background: white;
  color: #667eea;
}

.action-btn.primary {
  background: #ffd700;
  color: #333;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(0,0,0,0.2);
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.feature-card p {
  color: #718096;
}
</style>
