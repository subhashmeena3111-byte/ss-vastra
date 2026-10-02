import React, { useState, useEffect, useMemo } from 'react';
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
  Heart,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Lock,
  BadgeCheck,
} from 'lucide-react';
import { Product } from '../types.ts';
import { normalizeProductImageUrl, getDriveThumbnailUrl } from '../utils/imageUtils.ts';
import { normalizeProductSizes, normalizeProductHighlights } from '../utils/productUtils.ts';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, quantity: number, color?: string) => void;
  onInstantBuy: (product: Product, size: string, quantity: number, color?: string) => void;
  onOpenDeepLink?: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
  isAdmin?: boolean;
  onDeleteProduct?: (product: Product, alreadyConfirmed?: boolean) => void;
  onEditProduct?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onInstantBuy,
  onOpenDeepLink,
  isWishlisted = false,
  onToggleWishlist,
  isAdmin = false,
  onDeleteProduct,
  onEditProduct,
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

  // Multi-color options
  const availableColors = useMemo(() => {
    if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
      return product.colors;
    }
    if (product.color) {
      return [product.color];
    }
    return [];
  }, [product]);

  const [selectedColor, setSelectedColor] = useState<string>(() => availableColors[0] || '');

  useEffect(() => {
    if (availableColors.length > 0 && !availableColors.includes(selectedColor)) {
      setSelectedColor(availableColors[0]);
    }
  }, [availableColors]);

  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>('shipping');

  const toggleAccordion = (name: string) => {
    setOpenAccordion((prev) => (prev === name ? null : name));
  };

  const parsedDesc = useMemo(() => {
    const raw = product.description || '';
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    const bullets: string[] = [];
    const specs: { label: string; value: string }[] = [];
    const leadParts: string[] = [];

    lines.forEach((line) => {
      if (/^[\*\-\•\▪\▫\+]\s*/.test(line)) {
        bullets.push(line.replace(/^[\*\-\•\▪\▫\+]\s*/, '').trim());
      } else if (/^[A-Za-z0-9\s&]{2,22}:/i.test(line) && !line.toLowerCase().startsWith('http')) {
        const idx = line.indexOf(':');
        const label = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        if (value) {
          specs.push({ label, value });
        }
      } else if (!line.startsWith('✨') && !line.startsWith('🧵') && !line.startsWith('👗') && !line.startsWith('🌸')) {
        leadParts.push(line);
      }
    });

    return {
      leadText: leadParts.length > 0 ? leadParts.join(' ') : raw,
      bullets,
      specs,
    };
  }, [product.description]);

  const discount =
    product.discountPercent ||
    (product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0);

  const handleAdd = () => {
    onAddToCart(product, selectedSize, quantity, selectedColor || undefined);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  const handleWhatsApp = () => {
    const deepLink = `${window.location.origin}/?product=${product.id}`;
    const colorLine = selectedColor ? `\nColor: ${selectedColor}` : '';
    const msg = `Namaste SS VASTRA! Main yeh dress order karna chahti hu:\n*${product.name}*\nSize: ${selectedSize}${colorLine}\nQuantity: ${quantity}\nPrice: ₹${product.price * quantity}\nProduct Deep Link: ${deepLink}\nAddress: Green Vihar Vatika, Sanganer, Jaipur`;
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
                    target.src = 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80';
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

            {/* Color Swatch Selector */}
            {availableColors.length > 0 && (
              <div className="mb-4">
                <span className="block text-xs font-bold text-[#2B2320] uppercase tracking-wider mb-2">
                  Select Color: <span className="text-[#A87A2A] font-semibold">{selectedColor}</span>
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {availableColors.map((col) => {
                    const isSelected = selectedColor === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setSelectedColor(col)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'border-[#A87A2A] bg-[#F7E3E8] text-[#2B2320] ring-2 ring-[#A87A2A]/40 shadow-xs'
                            : 'border-stone-300 text-stone-700 hover:border-stone-400 bg-white'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-2xs shrink-0"
                          style={{
                            backgroundColor:
                              col.toLowerCase().includes('pink') || col.toLowerCase().includes('gulabi') ? '#f472b6' :
                              col.toLowerCase().includes('red') || col.toLowerCase().includes('maroon') ? '#991b1b' :
                              col.toLowerCase().includes('blue') || col.toLowerCase().includes('navy') ? '#1e40af' :
                              col.toLowerCase().includes('green') || col.toLowerCase().includes('pista') ? '#15803d' :
                              col.toLowerCase().includes('yellow') || col.toLowerCase().includes('mustard') ? '#eab308' :
                              col.toLowerCase().includes('white') || col.toLowerCase().includes('ivory') ? '#fafaf9' :
                              col.toLowerCase().includes('black') ? '#18181b' :
                              col.toLowerCase().includes('orange') || col.toLowerCase().includes('rust') ? '#ea580c' :
                              col.toLowerCase().includes('purple') ? '#7e22ce' :
                              col.toLowerCase().includes('beige') ? '#f5f5dc' : '#A87A2A'
                          }}
                        />
                        <span>{col}</span>
                      </button>
                    );
                  })}
                </div>
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
                  onClick={() => onInstantBuy(product, selectedSize, quantity, selectedColor || undefined)}
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

                  <button
                    type="button"
                    onClick={() => {
                      if (onToggleWishlist) onToggleWishlist(product);
                    }}
                    className={`p-3 rounded-xl border transition-all shadow-xs flex items-center justify-center ${
                      isWishlisted
                        ? 'border-rose-300 bg-rose-50 text-rose-600'
                        : 'border-stone-300 bg-stone-50 hover:bg-white text-stone-700 hover:text-rose-500'
                    }`}
                    title={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
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

              {/* Direct Edit & Delete Outfit Action Bar */}
              {(onEditProduct || onDeleteProduct) && (
                <div className="pt-2 space-y-2 border-t border-stone-200 mt-2">
                  <div className="flex gap-2">
                    {onEditProduct && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onEditProduct(product);
                        }}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-[#A87A2A] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                        <span>Edit Outfit (एडिट करें)</span>
                      </button>
                    )}

                    {onDeleteProduct && !showDeleteConfirm && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete (हटाएं)</span>
                      </button>
                    )}
                  </div>

                  {onDeleteProduct && showDeleteConfirm && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center space-y-2 animate-in fade-in duration-150">
                      <p className="text-xs font-bold text-rose-800">
                        Kya aap sach me is outfit ko catalog se delete karna chahte hain?
                      </p>
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 text-xs font-semibold bg-white hover:bg-stone-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            onClose();
                            if (onDeleteProduct) onDeleteProduct(product, true);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-xs"
                        >
                          Haan, Delete Karein
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 100% SECURE PAYMENTS Trust Banner (Vastramaniaa Luxury Style) */}
            <div className="border-t border-[#E9A9BB]/30 pt-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-[#FAF5EE] border border-[#E9A9BB]/40 mb-4">
                <div className="flex items-center gap-1.5 text-stone-700">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase">
                    100% SECURE PAYMENTS
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded-md bg-white border border-stone-200 text-sky-700 shadow-2xs">
                    Paytm
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-stone-200 text-purple-700 shadow-2xs">
                    PhonePe
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-stone-200 text-blue-600 shadow-2xs">
                    GPay
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-stone-200 text-stone-700 shadow-2xs">
                    NET BANKING
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-stone-200 text-amber-700 shadow-2xs">
                    VISA / MC
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                    COD ✓
                  </span>
                </div>
              </div>

              {/* Lead Product Description */}
              <h4 className="text-xs font-bold text-[#2B2320] uppercase tracking-wider mb-2">
                About The Outfit
              </h4>
              <p className="text-xs sm:text-sm text-stone-700 font-medium leading-relaxed mb-3">
                {parsedDesc.leadText}
              </p>

              {/* Key Specs Pills if available */}
              {parsedDesc.specs.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3.5">
                  {parsedDesc.specs.map((sp, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-stone-50 border border-stone-200 text-[11px]">
                      <span className="text-stone-400 block uppercase font-bold text-[9px] tracking-wider">
                        {sp.label}
                      </span>
                      <span className="font-semibold text-stone-800 line-clamp-1">
                        {sp.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Bullet Highlights in Vastramaniaa Style */}
              {parsedDesc.bullets.length > 0 && (
                <ul className="space-y-2 mb-4 bg-[#FBF7F0]/60 p-3.5 rounded-2xl border border-[#E9A9BB]/30">
                  {parsedDesc.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-stone-700 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A87A2A] mt-2 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Safe Highlights tags */}
              {safeHighlights.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700 mb-4">
                  {safeHighlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#A87A2A] shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* SS VASTRA Promise Card (Vastramaniaa Promise format) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FAF5EE] via-[#FBF7F0] to-[#F7E3E8]/40 border border-[#E9A9BB]/50 text-xs text-stone-800 leading-relaxed mb-4">
                <span className="font-serif font-bold text-[#A87A2A] text-sm block mb-1">
                  SS VASTRA Promise:
                </span>
                <p className="text-stone-700">
                  Cash on Delivery available | Free Prepaid Shipping across India | 7-Day Easy Doorstep Exchange | 100% Handcrafted Jaipuri Fabrics
                </p>
              </div>

              {/* Need Styling Help? Direct WhatsApp Assist */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs mb-4">
                <div className="text-emerald-900">
                  <span className="font-bold">Need styling help or custom sizing?</span>
                  <p className="text-[11px] text-emerald-700">WhatsApp us at +91 9783770735 or +91 7014897197</p>
                </div>
                <a
                  href={`https://wa.me/919783770735?text=${encodeURIComponent(
                    `Namaste SS VASTRA! Mujhe "${product.name}" ke styling aur sizing ke bare me guide karein.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 self-start sm:self-auto transition-colors shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>

              {/* Interactive Collapsible Accordions (Shipping, Care, Exchange) */}
              <div className="space-y-2 border-t border-stone-200 pt-4">
                {/* Accordion 1: Shipping */}
                <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('shipping')}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#2B2320]">
                      <Truck className="w-4 h-4 text-[#A87A2A]" />
                      <span>Shipping & Delivery Partners</span>
                    </div>
                    {openAccordion === 'shipping' ? (
                      <ChevronUp className="w-4 h-4 text-stone-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-500" />
                    )}
                  </button>

                  {openAccordion === 'shipping' && (
                    <div className="px-4 pb-4 pt-1 text-xs text-stone-600 leading-relaxed border-t border-stone-100 bg-[#FAF5EE]/30 space-y-2 animate-in fade-in duration-150">
                      <p>
                        We strive to offer a seamless shopping experience with timely and safe deliveries through trusted courier partners like <strong>Delhivery, Bluedart, DTDC, Shadowfax, and Shiprocket</strong>.
                      </p>
                      <p>
                        SS VASTRA offers <strong>Free Shipping across India</strong> for prepaid orders, with nominal COD charges. Orders are safely packaged in tamper-proof boxes and dispatched within 24–48 hours from our Jaipur Sanganer atelier.
                      </p>
                      <p className="text-[11px] text-[#A87A2A] font-bold">
                        Average Delivery Time: 3 to 5 business days nationwide.
                      </p>
                    </div>
                  )}
                </div>

                {/* Accordion 2: Fabric Care */}
                <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('care')}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#2B2320]">
                      <Sparkles className="w-4 h-4 text-[#A87A2A]" />
                      <span>Fabric Care & Wash Instructions</span>
                    </div>
                    {openAccordion === 'care' ? (
                      <ChevronUp className="w-4 h-4 text-stone-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-500" />
                    )}
                  </button>

                  {openAccordion === 'care' && (
                    <div className="px-4 pb-4 pt-1 text-xs text-stone-600 leading-relaxed border-t border-stone-100 bg-[#FAF5EE]/30 space-y-1.5 animate-in fade-in duration-150">
                      <p>• Handcrafted from authentic Jaipur natural fibers and traditional block prints.</p>
                      <p>• Dry clean recommended for first wash or gentle hand wash separately in cold water with mild liquid detergent.</p>
                      <p>• Do not soak, scrub, or bleach. Dry inside out in shade to maintain color brilliance.</p>
                      <p>• Steam iron on medium heat on the reverse side of the fabric.</p>
                    </div>
                  )}
                </div>

                {/* Accordion 3: Return & Exchange */}
                <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('returns')}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#2B2320]">
                      <RotateCcw className="w-4 h-4 text-[#A87A2A]" />
                      <span>Return & Doorstep Exchange Policy</span>
                    </div>
                    {openAccordion === 'returns' ? (
                      <ChevronUp className="w-4 h-4 text-stone-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-500" />
                    )}
                  </button>

                  {openAccordion === 'returns' && (
                    <div className="px-4 pb-4 pt-1 text-xs text-stone-600 leading-relaxed border-t border-stone-100 bg-[#FAF5EE]/30 space-y-2 animate-in fade-in duration-150">
                      <p>
                        Enjoy complete peace of mind with our <strong>7-Day Doorstep Exchange Policy</strong>.
                      </p>
                      <p>
                        Need a size exchange or different color? Simply WhatsApp our Jaipur support team with your Order ID, and our courier partner will arrange hassle-free reverse pickup from your doorstep.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
