import { createApp } from 'vue'
import { createPinia } from 'pinia'
import naive from 'naive-ui'
import i18n from './locales'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(naive)
app.use(i18n)

app.mount('#app')
