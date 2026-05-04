import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useCartStore = defineStore('cart', () => {
  // State
  const items = ref([])

  // 初始化：從 localStorage 讀取購物車數據
  const initializeCart = () => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        items.value = JSON.parse(savedCart)
      } catch (e) {
        console.error('Failed to parse cart from localStorage:', e)
        items.value = []
      }
    }
  }

  // 監聽 items 變化，自動寫入 localStorage
  watch(
    items,
    (newItems) => {
      localStorage.setItem('cart', JSON.stringify(newItems))
    },
    { deep: true }
  )

  // Actions
  const addItem = (product) => {
    // 檢查商品是否已存在購物車
    const existingItem = items.value.find((item) => item.id === product.id)

    if (existingItem) {
      // 如果存在，累加數量
      existingItem.quantity += product.quantity || 1
    } else {
      // 如果不存在，新增商品
      items.value.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image || product.thumbnail,
        quantity: product.quantity || 1,
      })
    }
  }

  const removeItem = (productId) => {
    items.value = items.value.filter((item) => item.id !== productId)
  }

  const updateQuantity = (productId, quantity) => {
    const item = items.value.find((item) => item.id === productId)
    if (item) {
      if (quantity <= 0) {
        removeItem(productId)
      } else {
        item.quantity = quantity
      }
    }
  }

  const clearCart = () => {
    items.value = []
  }

  // Computed
  const totalPrice = computed(() => {
    return items.value.reduce((total, item) => {
      return total + item.price * item.quantity
    }, 0)
  })

  const itemCount = computed(() => {
    return items.value.reduce((count, item) => count + item.quantity, 0)
  })

  // 初始化購物車
  initializeCart()

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalPrice,
    itemCount,
  }
})
