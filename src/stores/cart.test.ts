import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Product } from '@/types/product'
import { useCartStore } from './cart'

// 判定:unit｜測試:src/stores/cart.test.ts
// 層級：純邏輯 unit（e2e skill 決策表）——store 的 action/getter 皆同步、無網路請求，
// 直接呼叫、斷言 state，不 mount 任何元件。localStorage 由 jsdom 提供。
// 對應 capability：cart（openspec/specs/cart/spec.md）。

// 建一筆最小可用的 Product（addItem 需要 quantity）
function makeProduct(overrides: Partial<Product> & { quantity?: number } = {}) {
  return {
    id: 1,
    title: '測試商品',
    description: 'desc',
    category: 'misc',
    price: 100,
    rating: 4,
    thumbnail: 'https://example.com/thumb.png',
    images: ['https://example.com/1.png'],
    quantity: 1,
    ...overrides,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

// Requirement: 加入商品時的合併規則
describe('加入商品時的合併規則', () => {
  // Scenario: 加入新商品
  it('加入新商品：新增一筆，數量為 N，總金額更新', () => {
    const cart = useCartStore()
    cart.addItem(makeProduct({ id: 1, price: 100, quantity: 3 }))

    expect(cart.items).toHaveLength(1)
    expect(cart.items[0]).toMatchObject({ id: 1, quantity: 3 })
    expect(cart.totalPrice).toBe(300)
  })

  // Scenario: 加入已存在的商品
  it('加入已存在商品：累加數量，不新增重複項目，總金額更新', () => {
    const cart = useCartStore()
    cart.addItem(makeProduct({ id: 1, price: 100, quantity: 2 }))
    cart.addItem(makeProduct({ id: 1, price: 100, quantity: 3 }))

    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].quantity).toBe(5)
    expect(cart.totalPrice).toBe(500)
  })

  it('加入時把 product.thumbnail 映射為購物車項目的 image', () => {
    const cart = useCartStore()
    cart.addItem(makeProduct({ id: 1, thumbnail: 'https://example.com/t.png' }))

    expect(cart.items[0].image).toBe('https://example.com/t.png')
  })
})

// Requirement: 調整商品數量（store 層邏輯；UI 觸發見 CartView.test.ts）
describe('調整商品數量', () => {
  // Scenario: 增加數量（store 層：updateQuantity 設為正值）
  it('updateQuantity 設為正值：更新為該值，總金額即時更新', () => {
    const cart = useCartStore()
    cart.addItem(makeProduct({ id: 1, price: 100, quantity: 1 }))
    cart.updateQuantity(1, 4)

    expect(cart.items[0].quantity).toBe(4)
    expect(cart.totalPrice).toBe(400)
  })

  // Scenario: 減少數量至零（store 層：updateQuantity ≤ 0 視為移除）
  it('updateQuantity ≤ 0：該商品從購物車移除', () => {
    const cart = useCartStore()
    cart.addItem(makeProduct({ id: 1, quantity: 1 }))
    cart.updateQuantity(1, 0)

    expect(cart.items.find((i) => i.id === 1)).toBeUndefined()
    expect(cart.items).toHaveLength(0)
  })
})

// Requirement: 移除商品
describe('移除商品', () => {
  // Scenario: 點擊移除（store 層：removeItem）
  it('removeItem：移除指定商品，其餘保留，總金額更新', () => {
    const cart = useCartStore()
    cart.addItem(makeProduct({ id: 1, price: 100, quantity: 1 }))
    cart.addItem(makeProduct({ id: 2, price: 50, quantity: 1 }))
    cart.removeItem(1)

    expect(cart.items.map((i) => i.id)).toEqual([2])
    expect(cart.totalPrice).toBe(50)
  })

  it('clearCart：清空所有商品', () => {
    const cart = useCartStore()
    cart.addItem(makeProduct({ id: 1 }))
    cart.addItem(makeProduct({ id: 2 }))
    cart.clearCart()

    expect(cart.items).toHaveLength(0)
  })
})

// Requirement: 顯示購物車內容（總金額計算；顯示層見 CartView.test.ts）
describe('金額與數量計算', () => {
  it('totalPrice：所有商品 單價×數量 加總', () => {
    const cart = useCartStore()
    cart.addItem(makeProduct({ id: 1, price: 100, quantity: 2 }))
    cart.addItem(makeProduct({ id: 2, price: 50, quantity: 3 }))

    expect(cart.totalPrice).toBe(100 * 2 + 50 * 3)
  })

  it('itemCount：所有商品數量加總', () => {
    const cart = useCartStore()
    cart.addItem(makeProduct({ id: 1, quantity: 2 }))
    cart.addItem(makeProduct({ id: 2, quantity: 3 }))

    expect(cart.itemCount).toBe(5)
  })
})

// Requirement: 購物車狀態持久化（localStorage 寫入；重整還原見 cart.spec.ts e2e）
describe('localStorage 持久化', () => {
  // Scenario: 加入商品後寫入
  it('加入商品後：localStorage 更新為包含該商品', async () => {
    const cart = useCartStore()
    cart.addItem(makeProduct({ id: 1, quantity: 2 }))
    await nextTick()

    const saved = JSON.parse(localStorage.getItem('cart') || '[]')
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ id: 1, quantity: 2 })
  })

  // Scenario: 調整數量後寫入
  it('調整數量後：localStorage 中該商品數量更新為最新值', async () => {
    const cart = useCartStore()
    cart.addItem(makeProduct({ id: 1, quantity: 1 }))
    cart.updateQuantity(1, 5)
    await nextTick()

    const saved = JSON.parse(localStorage.getItem('cart') || '[]')
    expect(saved[0].quantity).toBe(5)
  })

  // Scenario: 移除或清空後寫入（移除單一）
  it('移除商品後：localStorage 同步移除該商品', async () => {
    const cart = useCartStore()
    cart.addItem(makeProduct({ id: 1 }))
    cart.addItem(makeProduct({ id: 2 }))
    cart.removeItem(1)
    await nextTick()

    const saved = JSON.parse(localStorage.getItem('cart') || '[]')
    expect(saved.map((i: { id: number }) => i.id)).toEqual([2])
  })

  // Scenario: 移除或清空後寫入（清空）
  it('清空購物車後：localStorage 變為空陣列', async () => {
    const cart = useCartStore()
    cart.addItem(makeProduct({ id: 1 }))
    cart.clearCart()
    await nextTick()

    const saved = JSON.parse(localStorage.getItem('cart') || 'null')
    expect(saved).toEqual([])
  })

  // Scenario: 重整頁面（store 初始化端：新 store 從 localStorage 讀回；
  // 真實瀏覽器 reload 的整合驗證在 cart.spec.ts e2e）
  it('初始化：新 store 從 localStorage 讀回購物車', () => {
    localStorage.setItem(
      'cart',
      JSON.stringify([{ id: 7, title: 'X', price: 10, image: 'x.png', quantity: 4 }]),
    )

    setActivePinia(createPinia())
    const cart = useCartStore()

    expect(cart.items).toHaveLength(1)
    expect(cart.items[0]).toMatchObject({ id: 7, quantity: 4 })
  })

  it('localStorage 資料損毀時還原為空、不拋錯', () => {
    localStorage.setItem('cart', '{ not valid json')

    setActivePinia(createPinia())
    const cart = useCartStore()

    expect(cart.items).toEqual([])
  })
})
