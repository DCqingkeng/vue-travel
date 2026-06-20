<template>
  <div class="story-card">
    <div class="story-media"></div>
    <div class="story-body">
      <div class="tag">旅行故事</div>
      <h4>探索世界的精彩</h4>
      <p>分享旅途中的美好瞬间与难忘经历。</p>
      <a href="#" class="more">了解更多 →</a>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.story-card { background: #fff; border-radius: 10px; overflow: hidden; display:flex; gap:12px; box-shadow: 0 8px 24px rgba(74, 74, 72, 0.08); border: 1px solid var(--morandi-border-light); }
.story-media { width: 160px; background: linear-gradient(135deg, var(--morandi-cream) 0%, var(--morandi-taupe) 100%); }
.story-body { padding: 16px; flex: 1; }
.story-body h4 { color: var(--morandi-text-primary); margin: 8px 0; font-size: 16px; }
.story-body p { color: var(--morandi-text-secondary); font-size: 14px; margin: 0; }
.tag { font-size: 0.8rem; color: var(--morandi-sage); font-weight: 500; }
.more { color: var(--morandi-sage); text-decoration:none; font-size: 14px; }
.more:hover { text-decoration: underline; }
</style>
