/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3301",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3300",
        pathname: "/uploads/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; img-src 'self' data: blob: https://*.openstreetmap.org https://cdnjs.cloudflare.com http://localhost:* https://localhost:* https://images.unsplash.com https://ui-avatars.com https://placehold.co https://res.cloudinary.com https://*.skybreath-hrm.cloud https://skybreath-hrm.cloud; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' data: http://localhost:* ws://localhost:* https://*.openstreetmap.org https://cdn.jsdelivr.net https://api.ipify.org https://*.skybreath-hrm.cloud wss://*.skybreath-hrm.cloud https://skybreath-hrm.cloud; frame-src 'self'; object-src 'none';",
          },
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
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=()",
          }
        ],
      },
    ];
  },
};

module.exports = nextConfig;
