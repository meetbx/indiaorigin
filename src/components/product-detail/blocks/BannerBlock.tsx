import React from "react";

export const BannerBlock: React.FC<{ imageUrl: string; title?: string; subtitle?: string }> = ({ imageUrl, title, subtitle }) => {
  if (!imageUrl) return null;
  return (
    <div className="relative my-6 rounded-xl overflow-hidden shadow-md">
      <img src={imageUrl} alt={title || "Banner"} className="w-full h-64 object-cover" />
      {(title || subtitle) && (
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-white p-6 text-center">
          {title && <h3 className="text-2xl md:text-3xl font-bold">{title}</h3>}
          {subtitle && <p className="text-sm md:text-base mt-2 opacity-90">{subtitle}</p>}
        </div>
      )}
    </div>
  );
};