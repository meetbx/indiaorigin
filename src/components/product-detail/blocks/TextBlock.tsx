import React from "react";

export const TextBlock: React.FC<{ content: string }> = ({ content }) => {
  return <p className="text-gray-700 leading-relaxed my-3 whitespace-pre-line text-base">{content}</p>;
};