import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  allowedDevOrigins: ["surviving-endocrine-widen.ngrok-free.dev"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
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
  async redirects() {
    return [
      // 301 Redirects for indexed product slugs from GSC performance data
      {
        source: "/products/joy-baby-toys-meteor-gun-soft-bullet-toy-gun-3-soft-bullets-30-feet-range-orange-grey-red-black-1793530950457",
        destination: "/products/meteor-gun-soft-bullet-toy-gun",
        permanent: true,
      },
      {
        source: "/products/heavy-duty-industrial-rubber-conveyor-belt-system-with-troughing-idler-rollers-motor-drive-assembly",
        destination: "/products/heavy-duty-industrial-rubber-conveyor-belt-system",
        permanent: true,
      },
      {
        source: "/products/industrial-rubber-conveyor-belt-system-1793526529846",
        destination: "/products/heavy-duty-industrial-rubber-conveyor-belt-system",
        permanent: true,
      },
      {
        source: "/products/plazma-power-toy-gun-soft-bullets-1793809258257",
        destination: "/products/plazma-power-foam-bullet-toy-gun",
        permanent: true,
      },
      {
        source: "/products/industrial-conveyor-roller-1793528826060",
        destination: "/products/heavy-duty-industrial-conveyor-roller-steel",
        permanent: true,
      },
      {
        source: "/products/paint-roller-for-wall-painting-1791114151030",
        destination: "/products/professional-paint-roller-for-wall-painting",
        permanent: true,
      },
      {
        source: '/products/ss316-hex-bolt-m16-100',
        destination: '/products/stainless-steel-316-hex-bolt-m16-100', // Change to your active alternative product/category URL
        permanent: true,
      },
      {
        source: "/products/plastic-cricket-bat--ball-1794375610833",
        destination: "/products/plastic-cricket-bat-toy-set-with-ball",
        permanent: true,
      },
      {
        source: "/products/building-blocks-toy-1793307190076",
        destination: "/products/45-piece-multicolour-interlocking-building-blocks",
        permanent: true,
      },
      {
        source: "/products/Acrylic-Jacuzzi-Bathtub-480242",
        destination: "/products/acrylic-freestanding-jacuzzi-bathtub",
        permanent: true,
      },
      {
        source: "/products/premium-tiles-manufacturer-supplier-floor-wall-vitrified-tiles-1794677891629",
        destination: "/products/premium-floor-wall-vitrified-tiles",
        permanent: true,
      },
      {
        source: "/products/premium-black-gold-designer-wall-clock-elegant-decorative-quartz-wall-clock-for-home-1794745720213",
        destination: "/products/premium-black-gold-designer-wall-clock",
        permanent: true,
      },
      {
        source: "/manufacturers/doller-gift-and-time-39zi8",
        destination: "/manufacturers/dollar-gift-and-time-morbi",
        permanent: true,
      },
                  {
        source: "/manufacturers/jbt-toys",
        destination: "/manufacturers/jbt-toys-morbi",
        permanent: true,
      },
      {
        source: "/products/premium-16-inch-luxury-designer-wall-clock-elegant-cream-golden-frame-with-wooden-centre-model-no-124-1794745966451",
        destination: "/products/luxury-16-inch-designer-wall-clock-wooden-centre-model-124",
        permanent: true,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
