import React from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Instagram,
  MessageCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface FooterProps {
  onSelectCategory: (name: string) => void;
  onOpenTrackOrder: () => void;
  onOpenAdmin: () => void;
  onOpenContact?: () => void;
  onOpenMyOrders?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onOpenTrackOrder,
  onOpenAdmin,
  onOpenContact,
  onOpenMyOrders,
}) => {
  return (
    <footer className="bg-[#1F1A18] text-stone-300 pt-14 pb-8 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 3 Columns Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14 pb-12 border-b border-stone-800">
          
          {/* Column 1: Brand Story & Heritage */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full p-1 bg-gradient-to-tr from-[#F7E3E8] to-[#FBF7F0] border-2 border-[#A87A2A]/40 flex items-center justify-center shrink-0">
                <img src="/icon.svg" alt="SS VASTRA Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-[0.15em] text-white block">
                  SS VASTRA
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-[#A87A2A] font-semibold">
                  Jaipur • Sanganer
                </span>
              </div>
            </div>

            <p className="text-sm font-serif italic text-amber-200/90">
              "Elegance in Every Thread — Your Style, Our Passion"
            </p>

            <p className="text-xs text-stone-400 leading-relaxed">
              Rooted in the historic textile hub of Sanganer, Jaipur, SS VASTRA brings handcrafted ladies fashion, pure cotton kurta sets, co-ords, anarkalis, and premium ethnic fabrics directly from artisan looms to discerning wardrobes across India.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com/SS_vastra"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-stone-800 hover:bg-[#A87A2A] flex items-center justify-center text-stone-300 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>

              <a
                href="https://wa.me/919783770735"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-emerald-900/60 hover:bg-emerald-600 flex items-center justify-center text-emerald-300 hover:text-white transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>

              <a
                href="tel:9783770735"
                className="w-9 h-9 rounded-full bg-stone-800 hover:bg-[#A87A2A] flex items-center justify-center text-stone-300 hover:text-white transition-colors"
                aria-label="Call Store"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links & Ethnic Collections */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-4 text-[#A87A2A]">
                Collections
              </h3>
              <ul className="space-y-2.5 text-xs text-stone-400">
                <li>
                  <button
                    onClick={() => onSelectCategory('Kurta Sets')}
                    className="hover:text-white transition-colors"
                  >
                    Kurta Sets
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectCategory('Co-ord Sets')}
                    className="hover:text-white transition-colors"
                  >
                    Co-ord Sets
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectCategory('Anarkali & Dresses')}
                    className="hover:text-white transition-colors"
                  >
                    Anarkali & Dresses
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectCategory('Kurta / Kurtis')}
                    className="hover:text-white transition-colors"
                  >
                    Kurta / Kurtis
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectCategory('Festive Fits')}
                    className="hover:text-white transition-colors"
                  >
                    Festive Fits
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onSelectCategory('Fabrics')}
                    className="hover:text-white transition-colors"
                  >
                    Pure Jaipuri Fabrics
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-4 text-[#A87A2A]">
                Customer Care
              </h3>
              <ul className="space-y-2.5 text-xs text-stone-400">
                <li>
                  <button
                    onClick={onOpenTrackOrder}
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5 text-[#A87A2A]" />
                    <span>Track Your Order</span>
                  </button>
                </li>
                {onOpenMyOrders && (
                  <li>
                    <button
                      onClick={onOpenMyOrders}
                      className="hover:text-white transition-colors"
                    >
                      My Orders & History
                    </button>
                  </li>
                )}
                {onOpenContact && (
                  <li>
                    <button
                      onClick={onOpenContact}
                      className="hover:text-white transition-colors"
                    >
                      Contact Store & Boutique
                    </button>
                  </li>
                )}
                <li>
                  <a
                    href="https://wa.me/919783770735"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    WhatsApp Helpline
                  </a>
                </li>
                <li>
                  <span className="text-stone-500">Shipping & Delivery (3-5 Days)</span>
                </li>
                <li>
                  <span className="text-stone-500">Easy Size Exchanges</span>
                </li>
                <li>
                  <span className="text-stone-500">Sanganer Artisan Pledge</span>
                </li>
                <li className="pt-2">
                  <button
                    onClick={onOpenAdmin}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-800 hover:bg-[#A87A2A] text-amber-300 hover:text-white transition-all text-[12px] font-medium border border-stone-700 hover:border-[#A87A2A]"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin Portal Login</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 3: Contact Details & Sanganer Boutique */}
          <div className="space-y-3.5">
            <h3 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-4 text-[#A87A2A]">
              Store & Workshop
            </h3>

            <div className="flex items-start gap-3 text-xs text-stone-400">
              <MapPin className="w-4 h-4 text-[#A87A2A] shrink-0 mt-0.5" />
              <span>
                Green Vihar Vatika, Sanganer, Jaipur, Rajasthan 303905, India
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-400">
              <Phone className="w-4 h-4 text-[#A87A2A] shrink-0" />
              <a href="tel:9783770735" className="hover:text-white">
                +91 9783770735
              </a>
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-400">
              <Mail className="w-4 h-4 text-[#A87A2A] shrink-0" />
              <a href="mailto:subhashmeena3111@gmail.com" className="hover:text-white">
                subhashmeena3111@gmail.com
              </a>
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-400">
              <Instagram className="w-4 h-4 text-[#A87A2A] shrink-0" />
              <a
                href="https://instagram.com/SS_vastra"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                @SS_vastra
              </a>
            </div>

            {/* Payment security badge */}
            <div className="pt-3 border-t border-stone-800">
              <span className="text-[11px] text-stone-400 block mb-2 font-medium">
                100% Safe Payments Handled By
              </span>
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-300">
                <span className="bg-stone-800 px-2.5 py-1 rounded border border-stone-700">
                  Razorpay UPI
                </span>
                <span className="bg-stone-800 px-2.5 py-1 rounded border border-stone-700">
                  Cash on Delivery
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} SS VASTRA. All rights reserved. Handcrafted in Sanganer, Jaipur.</p>
          <p className="flex items-center gap-2">
            <span>Made with pure natural dyes & love in Rajasthan</span>
          </p>
        </div>

      </div>
    </footer>
  );
};
