<template>
  <nav class="navbar">
    <div class="nav-inner">
      <RouterLink to="/" class="nav-logo">
        <span class="logo-main font-display">Vue Shop</span>
      </RouterLink>

      <div class="nav-links">
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

        <RouterLink to="/cart" class="cart-link">
          <svg xmlns="http://www.w3.org/2000/svg" class="cart-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span v-if="isLoggedIn && itemCount > 0" class="cart-badge">
            {{ itemCount > 99 ? '99+' : itemCount }}
          </span>
        </RouterLink>

        <button
          type="button"
          class="auth-btn"
          @click="handleAuthClick"
        >
          {{ isLoggedIn ? '登出' : '登入' }}
        </button>
      </div>
    </div>
    <div class="nav-border" />
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

const syncAuthState = () => {
  isLoggedIn.value = hasFaToken()
}

watch(
  () => route.fullPath,
  () => syncAuthState(),
  { immediate: true }
)

const handleAuthClick = async () => {
  if (isLoggedIn.value) {
    clearFaToken()
    syncAuthState()

    if (route.meta.requiresAuth) {
      await router.push({ name: 'Home' })
    }
    return
  }

  if (route.name === 'Login') {
    return
  }

  await router.push({ name: 'Login', query: { redirect: route.fullPath } })
}
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--cream);
}

.nav-inner {
  max-width: 72rem;
  margin: 0 auto;
  padding: 0 2rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-logo {
  text-decoration: none;
}

.logo-main {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--ink);
  letter-spacing: 0.02em;
  transition: color 0.2s;
}

.logo-main:hover {
  color: var(--gold);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

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

.cart-link {
  position: relative;
  color: var(--muted);
  transition: color 0.2s;
  display: flex;
}

.cart-link:hover {
  color: var(--ink);
}

.cart-icon {
  width: 1.4rem;
  height: 1.4rem;
}

.cart-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--gold);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 600;
  border-radius: 9999px;
  height: 1.1rem;
  min-width: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
}

.auth-btn {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  padding: 0.38rem 0.7rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.auth-btn:hover {
  color: var(--ink);
  border-color: var(--gold);
}

.nav-border {
  height: 1px;
  background: var(--border);
}
</style>
