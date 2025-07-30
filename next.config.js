/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['formidable'],
  },
  // Configure body size limits for API routes
  serverRuntimeConfig: {
    // Will only be available on the server side
    maxBodySize: '10mb', // For small files only
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    maxFileSize: '500mb',
  },
  // Simple config for Render deployment
  async redirects() {
    return [
      {
        source: '/',
        destination: '/home',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
