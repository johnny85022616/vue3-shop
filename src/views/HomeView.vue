<template>
  <div class="min-h-screen bg-cream">
    <Navbar />

    <!-- Hero -->
    <section class="relative max-w-6xl mx-auto px-8 pt-20 pb-16">
      <div class="flex items-center justify-between gap-8">
        <!-- 文字區 -->
        <div class="flex-1 max-w-[560px]">
          <p class="text-xs font-medium tracking-[0.2em] text-gold uppercase mb-5">
            精選嚴選 · 品味生活
          </p>
          <h1 class="hero-title font-semibold leading-[1.1] text-ink mb-6">
            探索每一件<br /><em class="italic text-gold">值得擁有</em>的好物
          </h1>
          <p class="text-base text-muted leading-[1.7] mb-10 max-w-[400px]">
            從日常必需到精緻配件，為你的生活注入品味
          </p>
          <RouterLink
            to="/products"
            class="group inline-flex items-center gap-3 bg-ink text-cream text-sm font-medium tracking-[0.05em] py-[0.9rem] px-8 no-underline transition-colors duration-[250ms] hover:bg-gold hover:text-white"
          >
            立即探索
            <span class="transition-transform duration-[250ms] group-hover:translate-x-1">→</span>
          </RouterLink>
        </div>

        <!-- 裝飾圓 -->
        <div class="relative w-[260px] h-[260px] shrink-0 hidden md:block">
          <div class="deco-ring absolute inset-0 border border-border rounded-full" />
          <div class="absolute top-1/2 left-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 bg-gold-light rounded-full opacity-[0.15]" />
        </div>
      </div>
      <div class="mt-16 h-px bg-border" />
    </section>

    <!-- 分類 -->
    <section class="max-w-6xl mx-auto px-8 pt-16 pb-24">
      <div class="flex items-baseline gap-5 mb-10">
        <span class="text-[0.7rem] font-medium tracking-[0.2em] text-gold border border-gold py-[0.2rem] px-[0.6rem]">
          CATEGORIES
        </span>
        <h2 class="font-display text-[2rem] font-semibold text-ink">商品分類</h2>
      </div>

      <!-- 載入中 -->
      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border border border-border">
        <div v-for="n in 12" :key="n" class="min-h-[90px] bg-border animate-pulse" />
      </div>

      <!-- 錯誤 -->
      <p v-else-if="error" class="text-red-700 text-sm">{{ error }}</p>

      <!-- 分類卡片 -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border border border-border">
        <button
          v-for="category in categories"
          :key="category.slug"
          class="group flex flex-col items-start justify-between bg-cream p-5 cursor-pointer border-none transition-colors duration-200 text-left min-h-[90px] hover:bg-ink hover:text-cream"
          @click="goToCategory(category.slug)"
        >
          <span class="text-[0.82rem] font-medium capitalize leading-[1.4]">{{ category.name }}</span>
          <span class="text-[0.9rem] opacity-0 transition-opacity duration-200 group-hover:opacity-100">↗</span>
        </button>
      </div>
    </section>

    <!-- 底部裝飾帶 -->
    <div class="bg-ink text-cream text-xs tracking-[0.1em] py-3 whitespace-nowrap overflow-hidden opacity-85 text-center">
      <span v-for="n in 6" :key="n">精選好物 &nbsp;·&nbsp; </span>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import { useProductList } from '@/composables/useProductList'

const router = useRouter()
const { categories, loading, error, fetchCategories } = useProductList()

const goToCategory = (slug) => {
  router.push({ name: 'ProductList', query: { category: slug } })
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
/* clamp 字體無法用 Tailwind 表達 */
.hero-title {
  font-size: clamp(2.8rem, 6vw, 5rem);
}

/* 旋轉動畫 */
.deco-ring {
  animation: spin 24s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

</style>

