import { defineConfig, configDefaults } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',  // 模擬瀏覽器 DOM 環境
    globals: true,         // 不需要 import describe/test/expect，直接使用
    // e2e 用 Playwright 跑，vitest 不要撿 e2e/*.spec.ts（副檔名剛好也是 .spec.ts）
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
  build: {
    rollupOptions: {
      output: {
        // 將所有第三方套件統一打包進 vendor.js，讓應用程式碼更新時瀏覽器可繼續使用快取
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
})
