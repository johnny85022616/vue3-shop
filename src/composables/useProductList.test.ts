import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Category, Product, ProductListResponse } from '@/types/product'

// 判定:unit｜測試:src/composables/useProductList.test.ts
// 層級：純邏輯 unit（e2e skill 決策表）——不 mount 任何元件，直接呼叫 composable，
// 用 vi.mock 擋掉網路層，斷言「拿到資料後 state 怎麼變、loading/error 三態」。
// 對應 capability：product-list（openspec/specs/product-list/spec.md）。
//
// 這支負責資料面：打了哪支 API、帶什麼參數、products/total/hasMore/error 怎麼變。
// 「畫面上看到什麼」（skeleton、錯誤訊息、找不到商品提示、點按鈕）由
// src/views/ProductListView.test.ts 負責，兩支不重複。

vi.mock('@/api/product', () => ({
  getProducts: vi.fn(),
  getCategories: vi.fn(),
  getProductsByCategory: vi.fn(),
  searchProducts: vi.fn(),
}))

// useProductList.ts 有 module-level 的 categoriesCache，會跨測試殘留；
// 每個 case 都 resetModules 後重新 import，拿到乾淨的快取與乾淨的 mock。
let api: typeof import('@/api/product')
let useProductList: (typeof import('@/composables/useProductList'))['useProductList']

beforeEach(async () => {
  vi.resetModules()
  api = await import('@/api/product')
  // resetModules 會清掉 useProductList 的 module-level 快取，但 vi.mock 的 factory 結果
  // 被 vitest 快取住，getProducts 等 vi.fn() 是同一批實例、呼叫紀錄會跨 case 累積，
  // 所以還要手動清掉呼叫紀錄（clearAllMocks 不會動到各 case 自己設的 implementation）。
  vi.clearAllMocks()
  ;({ useProductList } = await import('@/composables/useProductList'))
})

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

function makeCategory(slug: string, name: string): Category {
  return { slug, name, url: `https://dummyjson.com/products/category/${slug}` }
}

// 建立一個還沒 resolve 的回傳值，用來觀察「請求進行中」的狀態
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

// Requirement: 顯示商品列表
describe('載入商品列表', () => {
  // Scenario: 進入商品列表頁（載入中狀態直到資料回傳）
  it('fetchProducts：請求中 loading 為 true，回傳後填入 products/total 並收掉 loading', async () => {
    const pending = deferred<ProductListResponse>()
    vi.mocked(api.getProducts).mockReturnValue(pending.promise)
    const { products, total, loading, error, fetchProducts } = useProductList()

    expect(loading.value).toBe(false)
    const done = fetchProducts()
    expect(loading.value).toBe(true) // 資料還沒回來的期間

    pending.resolve(makeRes([makeProduct({ id: 1, title: '口紅' }), makeProduct({ id: 2, title: '香水' })], 2))
    await done

    expect(loading.value).toBe(false)
    expect(products.value.map((p) => p.title)).toEqual(['口紅', '香水'])
    expect(total.value).toBe(2)
    expect(error.value).toBeNull()
  })

  // Scenario: 商品載入失敗
  it('fetchProducts 失敗：error 帶入錯誤訊息，products 保持空、loading 收掉', async () => {
    vi.mocked(api.getProducts).mockRejectedValue(new Error('Network Error'))
    const { products, loading, error, fetchProducts } = useProductList()

    await fetchProducts()

    expect(error.value).toBe('Network Error')
    expect(products.value).toEqual([])
    expect(loading.value).toBe(false)
  })
})

