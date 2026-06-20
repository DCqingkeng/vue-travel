<template>
  <footer class="footer">
    <div class="container">
      <div class="cols">
        <div class="col">
          <h4>产品</h4>
          <ul>
            <li><router-link to="/recommend">旅游推荐</router-link></li>
            <li><router-link to="/route">路线规划</router-link></li>
            <li><router-link to="/venue">场所查询</router-link></li>
            <li><router-link to="/diary">旅游日记</router-link></li>
          </ul>
        </div>
        <div class="col">
          <h4>服务</h4>
          <ul>
            <li><router-link to="/disaster">灾情预防</router-link></li>
            <li><a href="#">智能导览</a></li>
            <li><a href="#">语音讲解</a></li>
            <li><a href="#">AR实景</a></li>
          </ul>
        </div>
        <div class="col">
          <h4>支持</h4>
          <ul>
            <li><a href="#" @click.prevent="helpCenterVisible = true">帮助中心</a></li>
            <li><a href="#">用户指南</a></li>
            <li><a href="#">常见问题</a></li>
            <li><a href="#">意见反馈</a></li>
          </ul>
        </div>
        <div class="col">
          <h4>关于</h4>
          <ul>
            <li><a href="#">关于我们</a></li>
            <li><a href="#">联系我们</a></li>
            <li><a href="#">加入我们</a></li>
            <li><a href="#">合作伙伴</a></li>
          </ul>
        </div>
        <div class="col">
          <h4>社交</h4>
          <ul>
            <li><a href="#">官方微博</a></li>
            <li><a href="#">微信公众号</a></li>
            <li><a href="#">小红书</a></li>
            <li><a href="#">抖音号</a></li>
          </ul>
        </div>
        <div class="col">
          <h4>法律</h4>
          <ul>
            <li><a href="#">用户协议</a></li>
            <li><a href="#">隐私政策</a></li>
            <li><a href="#">免责声明</a></li>
            <li><a href="#">版权声明</a></li>
          </ul>
        </div>
      </div>
      <div class="copyright">© 2026 智游无疆 • All rights reserved</div>
    </div>
    <el-dialog
      v-model="helpCenterVisible"
      width="min(860px, calc(100vw - 32px))"
      class="faq-dialog"
      append-to-body
      destroy-on-close
    >
      <template #header>
        <div class="faq-header">
          <p class="faq-kicker">Help Center</p>
          <h3>常见问题 FAQ</h3>
          <p>这里整理了旅游系统最常见的问题，帮助你快速了解推荐、路线、美食、日记和灾情预防功能。</p>
        </div>
      </template>

      <el-collapse accordion>
        <el-collapse-item
          v-for="item in faqItems"
          :key="item.name"
          :name="item.name"
          :title="item.question"
        >
          <p class="faq-answer">{{ item.answer }}</p>
        </el-collapse-item>
      </el-collapse>
    </el-dialog>
  </footer>
</template>

<script setup>
import { ref } from 'vue'

const helpCenterVisible = ref(false)

