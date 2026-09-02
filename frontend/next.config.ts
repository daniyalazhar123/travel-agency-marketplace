/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    // Allowed optimization qualities (must include every quality value used
    // in <Image quality={...}> across the app: Hero 90, cards 85, default 75)
    qualities: [75, 85, 90],
  },
};

export default nextConfig;
