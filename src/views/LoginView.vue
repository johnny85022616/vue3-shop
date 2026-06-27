<template>
  <div class="min-h-screen bg-cream">
    <Navbar />

    <main class="max-w-xl mx-auto px-8 py-20">
      <div class="bg-white border border-border rounded p-8 shadow-sm">
        <p class="text-xs tracking-[0.2em] text-gold uppercase mb-3">Quick Login</p>
        <h1 class="text-3xl font-display text-ink mb-8">會員登入</h1>

        <form class="space-y-5" @submit.prevent="handleLogin">
          <div>
            <label for="username" class="block text-sm text-muted mb-2">帳號</label>
            <input
              id="username"
              type="text"
              v-model="username"
              readonly
              disabled
              class="w-full border border-border bg-[#f7f4ee] text-ink rounded px-3 py-2 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label for="password" class="block text-sm text-muted mb-2">密碼</label>
            <input
              id="password"
              type="password"
              v-model="password"
              readonly
              disabled
              class="w-full border border-border bg-[#f7f4ee] text-ink rounded px-3 py-2 text-sm cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            class="w-full bg-ink text-cream py-2.5 rounded text-sm tracking-[0.06em] hover:bg-gold transition-colors"
          >
            登入
          </button>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import { createRandomToken, setFaToken } from '@/utils/auth'

const router = useRouter()
const route = useRoute()

const username = ref('User01')
const password = ref('Password01')

const redirectPath = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' ? redirect : '/'
})

const handleLogin = async () => {
  setFaToken(createRandomToken())
  await router.push(redirectPath.value)
}
</script>
