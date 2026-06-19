import { ref } from 'vue'
import { getProductById } from '@/api/product'
import type { Product } from '@/types/product'

export function useProductDetail() {
  const product = ref<Product | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchProductById = async (id: string) => {
    loading.value = true
    error.value = null
    product.value = null
    try {
      product.value = await getProductById(id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '載入商品詳情失敗'
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
