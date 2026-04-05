import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }
          if (id.includes('three')) {
            return 'vendor-three'
          }
          if (id.includes('p5')) {
            return 'vendor-p5'
          }
          if (id.includes('katex')) {
            return 'vendor-katex'
          }
          if (id.includes('vue')) {
            return 'vendor-vue'
          }
          return 'vendor-misc'
        },
      },
    },
  },
})