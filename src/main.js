import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia()) // 註冊 Pinia 狀態管理
app.use(router)        // 註冊 Vue Router
app.mount('#app')
