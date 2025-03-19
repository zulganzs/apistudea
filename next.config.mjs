/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle binary files
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@tensorflow/tfjs-node']
  },
  // Serve static files from the ai directory
  async rewrites() {
    return [
      {
        source: '/ai/:path*',
        destination: '/api/static/:path*',
      },
    ];
  },
  // Configure headers to allow serving model files
  async headers() {
    return [
      {
        source: '/ai/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
