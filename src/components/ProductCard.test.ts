import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductCard from './ProductCard.vue'

const product = {
  id: 42,
  title: '測試商品',
  price: 199,
  rating: 4.567,
  thumbnail: 'thumb.jpg',
  category: 'test',
  description: '',
  images: [],
}

const mountCard = (push = vi.fn()) =>
  mount(ProductCard, {
    props: { product },
    global: {
      mocks: { $router: { push } },
    },
  })

describe('ProductCard', () => {
  it('顯示標題、價格與圖片', () => {
    const wrapper = mountCard()

    expect(wrapper.text()).toContain('測試商品')
    expect(wrapper.text()).toContain('$199')

    const img = wrapper.get('img')
    expect(img.attributes('src')).toBe('thumb.jpg')
    expect(img.attributes('alt')).toBe('測試商品')
  })

  it('評分四捨五入到小數點一位', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('4.6')
  })

  it('點擊卡片導向 ProductDetail 並帶入商品 id', async () => {
    const push = vi.fn()
    const wrapper = mountCard(push)

    await wrapper.get('.product-card').trigger('click')

    expect(push).toHaveBeenCalledWith({
      name: 'ProductDetail',
      params: { id: 42 },
    })
  })
})
