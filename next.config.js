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
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://ecoutertranscribe.tech',
  },
  // THE REDIRECTS FUNCTION HAS BEEN REMOVED FROM HERE
  
  // Ensure public assets are served correctly
  images: {
    domains: ['ecoutertranscribe.tech'],
  },
}

module.exports = nextConfig
