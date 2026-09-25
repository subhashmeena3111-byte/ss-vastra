import React, { useState } from 'react';
import { ShoppingBag, MessageCircle, Eye, Heart, Share2, Check } from 'lucide-react';
import { Product } from '../types.ts';
import { normalizeProductImageUrl, getDriveThumbnailUrl } from '../utils/imageUtils.ts';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product, size: string) => void;
  onShareDeepLink?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onAddToCart,
  onShareDeepLink,
}) => {
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes && product.sizes.length ? product.sizes[0] : 'Free Size'
  );
  const [isLiked, setIsLiked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const discount =
    product.discountPercent ||
    (product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0);

  const handleWhatsAppOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    const deepLink = `${window.location.origin}/?product=${product.id}`;
    const msg = `Namaste SS VASTRA! Main yeh dress order karna chahti hu:\n*${product.name}*\nSize: ${selectedSize}\nPrice: ₹${product.price}\nProduct Deep Link: ${deepLink}`;
    const url = `https://wa.me/919783770735?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShareDeepLink) {
      onShareDeepLink(product);
      return;
    }
    const deepLink = `${window.location.origin}/?product=${product.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(deepLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, selectedSize);
  };

  return (
    <div
      onClick={() => onQuickView(product)}
      className="group bg-white rounded-2xl overflow-hidden border border-[#E9A9BB]/30 hover:border-[#A87A2A]/50 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer relative"
    >
      {/* Product Image Area with soft rounded corners */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#F7E3E8]/40">
        <img
          src={normalizeProductImageUrl(product.image)}
          alt={product.name}
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            const fallback = getDriveThumbnailUrl(product.image);
            if (target.src !== fallback) {
              target.src = fallback;
            }
          }}
        />

        {/* Badges: Discount and Tags */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          {discount > 0 && (
            <span className="bg-[#A87A2A] text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shadow-xs">
              {discount}% OFF
            </span>
          )}
          {product.isBestSeller && (
            <span className="bg-[#2B2320] text-amber-300 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
              Best Seller
            </span>
          )}
          {product.isNewArrival && (
            <span className="bg-[#E9A9BB] text-[#2B2320] text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
              New Drop
            </span>
          )}
        </div>

        {/* Top Right Actions: Share Deep Link & Wishlist */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 rounded-full bg-white/85 backdrop-blur-xs text-stone-600 hover:text-[#A87A2A] hover:bg-white shadow-xs transition-all"
            title="Copy or share deep link"
            aria-label="Share deep link"
          >
            {copiedLink ? (
              <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className="p-1.5 rounded-full bg-white/85 backdrop-blur-xs text-stone-600 hover:text-rose-500 hover:bg-white shadow-xs transition-colors"
            aria-label="Wishlist"
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        {/* Quick View Floating Pill on Hover */}
        <div className="absolute inset-x-3 bottom-3 hidden sm:flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-xs font-semibold text-[#2B2320] shadow-md">
            <Eye className="w-3.5 h-3.5 text-[#A87A2A]" /> Quick View
          </span>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Category & Fabric */}
          <div className="flex items-center justify-between text-[11px] text-[#A87A2A] font-medium mb-1">
            <span className="truncate">{product.category}</span>
            {product.fabric && (
              <span className="text-stone-600 text-[10px] truncate max-w-[100px] hidden sm:inline">
                {product.fabric}
              </span>
            )}
          </div>

          {/* Product Name */}
          <h3 className="font-serif text-sm sm:text-base font-bold text-[#2B2320] line-clamp-2 leading-snug mb-2 group-hover:text-[#A87A2A] transition-colors">
            {product.name}
          </h3>

          {/* Price Row */}
          <div className="flex items-baseline gap-2 mb-2.5">
            <span className="text-base sm:text-lg font-bold text-[#2B2320]">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-xs sm:text-sm text-stone-600 line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Sizes Row */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-stone-600 uppercase font-medium mr-1">
                  Size:
                </span>
                {product.sizes.slice(0, 5).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded border transition-colors ${
                      selectedSize === size
                        ? 'border-[#A87A2A] bg-[#F7E3E8] text-[#A87A2A] font-bold'
                        : 'border-stone-200 text-stone-600 hover:border-[#A87A2A]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
                {product.sizes.length > 5 && (
                  <span className="text-[9px] text-stone-600">+{product.sizes.length - 5}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons: Add to Bag & WhatsApp Order */}
        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-stone-100 mt-auto">
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-[#F7E3E8] hover:bg-[#A87A2A] text-[#A87A2A] hover:text-white text-xs font-semibold transition-all duration-200 shadow-2xs active:scale-95"
            title="Add item to shopping bag"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="truncate">Add to Bag</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppOrder}
            className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all duration-200 shadow-2xs active:scale-95"
            title="Order directly on WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="truncate">WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
