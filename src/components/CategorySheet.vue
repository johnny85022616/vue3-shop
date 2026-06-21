<template>
  <BottomSheet :model-value="modelValue" title="選擇分類" @update:model-value="$emit('update:modelValue', $event)">
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
  </BottomSheet>
</template>

<script setup lang="ts">
import type { Category } from '@/types/product'
import BottomSheet from '@/components/BottomSheet.vue'

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
