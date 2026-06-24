/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during `next build` — linting runs separately in CI.
  // This prevents Docker builds from failing due to ESLint warnings/errors.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type-checking during builds for the same reason.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
