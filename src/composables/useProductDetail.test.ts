import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProductDetail } from './useProductDetail'

vi.mock('@/api/product', () => ({
  getProductById: vi.fn(),
}))

import * as api from '@/api/product'

const mockProduct = {
  id: 1,
  title: 'Product A',
  price: 10,
  rating: 4.5,
  thumbnail: '',
  category: 'electronics',
  description: '',
  images: [],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchProductById', () => {
  it('成功載入時設定 product，loading / error 歸位', async () => {
    vi.mocked(api.getProductById).mockResolvedValue(mockProduct)

    const { product, loading, error, fetchProductById } = useProductDetail()
    await fetchProductById('1')

    expect(api.getProductById).toHaveBeenCalledWith('1')
    expect(product.value).toEqual(mockProduct)
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('API 失敗時設定 error 且 product 為 null', async () => {
    vi.mocked(api.getProductById).mockRejectedValue(new Error('找不到商品'))

    const { product, error, fetchProductById } = useProductDetail()
    await fetchProductById('999')

    expect(product.value).toBeNull()
    expect(error.value).toBe('找不到商品')
  })

  it('非 Error 例外時使用預設錯誤訊息', async () => {
    vi.mocked(api.getProductById).mockRejectedValue('boom')

    const { error, fetchProductById } = useProductDetail()
    await fetchProductById('1')

    expect(error.value).toBe('載入商品詳情失敗')
  })

  it('重新載入前會清掉上一筆 product', async () => {
    vi.mocked(api.getProductById).mockResolvedValueOnce(mockProduct)
    const { product, fetchProductById } = useProductDetail()
    await fetchProductById('1')
    expect(product.value).toEqual(mockProduct)

    vi.mocked(api.getProductById).mockRejectedValueOnce(new Error('壞了'))
    await fetchProductById('2')
    expect(product.value).toBeNull()
  })
})
