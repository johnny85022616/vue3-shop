import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { ref } from 'vue'
import Navbar from './Navbar.vue'

// 共用可變狀態，供各 mock 讀寫
const state = vi.hoisted(() => ({ loggedIn: false, count: 0 }))

const push = vi.hoisted(() => vi.fn())
const route = vi.hoisted(() => ({ fullPath: '/', name: 'Home', meta: {} as Record<string, unknown> }))

vi.mock('@/utils/auth', () => ({
  hasFaToken: () => state.loggedIn,
  clearFaToken: vi.fn(() => { state.loggedIn = false }),
}))

vi.mock('@/composables/useCart', () => ({
  useCart: () => ({ itemCount: ref(state.count) }),
}))

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push }),
}))

import { clearFaToken } from '@/utils/auth'

const mountNavbar = () =>
  mount(Navbar, {
    global: {
      stubs: { RouterLink: RouterLinkStub },
      mocks: { $route: route },
    },
  })

const badge = (wrapper: ReturnType<typeof mountNavbar>) =>
  wrapper.find('span.bg-gold')

beforeEach(() => {
  state.loggedIn = false
  state.count = 0
  route.fullPath = '/'
  route.name = 'Home'
  route.meta = {}
  push.mockClear()
  vi.mocked(clearFaToken).mockClear()
})

describe('購物車徽章', () => {
  it('未登入時即使有商品也不顯示徽章', () => {
    state.loggedIn = false
    state.count = 3
    expect(badge(mountNavbar()).exists()).toBe(false)
  })

  it('已登入但數量為 0 時不顯示徽章', () => {
    state.loggedIn = true
    state.count = 0
    expect(badge(mountNavbar()).exists()).toBe(false)
  })

  it('已登入且有商品時顯示數量', () => {
    state.loggedIn = true
    state.count = 5
    expect(badge(mountNavbar()).text()).toBe('5')
  })

  it('數量超過 99 時顯示 99+', () => {
    state.loggedIn = true
    state.count = 150
    expect(badge(mountNavbar()).text()).toBe('99+')
  })
})

describe('登入/登出按鈕', () => {
  it('未登入時按鈕顯示「登入」', () => {
    state.loggedIn = false
    expect(mountNavbar().get('button').text()).toBe('登入')
  })

  it('已登入時按鈕顯示「登出」', () => {
    state.loggedIn = true
    expect(mountNavbar().get('button').text()).toBe('登出')
  })

  it('點擊登出會清除 token 並隱藏徽章', async () => {
    state.loggedIn = true
    state.count = 2
    const wrapper = mountNavbar()
    expect(badge(wrapper).exists()).toBe(true)

    await wrapper.get('button').trigger('click')

    expect(clearFaToken).toHaveBeenCalledOnce()
    expect(badge(wrapper).exists()).toBe(false)
    expect(wrapper.get('button').text()).toBe('登入')
  })

  it('在需要授權的頁面登出後導回首頁', async () => {
    state.loggedIn = true
    route.meta = { requiresAuth: true }
    const wrapper = mountNavbar()

    await wrapper.get('button').trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'Home' })
  })

  it('未登入點擊登入，導向 Login 並帶 redirect', async () => {
    state.loggedIn = false
    route.name = 'ProductList'
    route.fullPath = '/products'
    const wrapper = mountNavbar()

    await wrapper.get('button').trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'Login', query: { redirect: '/products' } })
  })

  it('已在 Login 頁時點擊登入不重複導航', async () => {
    state.loggedIn = false
    route.name = 'Login'
    const wrapper = mountNavbar()

    await wrapper.get('button').trigger('click')

    expect(push).not.toHaveBeenCalled()
  })
})
