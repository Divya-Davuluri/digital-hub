/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export' to enable full dynamic SSR
  // This ensures role-based routing and protected routes work correctly on Render
  images: {
    unoptimized: true,
  },
  // Keep trailingSlash to match your current URL structure if needed
  trailingSlash: true,
};

export default nextConfig;
