const FA_TOKEN_KEY = 'FA_TOKEN'

const buildCookie = (name: string, value: string, maxAgeSeconds: number) =>
  `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`

export const hasFaToken = () => document.cookie
  .split('; ')
  .some((cookie) => cookie.startsWith(`${FA_TOKEN_KEY}=`))

export const setFaToken = (token: string) => {
  document.cookie = buildCookie(FA_TOKEN_KEY, token, 60 * 60 * 24 * 7)
}

export const clearFaToken = () => {
  document.cookie = `${FA_TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`
}

export const createRandomToken = () => {
  const randomPart = Math.random().toString(36).slice(2)
  return `${Date.now().toString(36)}-${randomPart}`
}
