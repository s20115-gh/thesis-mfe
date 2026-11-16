import { federation } from '@module-federation/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const origin = 'http://localhost:5174'

export default defineConfig({
  // Absolute base so the remote's chunks are fetched from the remote's own
  // server, not from the shell's origin.
  base: `${origin}/`,
  server: { origin },
  plugins: [
    react(),
    federation({
      // Auto type generation fails with TypeScript 7; remote types are
      // declared by hand in the shell (src/remotes.d.ts).
      dts: false,
      name: 'remote',
      filename: 'remoteEntry.js',
      exposes: {
        './Hello': './src/Hello.tsx',
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
