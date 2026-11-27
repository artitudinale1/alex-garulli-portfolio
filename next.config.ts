import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  agentRules: false,
  serverExternalPackages: ["agentic-publishing-lab", "openai", "cloudinary"],
};

export default nextConfig;
