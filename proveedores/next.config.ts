import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives in a subfolder of a larger repo that also has its own
  // lockfile (../package-lock.json); pin the workspace root to this folder
  // so Next doesn't try to trace files outside of it.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
