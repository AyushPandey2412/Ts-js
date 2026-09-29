import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 4-5 Hours (18,000 seconds) Edge & Browser Caching
  async headers() {
    return [
      {
        source: "/modules/:slug*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=18000, s-maxage=18000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/tracks/:trackId*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=18000, s-maxage=18000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/:path((?!api|_next/static|_next/image|favicon.ico).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=18000, s-maxage=18000, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
