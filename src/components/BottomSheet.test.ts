import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BottomSheet from './BottomSheet.vue'

// 把 Teleport stub 掉，讓內容 inline 渲染，方便用 wrapper 斷言
const mountSheet = (props: { modelValue: boolean; title?: string }, slot = '') =>
  mount(BottomSheet, {
    props,
    slots: slot ? { default: slot } : {},
    global: { stubs: { teleport: true } },
  })

describe('BottomSheet', () => {
  it('modelValue 為 false 時不渲染內容', () => {
    const wrapper = mountSheet({ modelValue: false, title: '標題' })
    expect(wrapper.text()).not.toContain('標題')
  })

  it('modelValue 為 true 時顯示標題與 slot 內容', () => {
    const wrapper = mountSheet({ modelValue: true, title: '選擇分類' }, '<p>slot 內容</p>')
    expect(wrapper.text()).toContain('選擇分類')
    expect(wrapper.text()).toContain('slot 內容')
  })

  it('點擊遮罩層 emit update:modelValue false', async () => {
    const wrapper = mountSheet({ modelValue: true, title: 't' })
    // 最外層遮罩即根元素
    await wrapper.get('.bg-black\\/40').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('點擊關閉鈕 emit update:modelValue false', async () => {
    const wrapper = mountSheet({ modelValue: true, title: 't' })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('點擊內容區（@click.stop）不會冒泡到遮罩、不 emit', async () => {
    const wrapper = mountSheet({ modelValue: true, title: 't' })
    await wrapper.get('.sheet-body').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
