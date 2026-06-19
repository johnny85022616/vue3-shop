import axios from 'axios'
import type { Product, Category, ProductListResponse } from '@/types/product'

// 建立統一的 axios instance，所有請求都走這個 base URL
const http = axios.create({
  baseURL: 'https://dummyjson.com',
})

interface PageParams {
  limit?: number
  skip?: number
}

// 取得商品列表（支援分頁）
export const getProducts = async ({ limit = 20, skip = 0 }: PageParams = {}): Promise<ProductListResponse> => {
  const res = await http.get<ProductListResponse>('/products', { params: { limit, skip } })
  return res.data
}

// 取得單一商品詳情
export const getProductById = async (id: string): Promise<Product> => {
  const res = await http.get<Product>(`/products/${id}`)
  return res.data
}

// 取得所有分類
export const getCategories = async (): Promise<Category[]> => {
  const res = await http.get<Category[]>('/products/categories')
  return res.data
}

// 依分類取得商品
export const getProductsByCategory = async (category: string, { limit = 20, skip = 0 }: PageParams = {}): Promise<ProductListResponse> => {
  const res = await http.get<ProductListResponse>(`/products/category/${category}`, { params: { limit, skip } })
  return res.data
}

// 搜尋商品
export const searchProducts = async (query: string): Promise<ProductListResponse> => {
  const res = await http.get<ProductListResponse>('/products/search', { params: { q: query } })
  return res.data
}

