import type { NextConfig } from "next";
import packageJson from "./package.json";

const appVersion = (
  process.env.NEXT_PUBLIC_APP_VERSION ||
  process.env.ICONFIGLY_VERSION ||
  packageJson.version
).replace(/^v/, "");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  devIndicators: false,
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
