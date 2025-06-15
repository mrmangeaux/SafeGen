/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Remove the env section since we're using process.env directly
  // The environment variables will be loaded from .env files and Vercel environment
}

module.exports = nextConfig 