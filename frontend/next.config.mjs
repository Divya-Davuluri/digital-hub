/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://digital-hub-og1a.onrender.com';
    const backendBase = apiUrl.replace(/\/api\/?$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${backendBase}/api/:path*`
      },
      {
        source: '/uploads/:path*',
        destination: `${backendBase}/uploads/:path*`
      }
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  },
  // Memory optimization for Render Free Tier (512MB limit)
  experimental: {
    workerThreads: false,
    cpus: 1
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
