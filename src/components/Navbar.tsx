import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  Phone,
  Truck,
  ShieldCheck,
  Download,
  HelpCircle,
  Package,
  User,
  MapPin,
  MessageCircle,
  Share2,
  Link as LinkIcon,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  onOpenTrackOrder: () => void;
  onOpenMyOrders?: () => void;
  onOpenCustomerAuth?: () => void;
  onOpenContact?: () => void;
  onSelectCategory: (categoryName: string) => void;
  onOpenAdmin: () => void;
  onScrollToMap?: () => void;
  onOpenDeepLink?: () => void;
  isAdminLoggedIn?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  onOpenSearch,
  onOpenTrackOrder,
  onOpenMyOrders,
  onOpenCustomerAuth,
  onOpenContact,
  onSelectCategory,
  onOpenAdmin,
  onScrollToMap,
  onOpenDeepLink,
  isAdminLoggedIn,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  const navLinks = [
    { label: 'Home', action: () => onSelectCategory('All Products') },
    { label: 'Kurta Sets', action: () => onSelectCategory('Kurta Sets') },
    { label: 'Co-ord Sets', action: () => onSelectCategory('Co-ord Sets') },
    { label: 'Anarkali & Dresses', action: () => onSelectCategory('Anarkali & Dresses') },
    { label: 'Kurtis', action: () => onSelectCategory('Kurta / Kurtis') },
    { label: 'Festive Fits', action: () => onSelectCategory('Festive Fits') },
    { label: 'Fabrics', action: () => onSelectCategory('Fabrics') },
    { label: 'Contact', action: () => onOpenContact ? onOpenContact() : null },
  ];

  return (
    <>
      {/* 1. Announcement Bar: strictly separated text with 14px gap, 13px font, 500 weight, bold tappable phone number */}
      <aside aria-label="Store Announcement" className="bg-[#A87A2A] text-white py-2 px-4 text-center select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-[14px] text-[13px] font-[500] tracking-wide flex-wrap">
          <span>Order ke liye WhatsApp karein</span>
          <span className="opacity-60 hidden sm:inline">•</span>
          <a
            href="https://wa.me/919783770735"
            target="_blank"
            rel="noopener noreferrer"
            className="font-[700] hover:underline underline-offset-2 flex items-center gap-1.5 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            9783770735
          </a>
          <span className="opacity-60 hidden md:inline">•</span>
          <span className="hidden md:inline-block text-xs font-normal bg-black/20 px-2 py-0.5 rounded">
            Jaipur Artisans Handcrafted
          </span>
        </div>
      </aside>

      {/* 2. Sticky Header with 64px logo and 22px link spacing */}
      <header className="sticky top-0 z-40 bg-[#FBF7F0]/95 backdrop-blur-md border-b border-[#E9A9BB]/30 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[80px]">
            {/* Mobile Menu Button */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[#2B2320] hover:text-[#A87A2A] transition-colors focus:outline-none"
                aria-label="Open navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Brand Logo & Name (Height 64px, Gold SS + Pink Saree Motif) */}
            <div className="flex-1 lg:flex-none flex items-center justify-center lg:justify-start">
              <button
                onClick={() => onSelectCategory('All Products')}
                className="flex items-center gap-3 group text-left focus:outline-none"
              >
                <div className="h-[64px] w-[64px] rounded-full p-1 bg-gradient-to-tr from-[#F7E3E8] to-[#FBF7F0] border-2 border-[#A87A2A]/40 shadow-sm flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
                  <img
                    src="/icon.svg"
                    alt="SS VASTRA Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <span className="block font-serif text-[24px] sm:text-[28px] font-bold tracking-[0.2em] text-[#2B2320] group-hover:text-[#A87A2A] transition-colors leading-tight">
                    SS VASTRA
                  </span>
                  <span className="block text-[11px] uppercase tracking-[0.25em] text-[#A87A2A] font-medium">
                    Jaipur • Sanganer
                  </span>
                </div>
              </button>
            </div>

            {/* Desktop Navigation Links (14px, weight 500, 22px spacing) */}
            <nav className="hidden lg:flex items-center space-x-[22px]">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={link.action}
                  className="text-[14px] font-[500] text-[#2B2320] hover:text-[#A87A2A] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#A87A2A] hover:after:w-full after:transition-all after:duration-200"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Header Right Action Icons */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* PWA Install Button */}
              {!isInstalled && isInstallable && (
                <button
                  onClick={install}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-[#F7E3E8] text-[#A87A2A] border border-[#E9A9BB] rounded-full hover:bg-[#A87A2A] hover:text-white transition-all shadow-xs"
                  title="Install SS VASTRA App on your device"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </button>
              )}

              {!isInstalled && isIOS && (
                <button
                  onClick={() => setShowIOSModal(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-[#F7E3E8] text-[#A87A2A] border border-[#E9A9BB] rounded-full hover:bg-[#A87A2A] hover:text-white transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Add to Home</span>
                </button>
              )}

              {/* Track Order Button */}
              <button
                onClick={onOpenTrackOrder}
                className="hidden md:flex items-center gap-1.5 text-[13px] font-medium text-[#2B2320] hover:text-[#A87A2A] px-2.5 py-1.5 rounded-lg hover:bg-black/5 transition-colors"
                title="Track your order delivery"
              >
                <Truck className="w-4 h-4 text-[#A87A2A]" />
                <span>Track Order</span>
              </button>

              {/* My Orders Button */}
              {onOpenMyOrders && (
                <button
                  type="button"
                  onClick={onOpenMyOrders}
                  className="hidden sm:flex items-center gap-1.5 text-[13px] font-medium text-[#2B2320] hover:text-[#A87A2A] px-2.5 py-1.5 rounded-lg hover:bg-black/5 transition-colors"
                  title="View your orders & tracking status"
                >
                  <Package className="w-4 h-4 text-[#A87A2A]" />
                  <span>My Orders</span>
                </button>
              )}

              {/* Customer Account Trigger */}
              {onOpenCustomerAuth && (
                <button
                  type="button"
                  onClick={onOpenCustomerAuth}
                  className="p-2 text-[#2B2320] hover:text-[#A87A2A] hover:bg-black/5 rounded-full transition-colors"
                  title="Customer Sign In / Profile"
                  aria-label="Customer Profile"
                >
                  <User className="w-5 h-5" />
                </button>
              )}

              {/* Deep Link & Share Trigger */}
              {onOpenDeepLink && (
                <button
                  type="button"
                  onClick={onOpenDeepLink}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold bg-[#FBF7F0] border border-[#E9A9BB]/60 text-[#A87A2A] rounded-full hover:bg-[#A87A2A] hover:text-white transition-all shadow-2xs"
                  title="Generate & Share Deep Links"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Deep Link</span>
                </button>
              )}

              {/* Search Icon */}
              <button
                type="button"
                onClick={onOpenSearch}
                className="p-2 text-[#2B2320] hover:text-[#A87A2A] hover:bg-black/5 rounded-full transition-colors"
                aria-label="Search clothing catalog"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Cart Drawer Trigger */}
              <button
                type="button"
                onClick={onOpenCart}
                className="p-2 text-[#2B2320] hover:text-[#A87A2A] hover:bg-black/5 rounded-full transition-colors relative"
                aria-label="Shopping bag"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 bg-[#A87A2A] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#FBF7F0] animate-pulse">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Admin Portal Gateway */}
              <button
                type="button"
                onClick={onOpenAdmin}
                className={`p-2 rounded-full transition-colors ${
                  isAdminLoggedIn
                    ? 'text-amber-700 bg-amber-100 hover:bg-amber-200'
                    : 'text-stone-500 hover:text-[#A87A2A] hover:bg-black/5'
                }`}
                title={isAdminLoggedIn ? 'Admin Panel (Logged In)' : 'Admin Login'}
                aria-label="Admin Portal"
              >
                <ShieldCheck className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E9A9BB]/30 bg-[#FBF7F0] px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top duration-200">
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-[#E9A9BB]/20">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => {
                    link.action();
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 px-3 text-[14px] font-[500] text-[#2B2320] hover:bg-[#F7E3E8] rounded-md transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="pt-2 space-y-2">
              {onOpenMyOrders && (
                <button
                  onClick={() => {
                    onOpenMyOrders();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium text-[#2B2320] bg-white rounded-lg border border-[#E9A9BB]/40 shadow-xs"
                >
                  <Package className="w-4 h-4 text-[#A87A2A]" />
                  <span>My Orders (Mera Order Itihas)</span>
                </button>
              )}

              {onOpenCustomerAuth && (
                <button
                  onClick={() => {
                    onOpenCustomerAuth();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium text-[#2B2320] bg-white rounded-lg border border-[#E9A9BB]/40 shadow-xs"
                >
                  <User className="w-4 h-4 text-[#A87A2A]" />
                  <span>Customer Login / Profile</span>
                </button>
              )}

              <button
                onClick={() => {
                  onOpenTrackOrder();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium text-[#2B2320] bg-white rounded-lg border border-[#E9A9BB]/40 shadow-xs"
              >
                <Truck className="w-4 h-4 text-[#A87A2A]" />
                <span>Track Order Status</span>
              </button>

              {onOpenDeepLink && (
                <button
                  onClick={() => {
                    onOpenDeepLink();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium text-[#2B2320] bg-white rounded-lg border border-[#E9A9BB]/40 shadow-xs"
                >
                  <Share2 className="w-4 h-4 text-[#A87A2A]" />
                  <span>Deep Link & QR Generator</span>
                </button>
              )}

              {(!isInstalled && (isInstallable || isIOS)) && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (isInstallable) install();
                    else setShowIOSModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[14px] font-medium bg-[#A87A2A] text-white rounded-lg shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Install App on Phone</span>
                </button>
              )}

              <a
                href="https://wa.me/919783770735"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[14px] font-medium text-emerald-800 bg-emerald-50 rounded-lg border border-emerald-200"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Helpline: 9783770735</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[14px] font-medium rounded-lg border transition-all ${
                  isAdminLoggedIn
                    ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                    : 'bg-stone-100 text-stone-800 hover:bg-stone-200 border-stone-300'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#A87A2A]" />
                <span>{isAdminLoggedIn ? '👑 Open Admin Portal' : '🔒 Admin Login / Portal'}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* iOS Installation Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-[#E9A9BB]/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#F7E3E8] p-1 flex items-center justify-center border border-[#A87A2A]/40">
                <img src="/icon.svg" alt="SS VASTRA" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#2B2320]">Install SS VASTRA</h3>
                <p className="text-xs text-[#A87A2A]">iPhone / iPad Safari</p>
              </div>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed space-y-2">
              <span className="block">1. Tap the <strong>Share</strong> button (square with arrow up) at the bottom of Safari.</span>
              <span className="block">2. Scroll down and tap <strong>Add to Home Screen</strong>.</span>
              <span className="block">3. Enjoy seamless fast shopping anytime!</span>
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full rounded-xl bg-[#A87A2A] text-white py-2.5 text-sm font-semibold hover:bg-[#8e6520] transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
