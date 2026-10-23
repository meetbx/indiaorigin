import React from "react";

export const ImageTextBlock: React.FC<{
  imageUrl: string;
  alt?: string;
  heading?: string;
  text: string;
  imagePosition?: "left" | "right";
}> = ({ imageUrl, alt = "", heading, text, imagePosition = "left" }) => {
  return (
    <div className={`flex flex-col md:flex-row gap-6 items-center my-8 ${imagePosition === "right" ? "md:flex-row-reverse" : ""}`}>
      {imageUrl && (
        <div className="w-full md:w-1/2">
          <img src={imageUrl} alt={alt} className="w-full rounded-lg object-cover h-64 shadow-sm" />
        </div>
      )}
      <div className="w-full md:w-1/2 space-y-3">
        {heading && <h3 className="text-xl font-bold text-gray-900">{heading}</h3>}
        <p className="text-gray-700 leading-relaxed text-base">{text}</p>
      </div>
    </div>
  );
};