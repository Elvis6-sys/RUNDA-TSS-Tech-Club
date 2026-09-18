import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // CRITICAL: Disable PWA for both development AND production
  // Service worker causes crashes in Electron when precaching fails
  disable: true,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      // Lesson API — network first, fall back to cache when offline
      {
        urlPattern: /^https?.*\/api\/lessons/,
        handler: "NetworkFirst",
        options: {
          cacheName: "lessons-api-cache",
          expiration: { maxEntries: 64, maxAgeSeconds: 7 * 24 * 60 * 60 },
          networkTimeoutSeconds: 5,
        },
      },
      // App pages — network first
      {
        urlPattern: /^https?:\/\/localhost(:\d+)?\/(dashboard|lessons|resources|projects|events)/,
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-cache",
          expiration: { maxEntries: 32, maxAgeSeconds: 7 * 24 * 60 * 60 },
          networkTimeoutSeconds: 5,
        },
      },
      // Static assets — cache first
      {
        urlPattern: /\.(?:js|css|woff2?|png|jpg|jpeg|svg|ico)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: { maxEntries: 128, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone", // Required for Electron packaging
  images: {
    unoptimized: true,
  },
  // Speed up builds by skipping lint and type check
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withPWA(nextConfig);
