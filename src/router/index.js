import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import NotFound from '../views/NotFound.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/home/HomePage.vue')
      },
      {
        path: 'recommend',
        name: 'Recommend',
        component: () => import('../views/recommend/RecommendPage.vue')
      },
      {
        path: 'route',
        name: 'Route',
        component: () => import('../views/route/RoutePage.vue')
      },
      {
        path: 'venue',
        name: 'Venue',
        component: () => import('../views/venue/VenuePage.vue')
      },
      {
        path: 'diary',
        name: 'Diary',
        component: () => import('../views/diary/DiaryPage.vue')
      },
      {
        path: 'login',
        name: 'Login',
        component: () => import('../views/user/LoginPage.vue')
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('../views/user/RegisterPage.vue')
      },
      {
        path: 'user',
        name: 'UserCenter',
        component: () => import('../views/user/UserCenter.vue')
      },
      {
        path: 'community',
        name: 'Community',
        component: () => import('../views/community/CommunityPage.vue')
      },
      {
        path: 'food',
        name: 'Food',
        component: () => import('../views/food/FoodPage.vue')
      }
    ]
  }
  ,
  // 处理未匹配路由
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

// 设置页面标题
router.afterEach((to) => {
  const name = to.name || ''
  const titleMap = {
    Home: '首页 - 旅游助手',
    Recommend: '旅游推荐 - 旅游助手',
    Route: '路线规划 - 旅游助手',
    Venue: '场所查询 - 旅游助手',
    Diary: '旅游日记 - 旅游助手',
    Community: '日记交流 - 旅游助手',
    Food: '美食推荐 - 旅游助手',
    NotFound: '页面未找到 - 旅游助手'
  }
  document.title = titleMap[name] || '旅游助手'
})
