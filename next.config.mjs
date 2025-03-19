/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase the timeout for API routes
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb',
    },
  }
};

export default nextConfig;
