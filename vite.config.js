import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'App de Profesor',
        short_name: 'ProfeApp',
        description: 'Aplicación de gestión escolar y control de alumnos',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      // 👇 AGREGA ESTO PARA QUE FUNCIONE EN TU CELULAR DURANTE LAS PRUEBAS
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ]
})