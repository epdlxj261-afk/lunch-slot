import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 개발 중 /api 요청을 FastAPI(8001)로 넘긴다.
    proxy: {
      '/api': 'http://127.0.0.1:8001',
    },
  },
})
