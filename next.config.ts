import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["surviving-endocrine-widen.ngrok-free.dev"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
protocol: "https",
hostname: "img.freepik.com",
},
    ],
  },
};

export default nextConfig;