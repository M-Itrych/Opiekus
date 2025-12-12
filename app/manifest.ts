import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Opiekus - System zarządzania przedszkolem',
    short_name: 'Opiekus',
    description: 'Aplikacja do zarządzania przedszkolem - komunikacja z rodzicami, dokumenty, obecności',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0ea5e9',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/global/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
    categories: ['education', 'productivity'],
  }
}