// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Desactivar el modo estricto de React
  reactStrictMode: false,
  experimental: {
    // Cambiado de true a {} para ser compatible con Next.js 15
    serverActions: {},
  },
  // Configuración de imágenes más permisiva
  images: {
    domains: ["cdn.jsdelivr.net", "images.unsplash.com", "localhost", "supabase.co", "*"],
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Ignorar errores durante la construcción
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
