import axios from 'axios'
import type { Product, Category, ProductsResponse } from '@/types/product'

// 建立統一的 axios instance，所有請求都走這個 base URL
const http = axios.create({
  baseURL: 'https://dummyjson.com',
})

interface PageParams {
  limit?: number
  skip?: number
}

// 取得商品列表（支援分頁）
export const getProducts = ({ limit = 20, skip = 0 }: PageParams = {}) =>
  http.get<ProductsResponse>('/products', { params: { limit, skip } })

// 取得單一商品詳情
export const getProductById = (id: string) =>
  http.get<Product>(`/products/${id}`)

// 取得所有分類
export const getCategories = () =>
  http.get<Category[]>('/products/categories')

// 依分類取得商品
export const getProductsByCategory = (category: string, { limit = 20, skip = 0 }: PageParams = {}) =>
  http.get<ProductsResponse>(`/products/category/${category}`, { params: { limit, skip } })

// 搜尋商品
export const searchProducts = (query: string) =>
  http.get<ProductsResponse>('/products/search', { params: { q: query } })
