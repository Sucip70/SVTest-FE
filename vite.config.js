import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig({
  base: '/SVTest-FE/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://svtest-1014951496037.asia-southeast2.run.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            if (process.env.SVTEST_IDENTITY_TOKEN) {
              proxyReq.setHeader('Authorization', `bearer ${process.env.SVTEST_IDENTITY_TOKEN}`)
            }
          })
        },
      },
    },
  },
})