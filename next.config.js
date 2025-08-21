/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  experimental: {
    serverComponentsExternalPackages: ['formidable'],
  },

  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/serve-upload/:path*',
      },
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/api/sitemap',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml',
          },
          {
            key: 'Cache-Control',
            value: 's-maxage=86400, stale-while-revalidate',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
