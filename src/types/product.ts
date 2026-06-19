// 對應 https://dummyjson.com/products 回傳的商品資料結構
export interface Product {
  id: number        // 商品唯一識別碼
  title: string     // 商品名稱
  description: string // 商品描述文字
  category: string  // 所屬分類（slug 格式，例如 "smartphones"）
  price: number     // 商品價格（美元）
  rating: number    // 平均評分（0–5）
  thumbnail: string // 單張縮圖 URL，用於列表、購物車等小圖場景
  images: string[]  // 完整圖片 URL 陣列，用於詳情頁展示多張圖片
}

// 對應 https://dummyjson.com/products/categories 回傳的分類資料結構
export interface Category {
  slug: string // 分類的 URL 識別碼（例如 "smartphones"），用於 API 查詢
  name: string // 分類的顯示名稱（例如 "Smartphones"）
  url: string  // 該分類的 API endpoint URL
}

// 對應 /products、/products/category/:slug、/products/search 的回傳格式
export interface ProductListResponse {
  products: Product[] // 當前頁的商品陣列
  total: number       // 符合條件的商品總筆數（用於判斷是否還有更多）
  skip: number        // 本次回傳跳過的筆數（已載入的累計數量）
  limit: number       // 本次回傳的最大筆數上限
}
