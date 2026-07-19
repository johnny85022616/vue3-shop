import { describe, test, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from './cart'

// 測試用假商品
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

describe('useCartStore', () => {
  // 每個測試前建立全新的 Pinia，避免測試之間互相污染
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  // 覆蓋 line 14–16（initializeCart 讀取 localStorage 正確資料）
  test('初始化時應從 localStorage 載入購物車', () => {
    localStorage.setItem('cart', JSON.stringify([
      { id: 1, title: 'Test', price: 100, image: '', quantity: 2 }
    ]))
    const cart = useCartStore()

    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].quantity).toBe(2)
  })

  // 覆蓋 line 17–18（initializeCart 的 catch 分支）
  test('localStorage 格式錯誤時 items 應為空', () => {
    localStorage.setItem('cart', 'invalid json')
    const cart = useCartStore()

    expect(cart.items).toHaveLength(0)
  })

  // 覆蓋 line 37–49（addItem 新增商品分支）
  test('加入商品後 items 應有一筆資料', () => {
    const cart = useCartStore()
    cart.addItem(mockProduct)

    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].title).toBe('Test Product')
  })

  // 覆蓋 line 37–39（addItem 累加數量分支）
  test('加入相同商品應累加數量', () => {
    const cart = useCartStore()
    cart.addItem(mockProduct)
    cart.addItem({ ...mockProduct, quantity: 2 })

    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].quantity).toBe(3)
  })

  // 覆蓋 line 47（新增時 quantity 為 0/undefined 時 fallback 為 1）
  test('新增商品未給 quantity 時預設為 1', () => {
    const cart = useCartStore()
    cart.addItem({ ...mockProduct, quantity: 0 })

    expect(cart.items[0].quantity).toBe(1)
  })

  // 覆蓋 line 39（累加時 quantity 為 0/undefined 時 fallback 為 1）
  test('累加商品未給 quantity 時預設加 1', () => {
    const cart = useCartStore()
    cart.addItem(mockProduct)
    cart.addItem({ ...mockProduct, quantity: 0 })

    expect(cart.items[0].quantity).toBe(2)
  })

  // 覆蓋 line 52–54（removeItem）
  test('移除商品後 items 應為空', () => {
    const cart = useCartStore()
    cart.addItem(mockProduct)
    cart.removeItem(1)

    expect(cart.items).toHaveLength(0)
  })

  // 覆蓋 line 57–62（updateQuantity 正常更新數量）
  test('updateQuantity 應正確更新數量', () => {
    const cart = useCartStore()
    cart.addItem({...mockProduct,quantity: 2})
    cart.updateQuantity(1, 1)
    expect(cart.items[0].quantity).toBe(1)
  })

  // 覆蓋 line 59–60（updateQuantity 數量 <= 0 應刪除商品）
  test('updateQuantity 數量為 0 時應刪除商品', () => {
    const cart = useCartStore()
    cart.addItem(mockProduct)
    cart.updateQuantity(1, 0)
    expect(cart.items).toHaveLength(0)
  })

  // 覆蓋 line 57（updateQuantity 找不到商品時 items 不變）
  test('updateQuantity 商品不存在時 items 不變', () => {
    const cart = useCartStore()
    cart.addItem(mockProduct)
    cart.updateQuantity(999, 5)

    expect(cart.items).toHaveLength(1)
  })

  // 覆蓋 line 67–69（clearCart）
  test('clearCart 後 items 應為空', () => {
    const cart = useCartStore()
    cart.addItem(mockProduct)
    cart.clearCart()

    expect(cart.items).toHaveLength(0)
  })

  // 覆蓋 line 72–76（totalPrice computed）
  test('totalPrice 應正確計算', () => {
    const cart = useCartStore()
    cart.addItem({...mockProduct, quantity: 2 })
    expect(cart.totalPrice).toBe(200)
  })

  // 覆蓋 line 78–80（itemCount computed）
  test('itemCount 應正確計算', () => {
    const cart = useCartStore()
    cart.addItem(mockProduct)
    cart.addItem({ ...mockProduct, id: 2, quantity: 3 })

    expect(cart.itemCount).toBe(4)
  })
})
