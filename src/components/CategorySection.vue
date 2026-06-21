<template>
  <section ref="sectionRef" class="mb-20">
    <!-- 分類標題列 -->
    <div class="flex items-baseline justify-between mb-8">
      <h3 class="font-semibold text-xl text-ink capitalize">{{ category.name }}</h3>
      <RouterLink
        :to="{ name: 'ProductList', query: { category: category.slug } }"
        class="text-xs tracking-[0.1em] text-gold border-b border-gold pb-px hover:text-ink hover:border-ink transition-colors"
      >
        查看全部 →
      </RouterLink>
    </div>

    <!-- 骨架載入 -->
    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <div v-for="n in 6" :key="n" class="aspect-[3/4] bg-border animate-pulse rounded" />
    </div>

    <!-- 錯誤 -->
    <p v-else-if="error" class="text-red-600 text-sm">{{ error }}</p>

    <!-- 商品格 -->
    <div v-else-if="products.length" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <ProductCard v-for="product in products" :key="product.id" :product="product" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Category, Product } from '@/types/product'
import { getProductsByCategory } from '@/api/product'
import ProductCard from '@/components/ProductCard.vue'

const props = defineProps<{ category: Category }>()

const sectionRef = ref<HTMLElement | null>(null) // 綁定 section 元素，供 IntersectionObserver 觀察
const products = ref<Product[]>([])              // 該分類的商品列表
const loading = ref(false)                       // 是否正在載入
const error = ref<string | null>(null)           // 錯誤訊息
const hasLoaded = ref(false)                     // 是否已載入過，避免重複打 API

let observer: IntersectionObserver | null = null // 觀察 section 是否進入視窗的實例

const loadProducts = async () => {
  if (hasLoaded.value) return
  hasLoaded.value = true
  loading.value = true
  error.value = null
  try {
    const res = await getProductsByCategory(props.category.slug, { limit: 6 })
    products.value = res.products
  } catch (e) {
    error.value = e instanceof Error ? e.message : '載入失敗'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        loadProducts()
        observer?.disconnect()
      }
    },
    { rootMargin: '200px' }
  )
  if (sectionRef.value) observer.observe(sectionRef.value)
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>