const faqItems = [
  {
    name: 'overview',
    question: '这个旅游系统可以做什么？',
    answer: '系统整合了目的地推荐、路线规划、美食探索、场馆查询、旅行日记和灾情预防功能，帮助用户在一次行程中同时解决“去哪、怎么走、吃什么、怎么避险”等问题。'
  },
  {
    name: 'recommendation',
    question: '如何使用推荐功能快速找到目的地？',
    answer: '进入推荐模块后，你可以按景点、学校等类型浏览内容，再结合评分、热度和位置筛选结果，快速找到更符合自己出行计划的目的地。'
  },
  {
    name: 'route',
    question: '路线规划支持哪些模式？',
    answer: '系统支持普通目的地导航、多目标点规划以及室内外场景切换。你可以根据当前位置和目标位置生成更适合当前场景的路线方案。'
  },
  {
    name: 'food',
    question: '美食推荐为什么会和目的地联动？',
    answer: '美食模块会根据当前选择的目的地进行筛选，并结合菜系、关键词、热度、评分和距离排序，让你更快找到附近值得尝试的餐厅和招牌菜。'
  },
  {
    name: 'diary',
    question: '旅行日记模块有什么价值？',
    answer: '日记模块既可以记录自己的旅行体验，也可以浏览其他用户的真实内容，帮助你沉淀行程记忆，同时获得更贴近实际的出行参考。'
  },
  {
    name: 'disaster',
    question: '灾情预防模块和普通导航有什么不同？',
    answer: '灾情预防模块不仅关注“怎么到达”，更关注“是否安全”。系统会结合灾害类型、强度、当前位置、避难点容量和疏散策略，给出更适用于紧急场景的避险建议。'
  },
  {
    name: 'emergency',
    question: '遇到突发情况时应该如何使用系统？',
    answer: '进入灾情预防页面后，先确认当前区域和灾害类型，再查看推荐的疏散路线与避难点信息。请优先遵循现场广播、工作人员引导和官方应急要求，系统主要提供辅助决策支持。'
  }
]
</script>

<style scoped>
.footer { 
  background: var(--morandi-bg-secondary); 
  color: var(--morandi-text-secondary); 
  padding: 3rem 0 2rem; 
  border-top: 1px solid var(--morandi-border); 
  margin-top: 4rem;
}
.footer.home-theme {
  background: #000;
  color: rgba(255, 255, 255, 0.72);
  border-top-color: rgba(255, 255, 255, 0.12);
}
.container { 
  width: min(100%, var(--container-max)); 
  margin: 0 auto; 
  padding: 0 var(--container-gutter, 24px) 
}
.cols { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}
.col h4 { 
  color: var(--morandi-text-primary); 
  font-weight: 600; 
  font-size: 14px;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.footer.home-theme .col h4 {
  color: #fff;
}
.col ul { 
  list-style: none; 
  padding: 0; 
  margin: 0 
}
.col li { 
  margin-bottom: 10px 
}
.col a { 
  color: var(--morandi-text-secondary); 
  text-decoration: none; 
  font-size: 13px;
  transition: color 0.2s; 
}
.footer.home-theme .col a {
  color: rgba(255, 255, 255, 0.72);
}
.col a:hover { 
  color: var(--morandi-sage); 
}
.footer.home-theme .col a:hover {
  color: #fff;
}
.copyright { 
  margin-top: 2rem; 
  padding-top: 1.5rem; 
  border-top: 1px solid var(--morandi-border); 
  color: var(--morandi-text-muted); 
  font-size: 13px;
  text-align: center;
}
.footer.home-theme .copyright {
  border-top-color: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.56);
}

.faq-header h3 {
  margin: 4px 0 8px;
  font-size: 1.5rem;
  color: #2f312e;
}

.faq-header p:last-child,
.faq-answer {
  color: #5f675f;
  line-height: 1.8;
}

.faq-kicker {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #7f887f;
}

.faq-answer {
  margin: 0;
}

.faq-dialog :deep(.el-dialog) {
  border-radius: 24px;
}

.faq-dialog :deep(.el-dialog__body) {
  padding-top: 8px;
}

.faq-dialog :deep(.el-collapse) {
  border-top: none;
  border-bottom: none;
}

.faq-dialog :deep(.el-collapse-item__header) {
  height: auto;
  min-height: 54px;
  padding: 10px 0;
  line-height: 1.5;
  font-weight: 600;
  color: #2f312e;
}

.faq-dialog :deep(.el-collapse-item__content) {
  padding-bottom: 18px;
}

@media (max-width: 768px) { 
  .cols { 
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
  .footer {
    padding: 2rem 0 1.5rem;
  }
}

@media (max-width: 480px) {
  .cols {
    grid-template-columns: 1fr;
  }
}
</style>
