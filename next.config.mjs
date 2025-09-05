/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: false, // Disable strict typing for routes to allow string URLs
  },
  typescript: {
    // Allow production builds to succeed even if there are type errors
    ignoreBuildErrors: false,
  },
  eslint: {
    // Allow production builds to succeed even if there are ESLint errors
    ignoreDuringBuilds: false,
  },
  poweredByHeader: false,
  compress: true,
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },
}

export default nextConfig
