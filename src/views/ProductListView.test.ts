import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ProductListView from './ProductListView.vue'

// useProductList 的可控狀態
const store = vi.hoisted(() => ({
  products: [] as unknown[],
  categories: [] as unknown[],
  loading: false,
  loadingMore: false,
  error: null as string | null,
  hasMore: false,
  fetchProducts: vi.fn(),
  fetchCategories: vi.fn(),
  fetchProductsByCategory: vi.fn(),
  fetchSearchProducts: vi.fn(),
  loadMore: vi.fn(),
}))
const routerApi = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }))
const route = vi.hoisted(() => ({ query: {} as Record<string, unknown> }))

vi.mock('@/composables/useProductList', async () => {
  const { ref } = await import('vue')
  return {
    useProductList: () => ({
      products: ref(store.products),
      categories: ref(store.categories),
      loading: ref(store.loading),
      loadingMore: ref(store.loadingMore),
      error: ref(store.error),
      hasMore: ref(store.hasMore),
      fetchProducts: store.fetchProducts,
      fetchCategories: store.fetchCategories,
      fetchProductsByCategory: store.fetchProductsByCategory,
      fetchSearchProducts: store.fetchSearchProducts,
      loadMore: store.loadMore,
    }),
  }
})

vi.mock('@/composables/useIntersectionObserver', async () => {
  const { ref } = await import('vue')
  return { useIntersectionObserver: () => ({ sentinel: ref(null) }) }
})

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => routerApi,
  onBeforeRouteUpdate: () => {},
}))

const categories = [
  { slug: 'a', name: 'Cat A', url: '' },
  { slug: 'b', name: 'Cat B', url: '' },
]
const products = [
  { id: 1, title: 'P1', price: 10, rating: 4, thumbnail: '', category: 'a', description: '', images: [] },
  { id: 2, title: 'P2', price: 20, rating: 4, thumbnail: '', category: 'a', description: '', images: [] },
]

const mountView = async () => {
  const wrapper = mount(ProductListView, {
    global: { stubs: { Navbar: true, ProductCard: true, CategorySheet: true, RouterLink: true } },
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  store.products = []
  store.categories = categories
  store.loading = false
  store.loadingMore = false
  store.error = null
  store.hasMore = false
  route.query = {}
  Object.values(routerApi).forEach((fn) => fn.mockClear())
  ;[store.fetchProducts, store.fetchCategories, store.fetchProductsByCategory, store.fetchSearchProducts, store.loadMore].forEach((f) => f.mockClear())
})

describe('ProductListView 四種顯示狀態', () => {
  it('loading 時顯示 skeleton', async () => {
    store.loading = true
    const wrapper = await mountView()
    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('error 時顯示錯誤訊息', async () => {
    store.error = '出錯了'
    const wrapper = await mountView()
    expect(wrapper.find('.text-red-700').text()).toBe('出錯了')
  })

  it('無商品時顯示找不到提示', async () => {
    store.products = []
    const wrapper = await mountView()
    expect(wrapper.text()).toContain('找不到符合的商品')
  })

  it('有商品時渲染 ProductCard', async () => {
    store.products = products
    const wrapper = await mountView()
    expect(wrapper.findAllComponents({ name: 'ProductCard' })).toHaveLength(2)
  })
})

describe('ProductListView 分類標籤', () => {
  it('依 route.query.category 標示 active 分類', async () => {
    route.query = { category: 'a' }
    const wrapper = await mountView()
    const catA = wrapper.findAll('button').filter((b) => b.text() === 'Cat A')[0]
    expect(catA.classes()).toContain('bg-ink')
  })

  it('點分類呼叫 router.replace 帶 category query', async () => {
    const wrapper = await mountView()
    const catB = wrapper.findAll('button').filter((b) => b.text() === 'Cat B')[0]
    await catB.trigger('click')
    expect(routerApi.replace).toHaveBeenCalledWith({ query: { category: 'b' } })
  })

  it('點「全部」呼叫 router.replace 清空 query', async () => {
    const wrapper = await mountView()
    const all = wrapper.findAll('button').filter((b) => b.text() === '全部')[0]
    await all.trigger('click')
    expect(routerApi.replace).toHaveBeenCalledWith({ query: {} })
  })

  it('手機版分類標籤只取前 5 個', async () => {
    store.categories = Array.from({ length: 8 }, (_, i) => ({ slug: `s${i}`, name: `C${i}`, url: '' }))
    const wrapper = await mountView()
    // 手機容器：overflow-x-auto，內含「全部」+ 前5個 + 「更多 ↓」
    const mobileBar = wrapper.find('.overflow-x-auto')
    const labels = mobileBar.findAll('button').map((b) => b.text())
    expect(labels).toContain('更多 ↓')
    expect(labels.filter((l) => l.startsWith('C'))).toHaveLength(5)
  })
})

describe('ProductListView 搜尋', () => {
  it('輸入內容按 Enter → 清 query 並呼叫 fetchSearchProducts', async () => {
    const wrapper = await mountView()
    const input = wrapper.get('input')
    await input.setValue('  phone  ')
    await input.trigger('keyup.enter')

    expect(routerApi.replace).toHaveBeenCalledWith({ query: {} })
    expect(store.fetchSearchProducts).toHaveBeenCalledWith('phone')
  })

  it('空字串按 Enter → 改呼叫 fetchProducts', async () => {
    const wrapper = await mountView()
    const input = wrapper.get('input')
    await input.setValue('   ')
    await input.trigger('keyup.enter')

    expect(store.fetchSearchProducts).not.toHaveBeenCalled()
    expect(store.fetchProducts).toHaveBeenCalled()
  })
})
