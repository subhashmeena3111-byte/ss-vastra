import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, CheckCircle2, AlertCircle } from 'lucide-react';
import { CartItem } from '../types.ts';
import { normalizeProductImageUrl, getDriveThumbnailUrl } from '../utils/imageUtils.ts';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: number, size: string, delta: number) => void;
  onRemoveItem: (productId: number, size: string) => void;
  onProceedToCheckout: (couponDiscount: number, couponCode: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const freeShippingThreshold = 1999;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const deliveryFee = 0; // Free shipping promotional
  const finalTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setValidatingCoupon(true);
    setCouponError(null);

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponInput.trim(),
          orderAmount: subtotal,
        }),
      });
      const data = await res.json();
      if (data.success && data.coupon) {
        setAppliedCoupon({
          code: data.coupon.code,
          discountAmount: data.coupon.discountAmount,
        });
        setCouponError(null);
      } else {
        setCouponError(data.error || 'Invalid coupon code');
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError('Network error while validating coupon');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FBF7F0] shadow-2xl flex flex-col border-l border-[#E9A9BB]/40">
          
          {/* Header */}
          <div className="p-4 sm:p-5 bg-white border-b border-[#E9A9BB]/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#A87A2A]" />
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#2B2320]">
                Your Shopping Bag ({items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-500 hover:text-black rounded-full hover:bg-stone-100 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Meter */}
          <div className="bg-[#F7E3E8] p-3 text-xs border-b border-[#E9A9BB]/40">
            {remainingForFreeShipping > 0 ? (
              <p className="text-stone-700 font-medium mb-1.5 text-center">
                Add <span className="font-bold text-[#A87A2A]">₹{remainingForFreeShipping}</span> more to unlock <span className="font-bold">FREE Express Delivery</span>!
              </p>
            ) : (
              <p className="text-emerald-800 font-bold text-center flex items-center justify-center gap-1.5 mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Congratulations! You unlocked FREE Delivery.
              </p>
            )}
            <div className="w-full bg-white/70 rounded-full h-2 overflow-hidden border border-[#E9A9BB]/40">
              <div
                className="bg-[#A87A2A] h-full rounded-full transition-all duration-500"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-20 h-20 rounded-full bg-[#F7E3E8] flex items-center justify-center mb-4 text-[#A87A2A]">
                  <ShoppingBag className="w-10 h-10 stroke-1" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#2B2320] mb-1">
                  Your bag is currently empty
                </h3>
                <p className="text-xs text-stone-500 max-w-xs mb-6">
                  Explore our handcrafted Jaipur suits, anarkalis and Sanganer fabrics.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full bg-[#A87A2A] text-white font-medium text-xs shadow-md hover:bg-[#8e6520] transition-colors"
                >
                  Explore Collections
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.product.id}-${item.size}`}
                  className="flex gap-3 bg-white p-3 rounded-2xl border border-[#E9A9BB]/30 shadow-2xs"
                >
                  {/* Thumbnail */}
                  <img
                    src={normalizeProductImageUrl(item.product.image)}
                    alt={item.product.name}
                    className="w-18 h-24 object-cover object-top rounded-xl bg-stone-100 shrink-0"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback = getDriveThumbnailUrl(item.product.image);
                      if (target.src !== fallback) {
                        target.src = fallback;
                      }
                    }}
                  />

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-serif text-xs sm:text-sm font-bold text-[#2B2320] line-clamp-2">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.product.id, item.size)}
                          className="text-stone-400 hover:text-rose-500 p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="inline-block text-[11px] font-semibold text-[#A87A2A] bg-[#F7E3E8] px-2 py-0.5 rounded-md mt-1">
                        Size: {item.size}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                      {/* Price */}
                      <span className="text-sm font-bold text-[#2B2320]">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-stone-50 text-xs">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, item.size, -1)}
                          className="px-2 py-1 text-stone-600 hover:bg-stone-200 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-1 font-bold text-stone-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, item.size, 1)}
                          className="px-2 py-1 text-stone-600 hover:bg-stone-200 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Area: Coupon and Totals */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 bg-white border-t border-[#E9A9BB]/30 space-y-3.5">
              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Enter coupon (e.g. WELCOME10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-2 text-xs uppercase font-medium rounded-xl border border-stone-300 focus:outline-none focus:border-[#A87A2A]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={validatingCoupon || !couponInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[#F7E3E8] border border-[#E9A9BB] text-[#A87A2A] text-xs font-bold hover:bg-[#A87A2A] hover:text-white transition-all disabled:opacity-50"
                >
                  {validatingCoupon ? 'Checking...' : 'Apply'}
                </button>
              </form>

              {/* Coupon Status Message */}
              {appliedCoupon && (
                <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <span className="font-semibold">
                    ✓ Code '{appliedCoupon.code}' applied (-₹{appliedCoupon.discountAmount})
                  </span>
                  <button
                    onClick={removeCoupon}
                    className="text-stone-500 hover:text-rose-600 text-[11px] underline"
                  >
                    Remove
                  </button>
                </div>
              )}

              {couponError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{couponError}</span>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-stone-600 border-t border-stone-100 pt-3">
                <div className="flex justify-between">
                  <span>Bag Subtotal</span>
                  <span className="font-semibold text-stone-800">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Coupon Discount</span>
                    <span className="font-semibold">
                      -₹{appliedCoupon.discountAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="font-semibold text-emerald-700">FREE</span>
                </div>

                <div className="flex justify-between text-sm sm:text-base font-bold text-[#2B2320] pt-2 border-t border-stone-200">
                  <span>Total Amount</span>
                  <span className="text-[#A87A2A]">
                    ₹{finalTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                type="button"
                onClick={() => onProceedToCheckout(discountAmount, appliedCoupon?.code || '')}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-sm tracking-wide shadow-md active:scale-98 transition-all"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
