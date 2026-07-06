<template>
  <nav class="sticky top-0 z-50 bg-cream">
    <div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">

      <RouterLink to="/" class="no-underline">
        <span class="font-display text-2xl font-semibold text-ink tracking-wide hover:text-gold transition-colors duration-200">
          Vue Shop
        </span>
      </RouterLink>

      <div class="flex items-center gap-4">
        <RouterLink
          to="/"
          class="nav-link"
          :class="{ active: $route.name === 'Home' }"
        >
          首頁
        </RouterLink>
        <RouterLink
          to="/products"
          class="nav-link"
          :class="{ active: $route.name === 'ProductList' }"
        >
          商品列表
        </RouterLink>

        <RouterLink to="/cart" class="relative text-muted hover:text-ink transition-colors duration-200 flex">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-[1.4rem] h-[1.4rem]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span v-if="isLoggedIn && itemCount > 0"
            class="absolute -top-2 -right-2 bg-gold text-white text-[0.65rem] font-semibold rounded-full h-4 min-w-[1rem] flex items-center justify-center px-[3px]"
          >
            {{ itemCount > 99 ? '99+' : itemCount }}
          </span>
        </RouterLink>

        <button
          type="button"
          class="border border-border bg-transparent text-muted text-[0.78rem] tracking-[0.06em] px-[0.7rem] py-[0.38rem] rounded transition-all duration-200 hover:text-ink hover:border-gold"
          @click="handleAuthClick"
        >
          {{ isLoggedIn ? '登出' : '登入' }}
        </button>
      </div>
    </div>
    <div class="h-px bg-border" />
  </nav>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCart } from '@/composables/useCart'
import { clearFaToken, hasFaToken } from '@/utils/auth'

const { itemCount } = useCart()
const route = useRoute()
const router = useRouter()
const isLoggedIn = ref(false)

const syncAuthState = () => { isLoggedIn.value = hasFaToken() }

watch(() => route.fullPath, () => syncAuthState(), { immediate: true })

const handleAuthClick = async () => {
  if (isLoggedIn.value) {
    clearFaToken()
    syncAuthState()
    if (route.meta.requiresAuth) await router.push({ name: 'Home' })
    return
  }
  if (route.name === 'Login') return
  await router.push({ name: 'Login', query: { redirect: route.fullPath } })
}
</script>

<style scoped>
.nav-link {
  font-size: 0.85rem;
  font-weight: 400;
  letter-spacing: 0.05em;
  color: var(--muted);
  text-decoration: none;
  transition: color 0.2s;
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--gold);
  transition: width 0.25s;
}

.nav-link:hover,
.nav-link.active {
  color: var(--ink);
}

.nav-link:hover::after,
.nav-link.active::after {
  width: 100%;
}
</style>
