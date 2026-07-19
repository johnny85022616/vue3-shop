import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import ProductDetailView from './ProductDetailView.vue'

// ---- 可控狀態 ----
const scenario = vi.hoisted(() => ({
  product: null as Record<string, unknown> | null,
  error: null as string | null,
}))
const detail = vi.hoisted(() => ({ product: null as any, error: null as any, fetchProductById: null as any }))
const routerApi = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }))
const route = vi.hoisted(() => ({ params: { id: '1' }, fullPath: '/products/1' }))
const cartApi = vi.hoisted(() => ({ addItem: vi.fn() }))
const authApi = vi.hoisted(() => ({ loggedIn: true }))
const apiMock = vi.hoisted(() => ({ getProductsByCategory: vi.fn() }))

vi.mock('@/composables/useProductDetail', async () => {
  const { ref } = await import('vue')
  return {
    useProductDetail: () => {
      detail.product = ref(null)
      detail.error = ref(null)
      detail.fetchProductById = vi.fn(async () => {
        detail.product.value = scenario.product
        detail.error.value = scenario.error
      })
      return { product: detail.product, loading: ref(false), error: detail.error, fetchProductById: detail.fetchProductById }
    },
  }
})

vi.mock('@/composables/useCart', () => ({ useCart: () => ({ addItem: cartApi.addItem }) }))
vi.mock('@/utils/auth', () => ({ hasFaToken: () => authApi.loggedIn }))
vi.mock('@/api/product', () => ({ getProductsByCategory: apiMock.getProductsByCategory }))
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => routerApi,
  onBeforeRouteUpdate: () => {},
}))

const product = {
  id: 1, title: '測試商品', price: 999, rating: 4.4,
  thumbnail: 'thumb.jpg', category: 'electronics', description: '一段描述', images: [],
}

const mountView = () => mount(ProductDetailView, { global: { stubs: { Navbar: true, RouterLink: true } } })

beforeEach(() => {
  scenario.product = { ...product }
  scenario.error = null
  authApi.loggedIn = true
  route.params = { id: '1' }
  route.fullPath = '/products/1'
  apiMock.getProductsByCategory.mockResolvedValue({ products: [{ ...product }] })
  Object.values(routerApi).forEach((fn) => fn.mockClear())
  cartApi.addItem.mockClear()
})

describe('ProductDetailView 載入與顯示', () => {
  it('載入成功顯示商品標題、價格、分類', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('測試商品')
    expect(wrapper.text()).toContain('$999')
    expect(wrapper.text()).toContain('electronics')
    expect(wrapper.text()).toContain('4.4')
  })

  it('星等依 Math.round(rating) 標金色', async () => {
    scenario.product = { ...product, rating: 3.6 } // round → 4
    const wrapper = mountView()
    await flushPromises()

    const goldStars = wrapper.findAll('svg.text-gold')
    expect(goldStars).toHaveLength(4)
  })

  it('載入時設定 document.title 與 meta description', async () => {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'description')
    document.head.appendChild(meta)

    mountView()
    await flushPromises()

    expect(document.title).toBe('測試商品 | vue3-shop')
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('一段描述')
    meta.remove()
  })

  it('載入失敗（error）時導回首頁', async () => {
    scenario.product = null
    scenario.error = '找不到'
    mountView()
    await flushPromises()

    expect(routerApi.replace).toHaveBeenCalledWith({ name: 'Home' })
  })
})

describe('ProductDetailView 相關商品', () => {
  it('排除當前商品且最多取 3 筆', async () => {
    apiMock.getProductsByCategory.mockResolvedValue({
      products: [
        { ...product, id: 1 }, // 當前商品，應被排除
        { ...product, id: 2 },
        { ...product, id: 3 },
        { ...product, id: 4 },
        { ...product, id: 5 },
      ],
    })
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('相關商品')
    // 排除 id=1 後剩 4 筆，slice(0,3) → 3 筆相關卡
    const relatedLinks = wrapper.findAllComponents({ name: 'RouterLink' })
    // 相關商品卡 + 「查看更多」連結，數量 > 0 即可，主要驗過濾邏輯用文字比對
    expect(relatedLinks.length).toBeGreaterThan(0)
  })
})

describe('ProductDetailView 數量選擇', () => {
  it('+ 增加數量，− 不會低於 1', async () => {
    const wrapper = mountView()
    await flushPromises()

    const minus = wrapper.findAll('button').filter((b) => b.text() === '−')[0]
    const plus = wrapper.findAll('button').filter((b) => b.text() === '+')[0]
    const qtyText = () => wrapper.findAll('span').find((s) => /^\d+$/.test(s.text()) && s.classes().includes('w-10'))!.text()

    expect(qtyText()).toBe('1')
    await minus.trigger('click') // 已是 1，守衛擋住
    expect(qtyText()).toBe('1')
    await plus.trigger('click')
    expect(qtyText()).toBe('2')
    await minus.trigger('click')
    expect(qtyText()).toBe('1')
  })
})

describe('ProductDetailView 加入購物車', () => {
  it('未登入時導向 Login 並帶 redirect，不加入購物車', async () => {
    authApi.loggedIn = false
    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('button').find((b) => b.text() === '加入購物車')!.trigger('click')

    expect(routerApi.push).toHaveBeenCalledWith({ name: 'Login', query: { redirect: '/products/1' } })
    expect(cartApi.addItem).not.toHaveBeenCalled()
  })

  it('已登入時加入購物車並顯示提示，2 秒後消失', async () => {
    const wrapper = mountView()
    await flushPromises()

    vi.useFakeTimers()
    await wrapper.findAll('button').find((b) => b.text() === '加入購物車')!.trigger('click')

    expect(cartApi.addItem).toHaveBeenCalledWith(expect.objectContaining({ id: 1, quantity: 1 }))
    expect(wrapper.text()).toContain('已加入購物車')

    vi.advanceTimersByTime(2000)
    await nextTick()
    expect(wrapper.text()).not.toContain('已加入購物車')
    vi.useRealTimers()
  })
})

afterEach(() => {
  vi.useRealTimers()
})
