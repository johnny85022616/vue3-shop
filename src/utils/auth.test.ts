import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { hasFaToken, setFaToken, clearFaToken, createRandomToken } from './auth'

// 每個測試前清掉 cookie，避免互相污染
const wipeCookies = () => {
  document.cookie
    .split('; ')
    .filter(Boolean)
    .forEach((cookie) => {
      const name = cookie.split('=')[0]
      document.cookie = `${name}=; Path=/; Max-Age=0`
    })
}

beforeEach(wipeCookies)
afterEach(wipeCookies)

describe('setFaToken / hasFaToken', () => {
  it('一開始沒有 token', () => {
    expect(hasFaToken()).toBe(false)
  })

  it('設定後 hasFaToken 為 true', () => {
    setFaToken('abc123')
    expect(hasFaToken()).toBe(true)
    expect(document.cookie).toContain('FA_TOKEN=abc123')
  })

  it('token 值會做 URL encode', () => {
    setFaToken('a b+c')
    expect(document.cookie).toContain(`FA_TOKEN=${encodeURIComponent('a b+c')}`)
  })
})

describe('clearFaToken', () => {
  it('清除後 hasFaToken 回到 false', () => {
    setFaToken('abc123')
    expect(hasFaToken()).toBe(true)

    clearFaToken()
    expect(hasFaToken()).toBe(false)
  })
})

describe('createRandomToken', () => {
  it('回傳 `<時間>-<隨機>` 格式且每次不同', () => {
    const t1 = createRandomToken()
    expect(t1).toMatch(/^[a-z0-9]+-[a-z0-9]+$/)

    // 用假的 random 讓兩次值不同，驗證有帶入隨機部分
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.123456789)
    const t2 = createRandomToken()
    const t3 = createRandomToken()
    expect(t2.split('-')[1]).toBe(t3.split('-')[1]) // 相同 random → 相同隨機段
    spy.mockRestore()

    const t4 = createRandomToken()
    expect(t4).not.toBe(t1)
  })
})
