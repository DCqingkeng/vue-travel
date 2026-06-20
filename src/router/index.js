import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import NotFound from '../views/NotFound.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/user/LoginPage.vue'),
    meta: { public: true, hideNavbar: true }
  },
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
        path: 'diary/:id',
        name: 'DiaryDetail',
        component: () => import('../views/diary/DiaryDetailPage.vue')
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
      },
      {
        path: 'food/:id',
        name: 'FoodDetail',
        component: () => import('../views/food/FoodDetailPage.vue')
      },
      {
        path: 'disaster',
        name: 'Disaster',
        component: () => import('../views/disaster/DisasterPage.vue')
      }
    ]
  },
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

router.afterEach((to) => {
  const titleMap = {
    Home: '首页 - 旅游助手',
    Recommend: '旅游推荐 - 旅游助手',
    Route: '路线规划 - 旅游助手',
    Venue: '场所查询 - 旅游助手',
    Diary: '旅行日记 - 旅游助手',
    DiaryDetail: '日记详情 - 旅游助手',
    Community: '日记交流 - 旅游助手',
    Food: '美食探索 - 旅游助手',
    FoodDetail: '美食详情 - 旅游助手',
    Disaster: '灾情预防 - 旅游助手',
    Login: '登录 - 旅游助手',
    NotFound: '页面未找到 - 旅游助手'
  }

  document.title = titleMap[to.name] || '旅游助手'
})

export default router
