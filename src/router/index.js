import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'), // 首頁
  },
  {
    path: '/products',
    name: 'ProductList',
    component: () => import('../views/ProductListView.vue'), // 商品列表
  },
  {
    path: '/products/:id',
    name: 'ProductDetail',
    component: () => import('../views/ProductDetailView.vue'), // 商品詳情
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('../views/CartView.vue'), // 購物車
  },
  {
    path: '/order',
    name: 'Order',
    component: () => import('../views/OrderView.vue'), // 訂單確認頁
  },
  {
    // 未知路由導回首頁
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

export default router
