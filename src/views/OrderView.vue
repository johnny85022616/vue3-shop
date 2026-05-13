<template>
  <div class="min-h-screen bg-cream">
    <Navbar />

    <div class="max-w-4xl mx-auto px-8 py-16">

      <!-- 訂單已送出：成功畫面 -->
      <div v-if="submitted" class="text-center py-24">
        <div class="inline-flex items-center justify-center w-16 h-16 border border-gold mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="font-display text-2xl font-semibold text-ink mb-3">訂單已送出</h2>
        <p class="text-sm text-muted mb-8">感謝您的購買，我們將盡快為您處理。</p>
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-sm font-medium tracking-[0.05em] text-ink border border-ink px-6 py-2.5 hover:bg-ink hover:text-cream transition-colors duration-200"
        >
          返回首頁
        </RouterLink>
      </div>

      <!-- 訂單摘要 -->
      <template v-else>
        <!-- 頁面標題 -->
        <div class="flex items-baseline gap-5 mb-10">
          <span class="text-[0.7rem] font-medium tracking-[0.2em] text-gold border border-gold py-[0.2rem] px-[0.6rem]">
            ORDER
          </span>
          <h1 class="font-display text-[2rem] font-semibold text-ink">訂單確認</h1>
        </div>

        <!-- 商品列表 -->
        <div class="divide-y divide-border border-t border-border">
          <div
            v-for="item in items"
            :key="item.id"
            class="flex items-center gap-5 py-5"
          >
            <div class="w-16 h-16 flex-shrink-0 bg-white border border-border flex items-center justify-center">
              <img
                :src="item.image"
                :alt="item.title"
                class="w-full h-full object-contain p-2"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-ink leading-snug line-clamp-1">{{ item.title }}</p>
              <p class="text-xs text-muted mt-1">單價 ${{ item.price.toFixed(2) }} × {{ item.quantity }}</p>
            </div>
            <p class="text-sm font-medium text-ink flex-shrink-0">
              ${{ (item.price * item.quantity).toFixed(2) }}
            </p>
          </div>
        </div>

        <!-- 總計 -->
        <div class="mt-6 flex flex-col sm:flex-row sm:justify-end">
          <div class="sm:w-72">
            <div class="h-px bg-border mb-4" />
            <div class="flex justify-between text-base font-semibold text-ink mb-8">
              <span>訂單總計</span>
              <span>${{ totalPrice.toFixed(2) }}</span>
            </div>

            <button
              class="w-full bg-ink text-cream text-sm font-medium tracking-[0.05em] py-[0.9rem] px-8 hover:bg-gold transition-colors duration-[250ms]"
              @click="handleSubmit"
            >
              確認送出
            </button>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import { useCart } from '@/composables/useCart'

const router = useRouter()
const { items, totalPrice, clearCart } = useCart()
const submitted = ref(false)

onMounted(() => {
  if (items.value.length === 0) {
    router.replace('/cart')
  }
})

function handleSubmit() {
  clearCart()
  submitted.value = true
}
</script>
