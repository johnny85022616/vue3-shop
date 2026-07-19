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
    coverage: {
      // all: true → 連沒被測試 import 的檔案也納入報表，覆蓋率才反映整個 src
      all: true,
      include: ['src/**/*.{ts,vue}'],
      // 只排除「沒有可單元測試邏輯」或「依分工歸 e2e」的檔案，不為了衝數字排除有邏輯的程式：
      // - main.js/App.vue：進入點/掛載，無邏輯可測
      // - router/index.ts：路由表為設定；守衛（requiresAuth 導轉、空車擋單）屬跨頁行為，
      //   依 .claude/skills/e2e 準則歸 Playwright e2e（login.spec 已覆蓋）
      // - types/env.d.ts：純型別宣告，執行期無程式碼
      // 註：views 不再整包排除——有邏輯的 view 已補元件測試並納入分母。
      exclude: [
        'src/main.js',
        'src/App.vue',
        'src/router/**',
        'src/types/**',
        'src/env.d.ts',
      ],
      // 回歸防線：低於 80% 讓 test:coverage 失敗。
      // 刻意設在目前實際值（stmts/lines 90%+）以下，只擋「覆蓋率倒退」，
      // 不製造「為了不讓 CI 紅而硬湊測試」的壓力。
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
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
