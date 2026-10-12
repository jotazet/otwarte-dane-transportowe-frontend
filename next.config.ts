import type { NextConfig } from "next";

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(
  /\/+$/,
  "",
);

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // Next 16 blocks dev resources (incl. the HMR websocket) for origins other
  // than "localhost". Opening the app via http://127.0.0.1:3000 made HMR fail
  // in a retry loop and left pages stuck on loading states.
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    resolveAlias: {
      // Dev-mode fix: react-icons/md defines all ~4000 icons in ONE index.mjs
      // (~4.6 MB unminified), which Turbopack cannot tree-shake in dev - every
      // page parsed the whole barrel and `next dev` froze, while production
      // builds (minification + DCE) were fine. The alias points at a slim
      // generated module containing only the icons this app uses; component
      // imports and TypeScript types stay unchanged.
      "react-icons/md": "./lib/icons/react-icons-md.js",
    },
  },
  async rewrites() {
    return [
      {
        source: "/internal-media/:path*",
        destination: `${apiBase}/internal-media/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
