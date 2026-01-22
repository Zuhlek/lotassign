/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  // basePath for GitHub Pages (repo name: lotassign)
  basePath: '/lotassign',
  // Trailing slash helps with GitHub Pages routing
  trailingSlash: true,
};

export default nextConfig;
