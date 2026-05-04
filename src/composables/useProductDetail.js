import { ref } from 'vue'
import { getProductById } from '@/api/product'

export function useProductDetail() {
  const product = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const fetchProductById = async (id) => {
    loading.value = true
    error.value = null
    product.value = null
    try {
      const res = await getProductById(id)
      product.value = res.data
    } catch (e) {
      error.value = e.message || '載入商品詳情失敗'
    } finally {
      loading.value = false
    }
  }

  return {
    product,
    loading,
    error,
    fetchProductById,
  }
}
