import React, { useState } from 'react';
import {
  X,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Package,
  AlertCircle,
} from 'lucide-react';
import { Order } from '../types.ts';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOrderNumber?: string;
  defaultPhone?: string;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  isOpen,
  onClose,
  defaultOrderNumber = '',
  defaultPhone = '',
}) => {
  const [searchInput, setSearchInput] = useState(defaultOrderNumber || defaultPhone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<Order | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;

    setIsLoading(true);
    setError(null);
    setOrderData(null);

    try {
      const isPhone = /^\d+$/.test(searchInput.trim());
      const queryParam = isPhone
        ? `phone=${encodeURIComponent(searchInput.trim())}`
        : `orderNumber=${encodeURIComponent(searchInput.trim())}`;

      const res = await fetch(`/api/orders/track?${queryParam}`);
      const data = await res.json();

      if (data.success && data.order) {
        setOrderData({
          ...data.order,
          items: data.items,
          shipment: data.shipment,
        });
      } else {
        setError(data.error || 'No matching order found. Please check your order ID or phone.');
      }
    } catch {
      setError('Network error while tracking order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    'Placed',
    'Confirmed',
    'Packed',
    'Shipped',
    'Out for Delivery',
    'Delivered',
  ];

  const currentStatusIndex = orderData
    ? steps.indexOf(orderData.orderStatus)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-[#E9A9BB]/40 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-[#FBF7F0] border-b border-[#E9A9BB]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#A87A2A]" />
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#A87A2A] block">
                SS VASTRA Fulfillment
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2B2320]">
                Track Your Parcel
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-500 hover:text-black rounded-full hover:bg-stone-200/50 transition-colors"
            aria-label="Close tracking"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Enter Order Number (SSV-2026-XXXX) or Phone Number"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white text-xs sm:text-sm font-bold shadow-md transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Track'}
            </button>
          </form>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Result Card */}
          {orderData && (
            <div className="space-y-6">
              {/* Order Header Summary */}
              <div className="p-4 rounded-2xl bg-[#FBF7F0] border border-[#E9A9BB]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-[#A87A2A] tracking-wider uppercase block">
                    Order ID: {orderData.orderNumber}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                    Recipient: {orderData.customerName}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Placed on: {new Date(orderData.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="sm:text-right">
                  <span className="text-xs text-stone-500 block">Total Amount</span>
                  <span className="text-lg font-bold text-[#2B2320]">
                    ₹{orderData.totalAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 ml-2">
                    {orderData.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Visual Step Progress Bar */}
              <div>
                <h4 className="text-xs font-bold text-[#2B2320] uppercase tracking-wider mb-4">
                  Delivery Status: <span className="text-[#A87A2A]">{orderData.orderStatus}</span>
                </h4>

                <div className="relative flex items-center justify-between">
                  {/* Connecting Line */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-stone-200 -translate-y-1/2 z-0" />
                  <div
                    className="absolute top-1/2 left-0 h-1 bg-[#A87A2A] -translate-y-1/2 z-0 transition-all duration-500"
                    style={{
                      width: `${(Math.max(0, currentStatusIndex) / (steps.length - 1)) * 100}%`,
                    }}
                  />

                  {steps.map((step, idx) => {
                    const isDone = idx <= currentStatusIndex;
                    const isCurrent = idx === currentStatusIndex;

                    return (
                      <div key={step} className="flex flex-col items-center relative z-10">
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isDone
                              ? 'bg-[#A87A2A] text-white ring-4 ring-[#F7E3E8]'
                              : 'bg-stone-200 text-stone-500'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span
                          className={`text-[9px] sm:text-[11px] font-medium mt-1 text-center max-w-[55px] ${
                            isCurrent
                              ? 'text-[#A87A2A] font-bold'
                              : isDone
                              ? 'text-stone-800'
                              : 'text-stone-400'
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shipment Courier Details */}
              {orderData.shipment && (
                <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                    <span className="text-stone-500">Logistics Partner:</span>
                    <span className="font-bold text-stone-800">
                      {orderData.shipment.courierName || 'Delhivery Express'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                    <span className="text-stone-500">AWB Tracking Number:</span>
                    <span className="font-mono font-bold text-[#2B2320]">
                      {orderData.shipment.trackingNumber || 'Pending Generation'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                    <span className="text-stone-500">Estimated Delivery:</span>
                    <span className="font-semibold text-emerald-700">
                      {orderData.shipment.estimatedDelivery || '3-5 Business Days'}
                    </span>
                  </div>

                  {orderData.shipment.trackingUrl && (
                    <div className="pt-1 text-right">
                      <a
                        href={orderData.shipment.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#A87A2A] font-bold hover:underline"
                      >
                        <span>Open Official Courier Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Status Updates Timeline */}
              {orderData.shipment?.statusUpdates && orderData.shipment.statusUpdates.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#2B2320] uppercase tracking-wider mb-3">
                    Tracking Timeline History
                  </h4>
                  <div className="space-y-3 border-l-2 border-[#E9A9BB] pl-4 ml-2">
                    {orderData.shipment.statusUpdates.map((u, i) => (
                      <div key={i} className="relative">
                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#A87A2A] ring-4 ring-white" />
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="font-bold text-[#2B2320]">{u.status}</span>
                          <span className="text-stone-400 text-[10px]">
                            {new Date(u.timestamp).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600">{u.note}</p>
                        {u.location && (
                          <div className="flex items-center gap-1 text-[11px] text-stone-400 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#A87A2A]" />
                            <span>{u.location}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items in Order */}
              {orderData.items && orderData.items.length > 0 && (
                <div className="border-t border-stone-200 pt-4">
                  <h4 className="text-xs font-bold text-[#2B2320] uppercase tracking-wider mb-2">
                    Ordered Outfits
                  </h4>
                  <div className="divide-y divide-stone-100">
                    {orderData.items.map((it) => (
                      <div key={it.id} className="py-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-[#A87A2A]" />
                          <span className="font-medium text-stone-800">{it.productName}</span>
                          <span className="text-stone-500 font-semibold">({it.size})</span>
                          <span className="text-stone-400">×{it.quantity}</span>
                        </div>
                        <span className="font-bold text-[#2B2320]">
                          ₹{it.totalPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
