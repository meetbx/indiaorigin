import React from "react";

export const HeadingBlock: React.FC<{ content: string; level?: "h1" | "h2" | "h3" }> = ({ content, level = "h2" }) => {
  if (level === "h1") return <h1 className="text-3xl font-extrabold text-gray-900 my-4">{content}</h1>;
  if (level === "h3") return <h3 className="text-xl font-bold text-gray-800 my-3">{content}</h3>;
  return <h2 className="text-2xl font-bold text-gray-900 my-4 border-b pb-2">{content}</h2>;
};