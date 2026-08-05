import { setActivePinia, createPinia } from 'pinia'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { useCartStore } from '@/stores/cart'
import type { CartItem } from '@/types/cartItem'
import CartView from './CartView.vue'

// 判定:unit｜測試:src/views/CartView.test.ts
// 層級：component test（e2e skill 決策表）——mount 單一 view、不跨頁，`trigger` 互動後
// 斷言 DOM/state 結果。掛真 store（不 mock action），驗可觀察結果而非模板接線。
// 對應 capability：cart（openspec/specs/cart/spec.md）。

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 1,
    title: '測試商品',
    price: 100,
    image: 'https://example.com/thumb.png',
    quantity: 1,
    ...overrides,
  }
}

function mountCart(items: CartItem[]) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useCartStore()
  store.items = items

  const wrapper = mount(CartView, {
    global: {
      plugins: [pinia],
      stubs: {
        Navbar: true,
        RouterLink: RouterLinkStub,
      },
    },
  })
  return { wrapper, store }
}

// 依 aria-label 取數量加減鈕（手機版與桌機版各一顆，故同 label 會有多顆）
function qtyButtons(wrapper: ReturnType<typeof mountCart>['wrapper'], sign: '+' | '−') {
  const label = sign === '+' ? '增加數量' : '減少數量'
  return wrapper.findAll(`button[aria-label="${label}"]`)
}

// 移除鈕：以 aria-label 定位（手機版與桌機版各一顆）
function removeButtons(wrapper: ReturnType<typeof mountCart>['wrapper']) {
  return wrapper.findAll('button[aria-label="移除"]')
}

// 目前渲染出的所有連結目的地
function linkTargets(wrapper: ReturnType<typeof mountCart>['wrapper']) {
  return wrapper.findAllComponents(RouterLinkStub).map((l) => l.props('to'))
}

beforeEach(() => {
  localStorage.clear()
})

// Requirement: 顯示購物車內容
describe('顯示購物車內容', () => {
  // Scenario: 購物車有商品（Requirement 列出圖片/名稱/單價/數量/小計/總金額）
  it('有商品：顯示圖片、名稱、單價、數量、小計與總金額', () => {
    const { wrapper } = mountCart([
      makeItem({ id: 1, title: '滑鼠', price: 100, quantity: 2, image: 'https://example.com/mouse.png' }),
      makeItem({ id: 2, title: '鍵盤', price: 50, quantity: 3, image: 'https://example.com/keyboard.png' }),
    ])
    const text = wrapper.text()

    expect(text).toContain('滑鼠')
    expect(text).toContain('鍵盤')
    expect(text).toContain('100.00') // 單價
    expect(text).toContain('200.00') // 滑鼠小計 100*2
    expect(text).toContain('150.00') // 鍵盤小計 50*3
    expect(text).toContain('350.00') // 總金額 200+150
    expect(text).not.toContain('購物車是空的')

    // 圖片：每個商品的 image 都渲染成 <img src>
    const imgSrcs = wrapper.findAll('img').map((i) => i.attributes('src'))
    expect(imgSrcs).toContain('https://example.com/mouse.png')
    expect(imgSrcs).toContain('https://example.com/keyboard.png')

    // 數量：數量數字有顯示（.w-8.text-center 為數量格，排除表頭「數量」欄）
    const qtyCells = wrapper.findAll('.w-8.text-center').map((s) => s.text())
    expect(qtyCells).toContain('2') // 滑鼠
    expect(qtyCells).toContain('3') // 鍵盤
  })

  // Scenario: 購物車為空
  it('空車：顯示「購物車是空的」提示', () => {
    const { wrapper } = mountCart([])

    expect(wrapper.text()).toContain('購物車是空的')
  })
})

// Scenario: 購物車為空 → 返回商品列表連結；有商品 → 前往結帳連結。
// 以「什麼狀態出現什麼連結」的行為來驗，而非只驗靜態 to prop。
describe('依購物車狀態顯示對的導向連結', () => {
  it('空車：出現返回商品列表連結(/products)，不出現結帳連結', () => {
    const { wrapper } = mountCart([])
    const targets = linkTargets(wrapper)

    expect(targets).toContain('/products')
    expect(targets).not.toContain('/order')
  })

  it('有商品：出現前往結帳連結(/order)，不再出現空車返回連結(/products)', () => {
    const { wrapper } = mountCart([makeItem({ id: 1 })])
    const targets = linkTargets(wrapper)

    expect(targets).toContain('/order')
    expect(targets).not.toContain('/products') // 空車返回連結；商品連結是 /products/1，不相等
  })
})

// Requirement: 調整商品數量（UI 觸發）
describe('調整商品數量', () => {
  // Scenario: 增加數量
  it('點「+」：該商品數量加一，總金額即時更新', async () => {
    const { wrapper, store } = mountCart([makeItem({ id: 1, price: 100, quantity: 1 })])

    await qtyButtons(wrapper, '+')[0].trigger('click')

    expect(store.items[0].quantity).toBe(2)
    expect(wrapper.text()).toContain('200.00') // 總金額更新
  })

  // Scenario: 減少數量至零
  it('數量為 1 時點「−」：該商品移除，畫面轉為空車', async () => {
    const { wrapper, store } = mountCart([makeItem({ id: 1, quantity: 1 })])

    await qtyButtons(wrapper, '−')[0].trigger('click')

    expect(store.items).toHaveLength(0)
    expect(wrapper.text()).toContain('購物車是空的')
  })
})

// Requirement: 移除商品
describe('移除商品', () => {
  // Scenario: 點擊移除
  it('點移除按鈕：該商品移除，總金額更新', async () => {
    const { wrapper, store } = mountCart([
      makeItem({ id: 1, title: '滑鼠', price: 100, quantity: 1 }),
      makeItem({ id: 2, title: '鍵盤', price: 50, quantity: 1 }),
    ])

    await removeButtons(wrapper)[0].trigger('click') // 第一顆移除鈕對應 id 1

    expect(store.items.map((i) => i.id)).toEqual([2])
    expect(wrapper.text()).not.toContain('滑鼠')
    expect(wrapper.text()).toContain('50.00') // 總金額剩鍵盤
  })
})
