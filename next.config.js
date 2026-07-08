/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimização de imagens
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    unoptimized: false,
  },

  // Otimização do compilador
  swcMinify: true,
  compress: true,

  // Headers de segurança
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Otimização de React
  reactStrictMode: true,

  // Configurações do Webpack (se necessário no futuro)
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig;