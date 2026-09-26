import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  MessageCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Check,
  Ruler,
  Share2,
  Copy,
  Link as LinkIcon,
} from 'lucide-react';
import { Product } from '../types.ts';
import { normalizeProductImageUrl, getDriveThumbnailUrl } from '../utils/imageUtils.ts';
import { normalizeProductSizes, normalizeProductHighlights } from '../utils/productUtils.ts';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, quantity: number) => void;
  onInstantBuy: (product: Product, size: string, quantity: number) => void;
  onOpenDeepLink?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onInstantBuy,
  onOpenDeepLink,
}) => {
  if (!product) return null;

  const safeSizes = normalizeProductSizes(product.sizes);
  const safeHighlights = normalizeProductHighlights(product.highlights);

  const allImages = [
    product.image,
    ...(product.gallery && product.gallery.length ? product.gallery : []),
  ];
  // Remove duplicates
  const uniqueImages = Array.from(new Set(allImages));

  const [activeImage, setActiveImage] = useState(uniqueImages[0]);
  const [selectedSize, setSelectedSize] = useState(
    safeSizes.length ? safeSizes[0] : 'Free Size'
  );
  const [quantity, setQuantity] = useState(1);

  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const discount =
    product.discountPercent ||
    (product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0);

  const handleAdd = () => {
    onAddToCart(product, selectedSize, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  const handleWhatsApp = () => {
    const deepLink = `${window.location.origin}/?product=${product.id}`;
    const msg = `Namaste SS VASTRA! Main yeh dress order karna chahti hu:\n*${product.name}*\nSize: ${selectedSize}\nQuantity: ${quantity}\nPrice: ₹${product.price * quantity}\nProduct Deep Link: ${deepLink}\nAddress: Green Vihar Vatika, Sanganer, Jaipur`;
    const url = `https://wa.me/919783770735?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = () => {
    const deepLink = `${window.location.origin}/?product=${product.id}`;
    navigator.clipboard.writeText(deepLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-[#E9A9BB]/40 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 text-stone-600 hover:text-black hover:bg-white shadow-md transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Scrollable Container */}
        <div className="overflow-y-auto p-4 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
          {/* Left Column: Image Gallery */}
          <div className="flex flex-col gap-3">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-[#F7E3E8]/30 border border-[#E9A9BB]/30 shadow-inner relative group">
              <img
                src={normalizeProductImageUrl(activeImage)}
                alt={product.name}
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  const target = e.currentTarget;
                  const fallback = getDriveThumbnailUrl(activeImage);
                  if (target.src !== fallback && !target.src.includes('drive.google.com/thumbnail')) {
                    target.src = fallback;
                  } else {
                    target.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';
                  }
                }}
              />
              {discount > 0 && (
                <span className="absolute top-3 left-3 bg-[#A87A2A] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                  {discount}% OFF
                </span>
              )}
            </div>

            {/* Thumbnails row */}
            {uniqueImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {uniqueImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`w-16 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      activeImage === img
                        ? 'border-[#A87A2A] ring-2 ring-[#A87A2A]/40'
                        : 'border-stone-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={normalizeProductImageUrl(img)}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fallback = getDriveThumbnailUrl(img);
                        if (target.src !== fallback) {
                          target.src = fallback;
                        }
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Details & Controls */}
          <div className="flex flex-col">
            {/* Category & Sanganer Tag */}
            <div className="flex items-center gap-2 text-xs font-semibold text-[#A87A2A] uppercase tracking-wider mb-1.5">
              <span>{product.category}</span>
              <span>•</span>
              <span className="text-emerald-700">Jaipur Authentic</span>
            </div>

            {/* Title */}
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B2320] leading-tight mb-3">
              {product.name}
            </h2>

            {/* Price section */}
            <div className="flex items-baseline gap-3 mb-4 p-3 rounded-xl bg-[#FBF7F0] border border-[#E9A9BB]/30">
              <span className="text-2xl sm:text-3xl font-bold text-[#2B2320]">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-base text-stone-500 line-through">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full ml-auto">
                Taxes Included
              </span>
            </div>

            {/* Fabric & Color Badges */}
            <div className="flex flex-wrap gap-2 mb-4 text-xs">
              {product.fabric && (
                <span className="px-2.5 py-1 rounded-md bg-[#F7E3E8] text-[#2B2320] font-medium border border-[#E9A9BB]/40">
                  🧵 Fabric: {product.fabric}
                </span>
              )}
              {product.color && (
                <span className="px-2.5 py-1 rounded-md bg-[#FBF7F0] text-[#2B2320] font-medium border border-[#E9A9BB]/40">
                  🎨 Color: {product.color}
                </span>
              )}
              <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-medium border border-amber-200">
                📦 Stock: {product.stock > 0 ? `${product.stock} units ready` : 'Out of Stock'}
              </span>
            </div>

            {/* Size Selector */}
            {safeSizes.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#2B2320] uppercase tracking-wider">
                    Select Size: <span className="text-[#A87A2A] font-semibold">{selectedSize}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSizeGuide(!showSizeGuide)}
                    className="text-xs text-[#A87A2A] hover:underline flex items-center gap-1 font-medium"
                  >
                    <Ruler className="w-3.5 h-3.5" /> Size Guide
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {safeSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[44px] h-10 px-3 rounded-xl border text-sm font-semibold transition-all ${
                        selectedSize === size
                          ? 'border-[#A87A2A] bg-[#A87A2A] text-white shadow-sm'
                          : 'border-stone-300 text-stone-700 hover:border-[#A87A2A] bg-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                {/* Size Guide Table Toggle */}
                {showSizeGuide && (
                  <div className="mt-3 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                    <h4 className="font-bold text-stone-800 mb-1">Standard Size Chart (Inches)</h4>
                    <div className="grid grid-cols-4 gap-1 text-center font-mono py-1 border-b border-stone-200 text-stone-500 font-sans">
                      <span>Size</span>
                      <span>Bust</span>
                      <span>Waist</span>
                      <span>Hip</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center py-0.5">
                      <span className="font-bold">S (36)</span>
                      <span>36"</span>
                      <span>32"</span>
                      <span>38"</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center py-0.5">
                      <span className="font-bold">M (38)</span>
                      <span>38"</span>
                      <span>34"</span>
                      <span>40"</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center py-0.5">
                      <span className="font-bold">L (40)</span>
                      <span>40"</span>
                      <span>36"</span>
                      <span>42"</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center py-0.5">
                      <span className="font-bold">XL (42)</span>
                      <span>42"</span>
                      <span>38"</span>
                      <span>44"</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center py-0.5">
                      <span className="font-bold">XXL (44)</span>
                      <span>44"</span>
                      <span>40"</span>
                      <span>46"</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs font-bold text-[#2B2320] uppercase tracking-wider">
                Quantity:
              </span>
              <div className="flex items-center border border-stone-300 rounded-xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 font-bold"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-sm font-bold text-stone-800">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}
                  className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 mb-6">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleAdd}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#F7E3E8] border border-[#E9A9BB] hover:bg-[#A87A2A] text-[#A87A2A] hover:text-white font-bold text-sm transition-all shadow-xs active:scale-98"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{addedToast ? 'Added to Bag! ✓' : 'Add to Bag'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onInstantBuy(product, selectedSize, quantity)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-sm transition-all shadow-md active:scale-98"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Buy Now</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="w-full flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-98"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span className="truncate">WhatsApp Order</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl border border-stone-300 hover:border-[#A87A2A] bg-stone-50 hover:bg-white text-stone-800 font-bold text-xs transition-all shadow-xs active:scale-98"
                    title="Copy direct product deep link"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                        <span className="text-emerald-700">Copied! ✓</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-stone-500" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  {onOpenDeepLink && (
                    <button
                      type="button"
                      onClick={() => onOpenDeepLink(product)}
                      className="px-3 py-3 rounded-xl border border-[#A87A2A]/40 bg-[#FBF7F0] hover:bg-[#A87A2A] text-[#A87A2A] hover:text-white transition-all shadow-xs"
                      title="Open Deep Link & QR Generator"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Description & Key Highlights */}
            <div className="border-t border-[#E9A9BB]/30 pt-4 mb-4">
              <h4 className="text-xs font-bold text-[#2B2320] uppercase tracking-wider mb-2">
                About The Outfit
              </h4>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-3">
                {product.description}
              </p>

              {safeHighlights.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700">
                  {safeHighlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#A87A2A] shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Trust Assurance Grid */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#FBF7F0] border border-[#E9A9BB]/30 text-center text-[11px] text-stone-600">
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-4 h-4 text-[#A87A2A]" />
                <span>Fast Dispatch</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#A87A2A]" />
                <span>Razorpay / COD</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RotateCcw className="w-4 h-4 text-[#A87A2A]" />
                <span>Easy Exchange</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
