import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProductList } from './useProductList'

vi.mock('@/api/product', () => ({
  getProducts: vi.fn(),
  getCategories: vi.fn(),
  getProductsByCategory: vi.fn(),
  searchProducts: vi.fn(),
}))

import * as api from '@/api/product'

const mockProducts = [
  { id: 1, title: 'Product A', price: 10, rating: 4.5, thumbnail: '', category: 'electronics', description: '', images: [] },
  { id: 2, title: 'Product B', price: 20, rating: 3.8, thumbnail: '', category: 'electronics', description: '', images: [] },
]

const mockCategories = [
  { slug: 'electronics', name: 'Electronics', url: '' },
  { slug: 'clothing', name: 'Clothing', url: '' },
]

beforeEach(() => {
  vi.clearAllMocks()
  // 清掉 module-level 分類快取
  vi.resetModules()
})

describe('fetchProducts', () => {
  it('成功載入商品，更新 products / total / hasMore / skip', async () => {
    vi.mocked(api.getProducts).mockResolvedValue({ products: mockProducts, total: 10, skip: 0, limit: 6 })

    const { products, total, hasMore, loading, fetchProducts } = useProductList()
    await fetchProducts()

    expect(products.value).toEqual(mockProducts)
    expect(total.value).toBe(10)
    expect(hasMore.value).toBe(true)
    expect(loading.value).toBe(false)
  })

  it('商品數量等於 total 時 hasMore 為 false', async () => {
    vi.mocked(api.getProducts).mockResolvedValue({ products: mockProducts, total: 2, skip: 0, limit: 6 })

    const { hasMore, fetchProducts } = useProductList()
    await fetchProducts()

    expect(hasMore.value).toBe(false)
  })

  it('API 失敗時設定 error', async () => {
    vi.mocked(api.getProducts).mockRejectedValue(new Error('網路錯誤'))

    const { error, fetchProducts } = useProductList()
    await fetchProducts()

    expect(error.value).toBe('網路錯誤')
  })
})

describe('fetchCategories', () => {
  // 註：categoriesCache 是 module-level，一旦成功載入就會被快取，
  // 因此失敗與快取分支的測試需放在成功測試之前，避免被快取污染。
  it('API 失敗時設定 error（尚未有快取時）', async () => {
    vi.mocked(api.getCategories).mockRejectedValue(new Error('分類壞了'))

    const { categories, error, fetchCategories } = useProductList()
    await fetchCategories()

    expect(error.value).toBe('分類壞了')
    expect(categories.value).toEqual([])
  })

  it('成功載入分類', async () => {
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories)

    const { categories, fetchCategories } = useProductList()
    await fetchCategories()

    expect(categories.value).toEqual(mockCategories)
  })

  it('已有快取時直接使用，不再打 API', async () => {
    // 上一個測試已把 mockCategories 寫進 module-level 快取
    vi.mocked(api.getCategories).mockClear()

    const { categories, fetchCategories } = useProductList()
    await fetchCategories()

    expect(api.getCategories).not.toHaveBeenCalled()
    expect(categories.value).toEqual(mockCategories)
  })
})

describe('fetchProductsByCategory', () => {
  it('依分類載入商品', async () => {
    vi.mocked(api.getProductsByCategory).mockResolvedValue({ products: mockProducts, total: 2, skip: 0, limit: 6 })

    const { products, fetchProductsByCategory } = useProductList()
    await fetchProductsByCategory('electronics')

    expect(api.getProductsByCategory).toHaveBeenCalledWith('electronics', { limit: 6, skip: 0 })
    expect(products.value).toEqual(mockProducts)
  })

  it('API 失敗時設定 error', async () => {
    vi.mocked(api.getProductsByCategory).mockRejectedValue(new Error('分類商品壞了'))

    const { error, fetchProductsByCategory } = useProductList()
    await fetchProductsByCategory('electronics')

    expect(error.value).toBe('分類商品壞了')
  })
})

describe('fetchSearchProducts', () => {
  it('搜尋後 hasMore 為 false（不支援 infinite scroll）', async () => {
    vi.mocked(api.searchProducts).mockResolvedValue({ products: mockProducts, total: 2, skip: 0, limit: 6 })

    const { hasMore, fetchSearchProducts } = useProductList()
    await fetchSearchProducts('phone')

    expect(hasMore.value).toBe(false)
  })

  it('API 失敗時設定 error', async () => {
    vi.mocked(api.searchProducts).mockRejectedValue(new Error('搜尋炸了'))

    const { error, fetchSearchProducts } = useProductList()
    await fetchSearchProducts('phone')

    expect(error.value).toBe('搜尋炸了')
  })
})

