import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, RouterLinkStub, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import CategorySection from './CategorySection.vue'

vi.mock('@/api/product', () => ({
  getProductsByCategory: vi.fn(),
}))
import * as api from '@/api/product'

// 假的 IntersectionObserver，保留 callback 供手動觸發「進入視窗」
let lastInstance: FakeObserver | null = null
class FakeObserver {
  callback: IntersectionObserverCallback
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
  takeRecords = vi.fn(() => [])
  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb
    lastInstance = this
  }
  enter() {
    this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
}

const category = { slug: 'electronics', name: 'Electronics', url: '' }
const mockProducts = [
  { id: 1, title: 'A', price: 1, rating: 4, thumbnail: '', category: 'electronics', description: '', images: [] },
  { id: 2, title: 'B', price: 2, rating: 4, thumbnail: '', category: 'electronics', description: '', images: [] },
]

const mountSection = () =>
  mount(CategorySection, {
    props: { category },
    global: {
      stubs: { RouterLink: RouterLinkStub, ProductCard: true },
    },
  })

beforeEach(() => {
  lastInstance = null
  vi.clearAllMocks()
  vi.stubGlobal('IntersectionObserver', FakeObserver as unknown as typeof IntersectionObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('CategorySection', () => {
  it('顯示分類標題，尚未進入視窗前不打 API、不顯示商品/骨架', () => {
    const wrapper = mountSection()
    expect(wrapper.text()).toContain('Electronics')
    expect(api.getProductsByCategory).not.toHaveBeenCalled()
    expect(wrapper.find('.animate-pulse').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'ProductCard' }).exists()).toBe(false)
  })

  it('進入視窗後依 slug 載入該分類商品並渲染商品格', async () => {
    vi.mocked(api.getProductsByCategory).mockResolvedValue({ products: mockProducts, total: 2, skip: 0, limit: 6 })
    const wrapper = mountSection()

    lastInstance!.enter()
    await flushPromises()

    expect(api.getProductsByCategory).toHaveBeenCalledWith('electronics', { limit: 6 })
    expect(wrapper.findAllComponents({ name: 'ProductCard' })).toHaveLength(2)
  })

  it('載入中顯示骨架', async () => {
    let resolve!: (v: unknown) => void
    vi.mocked(api.getProductsByCategory).mockReturnValue(new Promise((r) => { resolve = r }) as never)
    const wrapper = mountSection()

    lastInstance!.enter()
    await nextTick()
    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)

    resolve({ products: mockProducts, total: 2, skip: 0, limit: 6 })
    await flushPromises()
    expect(wrapper.find('.animate-pulse').exists()).toBe(false)
  })

  it('API 失敗時顯示錯誤訊息', async () => {
    vi.mocked(api.getProductsByCategory).mockRejectedValue(new Error('載入炸了'))
    const wrapper = mountSection()

    lastInstance!.enter()
    await flushPromises()

    expect(wrapper.find('.text-red-600').text()).toBe('載入炸了')
  })

  it('非 Error 例外時顯示預設錯誤訊息', async () => {
    vi.mocked(api.getProductsByCategory).mockRejectedValue('boom')
    const wrapper = mountSection()

    lastInstance!.enter()
    await flushPromises()

    expect(wrapper.find('.text-red-600').text()).toBe('載入失敗')
  })

  it('hasLoaded 防止重複觸發打 API 兩次', async () => {
    vi.mocked(api.getProductsByCategory).mockResolvedValue({ products: mockProducts, total: 2, skip: 0, limit: 6 })
    const wrapper = mountSection()

    lastInstance!.enter()
    await flushPromises()
    lastInstance!.enter()
    await flushPromises()

    expect(api.getProductsByCategory).toHaveBeenCalledOnce()
    expect(wrapper.findAllComponents({ name: 'ProductCard' })).toHaveLength(2)
  })
})
