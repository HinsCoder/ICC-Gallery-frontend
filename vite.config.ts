import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// 区分开发和生产环境
const DEV_BASE_URL = "http://localhost:8082";
const PROD_BASE_URL = "http://yourip";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api': { // 匹配所有以 /api 开头的请求
        target: PROD_BASE_URL, // 确认你的后端地址和端口
        changeOrigin: true, // 必须
      }
    }
  }
})
