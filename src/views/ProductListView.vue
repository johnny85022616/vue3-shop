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
          placeholder="搜尋商品..."
          class="w-full sm:w-80 border border-border bg-cream text-ink text-sm px-4 py-2.5 outline-none focus:border-ink transition-colors duration-200 placeholder:text-muted"
        />
      </div>

      <!-- 分類標籤 -->
      <div class="flex flex-wrap gap-2 mb-10">
        <button
          class="text-xs font-medium tracking-[0.05em] px-4 py-1.5 border transition-colors duration-200"
          :class="activeCategory === '' ? 'bg-ink text-cream border-ink' : 'bg-cream text-ink border-border hover:border-ink'"
          @click="selectCategory('')"
        >
          全部
        </button>
        <button
          v-for="cat in categories"
          :key="cat.slug"
          class="text-xs font-medium tracking-[0.05em] px-4 py-1.5 border capitalize transition-colors duration-200"
          :class="activeCategory === cat.slug ? 'bg-ink text-cream border-ink' : 'bg-cream text-ink border-border hover:border-ink'"
          @click="selectCategory(cat.slug)"
        >
          {{ cat.name }}
        </button>
      </div>

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

    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import ProductCard from '@/components/ProductCard.vue'
import { useProductList } from '@/composables/useProductList'

const route = useRoute()
const router = useRouter()
const { products, categories, loading, error, fetchProducts, fetchCategories, fetchProductsByCategory, fetchSearchProducts } = useProductList()

const activeCategory = ref('')
const searchQuery = ref('')

let searchTimer = null

// 點選分類標籤
const selectCategory = (slug) => {
  activeCategory.value = slug
  searchQuery.value = ''
  router.replace({ query: slug ? { category: slug } : {} })
  if (slug) {
    fetchProductsByCategory(slug)
  } else {
    fetchProducts()
  }
}

// 搜尋框 debounce
watch(searchQuery, (val) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (val.trim()) {
      activeCategory.value = ''
      router.replace({ query: {} })
      fetchSearchProducts(val.trim())
    } else {
      fetchProducts()
    }
  }, 400)
})

onMounted(async () => {
  await fetchCategories()
  const cat = route.query.category
  if (cat) {
    activeCategory.value = cat
    fetchProductsByCategory(cat)
  } else {
    fetchProducts()
  }
})
</script>
