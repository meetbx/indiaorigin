
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "About The India Origin – Connecting Indian Manufacturers with Buyers",
  description:
    "Discover The India Origin, an Indian B2B manufacturing marketplace connecting manufacturers, suppliers and buyers across India and global markets.",
  alternates: {
    canonical: "https://www.theindiaorigin.com/about-us",
  },
  openGraph: {
    title: "About The India Origin",
    description:
      "Discover Indian manufacturers and connect directly with suppliers through The India Origin.",
    url: "https://www.theindiaorigin.com/about-us",
    siteName: "The India Origin",
    type: "website",
  },
};


const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.theindiaorigin.com/#organization",
  "name": "The India Origin",
  "alternateName": [
    "The India Origin Marketplace",
    "theindiaorigin.com"
  ],
  "url": "https://www.theindiaorigin.com/",
  "logo": {
    "@type": "ImageObject",
    "url": "https://www.theindiaorigin.com/_next/image?url=%2Fimages%2Findiaorigin-logo.png&w=640&q=75"
  },
  "description":
    "The India Origin is an Indian B2B manufacturing marketplace connecting manufacturers, suppliers and buyers across India and international markets.",
  "knowsAbout": [
    "Indian Manufacturing",
    "B2B Marketplace",
    "Indian Manufacturers",
    "Industrial Products",
    "Product Sourcing",
    "Manufacturing Suppliers"
  ]
};


export default function AboutUsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema)
            .replace(/</g, "\\u003c"),
        }}
      />

      <main className="min-h-screen bg-white text-slate-900">
        <section className="mx-auto max-w-6xl px-6 py-20">
          <p className="mb-4 font-semibold text-[#FF5500]">
            ABOUT THE INDIA ORIGIN
          </p>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            Discover Indian Manufacturers.
            <span className="text-[#FF5500]">
              {" "}Connect Directly.
            </span>
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-600">
            The India Origin is an Indian B2B manufacturing
            marketplace built to make India's manufacturing
            capabilities more accessible to businesses across
            India and around the world.
          </p>

          <div className="mt-16 grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold">Our Story</h2>
              <p className="mt-4 leading-8 text-slate-600">
                India has a vast manufacturing ecosystem,
                producing everything from industrial machinery
                and engineering components to textiles, chemicals,
                building materials and consumer products.
              </p>
              <p className="mt-4 leading-8 text-slate-600">
                Yet discovering the right manufacturer is not
                always easy. Business information, products and
                manufacturing capabilities are often scattered
                across multiple platforms.
              </p>
              <p className="mt-4 leading-8 text-slate-600">
                We started The India Origin with a simple idea:
                create a dedicated digital platform where Indian
                manufacturers can showcase what they make and
                buyers can discover potential suppliers more easily.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold">Our Mission</h2>
              <p className="mt-4 leading-8 text-slate-600">
                To make Indian manufacturers easier to discover,
                helping businesses find manufacturing partners
                and creating greater visibility for products
                made in India.
              </p>

              <h2 className="mt-10 text-2xl font-bold">
                Our Vision
              </h2>
              <p className="mt-4 leading-8 text-slate-600">
                To build a trusted global discovery platform
                for Indian manufacturing, where businesses
                worldwide can explore India's manufacturing
                capabilities and connect directly with manufacturers.
              </p>
            </div>
          </div>

          <section className="mt-20">
            <h2 className="text-3xl font-bold">What We Do</h2>
            <p className="mt-5 max-w-3xl leading-8 text-slate-600">
              The India Origin helps connect India's manufacturing
              ecosystem with businesses looking for products
              and manufacturing partners.
            </p>

            <ul className="mt-8 grid gap-5 sm:grid-cols-2">
              {[
                "Discover manufacturers across different industries.",
                "Explore products manufactured in India.",
                "View manufacturer profiles and business information.",
                "Compare product offerings and capabilities.",
                "Connect directly with manufacturers for enquiries."
              ].map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-slate-200 p-5 leading-7"
                >
                  <span className="mr-2 text-[#FF5500]">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-20 rounded-2xl bg-slate-50 p-8 md:p-12">
            <h2 className="text-3xl font-bold">
              Be Part of India's Manufacturing Story
            </h2>
            <p className="mt-5 max-w-2xl leading-8 text-slate-600">
              Whether you are a manufacturer looking to expand
              your reach or a buyer searching for manufacturing
              partners, The India Origin welcomes you.
            </p>

            <p className="mt-8 text-xl font-semibold text-[#FF5500]">
              Rooted in India. Ready for the World.
            </p>

            <a
              href="/"
              className="mt-8 inline-flex rounded-lg bg-[#FF5500] px-7 py-3 font-semibold text-white hover:bg-orange-600"
            >
              Explore Manufacturers
            </a>
          </section>
        </section>
      </main>
    </>
  );
}
