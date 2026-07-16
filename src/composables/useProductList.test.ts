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
  it('成功載入分類', async () => {
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories)

    const { categories, fetchCategories } = useProductList()
    await fetchCategories()

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
})

describe('fetchSearchProducts', () => {
  it('搜尋後 hasMore 為 false（不支援 infinite scroll）', async () => {
    vi.mocked(api.searchProducts).mockResolvedValue({ products: mockProducts, total: 2, skip: 0, limit: 6 })

    const { hasMore, fetchSearchProducts } = useProductList()
    await fetchSearchProducts('phone')

    expect(hasMore.value).toBe(false)
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
})
