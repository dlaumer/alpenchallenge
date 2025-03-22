import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/alpenchallenge/", // IMPORTANT: Set this to your repo name
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined, // Avoid excessive chunking
      },
    },
  },
  define: {
    "process.env": {},
  },
  optimizeDeps: {
    exclude: ["@arcgis/core"],
  },
})
