import React from "react";

export const ImageBlock: React.FC<{ url: string; alt?: string; caption?: string }> = ({ url, alt = "", caption }) => {
  if (!url) return null;
  return (
    <figure className="my-6">
      <img src={url} alt={alt} className="w-full rounded-lg object-cover max-h-[500px] shadow-sm" />
      {caption && <figcaption className="text-center text-sm text-gray-500 mt-2">{caption}</figcaption>}
    </figure>
  );
};