import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCart } from './useCart'

const mockProduct = {
  id: 1,
  title: 'Test Product',
  price: 100,
  thumbnail: 'test.jpg',
  quantity: 1,
  description: '',
  category: 'test',
  rating: 4.5,
  images: [],
}

describe('useCart', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('addItem 後 items / itemCount / totalPrice 反映變化', () => {
    const { items, itemCount, totalPrice, addItem } = useCart()

    addItem({ ...mockProduct, quantity: 2 })

    expect(items.value).toHaveLength(1)
    expect(itemCount.value).toBe(2)
    expect(totalPrice.value).toBe(200)
  })

  it('removeItem / updateQuantity / clearCart 皆連動 store', () => {
    const { items, addItem, removeItem, updateQuantity, clearCart } = useCart()

    addItem(mockProduct)
    addItem({ ...mockProduct, id: 2 })
    expect(items.value).toHaveLength(2)

    updateQuantity(1, 5)
    expect(items.value.find((i) => i.id === 1)?.quantity).toBe(5)

    removeItem(2)
    expect(items.value).toHaveLength(1)

    clearCart()
    expect(items.value).toHaveLength(0)
  })

  it('回傳的 refs 具響應性（與底層 store 同步）', () => {
    const { itemCount, addItem } = useCart()
    expect(itemCount.value).toBe(0)
    addItem(mockProduct)
    expect(itemCount.value).toBe(1)
  })
})
