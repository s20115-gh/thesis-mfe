import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // One .env.local at the repo root serves every app (see .env.example).
  envDir: '../..',
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // Name each feature's chunk after the feature (feature-booking-*.js)
        // instead of its entry file (src-*.js), so build output can be
        // compared feature by feature across configurations.
        chunkFileNames(chunk) {
          const feature = /features\/([^/]+)\/src\/index\.ts$/.exec(chunk.facadeModuleId ?? '')
          return feature ? `assets/feature-${feature[1]}-[hash].js` : 'assets/[name]-[hash].js'
        },
      },
    },
  },
})
