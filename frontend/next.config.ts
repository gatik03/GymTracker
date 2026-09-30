import type { NextConfig } from "next";

const backendApiUrl = process.env.BACKEND_API_URL;
const isDevelopment = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // Django's API URLs all end in a slash. Next would otherwise redirect
  // /api/x/ to /api/x, Django would redirect it straight back, and the
  // browser would loop. Leave the slash alone and always forward with it.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    if (!backendApiUrl) return [];
    return [{ source: "/api/:path*", destination: `${backendApiUrl}/api/:path*/` }];
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
      ],
    }];
  },
};

export default nextConfig;
