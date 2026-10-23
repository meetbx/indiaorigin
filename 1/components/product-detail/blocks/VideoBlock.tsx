import React from "react";

export const VideoBlock: React.FC<{ videoUrl: string; caption?: string }> = ({ videoUrl, caption }) => {
  if (!videoUrl) return null;
  return (
    <figure className="my-6">
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
        <iframe src={videoUrl} className="w-full h-full border-0" allowFullScreen title="Product Showcase Video" />
      </div>
      {caption && <figcaption className="text-center text-sm text-gray-500 mt-2">{caption}</figcaption>}
    </figure>
  );
};