import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Search,
  ExternalLink,
  Clock,
  CheckCircle,
  Truck,
  MessageCircle,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { normalizeProductImageUrl, getDriveThumbnailUrl } from '../utils/imageUtils.ts';

interface OrderItem {
  id: number;
  productName: string;
  productImage: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ShipmentData {
  courierName: string;
  trackingNumber: string;
  trackingUrl: string;
  estimatedDelivery: string;
  currentStatus: string;
}

interface CustomerOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  city: string;
  state: string;
  pincode: string;
  totalAmount: number;
  discountAmount?: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  items: OrderItem[];
  shipment?: ShipmentData;
}

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTracking: (orderNumber: string, phone: string) => void;
  customerPhone?: string;
  customerEmail?: string;
}

export const MyOrdersModal: React.FC<MyOrdersModalProps> = ({
  isOpen,
  onClose,
  onOpenTracking,
  customerPhone = '',
  customerEmail = '',
}) => {
  const [searchInput, setSearchInput] = useState(customerPhone || customerEmail || '');
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const savedPhone = localStorage.getItem('ss_vastra_customer_phone');
      const savedEmail = localStorage.getItem('ss_vastra_customer_email');
      const defaultLookup = customerPhone || customerEmail || savedPhone || savedEmail || '';
      if (defaultLookup) {
        setSearchInput(defaultLookup);
        fetchOrders(defaultLookup);
      }
    }
  }, [isOpen, customerPhone, customerEmail]);

  if (!isOpen) return null;

  const fetchOrders = async (queryValue: string) => {
    const val = queryValue.trim();
    if (!val) {
      setError('Kripya apna mobile number ya email enter karein');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const isEmail = val.includes('@');
      const queryParam = isEmail
        ? `email=${encodeURIComponent(val)}`
        : `phone=${encodeURIComponent(val.replace(/\D/g, ''))}`;

      const res = await fetch(`/api/customer/orders?${queryParam}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
        if (!isEmail) {
          localStorage.setItem('ss_vastra_customer_phone', val);
        } else {
          localStorage.setItem('ss_vastra_customer_email', val);
        }
      } else {
        setOrders([]);
      }
    } catch {
      setError('Orders fetch karne mein dikkat aayi. Kripya dobara try karein.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(searchInput);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Shipped':
      case 'Out for Delivery':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Confirmed':
      case 'Packed':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#FBF7F0] rounded-3xl shadow-2xl overflow-hidden border border-[#E9A9BB]/40 my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E9A9BB]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F7E3E8] border border-[#A87A2A]/30 flex items-center justify-center text-[#A87A2A]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2B2320]">
                My Orders (Mera Order Itihas)
              </h2>
              <p className="text-xs text-stone-500">
                Track status, delivery timeline & courier updates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 bg-white border-b border-stone-100">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Apna 10-digit mobile number ya email enter karein..."
                className="w-full pl-10 pr-4 py-3 bg-[#FBF7F0] border border-[#E9A9BB]/50 rounded-2xl text-sm text-[#2B2320] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#A87A2A]"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-[#A87A2A] hover:bg-[#8e6520] text-white rounded-2xl text-sm font-semibold transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              {isLoading ? 'Dhoondh rahe hain...' : 'Search Orders'}
            </button>
          </form>
          {error && <p className="text-xs text-rose-600 mt-2 font-medium">{error}</p>}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-3 border-[#A87A2A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-stone-500">Aapke orders load ho rahe hain...</p>
            </div>
          ) : hasSearched && orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl p-6 border border-[#E9A9BB]/30">
              <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-[#2B2320] mb-1">
                Koi order nahi mila
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
                Is number/email par koi order record nahi hai. Kripya check karein ki aapne vahi number dala hai jisse order kiya tha.
              </p>
              <a
                href="https://wa.me/919783770735?text=Namaste%20SS%20VASTRA%2C%20mujhe%20apne%20order%20ke%20bare%20mein%20poochna%20hai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Helpline se Sahayata Leis
              </a>
            </div>
          ) : !hasSearched ? (
            <div className="text-center py-12 bg-white rounded-2xl p-6 border border-[#E9A9BB]/30">
              <Package className="w-10 h-10 text-[#A87A2A]/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-[#2B2320]">
                Apne orders dekhne ke liye upar mobile number dalein.
              </p>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-[#E9A9BB]/40 shadow-xs hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="p-4 bg-[#F7E3E8]/30 border-b border-[#E9A9BB]/20 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-[#A87A2A]">Order #{ord.orderNumber}</span>
                    <span className="text-xs text-stone-400 mx-2">•</span>
                    <span className="text-xs text-stone-500">
                      {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(ord.orderStatus)}`}>
                      {ord.orderStatus}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${ord.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {ord.paymentStatus === 'paid' ? 'Paid Online' : 'COD'}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="p-4 divide-y divide-stone-100">
                  {ord.items && ord.items.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center gap-3">
                      <img
                        src={normalizeProductImageUrl(item.productImage || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=150&q=80')}
                        alt={item.productName}
                        className="w-14 h-16 object-cover rounded-lg border border-stone-200 shrink-0"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fallback = getDriveThumbnailUrl(item.productImage || '');
                          if (target.src !== fallback) {
                            target.src = fallback;
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-sm font-bold text-[#2B2320] truncate">
                          {item.productName}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                          <span>Size: <strong className="text-stone-700">{item.size}</strong></span>
                          <span>•</span>
                          <span>Qty: <strong className="text-stone-700">{item.quantity}</strong></span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-[#2B2320]">
                          ₹{item.totalPrice?.toLocaleString('en-IN') || (item.unitPrice * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tracking & Shipment Box */}
                {ord.shipment && (
                  <div className="mx-4 mb-3 p-3 rounded-xl bg-[#FBF7F0] border border-[#E9A9BB]/40 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Truck className="w-4 h-4 text-[#A87A2A]" />
                      <div className="text-xs">
                        <span className="font-bold text-[#2B2320]">{ord.shipment.courierName}</span>
                        <span className="text-stone-500 ml-1">
                          AWB: <code className="font-mono text-[#A87A2A]">{ord.shipment.trackingNumber}</code>
                        </span>
                        {ord.shipment.estimatedDelivery && (
                          <div className="text-[11px] text-stone-500">
                            Est: {ord.shipment.estimatedDelivery}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onClose();
                          onOpenTracking(ord.orderNumber, ord.customerPhone);
                        }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#A87A2A] text-white hover:bg-[#8e6520] transition-colors"
                      >
                        Live Tracking
                      </button>
                      {ord.shipment.trackingUrl && (
                        <a
                          href={ord.shipment.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-stone-600 hover:text-[#A87A2A] flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer of Card */}
                <div className="p-4 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-stone-500">Total:</span>{' '}
                    <span className="font-bold text-sm text-[#2B2320]">
                      ₹{ord.totalAmount?.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/919783770735?text=${encodeURIComponent(
                        `Namaste SS VASTRA! Mera Order Number #${ord.orderNumber} hai. Mujhe iske baare mein jaankari chahiye.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Help on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
