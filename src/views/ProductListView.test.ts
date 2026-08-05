import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Category, Product, ProductListResponse } from '@/types/product'

// 判定:unit｜測試:src/views/ProductListView.test.ts
// 層級：component test（e2e skill 決策表）——mount 單一 view、不跨頁，斷言狀態驅動的
// DOM（skeleton／錯誤／無結果）與互動後結果。網路層用 vi.mock 擋掉，資料面的細節
// （帶什麼參數、hasMore 怎麼算）留在 src/composables/useProductList.test.ts。
// 對應 capability：product-list（openspec/specs/product-list/spec.md）。
//
// 用 memory history 的真 router 掛 router-view，是因為分類切換走的是
// selectCategory → router.replace(query) → onBeforeRouteUpdate → 重新載入 這條線；
// 直接 mount 元件會拿不到 matched route record，onBeforeRouteUpdate 不會觸發。
// 這仍在 jsdom 單頁內，不是跨頁導航，故不升 e2e。

vi.mock('@/api/product', () => ({
  getProducts: vi.fn(),
  getCategories: vi.fn(),
  getProductsByCategory: vi.fn(),
  searchProducts: vi.fn(),
}))

const api = await import('@/api/product')

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    title: '測試商品',
    description: '描述',
    category: 'beauty',
    price: 100,
    rating: 4.5,
    thumbnail: 'https://example.com/1.png',
    images: [],
    ...overrides,
  }
}

function makeRes(products: Product[], total = products.length): ProductListResponse {
  return { products, total, skip: 0, limit: 6 }
}

const CATEGORIES: Category[] = [
  { slug: 'beauty', name: 'Beauty', url: '' },
  { slug: 'furniture', name: 'Furniture', url: '' },
]

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

// 掛在 router-view 底下，讓 onBeforeRouteUpdate 拿得到 matched route record。
// 動態 import view：beforeEach 的 vi.resetModules() 會給出全新的 useProductList 模組
// 實例（module-level 的 categoriesCache 歸零），view 必須在 reset 之後才 import，
// 才會綁到那個乾淨的實例。否則第一個 case 打完分類後快取就一直留著，後面任何需要
// 「fetchCategories 真的有跑」的 case（如「分類先回來、商品還沒回來」）都會被
// 快取短路成空轉，變成恆綠、鎖不住 loading 旗標的回歸。
async function mountView() {
  const { default: ProductListView } = await import('./ProductListView.vue')
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div />' } },
      { path: '/products', name: 'ProductList', component: ProductListView },
      { path: '/products/:id(\\d+)', name: 'ProductDetail', component: { template: '<div />' } },
    ],
  })
  router.push('/products')
  await router.isReady()

  const wrapper = mount(
    { template: '<router-view />' },
    { global: { plugins: [router, createPinia()], stubs: { Navbar: true } } },
  )
  return { wrapper, router }
}

type Wrapper = Awaited<ReturnType<typeof mountView>>['wrapper']

// 分類標籤：手機版與桌機版各渲染一組（CSS 切換顯示），get 取當前的第一顆；找不到即拋錯
function categoryButton(wrapper: Wrapper, name: string) {
  return wrapper.get(`button[aria-label="分類：${name}"]`)
}

function searchInput(wrapper: Wrapper) {
  return wrapper.get('input[aria-label="搜尋商品"]')
}

function isLoading(wrapper: Wrapper) {
  return wrapper.find('[role="status"][aria-label="載入中"]').exists()
}

beforeEach(() => {
  vi.resetModules() // 清掉 useProductList 的 module-level categoriesCache（見 mountView）
  vi.clearAllMocks()
  // jsdom 沒有 IntersectionObserver，哨兵（載入更多）會在 onMounted 就炸
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.mocked(api.getCategories).mockResolvedValue(CATEGORIES)
  vi.mocked(api.getProducts).mockResolvedValue(makeRes([]))
  vi.mocked(api.getProductsByCategory).mockResolvedValue(makeRes([]))
  vi.mocked(api.searchProducts).mockResolvedValue(makeRes([]))
})

