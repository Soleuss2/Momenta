// app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Momenta — Your Shared Love Journal',
    short_name: 'Momenta',
    description: 'A stylish memory space for your shared stories.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff1f2', // matches your pink theme
    theme_color: '#e11d48',      // rose-600 to match your app
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  }
}