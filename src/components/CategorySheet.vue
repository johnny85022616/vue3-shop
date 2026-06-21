<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" @click="$emit('update:modelValue', false)">
        <!-- Sheet 本體 -->
        <div class="sheet-body bg-cream px-6 pt-5 pb-10 rounded-t-2xl max-h-[70vh] overflow-y-auto" @click.stop>
          <!-- 標題列 -->
          <div class="flex items-center justify-between mb-5">
            <span class="text-sm font-semibold text-ink tracking-[0.05em]">選擇分類</span>
            <button
              class="text-muted hover:text-ink transition-colors duration-200 text-lg leading-none"
              @click="$emit('update:modelValue', false)"
            >✕</button>
          </div>

          <!-- 分類 chips -->
          <div class="flex flex-wrap gap-2">
            <button
              class="text-xs font-medium tracking-[0.05em] px-4 py-2 border transition-colors duration-200"
              :class="activeCategory === '' ? 'bg-ink text-cream border-ink' : 'bg-cream text-ink border-border'"
              @click="select('')"
            >全部</button>
            <button
              v-for="cat in categories"
              :key="cat.slug"
              class="text-xs font-medium tracking-[0.05em] px-4 py-2 border capitalize transition-colors duration-200"
              :class="activeCategory === cat.slug ? 'bg-ink text-cream border-ink' : 'bg-cream text-ink border-border'"
              @click="select(cat.slug)"
            >{{ cat.name }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Category } from '@/types/product'

defineProps<{
  modelValue: boolean      // 控制 sheet 開關（v-model）
  categories: Category[]  // 所有分類清單
  activeCategory: string  // 目前選中的分類 slug，空字串表示「全部」
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]  // 用於 v-model 綁定
  select: [string]                // 點選分類時觸發，傳出 slug
}>()

const select = (slug: string) => {
  emit('select', slug)
  emit('update:modelValue', false)
}
</script>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s ease;
}
.sheet-enter-active .sheet-body,
.sheet-leave-active .sheet-body {
  transition: transform 0.25s ease;
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from .sheet-body {
  transform: translateY(100%);
}
.sheet-leave-to .sheet-body {
  transform: translateY(100%);
}
</style>
