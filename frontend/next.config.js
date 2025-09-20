/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  webpack: (config) => {
    // Handle node modules that need polyfills
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    
    // Handle ESM modules
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    
    return config
  },
  // Enable HTTPS for localhost development
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'cross-origin',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ]
  },
  // Optimize images
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Environment variables
  env: {
    CUSTOM_KEY: 'routex-frontend',
  },
  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Build output
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
}

module.exports = nextConfig