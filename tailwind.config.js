/** @type {import('tailwindcss').Config} */

// 1. 用顏色本身命名，集中管理色碼
const palette = {
  'charcoal':   '#0f0e0c',  // 近黑棕
  'ivory':      '#faf8f4',  // 米白
  'dark-gold':  '#b8860b',  // 深金
  'light-gold': '#d4a843',  // 淺金
  'warm-gray':  '#6b6560',  // 暖灰
  'warm-beige': '#e8e3db',  // 暖米
}

export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        // 2. 展開 palette（可直接用 bg-charcoal 等）
        ...palette,
        // 3. 語意別名 → 指向 palette（改色碼只需改上方）
        ink:          palette['charcoal'],
        cream:        palette['ivory'],
        gold:         palette['dark-gold'],
        'gold-light': palette['light-gold'],
        muted:        palette['warm-gray'],
        border:       palette['warm-beige'],
      },
    },
  },
  plugins: [],
}
