import axios from 'axios'

// 建立統一的 axios instance，所有請求都走這個 base URL
const http = axios.create({
  baseURL: 'https://dummyjson.com',
})

// 取得商品列表（支援分頁）
export const getProducts = ({ limit = 20, skip = 0 } = {}) =>
  http.get('/products', { params: { limit, skip } })

// 取得單一商品詳情
export const getProductById = (id) =>
  http.get(`/products/${id}`)

// 取得所有分類
export const getCategories = () =>
  http.get('/products/categories')

// 依分類取得商品
export const getProductsByCategory = (category) =>
  http.get(`/products/category/${category}`)

// 搜尋商品
export const searchProducts = (query) =>
  http.get('/products/search', { params: { q: query } })
