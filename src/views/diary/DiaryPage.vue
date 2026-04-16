<template>
  <div class="diary-page">
    <h1>📖 旅游日记</h1>
    <p class="subtitle">记录旅途中的美好瞬间</p>
    
    <div class="diary-header">
      <button class="btn-create" @click="showCreateModal = true">
        ✍️ 写日记
      </button>
    </div>
    
    <div class="diary-grid">
      <div v-for="diary in diaries" :key="diary.id" class="diary-card">
        <div class="diary-cover">{{ diary.destination }}</div>
        <div class="diary-content">
          <h3>{{ diary.title }}</h3>
          <p class="date">📅 {{ diary.date }}</p>
          <p class="location">📍 {{ diary.destination }}</p>
          <p class="preview">{{ diary.content.substring(0, 100) }}...</p>
          <div class="diary-footer">
            <span class="views">👁️ {{ diary.views }}</span>
            <span class="likes">❤️ {{ diary.likes }}</span>
            <button class="btn-read">阅读全文</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 创建日记弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal" @click.stop>
        <h2>✍️ 写新日记</h2>
        <div class="form-group">
          <label>标题</label>
          <input v-model="newDiary.title" type="text" placeholder="给日记起个标题" />
        </div>
        <div class="form-group">
          <label>目的地</label>
          <input v-model="newDiary.destination" type="text" placeholder="去哪里旅行了？" />
        </div>
        <div class="form-group">
          <label>旅行日期</label>
          <input v-model="newDiary.date" type="date" />
        </div>
        <div class="form-group">
          <label>日记内容</label>
          <textarea v-model="newDiary.content" rows="6" placeholder="记录下美好的旅行回忆..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showCreateModal = false">取消</button>
          <button class="btn-save" @click="saveDiary">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showCreateModal = ref(false)

const newDiary = ref({
  title: '',
  destination: '',
  date: '',
  content: ''
})

const diaries = ref([
  {
    id: 1,
    title: '三亚之旅：阳光与海滩的完美结合',
    destination: '三亚',
    date: '2026-03-15',
    content: '这次三亚之行让我感受到了热带海岛的魅力。清晨的海滩格外宁静，椰林树影，水清沙白...',
    views: 328,
    likes: 56
  },
  {
    id: 2,
    title: '丽江古城：时光倒流的地方',
    destination: '丽江',
    date: '2026-02-20',
    content: '漫步在丽江古城的石板路上，仿佛穿越回了古代。纳西族的东巴文化深深吸引着我...',
    views: 256,
    likes: 42
  },
  {
    id: 3,
    title: '张家界：人间仙境',
    destination: '张家界',
    date: '2026-01-10',
    content: '张家界的奇峰异石让人叹为观止。云雾缭绕中，山峰若隐若现，宛如仙境...',
    views: 189,
    likes: 35
  }
])

const saveDiary = () => {
  if (newDiary.value.title && newDiary.value.content) {
    diaries.value.unshift({
      id: Date.now(),
      ...newDiary.value,
      views: 0,
      likes: 0
    })
    newDiary.value = { title: '', destination: '', date: '', content: '' }
    showCreateModal.value = false
  }
}
</script>

<style scoped>
.diary-page {
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

.diary-header {
  margin-bottom: 2rem;
}

.btn-create {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.diary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
}

.diary-card {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}

.diary-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.diary-cover {
  height: 180px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
}

.diary-content {
  padding: 1.5rem;
}

.diary-content h3 {
  color: #2d3748;
  margin-bottom: 0.75rem;
}

.date,
.location {
  color: #718096;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.preview {
  color: #4a5568;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.diary-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.views,
.likes {
  color: #718096;
  font-size: 0.9rem;
}

.btn-read {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin-bottom: 1.5rem;
  color: #2d3748;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #4a5568;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.modal-actions button {
  padding: 0.75rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.btn-cancel {
  background: #e2e8f0;
  color: #4a5568;
  border: none;
}

.btn-save {
  background: #667eea;
  color: white;
  border: none;
}
</style>
