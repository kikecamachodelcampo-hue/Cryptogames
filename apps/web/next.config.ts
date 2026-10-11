import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // "shared" es nuestro paquete con código común (escrito en TypeScript):
  // le decimos a Next que lo compile junto con la web.
  transpilePackages: ["shared"],
  // Permite abrir la web desde el móvil en tu red de casa (http://192.168.x.x:3000).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
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
