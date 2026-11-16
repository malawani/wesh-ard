import type { NextConfig } from "next";

const config: NextConfig = {
  basePath: process.env.PAGES_BASE_PATH || undefined,
  output: "export",
  trailingSlash: true
};

export default config;
