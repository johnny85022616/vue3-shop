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

    <!-- 分類商品 -->
    <section class="max-w-6xl mx-auto px-8 pt-16 pb-24">
      <div class="flex items-baseline gap-5 mb-12">
        <span class="text-[0.7rem] font-medium tracking-[0.2em] text-gold border border-gold py-[0.2rem] px-[0.6rem]">
          CATEGORIES
        </span>
        <h2 class="font-display text-[2rem] font-semibold text-ink">商品分類</h2>
      </div>

      <!-- 載入分類中 -->
      <div v-if="loading" class="space-y-20">
        <div v-for="n in 3" :key="n">
          <div class="h-6 w-32 bg-border animate-pulse rounded mb-8" />
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div v-for="m in 6" :key="m" class="aspect-[3/4] bg-border animate-pulse rounded" />
          </div>
        </div>
      </div>

      <!-- 錯誤 -->
      <p v-else-if="error" class="text-red-700 text-sm">{{ error }}</p>

      <!-- 每個分類各自 lazy load -->
      <div v-else>
        <CategorySection
          v-for="category in categories"
          :key="category.slug"
          :category="category"
        />
      </div>
    </section>

    <!-- 底部裝飾帶 -->
    <div class="bg-ink text-cream text-xs tracking-[0.1em] py-3 whitespace-nowrap overflow-hidden opacity-85 text-center">
      <span v-for="n in 6" :key="n">精選好物 &nbsp;·&nbsp; </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import Navbar from '@/components/Navbar.vue'
import CategorySection from '@/components/CategorySection.vue'
import { useProductList } from '@/composables/useProductList'

// 首頁只載分類，載入中狀態就看分類那支（商品由各 CategorySection 自己載）
const { categories, categoriesLoading: loading, error, fetchCategories } = useProductList()

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

