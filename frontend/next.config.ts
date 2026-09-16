import type { NextConfig } from "next";

const backendApiUrl = process.env.BACKEND_API_URL;

const nextConfig: NextConfig = {
  async rewrites() {
    if (!backendApiUrl) return [];
    return [{ source: "/api/:path*", destination: `${backendApiUrl}/api/:path*` }];
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Content-Security-Policy", value: "default-src \x27self\x27; script-src \x27self\x27 \x27unsafe-inline\x27; style-src \x27self\x27 \x27unsafe-inline\x27; img-src \x27self\x27 data: blob:; font-src \x27self\x27 data:; connect-src \x27self\x27; frame-ancestors \x27none\x27; base-uri \x27self\x27; form-action \x27self\x27" },
      ],
    }];
  },
};

export default nextConfig;
