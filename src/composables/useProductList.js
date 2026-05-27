import { ref } from 'vue'
import {
  getProducts,
  getCategories,
  getProductsByCategory,
  searchProducts,
} from '@/api/product'

const LIMIT = 6

// module-level 快取：整個 app 生命週期只打一次分類 API
let categoriesCache = null

export function useProductList() {
  const products = ref([])       // 目前顯示的商品列表
  const categories = ref(categoriesCache ?? []) // 所有分類
  const loading = ref(false)     // 初始載入中（顯示 skeleton）
  const loadingMore = ref(false) // 追加載入中（顯示底部 spinner，不影響現有列表）
  const error = ref(null)        // 錯誤訊息
  const skip = ref(0)            // 下次打 API 要跳過的筆數（已載入的總筆數）
  const total = ref(0)           // API 回傳的商品總筆數
  const hasMore = ref(false)     // 是否還有更多商品可以載入

  const fetchProducts = async () => {
    loading.value = true
    error.value = null
    skip.value = 0
    try {
      const res = await getProducts({ limit: LIMIT, skip: 0 })
      products.value = res.data.products
      total.value = res.data.total
      hasMore.value = products.value.length < total.value
      skip.value = products.value.length
    } catch (e) {
      error.value = e.message || '載入商品失敗'
    } finally {
      loading.value = false
    }
  }

  const loadMore = async (category) => {
    if (loadingMore.value || !hasMore.value) return
    loadingMore.value = true
    try {
      const res = category
        ? await getProductsByCategory(category, { limit: LIMIT, skip: skip.value })
        : await getProducts({ limit: LIMIT, skip: skip.value })
      products.value = [...products.value, ...res.data.products]
      skip.value = products.value.length
      hasMore.value = products.value.length < total.value
    } catch (e) {
      error.value = e.message || '載入更多失敗'
    } finally {
      loadingMore.value = false
    }
  }

  const fetchCategories = async () => {
    // 已有快取則直接用，不打 API
    if (categoriesCache) {
      categories.value = categoriesCache
      return
    }
    loading.value = true
    error.value = null
    try {
      const res = await getCategories()
      categoriesCache = res.data
      categories.value = categoriesCache
    } catch (e) {
      error.value = e.message || '載入分類失敗'
    } finally {
      loading.value = false
    }
  }

  const fetchProductsByCategory = async (category) => {
    loading.value = true
    error.value = null
    skip.value = 0
    try {
      const res = await getProductsByCategory(category, { limit: LIMIT, skip: 0 })
      products.value = res.data.products
      total.value = res.data.total
      hasMore.value = products.value.length < total.value
      skip.value = products.value.length
    } catch (e) {
      error.value = e.message || '載入分類商品失敗'
    } finally {
      loading.value = false
    }
  }

  const fetchSearchProducts = async (query) => {
    loading.value = true
    error.value = null
    skip.value = 0
    hasMore.value = false
    try {
      const res = await searchProducts(query)
      products.value = res.data.products
      total.value = res.data.total
    } catch (e) {
      error.value = e.message || '搜尋失敗'
    } finally {
      loading.value = false
    }
  }

  return {
    products,
    categories,
    loading,
    loadingMore,
    error,
    hasMore,
    fetchProducts,
    fetchCategories,
    fetchProductsByCategory,
    fetchSearchProducts,
    loadMore,
  }
}