// Requirement: 依分類篩選商品
describe('依分類載入商品', () => {
  // Scenario: 選擇分類
  it('fetchProductsByCategory：以該分類 slug 打分類 API，products 換成該分類商品', async () => {
    vi.mocked(api.getProductsByCategory).mockResolvedValue(
      makeRes([makeProduct({ id: 10, title: '沙發', category: 'furniture' })], 1),
    )
    const { products, total, error, fetchProductsByCategory } = useProductList()

    await fetchProductsByCategory('furniture')

    expect(api.getProductsByCategory).toHaveBeenCalledWith('furniture', expect.objectContaining({ skip: 0 }))
    expect(products.value.map((p) => p.title)).toEqual(['沙發'])
    expect(total.value).toBe(1)
    expect(error.value).toBeNull()
  })

  // Scenario: 商品載入失敗（同一條 Scenario 的分類路徑——WHEN API 呼叫失敗，這裡是分類那支）
  it('fetchProductsByCategory 失敗：error 帶入錯誤訊息', async () => {
    vi.mocked(api.getProductsByCategory).mockRejectedValue(new Error('分類壞了'))
    const { error, fetchProductsByCategory } = useProductList()

    await fetchProductsByCategory('furniture')

    expect(error.value).toBe('分類壞了')
  })

  // Scenario: 選擇「全部」——從某分類回到全部：商品換回全站，分頁狀態一併重置
  it('在分類之後 fetchProducts：products 換回全站商品，且分頁從第一頁重來', async () => {
    vi.mocked(api.getProductsByCategory).mockResolvedValue(
      makeRes([makeProduct({ id: 10, title: '沙發', category: 'furniture' })], 5),
    )
    vi.mocked(api.getProducts).mockResolvedValue(
      makeRes([makeProduct({ id: 1, title: '全站商品A' }), makeProduct({ id: 2, title: '全站商品B' })], 2),
    )
    const { products, total, hasMore, fetchProducts, fetchProductsByCategory } = useProductList()

    await fetchProductsByCategory('furniture')
    expect(hasMore.value).toBe(true) // 分類只載了 1/5，還有更多

    await fetchProducts()

    expect(products.value.map((p) => p.title)).toEqual(['全站商品A', '全站商品B']) // 換掉而非追加在分類商品後面
    expect(api.getProducts).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 })) // 分頁重置
    expect(total.value).toBe(2)
    expect(hasMore.value).toBe(false) // 沿用分類的 total 就會錯留 true
  })
})

// Requirement: 搜尋商品
describe('搜尋商品', () => {
  // Scenario: 輸入搜尋關鍵字並送出
  it('fetchSearchProducts：以關鍵字打搜尋 API，products 換成搜尋結果', async () => {
    vi.mocked(api.searchProducts).mockResolvedValue(
      makeRes([makeProduct({ id: 5, title: 'iPhone 15' })], 1),
    )
    const { products, total, error, fetchSearchProducts } = useProductList()

    await fetchSearchProducts('phone')

    expect(api.searchProducts).toHaveBeenCalledWith('phone')
    expect(products.value.map((p) => p.title)).toEqual(['iPhone 15'])
    expect(total.value).toBe(1)
    expect(error.value).toBeNull()
  })

  // Scenario: 搜尋無結果（畫面提示由 view test 驗，這裡驗 state 收到空結果）
  it('搜尋無結果：products 清空、total 為 0', async () => {
    vi.mocked(api.getProducts).mockResolvedValue(makeRes([makeProduct({ id: 1, title: '口紅' })], 1))
    vi.mocked(api.searchProducts).mockResolvedValue(makeRes([], 0))
    const { products, total, fetchProducts, fetchSearchProducts } = useProductList()

    await fetchProducts() // 先有東西，才驗得出搜尋把它清掉
    await fetchSearchProducts('不存在的商品')

    expect(products.value).toEqual([])
    expect(total.value).toBe(0)
  })

  // Scenario: 商品載入失敗（同一條 Scenario 的搜尋路徑）
  it('搜尋失敗：error 帶入錯誤訊息', async () => {
    vi.mocked(api.searchProducts).mockRejectedValue(new Error('搜尋壞了'))
    const { error, fetchSearchProducts } = useProductList()

    await fetchSearchProducts('phone')

    expect(error.value).toBe('搜尋壞了')
  })
})