describe('loadMore', () => {
  it('追加商品到現有列表', async () => {
    const extraProducts = [
      { id: 3, title: 'Product C', price: 30, rating: 4.0, thumbnail: '', category: 'electronics', description: '', images: [] },
    ]
    vi.mocked(api.getProducts)
      .mockResolvedValueOnce({ products: mockProducts, total: 10, skip: 0, limit: 6 })
      .mockResolvedValueOnce({ products: extraProducts, total: 10, skip: 6, limit: 6 })

    const { products, loadMore, fetchProducts } = useProductList()
    await fetchProducts()
    await loadMore()

    expect(products.value).toHaveLength(3)
    expect(products.value[2].id).toBe(3)
  })

  it('hasMore 為 false 時不打 API', async () => {
    vi.mocked(api.getProducts).mockResolvedValue({ products: mockProducts, total: 2, skip: 0, limit: 6 })

    const { loadMore, fetchProducts } = useProductList()
    await fetchProducts()
    await loadMore()

    expect(api.getProducts).toHaveBeenCalledTimes(1)
  })

  it('傳入分類時走 getProductsByCategory 追加', async () => {
    const extraProducts = [
      { id: 3, title: 'Product C', price: 30, rating: 4.0, thumbnail: '', category: 'electronics', description: '', images: [] },
    ]
    vi.mocked(api.getProductsByCategory)
      .mockResolvedValueOnce({ products: mockProducts, total: 10, skip: 0, limit: 6 })
      .mockResolvedValueOnce({ products: extraProducts, total: 10, skip: 6, limit: 6 })

    const { products, loadMore, fetchProductsByCategory } = useProductList()
    await fetchProductsByCategory('electronics')
    await loadMore('electronics')

    expect(api.getProductsByCategory).toHaveBeenLastCalledWith('electronics', { limit: 6, skip: 2 })
    expect(products.value).toHaveLength(3)
  })

  it('追加時 API 失敗設定 error', async () => {
    vi.mocked(api.getProducts)
      .mockResolvedValueOnce({ products: mockProducts, total: 10, skip: 0, limit: 6 })
      .mockRejectedValueOnce(new Error('載入更多壞了'))

    const { error, loadMore, fetchProducts } = useProductList()
    await fetchProducts()
    await loadMore()

    expect(error.value).toBe('載入更多壞了')
  })
})

// 非 Error 例外時，各函式應套用各自的預設錯誤訊息（覆蓋 ternary 的 false 分支）
describe('非 Error 例外的預設訊息', () => {
  it('fetchProducts → 載入商品失敗', async () => {
    vi.mocked(api.getProducts).mockRejectedValue('boom')
    const { error, fetchProducts } = useProductList()
    await fetchProducts()
    expect(error.value).toBe('載入商品失敗')
  })

  it('fetchCategories → 載入分類失敗', async () => {
    // 這是本檔第一個呼叫 getCategories 的測試前，快取可能已被其他檔案清除；
    // 但 module-level 快取在單一測試檔內共用，故用動態載入取得未快取的實例。
    vi.resetModules()
    vi.doMock('@/api/product', () => ({
      getCategories: vi.fn().mockRejectedValue('boom'),
      getProducts: vi.fn(),
      getProductsByCategory: vi.fn(),
      searchProducts: vi.fn(),
    }))
    const { useProductList: freshUseProductList } = await import('./useProductList')
    const { error, fetchCategories } = freshUseProductList()
    await fetchCategories()
    expect(error.value).toBe('載入分類失敗')
    vi.doUnmock('@/api/product')
  })

  it('fetchProductsByCategory → 載入分類商品失敗', async () => {
    vi.mocked(api.getProductsByCategory).mockRejectedValue('boom')
    const { error, fetchProductsByCategory } = useProductList()
    await fetchProductsByCategory('x')
    expect(error.value).toBe('載入分類商品失敗')
  })

  it('fetchSearchProducts → 搜尋失敗', async () => {
    vi.mocked(api.searchProducts).mockRejectedValue('boom')
    const { error, fetchSearchProducts } = useProductList()
    await fetchSearchProducts('x')
    expect(error.value).toBe('搜尋失敗')
  })

  it('loadMore → 載入更多失敗', async () => {
    vi.mocked(api.getProducts)
      .mockResolvedValueOnce({ products: mockProducts, total: 10, skip: 0, limit: 6 })
      .mockRejectedValueOnce('boom')
    const { error, loadMore, fetchProducts } = useProductList()
    await fetchProducts()
    await loadMore()
    expect(error.value).toBe('載入更多失敗')
  })
})
