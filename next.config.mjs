/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '6GB'
    }
  },
  reactStrictMode: false
};

export default nextConfig;
