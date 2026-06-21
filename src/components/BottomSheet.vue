<template>
  <Teleport to="body">
    <Transition name="sheet">
      <!-- 遮罩層 -->
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
        @click="$emit('update:modelValue', false)"
      >
        <div class="sheet-body bg-cream px-6 pt-5 pb-10 rounded-t-2xl max-h-[70vh] overflow-y-auto" @click.stop>
          <!-- 標題列 -->
          <div class="flex items-center justify-between mb-5">
            <span class="text-sm font-semibold text-ink tracking-[0.05em]">{{ title }}</span>
            <button
              class="text-muted hover:text-ink transition-colors duration-200 text-lg leading-none"
              @click="$emit('update:modelValue', false)"
            >✕</button>
          </div>

          <!-- 外部傳入的內容 -->
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean  // 控制 sheet 開關（v-model）
  title?: string       // sheet 標題
}>()

defineEmits<{
  'update:modelValue': [boolean]
}>()
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
