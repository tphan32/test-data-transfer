/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5GB'
    }
  },
  reactStrictMode: false
};

export default nextConfig;
