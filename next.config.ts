import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app so Turbopack ignores stray lockfiles
  // higher up the filesystem (e.g. a package-lock.json in the home directory).
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
