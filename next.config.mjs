/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // يتجاوز أخطاء الـ ESLint أثناء الـ build على Vercel لتفادي توقف النشر
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // ✅ هذا هو السطر السحري الذي سيحل مشكلة رفع الصور الكبيرة
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;