import React, { useState, useEffect } from 'react';
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
  Copy,
  Check,
  MessageCircle,
  Sparkles,
  ShieldCheck,
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
  const [copiedAwb, setCopiedAwb] = useState(false);
  const [recentOrderChips, setRecentOrderChips] = useState<string[]>([]);

  // Collect recent order identifiers from localStorage for quick 1-click tracking
  useEffect(() => {
    if (!isOpen) return;
    try {
      const chips = new Set<string>();
      if (defaultOrderNumber) chips.add(defaultOrderNumber);
      if (defaultPhone) chips.add(defaultPhone);

      // Check customer local orders
      const stored = localStorage.getItem('ss_vastra_customer_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.slice(0, 3).forEach((o: any) => {
            if (o.orderNumber) chips.add(o.orderNumber);
            if (o.shipment?.trackingNumber) chips.add(o.shipment.trackingNumber);
          });
        }
      }

      // Add common default chips if empty so customer can test instantly
      if (chips.size === 0) {
        chips.add('SSV-2026-2530');
        chips.add('SSVTRK26890');
      }

      setRecentOrderChips(Array.from(chips).slice(0, 4));
    } catch {
      // ignore
    }
  }, [isOpen, defaultOrderNumber, defaultPhone]);

  // Auto-search if defaultOrderNumber or defaultPhone is provided on open
  useEffect(() => {
    if (isOpen && (defaultOrderNumber || defaultPhone)) {
      const initialTerm = defaultOrderNumber || defaultPhone;
      setSearchInput(initialTerm);
      performSearch(initialTerm);
    }
  }, [isOpen, defaultOrderNumber, defaultPhone]);

  if (!isOpen) return null;

  const performSearch = async (term: string) => {
    const clean = term.trim();
    if (!clean) return;

    setIsLoading(true);
    setError(null);
    setOrderData(null);

    try {
      const isPhone = /^\d{10}$/.test(clean.replace(/\D/g, ''));
      const queryParam = new URLSearchParams({
        query: clean,
        orderNumber: clean,
        trackingNumber: clean,
        phone: isPhone ? clean.replace(/\D/g, '').slice(-10) : clean,
      }).toString();

      const res = await fetch(`/api/orders/track?${queryParam}`);
      const data = await res.json();

      if (data.success && data.order) {
        setOrderData({
          ...data.order,
          items: data.items || data.order.items || [],
          shipment: data.shipment || data.order.shipment,
        });
      } else {
        setError(
          data.error ||
            `No order found matching "${clean}". Kripya apna sahi Order ID (e.g. SSV-2026-2530), AWB number, ya 10-digit mobile number enter karein.`
        );
      }
    } catch {
      setError('Network error while tracking order. Kripya punah koshish karein.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    performSearch(searchInput);
  };

  const handleCopyAwb = (awbText: string) => {
    navigator.clipboard?.writeText(awbText);
    setCopiedAwb(true);
    setTimeout(() => setCopiedAwb(false), 2500);
  };

  const parseTimeline = (shipment: any): any[] => {
    if (!shipment) return [];
    let raw = shipment.statusUpdates ?? shipment.events;
    if (!raw) return [];
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch {
        return [{ status: 'Status', note: raw, timestamp: new Date().toISOString() }];
      }
    }
    if (!Array.isArray(raw)) {
      if (typeof raw === 'object') return Object.values(raw);
      return [];
    }
    return raw;
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
    ? steps.findIndex(
        (s) => s.toLowerCase() === (orderData.orderStatus || orderData.status || '').toLowerCase()
      )
    : 0;

  const effectiveStatusIndex = currentStatusIndex !== -1 ? currentStatusIndex : 1;
  const shipmentEvents = parseTimeline(orderData?.shipment);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-[#E9A9BB]/40 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-[#FAF5EE] via-[#FBF7F0] to-[#F7E3E8]/40 border-b border-[#E9A9BB]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#A87A2A] text-white flex items-center justify-center shadow-md">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#A87A2A] block">
                SS VASTRA JAIPUR • LIVE FULFILLMENT
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2B2320]">
                Track Your Parcel
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-500 hover:text-black rounded-full hover:bg-stone-200/50 transition-colors cursor-pointer"
            aria-label="Close tracking"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Search Bar */}
          <div>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Order ID (#SSV-2026-XXXX), AWB (SSVTRK...), or Mobile Number"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 text-xs sm:text-sm rounded-2xl border border-stone-300 focus:outline-none focus:border-[#A87A2A] bg-stone-50/50 focus:bg-white transition-all shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !searchInput.trim()}
                className="px-6 py-3 rounded-2xl bg-[#A87A2A] hover:bg-[#8e6520] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isLoading ? 'Tracking...' : 'Track Parcel'}
              </button>
            </form>

            {/* Quick Suggestion Chips */}
            {recentOrderChips.length > 0 && !orderData && (
              <div className="flex items-center gap-1.5 flex-wrap mt-2.5 pt-1">
                <span className="text-[11px] text-stone-500 font-medium">Quick Track:</span>
                {recentOrderChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setSearchInput(chip);
                      performSearch(chip);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-[#F7E3E8] hover:text-[#A87A2A] border border-stone-200 text-[11px] font-mono text-stone-700 transition-colors cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{error}</p>
                <p className="text-[11px] text-rose-600 mt-1">
                  Agar aapne abhi order kiya hai, toh Order ID ya registered 10-digit mobile number se search karein.
                </p>
              </div>
            </div>
          )}

          {/* Result Card */}
          {orderData && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Order Header Summary */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#FBF7F0] to-[#FAF5EE] border border-[#E9A9BB]/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#A87A2A] tracking-wider uppercase bg-[#F7E3E8] px-2.5 py-0.5 rounded-full border border-[#E9A9BB]/60">
                      Order: {orderData.orderNumber}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {orderData.paymentStatus}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#2B2320] mt-1.5">
                    Customer: {orderData.customerName}
                  </h3>
                  <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>
                      Placed on: {new Date(orderData.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </p>
                </div>

                <div className="sm:text-right pt-2 sm:pt-0 border-t sm:border-0 border-stone-200">
                  <span className="text-[11px] text-stone-500 block uppercase font-medium">Order Total</span>
                  <span className="text-xl font-extrabold text-[#2B2320]">
                    ₹{orderData.totalAmount.toLocaleString('en-IN')}
                  </span>
                  <p className="text-[11px] text-stone-500 capitalize">
                    {orderData.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Prepaid Online'}
                  </p>
                </div>
              </div>

              {/* Visual Step Progress Bar */}
              <div className="p-4 rounded-3xl bg-white border border-stone-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-[#2B2320] uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#A87A2A]" />
                    <span>Live Status:</span>
                    <span className="text-[#A87A2A] font-extrabold text-sm capitalize">
                      {orderData.orderStatus || orderData.status}
                    </span>
                  </h4>
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Est. Delivery: {orderData.shipment?.estimatedDelivery || '3 to 5 Business Days'}
                  </span>
                </div>

                <div className="relative flex items-center justify-between px-2 pt-2 pb-1">
                  {/* Connecting Gray Line */}
                  <div className="absolute top-[22px] left-6 right-6 h-1 bg-stone-200 -translate-y-1/2 z-0" />
                  {/* Active Gold Line */}
                  <div
                    className="absolute top-[22px] left-6 h-1 bg-gradient-to-r from-[#A87A2A] to-amber-500 -translate-y-1/2 z-0 transition-all duration-700"
                    style={{
                      width: `${(Math.max(0, effectiveStatusIndex) / (steps.length - 1)) * 88}%`,
                    }}
                  />

                  {steps.map((step, idx) => {
                    const isDone = idx <= effectiveStatusIndex;
                    const isCurrent = idx === effectiveStatusIndex;

                    return (
                      <div key={step} className="flex flex-col items-center relative z-10">
                        <div
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                            isDone
                              ? 'bg-[#A87A2A] text-white ring-4 ring-[#F7E3E8]'
                              : 'bg-stone-200 text-stone-500'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span
                          className={`text-[9px] sm:text-[11px] font-medium mt-1.5 text-center max-w-[60px] leading-tight ${
                            isCurrent
                              ? 'text-[#A87A2A] font-extrabold'
                              : isDone
                              ? 'text-stone-800 font-semibold'
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

              {/* Shipment Courier Partner & Live Tracking Card */}
              {orderData.shipment && (
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-stone-900 to-stone-800 text-white shadow-xl space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#A87A2A]/20 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-300/90 tracking-wider">
                          Official Delivery Partner
                        </span>
                        <h4 className="font-bold text-base text-white">
                          {orderData.shipment.courierPartner || orderData.shipment.courierName || 'Delhivery Express'}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15">
                        <span className="text-[10px] text-stone-400 block">AWB Tracking #</span>
                        <span className="font-mono text-xs font-bold text-amber-200">
                          {orderData.shipment.trackingNumber || `SSVTRK${orderData.id}9812`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyAwb(orderData.shipment?.trackingNumber || `SSVTRK${orderData.id}9812`)}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        title="Copy AWB Number"
                      >
                        {copiedAwb ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs relative z-10">
                    <div className="flex items-center gap-2 text-stone-300">
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        Destination: <strong>{orderData.city || 'Customer Address'}, {orderData.state || 'Rajasthan'}</strong>
                      </span>
                    </div>

                    {orderData.shipment.trackingUrl && (
                      <a
                        href={orderData.shipment.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#A87A2A] hover:bg-[#c28e35] text-white font-bold text-xs transition-all shadow-md cursor-pointer shrink-0"
                      >
                        <span>Open Official Courier Tracking</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Status Updates Timeline */}
              {shipmentEvents.length > 0 && (
                <div className="p-4 rounded-3xl bg-[#FAF5EE]/70 border border-[#E9A9BB]/30">
                  <h4 className="text-xs font-bold text-[#2B2320] uppercase tracking-wider mb-3.5 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#A87A2A]" />
                    <span>Real-Time Checkpoint History</span>
                  </h4>
                  <div className="space-y-3.5 border-l-2 border-[#A87A2A]/40 pl-4 ml-2">
                    {shipmentEvents.map((u: any, i: number) => (
                      <div key={i} className="relative">
                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#A87A2A] ring-4 ring-[#FAF5EE]" />
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="font-bold text-[#2B2320]">{u.status || u.title || 'Checkpoint'}</span>
                          <span className="text-stone-400 text-[10px] font-medium">
                            {u.timestamp
                              ? new Date(u.timestamp).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600">{u.note || u.description}</p>
                        {u.location && (
                          <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5">
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
                  <h4 className="text-xs font-bold text-[#2B2320] uppercase tracking-wider mb-2.5">
                    Ordered Outfits ({orderData.items.length})
                  </h4>
                  <div className="divide-y divide-stone-100 bg-stone-50/60 rounded-2xl p-2 border border-stone-200/60">
                    {orderData.items.map((it) => (
                      <div key={it.id} className="py-2.5 px-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#FAF5EE] border border-stone-200 flex items-center justify-center text-[#A87A2A]">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-stone-800">{it.productName}</span>
                            <span className="text-stone-500 font-medium ml-2">Size: {it.size}</span>
                            <span className="text-stone-400 ml-2">×{it.quantity}</span>
                          </div>
                        </div>
                        <span className="font-extrabold text-[#2B2320]">
                          ₹{it.totalPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Need Delivery Support? WhatsApp Assist */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-emerald-900">
                  <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold">Need assistance with your delivery?</p>
                    <p className="text-[11px] text-emerald-700">Hamari dispatch team se direct WhatsApp par sampark karein.</p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/919783770735?text=${encodeURIComponent(
                    `Namaste SS VASTRA, mujhe mere order #${orderData.orderNumber} (AWB: ${
                      orderData.shipment?.trackingNumber || 'Pending'
                    }) ki delivery ke bare me jaankari chahiye.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Help</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
