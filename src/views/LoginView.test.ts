import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginView from './LoginView.vue'

const push = vi.hoisted(() => vi.fn())
const route = vi.hoisted(() => ({ query: {} as Record<string, unknown> }))
const auth = vi.hoisted(() => ({ setFaToken: vi.fn(), createRandomToken: vi.fn(() => 'tok-123') }))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => route,
}))

vi.mock('@/utils/auth', () => ({
  setFaToken: auth.setFaToken,
  createRandomToken: auth.createRandomToken,
}))

const mountView = () =>
  mount(LoginView, {
    global: { stubs: { Navbar: true } },
  })

beforeEach(() => {
  route.query = {}
  push.mockClear()
  auth.setFaToken.mockClear()
})

describe('LoginView handleLogin', () => {
  it('登入時設定 token 並導向 redirect 指定的路徑', async () => {
    route.query = { redirect: '/cart' }
    const wrapper = mountView()

    await wrapper.get('form').trigger('submit')

    expect(auth.setFaToken).toHaveBeenCalledWith('tok-123')
    expect(push).toHaveBeenCalledWith('/cart')
  })

  it('沒有 redirect 時導回首頁 /', async () => {
    route.query = {}
    const wrapper = mountView()

    await wrapper.get('form').trigger('submit')

    expect(push).toHaveBeenCalledWith('/')
  })

  it('redirect 為陣列（非字串）時 fallback 到 /', async () => {
    route.query = { redirect: ['/a', '/b'] }
    const wrapper = mountView()

    await wrapper.get('form').trigger('submit')

    expect(push).toHaveBeenCalledWith('/')
  })
})
