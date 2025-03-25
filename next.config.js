/** @type {import('next').NextConfig} */
const nextConfig = {
  // causes a double render in React 18
  reactStrictMode: false,
  swcMinify: true,
}

module.exports = nextConfig
