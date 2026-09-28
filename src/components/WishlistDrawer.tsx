import React from 'react';
import { X, Heart, ShoppingBag, MessageCircle, Trash2, ArrowRight } from 'lucide-react';
import { Product } from '../types.ts';
import { normalizeProductImageUrl } from '../utils/imageUtils.ts';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistProducts: Product[];
  onRemoveFromWishlist: (productId: number) => void;
  onClearWishlist: () => void;
  onAddToCart: (product: Product, size: string) => void;
  onQuickView: (product: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  wishlistProducts,
  onRemoveFromWishlist,
  onClearWishlist,
  onAddToCart,
  onQuickView,
}) => {
  if (!isOpen) return null;

  const handleWhatsAppOrder = (product: Product) => {
    const deepLink = `${window.location.origin}/?product=${product.id}`;
    const msg = `Namaste SS VASTRA! Main yeh wishlist dress order karna chahti hu:\n*${product.name}*\nPrice: ₹${product.price}\nProduct Link: ${deepLink}`;
    window.open(`https://wa.me/919783770735?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF8F5] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-white border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-200">
                <Heart className="w-5 h-5 fill-rose-500" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-lg text-[#2B2320]">
                  Saved Outfits
                </h2>
                <p className="text-xs text-stone-500">
                  {wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'} in your wishlist
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {wishlistProducts.length > 0 && (
                <button
                  type="button"
                  onClick={onClearWishlist}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-md hover:bg-rose-50 transition-colors"
                  title="Clear all saved items"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                aria-label="Close Wishlist"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            {wishlistProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center border border-rose-100">
                  <Heart className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#2B2320]">
                    Your wishlist is empty
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-xs">
                    Save your favorite Jaipur block prints, silk suits, and festive fits to view or order later!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#A87A2A] text-white font-bold text-xs hover:bg-[#8e6520] transition-colors shadow-sm"
                >
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              wishlistProducts.map((product) => {
                const imgUrl = normalizeProductImageUrl(product.image);
                const discount =
                  product.discountPercent ||
                  (product.originalPrice > product.price
                    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                    : 0);

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl p-3 border border-stone-200 shadow-xs flex gap-3 group relative hover:border-[#A87A2A]/40 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div
                      className="w-20 h-24 rounded-xl overflow-hidden bg-stone-100 shrink-0 cursor-pointer"
                      onClick={() => {
                        onClose();
                        onQuickView(product);
                      }}
                    >
                      <img
                        src={imgUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#A87A2A] truncate">
                            {product.category}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveFromWishlist(product.id)}
                            className="text-stone-400 hover:text-rose-500 p-1 -mr-1 transition-colors"
                            title="Remove from wishlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <h4
                          className="font-semibold text-xs text-[#2B2320] line-clamp-1 cursor-pointer hover:text-[#A87A2A]"
                          onClick={() => {
                            onClose();
                            onQuickView(product);
                          }}
                        >
                          {product.name}
                        </h4>

                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="font-bold text-sm text-[#A87A2A]">₹{product.price}</span>
                          {product.originalPrice > product.price && (
                            <span className="text-[11px] line-through text-stone-400">
                              ₹{product.originalPrice}
                            </span>
                          )}
                          {discount > 0 && (
                            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded">
                              {discount}% OFF
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => {
                            const defaultSize = product.sizes?.[0] || 'Free Size';
                            onAddToCart(product, defaultSize);
                          }}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-[#2B2320] hover:bg-[#A87A2A] text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleWhatsAppOrder(product)}
                          className="py-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors border border-emerald-200"
                          title="Direct WhatsApp Order"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {wishlistProducts.length > 0 && (
            <div className="p-4 bg-white border-t border-stone-200 space-y-2">
              <button
                type="button"
                onClick={() => {
                  wishlistProducts.forEach((p) => {
                    const defaultSize = p.sizes?.[0] || 'Free Size';
                    onAddToCart(p, defaultSize);
                  });
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Move All to Cart ({wishlistProducts.length})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