// Requirement: 顯示商品列表
describe('顯示商品列表', () => {
  // Scenario: 進入商品列表頁
  it('資料還沒回來時顯示載入中，回來後顯示商品卡片（名稱、價格、評分、圖片）', async () => {
    const pendingProducts = deferred<ProductListResponse>()
    vi.mocked(api.getProducts).mockReturnValue(pendingProducts.promise)

    const { wrapper } = await mountView()

    expect(isLoading(wrapper)).toBe(true)
    expect(wrapper.text()).not.toContain('口紅')

    pendingProducts.resolve(
      makeRes([
        makeProduct({ id: 1, title: '口紅', price: 199, rating: 4.5, thumbnail: 'https://example.com/lipstick.png' }),
        makeProduct({ id: 2, title: '香水', price: 88, rating: 3.2, thumbnail: 'https://example.com/perfume.png' }),
      ], 2),
    )
    await flushPromises()

    expect(isLoading(wrapper)).toBe(false)
    const text = wrapper.text()
    expect(text).toContain('口紅')
    expect(text).toContain('香水')
    expect(text).toContain('199') // 價格
    expect(text).toContain('4.5') // 評分
    const imgSrcs = wrapper.findAll('img').map((i) => i.attributes('src'))
    expect(imgSrcs).toContain('https://example.com/lipstick.png')
    expect(imgSrcs).toContain('https://example.com/perfume.png')
  })

  // Scenario: 分類已回傳但商品仍在載入
  it('分類先回來、商品還沒回來：維持載入中，不閃出「找不到符合的商品」', async () => {
    const pendingProducts = deferred<ProductListResponse>()
    vi.mocked(api.getProducts).mockReturnValue(pendingProducts.promise)
    vi.mocked(api.getCategories).mockResolvedValue(CATEGORIES) // 分類立刻回，商品還吊著

    const { wrapper } = await mountView()
    await flushPromises()

    // tripwire：categories 可能來自 module-level 快取（見 mountView 註解），單看畫面上的
    // 分類標籤無法區分「真的跑完 fetchCategories」與「快取短路早退」。後者不會碰任何
    // loading 旗標，這條 case 就會恆綠。斷言 API 真的被打過，快取洩漏時直接紅。
    expect(api.getCategories).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Beauty') // 分類標籤已渲染＝分類確實回來了
    expect(isLoading(wrapper)).toBe(true)
    expect(wrapper.text()).not.toContain('找不到符合的商品')

    pendingProducts.resolve(makeRes([makeProduct({ id: 1, title: '口紅' })], 1))
    await flushPromises()

    expect(isLoading(wrapper)).toBe(false)
    expect(wrapper.text()).toContain('口紅')
  })

  // Scenario: 商品載入失敗
  it('API 失敗：顯示錯誤訊息，且不顯示商品卡片', async () => {
    vi.mocked(api.getProducts).mockRejectedValue(new Error('伺服器爆了'))

    const { wrapper } = await mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('伺服器爆了')
    expect(isLoading(wrapper)).toBe(false)
    expect(wrapper.text()).not.toContain('找不到符合的商品') // 錯誤優先於無結果提示
  })
})

// Requirement: 依分類篩選商品
describe('依分類篩選商品', () => {
  // Scenario: 選擇分類
  it('點選分類標籤：列表更新為該分類的商品', async () => {
    vi.mocked(api.getProducts).mockResolvedValue(makeRes([makeProduct({ id: 1, title: '全站商品' })], 1))
    vi.mocked(api.getProductsByCategory).mockResolvedValue(
      makeRes([makeProduct({ id: 9, title: '沙發', category: 'furniture' })], 1),
    )

    const { wrapper, router } = await mountView()
    await flushPromises()
    expect(wrapper.text()).toContain('全站商品')

    await categoryButton(wrapper, 'Furniture').trigger('click')
    await flushPromises()

    expect(api.getProductsByCategory).toHaveBeenCalledWith('furniture', expect.objectContaining({ skip: 0 }))
    expect(wrapper.text()).toContain('沙發')
    expect(wrapper.text()).not.toContain('全站商品')
    expect(router.currentRoute.value.query.category).toBe('furniture')
  })

  // Scenario: 選擇「全部」
  it('在分類中點「全部」：列表回到所有商品', async () => {
    vi.mocked(api.getProducts).mockResolvedValue(makeRes([makeProduct({ id: 1, title: '全站商品' })], 1))
    vi.mocked(api.getProductsByCategory).mockResolvedValue(
      makeRes([makeProduct({ id: 9, title: '沙發', category: 'furniture' })], 1),
    )

    const { wrapper, router } = await mountView()
    await flushPromises()
    await categoryButton(wrapper, 'Furniture').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('沙發')

    await categoryButton(wrapper, '全部').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('全站商品')
    expect(wrapper.text()).not.toContain('沙發')
    expect(router.currentRoute.value.query.category).toBeUndefined()
  })
})

// Requirement: 搜尋商品
describe('搜尋商品', () => {
  // Scenario: 輸入搜尋關鍵字並送出
  it('輸入關鍵字並按 Enter：列表更新為搜尋結果', async () => {
    vi.mocked(api.getProducts).mockResolvedValue(makeRes([makeProduct({ id: 1, title: '全站商品' })], 1))
    vi.mocked(api.searchProducts).mockResolvedValue(makeRes([makeProduct({ id: 7, title: 'iPhone 15' })], 1))

    const { wrapper } = await mountView()
    await flushPromises()

    await searchInput(wrapper).setValue('phone')
    await flushPromises()
    // 只打字不按 Enter 不會查詢（spec 的觸發條件是 Enter，不是即時篩選）
    expect(api.searchProducts).not.toHaveBeenCalled()

    await searchInput(wrapper).trigger('keyup.enter')
    await flushPromises()

    expect(api.searchProducts).toHaveBeenCalledWith('phone')
    expect(wrapper.text()).toContain('iPhone 15')
    expect(wrapper.text()).not.toContain('全站商品')
  })

  // Scenario: 搜尋無結果
  it('搜尋結果為空：顯示「找不到符合的商品」提示', async () => {
    vi.mocked(api.getProducts).mockResolvedValue(makeRes([makeProduct({ id: 1, title: '全站商品' })], 1))
    vi.mocked(api.searchProducts).mockResolvedValue(makeRes([], 0))

    const { wrapper } = await mountView()
    await flushPromises()

    await searchInput(wrapper).setValue('不存在的商品')
    await searchInput(wrapper).trigger('keyup.enter')
    await flushPromises()

    expect(wrapper.text()).toContain('找不到符合的商品')
    expect(wrapper.text()).not.toContain('全站商品')
  })
})
