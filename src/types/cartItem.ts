export interface CartItem {
  id: number       // 對應 Product.id，用於識別是否為同一商品
  title: string    // 商品名稱，用於購物車列表顯示
  price: number    // 單件價格，用於計算小計與總價
  image: string    // 縮圖 URL（來自 Product.thumbnail），用於購物車列表顯示
  quantity: number // 加入購物車的數量
}
