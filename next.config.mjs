const r2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
const r2Host = r2 ? new URL(r2).hostname : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: r2Host ? [{ protocol: "https", hostname: r2Host }] : [],
  },
};
export default nextConfig;
