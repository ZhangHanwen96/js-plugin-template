import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import { viteSingleFile } from 'vite-plugin-singlefile'
import svgr from 'vite-plugin-svgr'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 6003
  },
  root: './ui-src',
  plugins: [
    reactRefresh(),
    viteSingleFile(),
    svgr({
      exportAsDefault: true,
      svgrOptions: {
        icon: true
      }
    })
  ],
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    outDir: '../dist',
    rollupOptions: {
      output: {
        manualChunks: () => 'everything.js',
        entryFileNames: `assets/bundle.js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'ui-src')
    }
  }
})
