const r2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
const r2Host = r2 ? new URL(r2).hostname : null;
const sit = new URL(process.env.SIT_API_URL || "https://sitbemui.com/api/website/v1");
const sitMedia = {
  protocol: sit.protocol.slice(0, -1),
  hostname: sit.hostname,
  port: sit.port,
  pathname: `${sit.pathname.replace(/\/+$/, "")}/media/**`,
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [sitMedia, ...(r2Host ? [{ protocol: "https", hostname: r2Host }] : [])],
  },
};
export default nextConfig;
