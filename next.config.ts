import type { NextConfig } from 'next';

const isCapacitor = process.env.NEXT_BUILD_TARGET === 'capacitor';

const nextConfig: NextConfig = {
  output: isCapacitor ? 'export' : 'standalone',
  // Static export for Capacitor: disable server-based image optimisation
  ...(isCapacitor && { images: { unoptimized: true } }),
};

export default nextConfig;
