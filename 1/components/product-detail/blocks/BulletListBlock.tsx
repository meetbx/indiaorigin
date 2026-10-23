import React from "react";

export const BulletListBlock: React.FC<{ items: string[] }> = ({ items }) => {
  if (!items || items.length === 0) return null;
  return (
    <ul className="list-disc list-inside space-y-2 my-4 text-gray-700 pl-2">
      {items.map((item, idx) => (
        <li key={idx} className="text-base">{item}</li>
      ))}
    </ul>
  );
};