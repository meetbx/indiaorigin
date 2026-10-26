import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import AuthProvider from "@/components/providers/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL = "https://theindiaorigin.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "The India Origin | Connecting Global Buyers with Verified Indian Manufacturers",
    template: "%s | The India Origin",
  },
  description: "Direct-from-source B2B marketplace bridging verified Indian manufacturers with global wholesale buyers.",
  keywords: ["B2B marketplace India", "Indian manufacturers", "wholesale suppliers India", "direct sourcing India"],
  authors: [{ name: "The India Origin" }],
  creator: "The India Origin",
  publisher: "The India Origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "The India Origin",
    title: "The India Origin | Connecting Global Buyers with Verified Indian Manufacturers",
    description: "Direct-from-source B2B marketplace bridging verified Indian manufacturers with global wholesale buyers.",
    images: [
      {
        url: "/og-image.jpg", // Make sure to place an og-image.jpg in your public folder
        width: 1200,
        height: 630,
        alt: "The India Origin B2B Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The India Origin",
    description: "Direct-from-source B2B marketplace bridging verified Indian manufacturers with global wholesale buyers.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "The India Origin",
    "url": BASE_URL,
    "logo": `${BASE_URL}/favicon/apple-touch-icon.png`,
    "description": "Direct-from-source B2B marketplace bridging verified Indian manufacturers with global wholesale buyers.",
    "areaServed": "Worldwide",
    "audience": {
      "@type": "BusinessAudience",
      "audienceType": "Global B2B Buyers, Importers, Wholesalers"
    }
  };

  return (
    <html lang="en">
      <head>
        {/* Structured Data for AI Discovery & Search Engines */}
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
  }}
/>
      </head>
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
    
        {/* Fixed Mobile Bottom Navigation */}
        <BottomNav />
      </body>
    </html>
  );
}