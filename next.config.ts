import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Force Turbopack to treat this directory as the workspace root.
    // Prevents chunk resolution from pointing at the parent repo when
    // multiple lockfiles exist (e.g. /home/no13/Projects).
    root: __dirname,
  },
};

export default nextConfig;