// ⚠️ 非 spec Scenario：本組三個 case 都不對應 product-list spec 的任何 Scenario。
// 無限捲動分頁是實作自帶的機制（LIMIT=6 + hasMore + skip），spec 目前沒定義它，
// 屬已知的 spec 缺口。留著是因為 loadMore 的 skip/hasMore 算術很容易改壞，且它與
// 「選擇分類／選擇全部」共用同一組分頁狀態。哨兵何時觸發 loadMore 由 view 負責。
describe('載入更多', () => {
  it('第一頁未載完時 hasMore 為 true，loadMore 追加下一批後轉 false', async () => {
    const firstPage = [makeProduct({ id: 1 }), makeProduct({ id: 2 })]
    const secondPage = [makeProduct({ id: 3 })]
    vi.mocked(api.getProducts)
      .mockResolvedValueOnce(makeRes(firstPage, 3))
      .mockResolvedValueOnce(makeRes(secondPage, 3))
    const { products, hasMore, fetchProducts, loadMore } = useProductList()

    await fetchProducts()
    expect(hasMore.value).toBe(true)

    await loadMore()

    expect(products.value.map((p) => p.id)).toEqual([1, 2, 3]) // 追加而非取代
    expect(api.getProducts).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 2 }))
    expect(hasMore.value).toBe(false) // 已載滿 total
  })

  it('沒有更多可載時 loadMore 不再打 API', async () => {
    vi.mocked(api.getProducts).mockResolvedValue(makeRes([makeProduct({ id: 1 })], 1))
    const { hasMore, fetchProducts, loadMore } = useProductList()

    await fetchProducts()
    expect(hasMore.value).toBe(false)
    vi.mocked(api.getProducts).mockClear()

    await loadMore()

    expect(api.getProducts).not.toHaveBeenCalled()
  })

  it('目前在某分類下時，loadMore 追加的是該分類的下一批', async () => {
    vi.mocked(api.getProductsByCategory)
      .mockResolvedValueOnce(makeRes([makeProduct({ id: 1, category: 'beauty' })], 2))
      .mockResolvedValueOnce(makeRes([makeProduct({ id: 2, category: 'beauty' })], 2))
    const { products, fetchProductsByCategory, loadMore } = useProductList()

    await fetchProductsByCategory('beauty')
    await loadMore('beauty')

    expect(api.getProductsByCategory).toHaveBeenLastCalledWith('beauty', expect.objectContaining({ skip: 1 }))
    expect(products.value.map((p) => p.id)).toEqual([1, 2])
    expect(api.getProducts).not.toHaveBeenCalled() // 不會退回全站商品
  })
})

// 分類清單：product-list spec 的「依分類篩選商品」預設有分類標籤可點，但沒有為
// 「分類清單本身怎麼載入」定義 Scenario，所以本組除了最後兩個 case 之外都不對應
// Scenario——是支撐那條 Requirement 的前置資料，以及一個實作自帶的快取機制。
// （首頁的「分類載入中／失敗」有自己的 Scenario，歸 home capability，不在這支。）
describe('載入分類清單', () => {
  // 非 spec Scenario：「依分類篩選商品」的分類標籤資料來源
  it('fetchCategories：取得分類並填入 categories', async () => {
    vi.mocked(api.getCategories).mockResolvedValue([makeCategory('beauty', 'Beauty')])
    const { categories, error, fetchCategories } = useProductList()

    await fetchCategories()

    expect(categories.value.map((c) => c.slug)).toEqual(['beauty'])
    expect(error.value).toBeNull()
  })

  // 非 spec Scenario：module-level 快取是實作決策（整個 app 生命週期只打一次分類 API）
  it('快取：第二個 useProductList 實例直接用快取，不重複打分類 API', async () => {
    vi.mocked(api.getCategories).mockResolvedValue([makeCategory('beauty', 'Beauty')])

    await useProductList().fetchCategories()
    const second = useProductList()
    await second.fetchCategories()

    expect(api.getCategories).toHaveBeenCalledTimes(1)
    expect(second.categories.value.map((c) => c.slug)).toEqual(['beauty'])
  })

  // Scenario: 分類已回傳但商品仍在載入——分類走自己的旗標，不得收掉商品的 loading
  it('分類載入完成不會動到商品的 loading', async () => {
    const pendingProducts = deferred<ProductListResponse>()
    vi.mocked(api.getProducts).mockReturnValue(pendingProducts.promise)
    vi.mocked(api.getCategories).mockResolvedValue([makeCategory('beauty', 'Beauty')])
    const { loading, categoriesLoading, fetchProducts, fetchCategories } = useProductList()

    const productsDone = fetchProducts() // 商品吊著不回
    await fetchCategories()              // 分類整支跑完

    expect(api.getCategories).toHaveBeenCalledTimes(1) // tripwire：快取短路早退的話不會碰旗標，本 case 會恆綠
    expect(categoriesLoading.value).toBe(false)
    expect(loading.value).toBe(true) // 商品仍在載入中

    pendingProducts.resolve(makeRes([]))
    await productsDone

    expect(loading.value).toBe(false)
  })

  // 非 spec Scenario：product-list spec 只定義「商品」載入失敗；分類載入失敗要顯示什麼
  // 是 home spec 的「分類載入失敗」，這裡只鎖住 composable 有把錯誤訊息接出來
  it('fetchCategories 失敗：error 帶入錯誤訊息，categories 保持空', async () => {
    vi.mocked(api.getCategories).mockRejectedValue(new Error('分類載入失敗'))
    const { categories, error, fetchCategories } = useProductList()

    await fetchCategories()

    expect(error.value).toBe('分類載入失敗')
    expect(categories.value).toEqual([])
  })
})
