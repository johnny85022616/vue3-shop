import { ref } from 'vue'
import {
  getProducts,
  getCategories,
  getProductsByCategory,
  searchProducts,
} from '@/api/product'

export function useProductList() {
  const products = ref([])
  const categories = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchProducts = async (params) => {
    loading.value = true
    error.value = null
    try {
      const res = await getProducts(params)
      products.value = res.data.products
    } catch (e) {
      error.value = e.message || '載入商品失敗'
    } finally {
      loading.value = false
    }
  }

  const fetchCategories = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await getCategories()
      categories.value = res.data
    } catch (e) {
      error.value = e.message || '載入分類失敗'
    } finally {
      loading.value = false
    }
  }

  const fetchProductsByCategory = async (category) => {
    loading.value = true
    error.value = null
    try {
      const res = await getProductsByCategory(category)
      products.value = res.data.products
    } catch (e) {
      error.value = e.message || '載入分類商品失敗'
    } finally {
      loading.value = false
    }
  }

  const fetchSearchProducts = async (query) => {
    loading.value = true
    error.value = null
    try {
      const res = await searchProducts(query)
      products.value = res.data.products
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
    error,
    fetchProducts,
    fetchCategories,
    fetchProductsByCategory,
    fetchSearchProducts,
  }
}
