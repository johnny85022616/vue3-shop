<template>
  <div class="min-h-screen bg-cream">
    <Navbar />

    <div class="max-w-4xl mx-auto px-8 py-16">

      <!-- 頁面標題 -->
      <div class="flex items-baseline gap-5 mb-10">
        <span class="text-[0.7rem] font-medium tracking-[0.2em] text-gold border border-gold py-[0.2rem] px-[0.6rem]">
          CART
        </span>
        <h1 class="font-display text-[2rem] font-semibold text-ink">購物車</h1>
      </div>

      <!-- 空購物車 -->
      <div v-if="items.length === 0" class="text-center py-24">
        <p class="text-muted text-sm mb-6">購物車是空的</p>
        <RouterLink
          to="/products"
          class="inline-flex items-center gap-2 text-sm font-medium tracking-[0.05em] text-ink border border-ink px-6 py-2.5 hover:bg-ink hover:text-cream transition-colors duration-200"
        >
          返回商品列表
        </RouterLink>
      </div>

      <!-- 購物車內容 -->
      <div v-else>
        <!-- 欄位標頭 -->
        <div class="hidden sm:grid grid-cols-[3fr_1fr_1fr_1fr_auto] gap-4 pb-3 border-b border-border text-xs font-medium tracking-[0.1em] text-muted uppercase">
          <span>商品</span>
          <span class="text-right">單價</span>
          <span class="text-center">數量</span>
          <span class="text-right">小計</span>
          <span />
        </div>

        <!-- 商品列表 -->
        <div class="divide-y divide-border">
          <div v-for="item in items" :key="item.id" class="py-6">

            <!-- 手機版 -->
            <div class="sm:hidden flex flex-col gap-4">
              <!-- 第一排：圖片 + 名稱 + 刪除 -->
              <div class="flex items-start gap-4">
                <div class="w-20 h-20 flex-shrink-0 bg-white border border-border flex items-center justify-center">
                  <img :src="item.image" :alt="item.title" class="w-full h-full object-contain p-2" />
                </div>
                <RouterLink :to="`/products/${item.id}`" class="flex-1 text-sm font-medium text-ink leading-snug hover:text-gold transition-colors duration-200 line-clamp-2">
                  {{ item.title }}
                </RouterLink>
                <button aria-label="移除" class="text-muted hover:text-ink transition-colors duration-200 flex-shrink-0" @click="removeItem(item.id)">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <!-- 第二排：單價 + 數量 + 小計 -->
              <div class="flex items-center gap-3">
                <span class="text-sm text-muted">單價 ${{ item.price.toFixed(2) }}</span>
                <div class="flex-1 flex justify-center">
                  <div class="flex items-center border border-border">
                    <button class="w-8 h-8 flex items-center justify-center text-ink hover:bg-border transition-colors duration-200" @click="decreaseQty(item)">−</button>
                    <span class="w-8 text-center text-sm font-medium text-ink">{{ item.quantity }}</span>
                    <button class="w-8 h-8 flex items-center justify-center text-ink hover:bg-border transition-colors duration-200" @click="increaseQty(item)">+</button>
                  </div>
                </div>
                <span class="text-sm font-medium text-ink">${{ (item.price * item.quantity).toFixed(2) }}</span>
              </div>
            </div>

            <!-- 桌機版 -->
            <div class="hidden sm:grid grid-cols-[3fr_1fr_1fr_1fr_auto] gap-4 items-center">
              <div class="flex items-center gap-4">
                <div class="w-20 h-20 flex-shrink-0 bg-white border border-border flex items-center justify-center">
                  <img :src="item.image" :alt="item.title" class="w-full h-full object-contain p-2" />
                </div>
                <RouterLink :to="`/products/${item.id}`" class="text-sm font-medium text-ink leading-snug hover:text-gold transition-colors duration-200 line-clamp-2">
                  {{ item.title }}
                </RouterLink>
              </div>
              <div class="text-sm text-muted text-right">${{ item.price.toFixed(2) }}</div>
              <div class="flex items-center justify-center">
                <div class="flex items-center border border-border">
                  <button class="w-8 h-8 flex items-center justify-center text-ink hover:bg-border transition-colors duration-200" @click="decreaseQty(item)">−</button>
                  <span class="w-8 text-center text-sm font-medium text-ink">{{ item.quantity }}</span>
                  <button class="w-8 h-8 flex items-center justify-center text-ink hover:bg-border transition-colors duration-200" @click="increaseQty(item)">+</button>
                </div>
              </div>
              <div class="text-sm font-medium text-ink text-right">${{ (item.price * item.quantity).toFixed(2) }}</div>
              <button aria-label="移除" class="text-muted hover:text-ink transition-colors duration-200" @click="removeItem(item.id)">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

          </div>
        </div>

        <!-- 總計 & 結帳 -->
        <div class="mt-10 flex flex-col sm:flex-row sm:justify-end gap-6">
          <div class="sm:w-72">
            <div class="flex justify-between text-sm text-muted mb-3">
              <span>商品小計</span>
              <span>${{ totalPrice.toFixed(2) }}</span>
            </div>
            <div class="h-px bg-border mb-3" />
            <div class="flex justify-between text-base font-semibold text-ink mb-6">
              <span>總計</span>
              <span>${{ totalPrice.toFixed(2) }}</span>
            </div>
            <RouterLink
              to="/order"
              class="block text-center bg-ink text-cream text-sm font-medium tracking-[0.05em] py-[0.9rem] px-8 hover:bg-gold transition-colors duration-[250ms]"
            >
              前往結帳
            </RouterLink>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
import { useCart } from '@/composables/useCart'
import type { CartItem } from '@/types/cartItem'

const { items, totalPrice, removeItem, updateQuantity } = useCart()

function decreaseQty(item: CartItem) {
  updateQuantity(item.id, item.quantity - 1)
}

function increaseQty(item: CartItem) {
  updateQuantity(item.id, item.quantity + 1)
}
</script>
