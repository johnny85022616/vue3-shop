import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CategorySheet from './CategorySheet.vue'

const categories = [
  { slug: 'electronics', name: 'Electronics', url: '' },
  { slug: 'clothing', name: 'Clothing', url: '' },
]

const mountSheet = (activeCategory = '') =>
  mount(CategorySheet, {
    props: { modelValue: true, categories, activeCategory },
    // Teleport stub 讓底層 BottomSheet 的內容 inline 渲染
    global: { stubs: { teleport: true } },
  })

describe('CategorySheet', () => {
  it('渲染「全部」加上每個分類的按鈕', () => {
    const wrapper = mountSheet()
    const buttons = wrapper.findAll('button').filter((b) => b.text() !== '✕')
    const labels = buttons.map((b) => b.text())
    expect(labels).toEqual(['全部', 'Electronics', 'Clothing'])
  })

  it('activeCategory 為空時「全部」帶選中樣式', () => {
    const wrapper = mountSheet('')
    const all = wrapper.findAll('button').find((b) => b.text() === '全部')!
    expect(all.classes()).toContain('bg-ink')
  })

  it('activeCategory 對應的分類帶選中樣式，其餘不帶', () => {
    const wrapper = mountSheet('electronics')
    const buttons = wrapper.findAll('button')
    const electronics = buttons.find((b) => b.text() === 'Electronics')!
    const clothing = buttons.find((b) => b.text() === 'Clothing')!
    expect(electronics.classes()).toContain('bg-ink')
    expect(clothing.classes()).toContain('bg-cream')
  })

  it('點選分類 emit select(slug) 並關閉 sheet', async () => {
    const wrapper = mountSheet()
    const electronics = wrapper.findAll('button').find((b) => b.text() === 'Electronics')!
    await electronics.trigger('click')

    expect(wrapper.emitted('select')).toEqual([['electronics']])
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('點選「全部」emit select 空字串', async () => {
    const wrapper = mountSheet('electronics')
    const all = wrapper.findAll('button').find((b) => b.text() === '全部')!
    await all.trigger('click')

    expect(wrapper.emitted('select')).toEqual([['']])
  })

  it('底層 BottomSheet 關閉時，往上轉發 update:modelValue', async () => {
    const wrapper = mountSheet()
    // BottomSheet 的關閉鈕
    const closeBtn = wrapper.findAll('button').find((b) => b.text() === '✕')!
    await closeBtn.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    // 未點分類，不應 emit select
    expect(wrapper.emitted('select')).toBeUndefined()
  })
})
