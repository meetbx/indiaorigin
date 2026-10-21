import React from "react";
import Image from "next/image";

export interface DetailBlock {
  id?: string;
  type: string;
  content?: string;
  text?: string;
  title?: string;
  value?: string;
  items?: Array<{ key: string; value: string } | string>;
  url?: string;
  src?: string;
  alt?: string;
  [key: string]: any;
}

interface ProductDetailsRendererProps {
  blocks: DetailBlock[];
}

export function ProductDetailsRenderer({ blocks }: ProductDetailsRendererProps) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3.5 text-gray-800">
      {blocks.map((block, index) => {
        const blockId = block.id || `block-${index}`;

        switch (block.type) {
          case "heading":
          case "header":
          case "h2":
          case "h3": {
            const headingText = block.content || block.title || block.text;
            if (!headingText) return null;
            return (
              <h3
                key={blockId}
                className="text-sm font-bold text-gray-900 pt-2 pb-1 border-b border-gray-100"
              >
                {headingText}
              </h3>
            );
          }

          case "paragraph":
          case "text":
          case "description": {
            const textContent = block.content || block.text || block.value;
            if (!textContent) return null;
            return (
              <p
                key={blockId}
                className="text-xs text-gray-600 leading-relaxed"
              >
                {textContent}
              </p>
            );
          }

          case "specifications_table":
          case "table":
          case "specs": {
            const tableTitle = block.title || block.name;
            const items = block.items || block.rows || [];
            return (
              <div key={blockId} className="my-3 space-y-1.5">
                {tableTitle && (
                  <h4 className="text-xs font-semibold text-gray-900">
                    {tableTitle}
                  </h4>
                )}
                <div className="border border-gray-100 rounded-lg overflow-hidden bg-gray-50/50">
                  <table className="w-full text-xs text-left border-collapse">
                    <tbody>
                      {items.map((item: any, idx: number) => {
                        const keyName = item.key || item.label || item.name;
                        const valName = item.value || item.val;
                        return (
                          <tr
                            key={idx}
                            className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/80"}
                          >
                            <td className="py-2 px-3 font-medium text-gray-500 w-1/3 border-r border-gray-100">
                              {keyName}
                            </td>
                            <td className="py-2 px-3 text-gray-800 font-medium">
                              {valName}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }

          case "bullet_list":
          case "list": {
            const listItems = block.items || [];
            return (
              <ul key={blockId} className="list-disc list-inside space-y-1 text-xs text-gray-600 pl-1">
                {listItems.map((item: any, idx: number) => (
                  <li key={idx}>
                    {typeof item === "string" ? item : item.text || item.content || item.value}
                  </li>
                ))}
              </ul>
            );
          }

case "image":
case "banner": {
  const imageUrl = block.url || block.src || block.image || block.imageUrl;
  if (!imageUrl) return null;

  return (
    <div key={blockId} className="w-full my-3 rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm">
      <img
        src={imageUrl}
        alt={block.alt || block.caption || "Product Detail Image"}
        className="w-full h-auto object-contain block rounded-xl"
      />
      {block.caption && (
        <p className="text-center text-xs text-gray-500 py-1.5 px-3 italic bg-gray-50/50">
          {block.caption}
        </p>
      )}
    </div>
  );
}

          case "divider":
          case "hr":
            return <hr key={blockId} className="border-gray-200 my-2" />;

          default:
            return null;
        }
      })}
    </div>
  );
}