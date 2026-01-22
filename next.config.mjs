/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  // Uncomment and set basePath if deploying to a subpath (e.g., /lotassign)
  // basePath: '/lotassign',
  // Trailing slash helps with GitHub Pages routing
  trailingSlash: true,
};

export default nextConfig;
