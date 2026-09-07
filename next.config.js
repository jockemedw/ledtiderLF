/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // /api/pptx läser lokalforsorjning.html i runtime (lib/sid-innehall.js).
    // Sökvägen byggs dynamiskt och spåras därför inte automatiskt av Next.
    outputFileTracingIncludes: {
      '/api/pptx': ['./lokalforsorjning.html'],
    },
  },
};

module.exports = nextConfig;
