import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import CartView from './CartView.vue'

const api = vi.hoisted(() => ({
  removeItem: vi.fn(),
  updateQuantity: vi.fn(),
}))
const items = vi.hoisted(() => ({ value: [] as unknown[] }))

vi.mock('@/composables/useCart', () => ({
  useCart: () => ({
    items: ref(items.value),
    totalPrice: ref(
      (items.value as { price: number; quantity: number }[]).reduce((s, i) => s + i.price * i.quantity, 0)
    ),
    removeItem: api.removeItem,
    updateQuantity: api.updateQuantity,
  }),
}))

const mockItems = [{ id: 1, title: 'A', price: 100, image: '', quantity: 2 }]

const mountView = () =>
  mount(CartView, {
    global: { stubs: { Navbar: true, RouterLink: true } },
  })

beforeEach(() => {
  items.value = mockItems.map((i) => ({ ...i }))
  api.removeItem.mockClear()
  api.updateQuantity.mockClear()
})

describe('CartView 空購物車', () => {
  it('items 為空時顯示空購物車提示', () => {
    items.value = []
    const wrapper = mountView()
    expect(wrapper.text()).toContain('購物車是空的')
  })
})

describe('CartView 商品列表', () => {
  it('顯示商品單價、小計與總計（.toFixed(2)）', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('$100.00') // 單價
    expect(wrapper.text()).toContain('$200.00') // 小計 & 總計 100*2
  })

  it('點刪除呼叫 removeItem 帶商品 id', async () => {
    const wrapper = mountView()
    // 桌機版刪除鈕（最後一顆 button）
    const buttons = wrapper.findAll('button')
    await buttons[buttons.length - 1].trigger('click')
    expect(api.removeItem).toHaveBeenCalledWith(1)
  })
})

describe('CartView 數量增減', () => {
  it('increaseQty：+ 鈕呼叫 updateQuantity(id, qty+1)', async () => {
    const wrapper = mountView()
    const plus = wrapper.findAll('button').filter((b) => b.text() === '+')
    await plus[0].trigger('click')
    expect(api.updateQuantity).toHaveBeenCalledWith(1, 3)
  })

  it('decreaseQty：− 鈕呼叫 updateQuantity(id, qty-1)', async () => {
    const wrapper = mountView()
    const minus = wrapper.findAll('button').filter((b) => b.text() === '−')
    await minus[0].trigger('click')
    expect(api.updateQuantity).toHaveBeenCalledWith(1, 1)
  })
})
