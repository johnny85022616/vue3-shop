// 已拆分為獨立 composable，請直接使用以下兩個檔案：
// - useProductList.ts：商品列表、分類、搜尋（給 ProductListView、HomeView 使用）
// - useProductDetail.ts：單一商品詳情（給 ProductDetailView 使用）
export { useProductList } from './useProductList'
export { useProductDetail } from './useProductDetail'
