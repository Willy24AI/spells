/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove the 'output: export' line since we need API routes
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;