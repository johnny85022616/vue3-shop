// 對應 https://dummyjson.com/products 回傳的商品資料結構
export interface Product {
  id: number
  title: string
  description: string
  category: string
  price: number
  rating: number
  thumbnail: string
  images: string[]
}

// 對應 https://dummyjson.com/products/categories 回傳的分類資料結構
export interface Category {
  slug: string
  name: string
  url: string
}

// 對應 /products、/products/category/:slug、/products/search 的回傳格式
export interface ProductListResponse {
  products: Product[]
  total: number
  skip: number
  limit: number
}
