import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives in a subfolder of a larger repo (the Expo app at the root has
  // its own lockfile). Pin the project root to web/ so Next doesn't infer the
  // repo root for file tracing / HMR.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
