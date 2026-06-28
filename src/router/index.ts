import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { hasFaToken } from '@/utils/auth'
import HomeView from '../views/HomeView.vue'

// 擴充 vue-router 的 RouteMeta，加入專案自訂欄位
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    description?: string
    requiresAuth?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: { title: '首頁 | vue3-shop', description: '探索每一件值得擁有的好物，從日常必需到精緻配件' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: '登入 | vue3-shop', description: '使用測試帳號快速登入' }
  },
  {
    path: '/products',
    name: 'ProductList',
    component: () => import('../views/ProductListView.vue'),
    meta: { title: '商品列表 | vue3-shop', description: '瀏覽所有精選商品，依分類篩選你喜愛的好物' }
  },
  {
    path: '/products/:id(\\d+)',
    name: 'ProductDetail',
    component: () => import('../views/ProductDetailView.vue'),
    meta: { title: '商品詳情 | vue3-shop', description: '查看商品詳細資訊' }
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('../views/CartView.vue'),
    meta: {
      title: '購物車 | vue3-shop',
      description: '查看購物車內的商品',
      requiresAuth: true,
    }
  },
  {
    path: '/order',
    name: 'Order',
    component: () => import('../views/OrderView.vue'),
    meta: {
      title: '訂單確認 | vue3-shop',
      description: '確認訂單內容並送出',
      requiresAuth: true,
    },
    beforeEnter: () => {
      // 購物車為空時禁止直接進入訂單頁
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      if (cart.length === 0) return { name: 'Cart' }
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(), // 使用 HTML5 history 模式（無 # 號）
  routes,
  // 每次切換頁面時滾回頂部
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !hasFaToken()) {
    return {
      name: 'Login',
      query: { redirect: to.fullPath },
    }
  }

  document.title = to.meta.title || 'vue3-shop'
  const metaDesc = document.querySelector('meta[name="description"]')
  if (metaDesc) {
    metaDesc.setAttribute('content', to.meta.description || '')
  }
})

export default router
