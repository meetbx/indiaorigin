import { MarketShare } from "@/lib/product-normalizer";

interface MarketsSectionProps {
  markets: MarketShare[];
}

export default function SupplierMarketsSection({ markets }: MarketsSectionProps) {
  if (!markets || markets.length === 0) return null;

  return (
    <div className="bg-white p-4 shadow-sm">
      <h3 className="font-bold text-gray-900 text-sm mb-3">Main markets distribution</h3>
      
      {/* Market Distribution Progress Bar */}
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex mb-4">
        {markets.map((m, i) => {
          const colors = ["bg-blue-600", "bg-orange-500", "bg-emerald-500", "bg-purple-500", "bg-slate-400"];
          return (
            <div 
              key={m.region} 
              style={{ width: `${m.percentage}%` }} 
              className={`${colors[i % colors.length]} h-full`}
              title={`${m.region}: ${m.percentage}%`}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {markets.map((m) => (
          <div key={m.region} className="flex justify-between border-b border-gray-50 pb-1">
            <span className="text-gray-600">{m.region}</span>
            <span className="font-bold text-gray-900">{m.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}