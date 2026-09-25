import React, { useState, useEffect } from 'react';
import {
  X,
  Link as LinkIcon,
  Copy,
  Check,
  Share2,
  ExternalLink,
  QrCode,
  Sparkles,
  ShoppingBag,
  Truck,
  Tag,
  ShieldCheck,
  Send,
  MessageCircle,
  Download,
} from 'lucide-react';
import { Product, Category } from '../types.ts';

interface DeepLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  initialProduct?: Product | null;
  initialCategory?: string | null;
}

export type DeepLinkType =
  | 'product'
  | 'buy_now'
  | 'category'
  | 'track_order'
  | 'coupon'
  | 'my_orders'
  | 'admin_portal';

export const DeepLinkModal: React.FC<DeepLinkModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  initialProduct,
  initialCategory,
}) => {
  const [linkType, setLinkType] = useState<DeepLinkType>('product');
  const [selectedProductId, setSelectedProductId] = useState<number>(
    initialProduct?.id || (products.length > 0 ? products[0].id : 1)
  );
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>(
    initialCategory || (categories.length > 0 ? categories[0].name : 'Kurta Sets')
  );
  const [orderIdInput, setOrderIdInput] = useState<string>('SSV-1001');
  const [phoneInput, setPhoneInput] = useState<string>('9783770735');
  const [couponCodeInput, setCouponCodeInput] = useState<string>('FESTIVE20');
  const [copied, setCopied] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(false);

  useEffect(() => {
    if (initialProduct) {
      setSelectedProductId(initialProduct.id);
      setLinkType('product');
      if (initialProduct.sizes && initialProduct.sizes.length > 0) {
        setSelectedSize(initialProduct.sizes[0]);
      }
    } else if (initialCategory) {
      setSelectedCategoryName(initialCategory);
      setLinkType('category');
    }
  }, [initialProduct, initialCategory, isOpen]);

  if (!isOpen) return null;

  const baseUrl = window.location.origin;
  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Construct Deep Link based on selected type
  let generatedUrl = baseUrl;
  let shareTitle = 'SS VASTRA - Ladies Fashion & Fabrics, Jaipur';
  let shareText = 'Check out SS VASTRA handcrafted Jaipuri fashion:';

  switch (linkType) {
    case 'product':
      generatedUrl = `${baseUrl}/?product=${currentProduct?.id || selectedProductId}`;
      shareTitle = currentProduct ? currentProduct.name : 'Handcrafted Jaipuri Outfit';
      shareText = currentProduct
        ? `*${currentProduct.name}*\nPrice: ₹${currentProduct.price}\nCategory: ${currentProduct.category}\nFabric: ${currentProduct.fabric || 'Pure Cambric Cotton'}\nDirect link:`
        : 'Explore our latest Jaipuri handcrafted collection:';
      break;

    case 'buy_now':
      generatedUrl = `${baseUrl}/?buy=${currentProduct?.id || selectedProductId}&size=${encodeURIComponent(
        selectedSize
      )}&coupon=${encodeURIComponent(couponCodeInput || 'FESTIVE20')}`;
      shareTitle = `Instant Buy: ${currentProduct?.name || 'Outfit'}`;
      shareText = `Order *${currentProduct?.name}* (Size: ${selectedSize}) instantly with discount coupon ${couponCodeInput}:\n`;
      break;

    case 'category':
      generatedUrl = `${baseUrl}/?category=${encodeURIComponent(selectedCategoryName)}`;
      shareTitle = `${selectedCategoryName} Collection | SS VASTRA`;
      shareText = `Explore the authentic ${selectedCategoryName} collection directly from Sanganer, Jaipur:\n`;
      break;

    case 'track_order':
      generatedUrl = `${baseUrl}/?track=${encodeURIComponent(orderIdInput)}&phone=${encodeURIComponent(
        phoneInput
      )}`;
      shareTitle = `Track Order #${orderIdInput} | SS VASTRA`;
      shareText = `Track your SS VASTRA order status, live courier tracking & shipment details here:\n`;
      break;

    case 'coupon':
      generatedUrl = `${baseUrl}/?coupon=${encodeURIComponent(couponCodeInput)}`;
      shareTitle = `Special Discount Coupon: ${couponCodeInput}`;
      shareText = `Get exclusive festival discount with coupon code *${couponCodeInput}* on your entire order at SS VASTRA:\n`;
      break;

    case 'my_orders':
      generatedUrl = `${baseUrl}/?my-orders=true`;
      shareTitle = 'My Orders & Account | SS VASTRA';
      shareText = 'Check your active orders, order history and invoices at SS VASTRA:\n';
      break;

    case 'admin_portal':
      generatedUrl = `${baseUrl}/admin`;
      shareTitle = 'Admin Management Portal | SS VASTRA';
      shareText = 'Direct access to SS VASTRA Merchant Dashboard:\n';
      break;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleWhatsAppShare = () => {
    const fullMessage = `${shareText}\n${generatedUrl}\n\n*SS VASTRA - Elegance in Every Thread*\nSanganer, Jaipur`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
    generatedUrl
  )}&bgcolor=FFFFFF&color=2B2320&margin=2`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-[#E9A9BB]/40 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FBF7F0] border-b border-[#E9A9BB]/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#A87A2A]/10 text-[#A87A2A] flex items-center justify-center">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#2B2320]">
                Deep Link & QR Generator
              </h3>
              <p className="text-[11px] text-stone-500">
                Generate direct 1-click shareable links for WhatsApp, ads & customer support
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-stone-800">
          {/* Link Type Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Select Deep Link Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'product', label: 'Product Outfit', icon: ShoppingBag },
                { id: 'buy_now', label: 'Instant Buy / Cart', icon: Sparkles },
                { id: 'category', label: 'Category Collection', icon: Tag },
                { id: 'track_order', label: 'Order Tracking', icon: Truck },
                { id: 'coupon', label: 'Discount Coupon', icon: Tag },
                { id: 'my_orders', label: 'Customer Orders', icon: ShieldCheck },
                { id: 'admin_portal', label: 'Admin Portal', icon: LinkIcon },
              ].map((item) => {
                const Icon = item.icon;
                const active = linkType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setLinkType(item.id as DeepLinkType);
                      setShowQr(false);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                      active
                        ? 'border-[#A87A2A] bg-[#A87A2A]/10 text-[#A87A2A] shadow-2xs ring-1 ring-[#A87A2A]'
                        : 'border-stone-200 hover:border-stone-300 text-stone-600 bg-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuration Form Based on Link Type */}
          <div className="p-4 bg-[#FBF7F0] border border-[#E9A9BB]/30 rounded-2xl space-y-3">
            {/* Product Configuration */}
            {(linkType === 'product' || linkType === 'buy_now') && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#2B2320] mb-1">
                    Choose Outfit:
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-medium focus:outline-none focus:border-[#A87A2A]"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{p.price})
                      </option>
                    ))}
                  </select>
                </div>

                {linkType === 'buy_now' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#2B2320] mb-1">
                        Pre-selected Size:
                      </label>
                      <div className="flex gap-1.5 flex-wrap">
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSelectedSize(sz)}
                            className={`px-3 py-1 rounded-lg border text-xs font-bold transition-colors ${
                              selectedSize === sz
                                ? 'bg-[#A87A2A] text-white border-[#A87A2A]'
                                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#2B2320] mb-1">
                        Auto-Applied Coupon Code:
                      </label>
                      <input
                        type="text"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                        placeholder="e.g. FESTIVE20"
                        className="w-full px-3 py-1.5 bg-white rounded-xl border border-stone-300 text-xs font-mono font-bold focus:outline-none focus:border-[#A87A2A]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Category Configuration */}
            {linkType === 'category' && (
              <div>
                <label className="block text-xs font-bold text-[#2B2320] mb-1">
                  Select Collection Category:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryName(cat.name)}
                      className={`p-2 rounded-xl border text-xs font-bold text-left transition-all ${
                        selectedCategoryName === cat.name
                          ? 'border-[#A87A2A] bg-white text-[#A87A2A] ring-1 ring-[#A87A2A]'
                          : 'border-stone-200 bg-white/70 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Order Tracking Configuration */}
            {linkType === 'track_order' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2B2320] mb-1">
                    Order Number:
                  </label>
                  <input
                    type="text"
                    value={orderIdInput}
                    onChange={(e) => setOrderIdInput(e.target.value)}
                    placeholder="e.g. SSV-1001"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-mono font-bold focus:outline-none focus:border-[#A87A2A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2B2320] mb-1">
                    Customer Phone:
                  </label>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="e.g. 9783770735"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#A87A2A]"
                  />
                </div>
              </div>
            )}

            {/* Coupon Configuration */}
            {linkType === 'coupon' && (
              <div>
                <label className="block text-xs font-bold text-[#2B2320] mb-1">
                  Discount Coupon Code:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. FESTIVE20"
                    className="flex-1 px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-mono font-bold focus:outline-none focus:border-[#A87A2A]"
                  />
                  <div className="flex gap-1.5">
                    {['FESTIVE20', 'WELCOME10', 'SANGANER15'].map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setCouponCodeInput(code)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-[#A87A2A] rounded-lg text-xs font-mono font-bold"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Admin or Customer info */}
            {linkType === 'admin_portal' && (
              <p className="text-xs text-stone-600">
                Direct access URL for administrators and staff to log into the management portal.
              </p>
            )}

            {linkType === 'my_orders' && (
              <p className="text-xs text-stone-600">
                Direct link that opens customer order tracking and purchase invoice history.
              </p>
            )}
          </div>

          {/* Generated Deep Link Preview & Action Box */}
          <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-[#A87A2A]" />
                Generated Direct Deep Link
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Universal Web & Mobile Ready
              </span>
            </div>

            <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 font-mono text-xs text-[#2B2320] break-all select-all">
              {generatedUrl}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs transition-all shadow-xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#A87A2A] hover:bg-[#8e6520] text-white active:scale-98'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Deep Link Copied! ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Deep Link</span>
                  </>
                )}
              </button>

              {/* WhatsApp Share Button */}
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share on WhatsApp</span>
              </button>

              {/* QR Code Toggle Button */}
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className={`flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl border text-xs font-bold transition-colors ${
                  showQr
                    ? 'bg-[#2B2320] text-white border-[#2B2320]'
                    : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>{showQr ? 'Hide QR' : 'QR Code'}</span>
              </button>

              {/* Open in New Tab Button */}
              <a
                href={generatedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-colors"
                title="Test Deep Link in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* QR Code Section */}
          {showQr && (
            <div className="p-4 bg-[#FBF7F0] border border-[#E9A9BB]/40 rounded-2xl flex flex-col sm:flex-row items-center gap-5 animate-in fade-in duration-200">
              <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-sm shrink-0">
                <img
                  src={qrImageUrl}
                  alt="Deep Link QR Code"
                  className="w-36 h-36 rounded-lg object-contain"
                />
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <h4 className="font-serif text-sm font-bold text-[#2B2320]">
                  Printable QR Code for Garment Tags & Packaging
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Print this QR code on clothing swing tags, packaging inserts, or display it in your
                  Jaipur store. When scanned with any smartphone camera, it opens this direct outfit listing!
                </p>
                <a
                  href={qrImageUrl}
                  download={`ss_vastra_qr_${Date.now()}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A87A2A] hover:underline pt-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download High-Res QR Code</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
