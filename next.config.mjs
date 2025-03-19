/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) return config;

    // Handle native modules
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    // Don't bundle tfjs-node for server-side
    config.externals.push({
      '@tensorflow/tfjs-node': 'commonjs @tensorflow/tfjs-node'
    });

    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@tensorflow/tfjs-node']
  },
  // Increase the timeout for API routes
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb',
    },
  }
};

export default nextConfig;
