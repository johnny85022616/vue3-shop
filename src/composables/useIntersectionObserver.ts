import { ref, onMounted, onUnmounted } from 'vue'

export function useIntersectionObserver(callback: () => void , options: IntersectionObserverInit = {}) {
  let observer: IntersectionObserver | null = null
  const sentinel = ref<HTMLElement | null>(null)

  onMounted(() => {
    observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        callback()
      }
    }, options)

    if (sentinel.value) observer.observe(sentinel.value)
  })

  onUnmounted(() => {
    observer?.disconnect()
  })
  
  return { sentinel }
}