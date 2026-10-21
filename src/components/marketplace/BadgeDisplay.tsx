import React from "react";
import { Award, Sparkles, ShieldCheck } from "lucide-react";
import { BadgeType } from "@prisma/client";

export default function BadgeDisplay({ badge }: { badge: BadgeType }) {
  if (!badge || badge === "NONE") return null;


const styles: Record<string, string> = {
  DIAMOND: "bad-diamond text-white",
  GOLD: "bad-gold text-white",
  SILVER: "bad-silver text-white",
  VERIFIED: "bad-verified text-white",
};


  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-sm uppercase tracking-wider ${styles[badge] || ""}`}>
      <Sparkles className="w-3.5 h-3.5" />
      {badge}
    </span>
  );
}