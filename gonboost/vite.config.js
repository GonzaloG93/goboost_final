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
        // ✅ Se eliminó la propiedad "babel" – Terser ya elimina los console en producción
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
          rewrite: (path) => path.replace(/^\/api/, '/api')
        },
        '/socket.io': {
          target: env.VITE_SOCKET_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          ws: true
        }
      } : undefined,
      cors: !isProduction,
      headers: {
        'X-Content-Type-Options': 'nosniff'
      }
    },

    build: {
      outDir: 'dist',
      sourcemap: isProduction ? false : 'hidden',
      emptyOutDir: true,
      minify: isProduction ? 'terser' : 'esbuild',
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
          passes: 2
        },
        mangle: {
          properties: {
            regex: /^_/
          }
        },
        format: {
          comments: false
        }
      } : undefined,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        },
        onwarn: (warning, warn) => {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
          if (warning.code === 'SOURCEMAP_ERROR') return
          warn(warning)
        }
      },
      chunkSizeWarningLimit: 800,
      target: 'es2020',
      cssTarget: 'chrome80',
      reportCompressedSize: true,
      assetsInlineLimit: 4096
    },

    base: isProduction ? '/' : '/',

    resolve: {
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
      strictPort: true,
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    },

    css: {
      devSourcemap: !isProduction,
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: isProduction
          ? '[hash:base64:8]'
          : '[name]__[local]__[hash:base64:5]'
      },
      postcss: './postcss.config.js'
    },

    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
      legalComments: 'none'
    },

    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      'process.env.NODE_ENV': JSON.stringify(mode)
    },

    cacheDir: '.vite/cache',

    assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.hdr']
  }
})