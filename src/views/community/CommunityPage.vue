<template>
  <div class="community-page">
    <h1>💬 日记交流</h1>
    <p class="subtitle">分享旅行故事，发现更多精彩</p>
    
    <div class="community-layout">
      <div class="main-feed">
        <div class="post-creator">
          <div class="avatar">👤</div>
          <div class="input-area">
            <textarea 
              v-model="newPost.content" 
              placeholder="分享你的旅行故事..."
              rows="3"
            ></textarea>
            <div class="post-actions">
              <div class="attachments">
                <button>📷 图片</button>
                <button>📍 位置</button>
              </div>
              <button class="btn-publish" @click="publishPost">发布</button>
            </div>
          </div>
        </div>
        
        <div class="posts-list">
          <div v-for="post in posts" :key="post.id" class="post-card">
            <div class="post-header">
              <div class="avatar">{{ post.author[0] }}</div>
              <div class="author-info">
                <h4>{{ post.author }}</h4>
                <span class="time">{{ post.time }}</span>
              </div>
            </div>
            <div class="post-content">
              <p>{{ post.content }}</p>
              <div v-if="post.images" class="post-images">
                <div v-for="(img, idx) in post.images" :key="idx" class="image-placeholder">
                  图片 {{ idx + 1 }}
                </div>
              </div>
            </div>
            <div class="post-footer">
              <button class="action-btn" @click="likePost(post)">
                ❤️ {{ post.likes }}
              </button>
              <button class="action-btn">
                💬 {{ post.comments }}
              </button>
              <button class="action-btn">
                🔄 分享
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="sidebar">
        <div class="widget hot-topics">
          <h3>🔥 热门话题</h3>
          <ul>
            <li v-for="topic in hotTopics" :key="topic.id">
              <span class="rank">{{ topic.rank }}</span>
              <span class="name">{{ topic.name }}</span>
              <span class="count">{{ topic.count }}万</span>
            </li>
          </ul>
        </div>
        
        <div class="widget recommended-users">
          <h3>👥 推荐关注</h3>
          <div v-for="user in recommendedUsers" :key="user.id" class="user-item">
            <div class="avatar">{{ user.name[0] }}</div>
            <div class="user-info">
              <h4>{{ user.name }}</h4>
              <p>{{ user.bio }}</p>
            </div>
            <button class="btn-follow">关注</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const newPost = ref({
  content: ''
})

const posts = ref([
  {
    id: 1,
    author: '旅行达人小王',
    time: '2小时前',
    content: '刚从西藏回来，纳木错的星空真的太美了！强烈推荐大家去看看，记得带好保暖衣物哦～',
    images: [1, 2, 3],
    likes: 128,
    comments: 32
  },
  {
    id: 2,
    author: '美食探索家',
    time: '5小时前',
    content: '成都的美食真的让人流连忘返！火锅、串串、担担面...每一口都是幸福的味道',
    likes: 256,
    comments: 48
  },
  {
    id: 3,
    author: '背包客阿明',
    time: '1天前',
    content: '徒步雨崩村，虽然很累但是看到梅里雪山的那一刻，一切都值得了！',
    images: [1, 2],
    likes: 189,
    comments: 27
  }
])

const hotTopics = ref([
  { id: 1, rank: 1, name: '#春日赏花攻略', count: 125 },
  { id: 2, rank: 2, name: '#小众旅行地', count: 98 },
  { id: 3, rank: 3, name: '#美食探店', count: 87 },
  { id: 4, rank: 4, name: '#自驾游路线', count: 76 },
  { id: 5, rank: 5, name: '#旅行摄影', count: 65 }
])

const recommendedUsers = ref([
  { id: 1, name: '摄影师阿杰', bio: '用镜头记录世界的美好' },
  { id: 2, name: '环球旅行家', bio: '已走过50+国家' },
  { id: 3, name: '美食地图', bio: '寻找各地特色美食' }
])

const publishPost = () => {
  if (newPost.value.content) {
    posts.value.unshift({
      id: Date.now(),
      author: '我',
      time: '刚刚',
      content: newPost.value.content,
      likes: 0,
      comments: 0
    })
    newPost.value.content = ''
  }
}

const likePost = (post) => {
  post.likes++
}
</script>

<style scoped>
.community-page {
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

.community-layout {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
}

.post-creator {
  display: flex;
  gap: 1rem;
  background: white;
  padding: 1.5rem;
  border-radius: 15px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  flex-shrink: 0;
}

.input-area {
  flex: 1;
}

.input-area textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  resize: vertical;
  font-family: inherit;
  font-size: 1rem;
}

.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.attachments {
  display: flex;
  gap: 1rem;
}

.attachments button {
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
}

.btn-publish {
  padding: 0.75rem 2rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.post-card {
  background: white;
  padding: 1.5rem;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.post-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.author-info h4 {
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.time {
  color: #718096;
  font-size: 0.9rem;
}

.post-content p {
  color: #4a5568;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.post-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.image-placeholder {
  aspect-ratio: 1;
  background: #edf2f7;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #718096;
}

.post-footer {
  display: flex;
  gap: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.action-btn {
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn:hover {
  color: #667eea;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.widget {
  background: white;
  padding: 1.5rem;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.widget h3 {
  color: #2d3748;
  margin-bottom: 1rem;
}

.hot-topics ul {
  list-style: none;
}

.hot-topics li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.rank {
  width: 24px;
  height: 24px;
  background: #ff6b6b;
  color: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
}

.name {
  flex: 1;
  color: #4a5568;
}

.count {
  color: #718096;
  font-size: 0.9rem;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.user-info {
  flex: 1;
}

.user-info h4 {
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.user-info p {
  color: #718096;
  font-size: 0.9rem;
}

.btn-follow {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  font-size: 0.9rem;
}
</style>
