<template>
  <div class="min-h-screen bg-cream">
    <Navbar />

    <div class="max-w-6xl mx-auto px-8 py-16">

      <!-- 頁面標題 -->
      <div class="flex items-baseline gap-5 mb-10">
        <span class="text-[0.7rem] font-medium tracking-[0.2em] text-gold border border-gold py-[0.2rem] px-[0.6rem]">
          PRODUCTS
        </span>
        <h1 class="font-display text-[2rem] font-semibold text-ink">所有商品</h1>
      </div>

      <!-- 搜尋框 -->
      <div class="mb-8">
        <input
          v-model="searchQuery"
          type="text"
          aria-label="搜尋商品"
          placeholder="搜尋商品..."
          class="w-full sm:w-80 border border-border bg-cream text-ink text-sm px-4 py-2.5 outline-none focus:border-ink transition-colors duration-200 placeholder:text-muted"
          @keyup.enter="doSearch"
        />
      </div>

      <!-- 分類標籤 -->
      <div class="mb-10">
        <!-- 手機：前 5 個橫滑 + 更多按鈕 -->
        <div class="flex sm:hidden overflow-x-auto gap-2 -mx-8 px-8 pb-1 [&::-webkit-scrollbar]:hidden">
          <button
            class="shrink-0 text-xs font-medium tracking-[0.05em] px-4 py-2 border transition-colors duration-200"
            :class="activeCategory === '' ? 'bg-ink text-cream border-ink' : 'bg-cream text-ink border-border'"
            @click="selectCategory('')"
          >全部</button>
          <button
            v-for="cat in categories.slice(0, 5)"
            :key="cat.slug"
            class="shrink-0 text-xs font-medium tracking-[0.05em] px-4 py-2 border capitalize transition-colors duration-200"
            :class="activeCategory === cat.slug ? 'bg-ink text-cream border-ink' : 'bg-cream text-ink border-border'"
            @click="selectCategory(cat.slug)"
          >{{ cat.name }}</button>
          <button
            class="shrink-0 text-xs font-medium tracking-[0.05em] px-4 py-2 border border-border text-muted"
            @click="showCategorySheet = true"
          >更多 ↓</button>
        </div>

        <!-- 桌機：全部換行 -->
        <div class="hidden sm:flex flex-wrap gap-2">
          <button
            class="text-xs font-medium tracking-[0.05em] px-4 py-1.5 border transition-colors duration-200"
            :class="activeCategory === '' ? 'bg-ink text-cream border-ink' : 'bg-cream text-ink border-border hover:border-ink'"
            @click="selectCategory('')"
          >全部</button>
          <button
            v-for="cat in categories"
            :key="cat.slug"
            class="text-xs font-medium tracking-[0.05em] px-4 py-1.5 border capitalize transition-colors duration-200"
            :class="activeCategory === cat.slug ? 'bg-ink text-cream border-ink' : 'bg-cream text-ink border-border hover:border-ink'"
            @click="selectCategory(cat.slug)"
          >{{ cat.name }}</button>
        </div>
      </div>

      <!-- 手機分類 Bottom Sheet -->
      <CategorySheet
        v-model="showCategorySheet"
        :categories="categories"
        :active-category="activeCategory"
        @select="selectCategory"
      />

      <!-- 載入中 skeleton -->
      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        <div v-for="n in 8" :key="n" class="animate-pulse bg-border aspect-[3/4]" />
      </div>

      <!-- 錯誤 -->
      <p v-else-if="error" class="text-red-700 text-sm">{{ error }}</p>

      <!-- 無結果 -->
      <p v-else-if="products.length === 0" class="text-muted text-sm">找不到符合的商品。</p>

      <!-- 商品格 -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        <ProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
        />
      </div>

      <!-- 載入更多 spinner -->
      <p v-if="loadingMore" class="text-center text-muted text-sm py-6">載入中...</p>

      <!-- 哨兵：進入畫面時觸發載入更多 -->
      <div ref="sentinel" class="h-1" />

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import ProductCard from '@/components/ProductCard.vue'
import CategorySheet from '@/components/CategorySheet.vue'
import { useProductList } from '@/composables/useProductList'
import { useIntersectionObserver } from '@/composables/useIntersectionObserver'

const route = useRoute()
const router = useRouter()
const { products, categories, loading, loadingMore, error, hasMore, fetchProducts, fetchCategories, fetchProductsByCategory, fetchSearchProducts, loadMore } = useProductList()
const { sentinel } = useIntersectionObserver(
  () => {
    if (hasMore.value) loadMore(activeCategory.value || undefined)
  },
  { rootMargin: '100px' }
)

const activeCategory = ref('')              // 目前選中的分類 slug，空字串表示「全部」
const searchQuery = ref('')                 // 搜尋框的輸入值
const showCategorySheet = ref(false)        // 控制手機版分類 bottom sheet 的開關

// 點選分類標籤
const selectCategory = (slug: string) => {
  searchQuery.value = ''
  router.replace({ query: slug ? { category: slug } : {} })
}

// 依分類載入商品，無分類則載入全部
const loadByCategory = async (cat: string | undefined) => {
  activeCategory.value = cat ?? ''
  if (cat) {
    await fetchProductsByCategory(cat)
  } else {
    await fetchProducts()
  }
}

// 同頁切換 query 時（分類標籤點選）重新載入
onBeforeRouteUpdate((to) => {
  loadByCategory(to.query.category as string | undefined)
})

// 按 Enter 才搜尋，搜尋時清空分類
const doSearch = () => {
  const val = searchQuery.value.trim()
  if (val) {
    activeCategory.value = ''
    router.replace({ query: {} })
    fetchSearchProducts(val)
  } else {
    fetchProducts()
  }
}

onMounted(async () => {
  fetchCategories()
  await loadByCategory(route.query.category as string | undefined)
})
</script>
