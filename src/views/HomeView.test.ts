import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import HomeView from './HomeView.vue'

const store = vi.hoisted(() => ({
  categories: [] as unknown[],
  loading: false,
  error: null as string | null,
  fetchCategories: vi.fn(),
}))

vi.mock('@/composables/useProductList', async () => {
  const { ref } = await import('vue')
  return {
    useProductList: () => ({
      categories: ref(store.categories),
      loading: ref(store.loading),
      error: ref(store.error),
      fetchCategories: store.fetchCategories,
    }),
  }
})

const mountView = async () => {
  const wrapper = mount(HomeView, {
    global: { stubs: { Navbar: true, CategorySection: true, RouterLink: true } },
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  store.categories = []
  store.loading = false
  store.error = null
  store.fetchCategories.mockClear()
})

describe('HomeView', () => {
  it('掛載時呼叫 fetchCategories', async () => {
    await mountView()
    expect(store.fetchCategories).toHaveBeenCalledOnce()
  })

  it('loading 時顯示分類 skeleton', async () => {
    store.loading = true
    const wrapper = await mountView()
    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('error 時顯示錯誤訊息', async () => {
    store.error = '載入分類失敗'
    const wrapper = await mountView()
    expect(wrapper.find('.text-red-700').text()).toBe('載入分類失敗')
  })

  it('載入完成後為每個分類渲染一個 CategorySection', async () => {
    store.categories = [
      { slug: 'a', name: 'A', url: '' },
      { slug: 'b', name: 'B', url: '' },
      { slug: 'c', name: 'C', url: '' },
    ]
    const wrapper = await mountView()
    expect(wrapper.findAllComponents({ name: 'CategorySection' })).toHaveLength(3)
  })
})
