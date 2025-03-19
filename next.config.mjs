/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle .node files
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    // Prevent webpack from trying to bundle native modules
    if (isServer) {
      config.externals.push({
        '@tensorflow/tfjs-node': 'commonjs @tensorflow/tfjs-node',
      });
    }

    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@tensorflow/tfjs-node']
  }
};

export default nextConfig;
