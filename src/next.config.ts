import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    // Type assertion to tell TypeScript that `turbopack` is expected here,
    // even if it's not explicitly in the `ExperimentalConfig` type.
    ...(process.env.NODE_ENV === 'development' && {
      turbopack: {
        root: path.join(__dirname, './'),
      },
    }),
  } as any, // Assert the entire experimental object as 'any' or a more specific type if known
};

export default nextConfig;
