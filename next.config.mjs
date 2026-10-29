/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdf-parse reads files at import time; keep it out of the server bundle.
    serverComponentsExternalPackages: ["pdf-parse"],
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
