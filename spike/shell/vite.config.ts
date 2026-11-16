import { federation } from '@module-federation/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  server: { origin: 'http://localhost:5173' },
  plugins: [
    react(),
    federation({
      // Auto type generation fails with TypeScript 7; remote types are
      // declared by hand in the shell (src/remotes.d.ts).
      dts: false,
      name: 'shell',
      remotes: {
        remote: {
          type: 'module',
          name: 'remote',
          entry: 'http://localhost:5174/remoteEntry.js',
        },
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'react-router': { singleton: true },
        '@tanstack/react-query': { singleton: true },
        '@supabase/supabase-js': { singleton: true },
      },
    }),
  ],
})
