import { storeToRefs } from 'pinia'
import { useCartStore } from '@/stores/cart'

export function useCart() {
  const cart = useCartStore()
  const { items, totalPrice, itemCount } = storeToRefs(cart)
  const { addItem, removeItem, updateQuantity, clearCart } = cart

  return {
    items,
    totalPrice,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  }
}
