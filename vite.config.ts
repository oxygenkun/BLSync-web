import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量，优先使用 .env.local，然后是 .env.<mode>，最后是 .env
  const env = loadEnv(mode, process.cwd(), '')

  // 从环境变量读取后端地址，用于开发服务器代理配置
  // 如果未设置则使用默认值 http://localhost:8000
  const backendUrl = env.VITE_API_BASE_URL || 'http://localhost:8000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/task': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: '../static',
      emptyOutDir: true,
    },
  }
})
