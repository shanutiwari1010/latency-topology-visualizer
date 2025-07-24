// next.config.js
/** @type {import('next').NextConfig} */
import { Configuration } from "webpack";
const nextConfig = {
  webpack: (config: Configuration, { isServer }: { isServer: boolean }) => {
    config?.module?.rules?.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: "raw-loader",
      exclude: /node_modules/,
    });

    if (!isServer) {
      if (config && config.resolve) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
        };
      }
    }

    return config;
  },
  images: {
    domains: [],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
