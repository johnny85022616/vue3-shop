<script setup>
import { ref } from 'vue'

// ===== Radio：單選（水果）=====
const products = ref([
  { id: 1, name: 'apple', price: 100 },
  { id: 2, name: 'banana', price: 200 },
  { id: 3, name: 'peach', price: 300 },
])
const selected = ref(null)          // 存被選中的整個物件

// ===== Checkbox：多選（飲料）=====
// 資料本身不帶 chose
const drinks = ref([
  { id: 1, name: 'coffee', price: 60 },
  { id: 2, name: 'tea', price: 50 },
  { id: 3, name: 'juice', price: 70 },
])
// v-model 綁這個陣列，:value 綁整個物件 → 這裡直接就是「已勾選的物件」
const checkedDrinks = ref([])
</script>

<template>
  <!-- Radio：單選，靠 :value + 共用 selected 達成互斥 -->
  <h3>單選商品（Radio）</h3>
  <label v-for="item in products" :key="item.id">
    <input type="radio" v-model="selected" :value="item" />
    {{ item.name }} (${{ item.price }})
  </label>
  <p>選中：{{ selected?.name }}（${{ selected?.price }}）</p>

  <hr />

  <!-- Checkbox：多選，v-model 綁陣列、:value 綁整個物件 -->
  <h3>多選商品（Checkbox）</h3>
  <label v-for="drink in drinks" :key="drink.id">
    <input type="checkbox" v-model="checkedDrinks" :value="drink" />
    {{ drink.name }} (${{ drink.price }})
  </label>
  <!-- checkedDrinks 本身就是已勾選的物件陣列，直接用 -->
  <p>已選：{{ checkedDrinks.map(d => d.name).join('、') || '（無）' }}</p>
  <p>總價：${{ checkedDrinks.reduce((sum, d) => sum + d.price, 0) }}</p>
</template>
