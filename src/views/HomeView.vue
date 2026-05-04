<template>
  <div class="home-view" style="background: var(--cream); min-height: 100vh;">
    <Navbar />

    <!-- Hero -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-text">
          <p class="hero-eyebrow">精選嚴選 · 品味生活</p>
          <h1 class="hero-title">探索每一件<br /><em>值得擁有</em>的好物</h1>
          <p class="hero-sub">從日常必需到精緻配件，為你的生活注入品味</p>
          <RouterLink to="/products" class="hero-btn">
            立即探索
            <span class="btn-arrow">→</span>
          </RouterLink>
        </div>
        <div class="hero-deco">
          <div class="deco-ring" />
          <div class="deco-dot" />
        </div>
      </div>
      <div class="hero-line" />
    </section>

    <!-- 分類 -->
    <section class="category-section">
      <div class="section-header">
        <span class="section-tag">CATEGORIES</span>
        <h2 class="section-title font-display">商品分類</h2>
      </div>

      <div v-if="loading" class="cat-grid">
        <div v-for="n in 12" :key="n" class="cat-skeleton" />
      </div>

      <p v-else-if="error" class="error-msg">{{ error }}</p>

      <div v-else class="cat-grid">
        <button
          v-for="category in categories"
          :key="category.slug"
          class="cat-item"
          @click="goToCategory(category.slug)"
        >
          <span class="cat-name">{{ category.name }}</span>
          <span class="cat-arrow">↗</span>
        </button>
      </div>
    </section>

    <!-- 底部裝飾帶 -->
    <div class="footer-band">
      <span v-for="n in 6" :key="n">精選好物 &nbsp;·&nbsp; </span>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import { useProductList } from '@/composables/useProductList'

const router = useRouter()
const { categories, loading, error, fetchCategories } = useProductList()

const goToCategory = (slug) => {
  router.push({ name: 'ProductList', query: { category: slug } })
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
/* Hero */
.hero {
  position: relative;
  padding: 5rem 2rem 4rem;
  max-width: 72rem;
  margin: 0 auto;
}

.hero-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.hero-text {
  flex: 1;
  max-width: 560px;
}

.hero-eyebrow {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  color: var(--gold);
  text-transform: uppercase;
  margin-bottom: 1.25rem;
}

.hero-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(2.8rem, 6vw, 5rem);
  font-weight: 600;
  line-height: 1.1;
  color: var(--ink);
  margin-bottom: 1.5rem;
}

.hero-title em {
  font-style: italic;
  color: var(--gold);
}

.hero-sub {
  font-size: 1rem;
  color: var(--muted);
  line-height: 1.7;
  margin-bottom: 2.5rem;
  max-width: 400px;
}

.hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--ink);
  color: var(--cream);
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  padding: 0.9rem 2rem;
  border-radius: 0;
  text-decoration: none;
  transition: background 0.25s, color 0.25s;
}

.hero-btn:hover {
  background: var(--gold);
  color: #fff;
}

.btn-arrow {
  transition: transform 0.25s;
}

.hero-btn:hover .btn-arrow {
  transform: translateX(4px);
}

.hero-deco {
  position: relative;
  width: 260px;
  height: 260px;
  flex-shrink: 0;
  display: none;
}

@media (min-width: 768px) {
  .hero-deco { display: block; }
}

.deco-ring {
  position: absolute;
  inset: 0;
  border: 1.5px solid var(--border);
  border-radius: 50%;
  animation: spin 24s linear infinite;
}

.deco-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  transform: translate(-50%, -50%);
  background: var(--gold-light);
  border-radius: 50%;
  opacity: 0.15;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.hero-line {
  margin-top: 4rem;
  height: 1px;
  background: var(--border);
}

/* Category */
.category-section {
  max-width: 72rem;
  margin: 0 auto;
  padding: 4rem 2rem 6rem;
}

.section-header {
  display: flex;
  align-items: baseline;
  gap: 1.25rem;
  margin-bottom: 2.5rem;
}

.section-tag {
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  color: var(--gold);
  border: 1px solid var(--gold);
  padding: 0.2rem 0.6rem;
}

.section-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2rem;
  font-weight: 600;
  color: var(--ink);
}

.cat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
}

@media (min-width: 640px) {
  .cat-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 1024px) {
  .cat-grid { grid-template-columns: repeat(6, 1fr); }
}

.cat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  background: var(--cream);
  padding: 1.25rem;
  cursor: pointer;
  border: none;
  transition: background 0.2s, color 0.2s;
  text-align: left;
  min-height: 90px;
}

.cat-item:hover {
  background: var(--ink);
  color: var(--cream);
}

.cat-name {
  font-size: 0.82rem;
  font-weight: 500;
  text-transform: capitalize;
  line-height: 1.4;
}

.cat-arrow {
  font-size: 0.9rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.cat-item:hover .cat-arrow {
  opacity: 1;
}

.cat-skeleton {
  background: #e8e3db;
  min-height: 90px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.error-msg {
  color: #b91c1c;
  font-size: 0.9rem;
}

/* Footer band */
.footer-band {
  background: var(--ink);
  color: var(--cream);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  padding: 0.75rem 0;
  white-space: nowrap;
  overflow: hidden;
  opacity: 0.85;
  text-align: center;
}
</style>
