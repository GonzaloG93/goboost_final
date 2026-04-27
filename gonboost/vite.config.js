import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'

  return {
    plugins: [
      react({
        jsxRuntime: 'automatic'
      }),
      mode === 'analyze' && visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),

    server: {
      port: 3000,
      host: true,
      open: false,
      proxy: !isProduction ? {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: env.VITE_SOCKET_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          ws: true
        }
      } : undefined,
    },

    build: {
      outDir: 'dist',
      sourcemap: false,
      emptyOutDir: true,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      },
      chunkSizeWarningLimit: 800,
      target: 'es2020',
      reportCompressedSize: true,
    },

    base: '/',

    resolve: {
      // ✅ Evitar instancias duplicadas de i18n con Vite HMR
      dedupe: ['i18next', 'react-i18next'],
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@pages': '/src/pages',
        '@context': '/src/context',
        '@utils': '/src/utils',
        '@hooks': '/src/hooks',
        '@assets': '/src/assets'
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
    },

    preview: {
      port: 3000,
      host: true,
    },

    css: {
      devSourcemap: false,
      postcss: './postcss.config.js'
    },

    define: {
      __APP_VERSION__: JSON.stringify('1.0.0'),
      'process.env.NODE_ENV': JSON.stringify(mode)
    },
  }
})
