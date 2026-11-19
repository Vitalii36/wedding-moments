/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: env.VITE_BASE || '/wedding-moments/',
    plugins: [vue(), tailwindcss()],
    test: {
      environment: 'happy-dom',
      include: ['tests/unit/**/*.test.ts'],
    },
  }
})
