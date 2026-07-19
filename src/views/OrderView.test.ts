import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import OrderView from './OrderView.vue'

// 可控的購物車狀態
const cart = vi.hoisted(() => ({ clearCart: vi.fn() }))
const items = vi.hoisted(() => ({ value: [] as unknown[] }))

vi.mock('@/composables/useCart', () => ({
  useCart: () => ({
    items: ref(items.value),
    totalPrice: ref(
      (items.value as { price: number; quantity: number }[]).reduce((s, i) => s + i.price * i.quantity, 0)
    ),
    clearCart: cart.clearCart,
  }),
}))

const mockItems = [
  { id: 1, title: 'A', price: 100, image: '', quantity: 2 },
  { id: 2, title: 'B', price: 50, image: '', quantity: 1 },
]

const mountView = () =>
  mount(OrderView, {
    global: { stubs: { Navbar: true, RouterLink: true } },
  })

beforeEach(() => {
  items.value = mockItems.map((i) => ({ ...i }))
  cart.clearCart.mockClear()
})

describe('OrderView 訂單摘要', () => {
  it('未送出時顯示商品列表與各項小計', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('訂單確認')
    expect(wrapper.text()).toContain('A')
    expect(wrapper.text()).toContain('單價 $100.00 × 2')
    expect(wrapper.text()).toContain('$200.00') // A 小計
  })

  it('顯示訂單總計', () => {
    const wrapper = mountView()
    // 100*2 + 50*1 = 250
    expect(wrapper.text()).toContain('$250.00')
  })
})

describe('OrderView 送出訂單', () => {
  it('點擊確認送出會清空購物車並切到成功畫面', async () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('訂單確認')

    await wrapper.get('button').trigger('click')

    expect(cart.clearCart).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('訂單已送出')
    expect(wrapper.text()).not.toContain('確認送出')
  })
})
