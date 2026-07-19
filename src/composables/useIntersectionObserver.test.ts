import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useIntersectionObserver } from './useIntersectionObserver'

// 假的 IntersectionObserver，記錄 observe / disconnect 並保留 callback 供手動觸發
let lastInstance: FakeObserver | null = null

class FakeObserver {
  callback: IntersectionObserverCallback
  options: IntersectionObserverInit
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
  takeRecords = vi.fn(() => [])

  constructor(cb: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
    this.callback = cb
    this.options = options
    lastInstance = this
  }

  // 測試用：模擬進入視窗
  trigger(isIntersecting: boolean) {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
}

beforeEach(() => {
  lastInstance = null
  vi.stubGlobal('IntersectionObserver', FakeObserver as unknown as typeof IntersectionObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// 用一個小元件把 sentinel 綁到真實 DOM 節點
const makeHost = (callback: () => void, options?: IntersectionObserverInit) =>
  defineComponent({
    setup() {
      const { sentinel } = useIntersectionObserver(callback, options)
      return () => h('div', { ref: sentinel })
    },
  })

describe('useIntersectionObserver', () => {
  it('掛載後對 sentinel 呼叫 observe', () => {
    const cb = vi.fn()
    const wrapper = mount(makeHost(cb))

    expect(lastInstance?.observe).toHaveBeenCalledOnce()
    expect(lastInstance?.observe).toHaveBeenCalledWith(wrapper.element)
  })

  it('進入視窗（isIntersecting=true）時觸發 callback', () => {
    const cb = vi.fn()
    mount(makeHost(cb))

    lastInstance!.trigger(true)
    expect(cb).toHaveBeenCalledOnce()
  })

  it('未進入視窗（isIntersecting=false）時不觸發 callback', () => {
    const cb = vi.fn()
    mount(makeHost(cb))

    lastInstance!.trigger(false)
    expect(cb).not.toHaveBeenCalled()
  })

  it('傳入的 options 會帶進 IntersectionObserver', () => {
    mount(makeHost(vi.fn(), { rootMargin: '200px' }))
    expect(lastInstance?.options).toEqual({ rootMargin: '200px' })
  })

  it('卸載時 disconnect', () => {
    const wrapper = mount(makeHost(vi.fn()))
    const instance = lastInstance!
    wrapper.unmount()
    expect(instance.disconnect).toHaveBeenCalledOnce()
  })

  it('sentinel 未綁定到節點時不呼叫 observe', () => {
    // ref 沒有掛到任何 DOM 節點，sentinel.value 仍為 null
    const host = defineComponent({
      setup() {
        useIntersectionObserver(vi.fn())
        return () => h('div')
      },
    })
    mount(host)
    expect(lastInstance?.observe).not.toHaveBeenCalled()
  })
})
