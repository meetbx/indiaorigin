"use client";

import React from "react";
import { X, Phone, Package, PhoneCall } from "lucide-react";

interface Props {
  manufacturer: any;
  product?: any;
  onClose: () => void;
}

export default function InquiryModal({ manufacturer, product, onClose }: Props) {
  // Retrieve the manufacturer phone number from database record
  const phoneNumber = manufacturer?.phone;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-5 border border-gray-200 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-extrabold text-gray-900 text-base">Contact Manufacturer</h3>
            <p className="text-xs text-gray-500">Call {manufacturer.name} directly</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 py-2">
          {product && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center shrink-0">
                {product.images && product.images[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Package className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="text-xs">
                <span className="text-gray-500 block">Inquiring about product:</span>
                <p className="font-bold text-gray-900 line-clamp-1">{product.name}</p>
              </div>
            </div>
          )}

          <div className="text-center py-4 space-y-2">
            <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-[#FF5500]">
              <PhoneCall className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-gray-900 text-base">Direct Phone Support</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Tap the button below to open your phone dialer and connect instantly with {manufacturer.name}.
            </p>
          </div>

          {phoneNumber ? (
            <a
              href={`tel:${phoneNumber}`}
              onClick={onClose}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md"
            >
              <Phone className="w-4 h-4" />
              Call Now ({phoneNumber})
            </a>
          ) : (
            <div className="w-full py-3 bg-gray-100 text-gray-400 font-bold text-xs rounded-xl text-center">
              Phone number not available for this manufacturer
            </div>
          )}
        </div>
      </div>
    </div>
  );
}