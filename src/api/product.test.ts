import { describe, it, expect, vi, beforeEach } from 'vitest'

// 假的 axios instance，攔截 http.get
// 用 vi.hoisted 讓 get 在 vi.mock 工廠（會被提升到檔案最上方）執行時就已存在
const { get } = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('axios', () => ({
  default: {
    create: () => ({ get }),
  },
}))

import {
  getProducts,
  getProductById,
  getCategories,
  getProductsByCategory,
  searchProducts,
} from './product'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getProducts', () => {
  it('帶預設分頁參數呼叫 /products', async () => {
    get.mockResolvedValue({ data: { products: [], total: 0, skip: 0, limit: 20 } })

    const res = await getProducts()

    expect(get).toHaveBeenCalledWith('/products', { params: { limit: 20, skip: 0 } })
    expect(res).toEqual({ products: [], total: 0, skip: 0, limit: 20 })
  })

  it('可傳入自訂 limit / skip', async () => {
    get.mockResolvedValue({ data: { products: [], total: 0, skip: 6, limit: 6 } })

    await getProducts({ limit: 6, skip: 6 })

    expect(get).toHaveBeenCalledWith('/products', { params: { limit: 6, skip: 6 } })
  })
})

describe('getProductById', () => {
  it('呼叫 /products/:id 並回傳 data', async () => {
    get.mockResolvedValue({ data: { id: 1, title: 'A' } })

    const res = await getProductById('1')

    expect(get).toHaveBeenCalledWith('/products/1')
    expect(res).toEqual({ id: 1, title: 'A' })
  })
})

describe('getCategories', () => {
  it('呼叫 /products/categories', async () => {
    get.mockResolvedValue({ data: [{ slug: 'a', name: 'A', url: '' }] })

    const res = await getCategories()

    expect(get).toHaveBeenCalledWith('/products/categories')
    expect(res).toHaveLength(1)
  })
})

describe('getProductsByCategory', () => {
  it('呼叫 /products/category/:category 並帶分頁', async () => {
    get.mockResolvedValue({ data: { products: [], total: 0, skip: 0, limit: 6 } })

    await getProductsByCategory('electronics', { limit: 6, skip: 12 })

    expect(get).toHaveBeenCalledWith('/products/category/electronics', {
      params: { limit: 6, skip: 12 },
    })
  })
})

describe('searchProducts', () => {
  it('呼叫 /products/search 並帶 q 參數', async () => {
    get.mockResolvedValue({ data: { products: [], total: 0, skip: 0, limit: 20 } })

    await searchProducts('phone')

    expect(get).toHaveBeenCalledWith('/products/search', { params: { q: 'phone' } })
  })
})
