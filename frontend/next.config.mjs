/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://digital-hub-3h88.onrender.com/api/:path*'
      }
    ];
  },
  images: {
    unoptimized: true,
    domains: [
      'digital-hub-3h88.onrender.com',
      'i.imgur.com',
      'i.postimg.cc'
    ]
  },
  trailingSlash: true,
};

export default nextConfig;
