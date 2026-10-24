import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In development, any request to /api/... is passed on to the Express
    // server on port 3000. The browser only ever talks to localhost:5173,
    // exactly like it only talks to the Vercel URL when the site is live
    // (see vercel.json), so the login cookie works the same in both.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
