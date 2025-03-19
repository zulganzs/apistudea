/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) return config;
    
    return config;
  }
};

export default nextConfig;
