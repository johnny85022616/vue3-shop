<template>
  <div class="min-h-screen bg-cream">
    <Navbar />

    <div class="max-w-6xl mx-auto px-8 py-16">

      <!-- 返回按鈕 -->
      <button
        class="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors duration-200 mb-10"
        @click="router.back()"
      >
        ← 返回
      </button>

      <!-- 載入中 skeleton -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-16 animate-pulse">
        <div class="aspect-square bg-border" />
        <div class="space-y-4 pt-4">
          <div class="h-4 bg-border w-1/4" />
          <div class="h-8 bg-border w-3/4" />
          <div class="h-4 bg-border w-1/3" />
          <div class="h-4 bg-border w-full" />
          <div class="h-4 bg-border w-5/6" />
          <div class="h-12 bg-border w-1/3 mt-8" />
        </div>
      </div>

      <!-- 錯誤 -->
      <p v-else-if="error" class="text-red-700 text-sm">{{ error }}</p>

      <!-- 商品詳情 -->
      <div v-else-if="product" class="grid grid-cols-1 md:grid-cols-2 gap-16">

        <!-- 左：圖片 -->
        <div class="aspect-square bg-white flex items-center justify-center border border-border">
          <img
            :src="product.thumbnail || product.images?.[0]"
            :alt="product.title"
            class="w-full h-full object-contain p-8"
          />
        </div>

        <!-- 右：資訊 -->
        <div class="flex flex-col">
          <!-- 分類 -->
          <p class="text-xs font-medium tracking-[0.15em] text-gold uppercase mb-3">
            {{ product.category }}
          </p>

          <!-- 標題 -->
          <h1 class="text-2xl font-semibold text-ink leading-snug mb-4">
            {{ product.title }}
          </h1>

          <!-- 評分 -->
          <div class="flex items-center gap-2 mb-6">
            <div class="flex items-center gap-0.5">
              <svg
                v-for="n in 5" :key="n"
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                :class="n <= Math.round(product.rating) ? 'text-gold' : 'text-border'"
                viewBox="0 0 20 20" fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <span class="text-sm text-muted">{{ product.rating?.toFixed(1) }}</span>
          </div>

          <!-- 描述 -->
          <p class="text-sm text-muted leading-relaxed mb-8">{{ product.description }}</p>

          <!-- 分隔線 -->
          <div class="h-px bg-border mb-8" />

          <!-- 價格 -->
          <p class="text-3xl font-semibold text-ink mb-8">${{ product.price }}</p>

          <!-- 數量選擇 -->
          <div class="flex items-center gap-4 mb-6">
            <span class="text-sm text-muted">數量</span>
            <div class="flex items-center border border-border">
              <button
                class="w-9 h-9 flex items-center justify-center text-ink hover:bg-border transition-colors duration-200"
                @click="qty > 1 && qty--"
              >−</button>
              <span class="w-10 text-center text-sm font-medium text-ink">{{ qty }}</span>
              <button
                class="w-9 h-9 flex items-center justify-center text-ink hover:bg-border transition-colors duration-200"
                @click="qty++"
              >+</button>
            </div>
          </div>

          <!-- 加入購物車 -->
          <button
            class="inline-flex items-center justify-center gap-3 bg-ink text-cream text-sm font-medium tracking-[0.05em] py-[0.9rem] px-8 transition-colors duration-[250ms] hover:bg-gold w-full sm:w-auto"
            @click="handleAddToCart"
          >
            加入購物車
          </button>

          <!-- 成功提示 -->
          <p v-if="added" class="text-sm text-gold mt-4">已加入購物車 ✓</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import { useProductDetail } from '@/composables/useProductDetail'
import { useCart } from '@/composables/useCart'

const route = useRoute()
const router = useRouter()
const { product, loading, error, fetchProductById } = useProductDetail()
const { addItem } = useCart()

const qty = ref(1)      // 使用者選擇的購買數量，最小為 1
const added = ref(false) // 控制「已加入購物車 ✓」提示的顯示與隱藏

// 載入指定 id 的商品，商品不存在時導回首頁
// @param id - route.params.id，來自 URL 的商品 id
const load = async (id) => {
  qty.value = 1
  added.value = false
  await fetchProductById(id)
  if (error.value) {
    router.replace({ name: 'Home' })
  } else {
    document.title = `${product.value.title} | vue3-shop`
  }
}

// 將目前商品加入購物車，並顯示 2 秒的成功提示
const handleAddToCart = () => {
  addItem({ ...product.value, quantity: qty.value })
  added.value = true
  setTimeout(() => { added.value = false }, 2000)
}

// 支援同頁換商品（例如相關商品連結），params 改變時重新載入
watch(() => route.params.id, (id) => { if (id) load(id) })

onMounted(() => {
  load(route.params.id)
})
</script>
