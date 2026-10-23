import React from "react";

export const GalleryBlock: React.FC<{ images: Array<{ url: string; alt?: string; caption?: string }> }> = ({ images }) => {
  if (!images || images.length === 0) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-6">
      {images.map((img, idx) => (
        <div key={idx} className="overflow-hidden rounded-lg border bg-gray-50">
          <img src={img.url} alt={img.alt || `Gallery ${idx + 1}`} className="w-full h-48 object-cover hover:scale-105 transition duration-300" />
        </div>
      ))}
    </div>
  );
};