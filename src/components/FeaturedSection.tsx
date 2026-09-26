import React from 'react';
import { Sparkles, CheckCircle2, ShoppingBag, MessageCircle, Heart } from 'lucide-react';
import { Product } from '../types.ts';
import { normalizeProductImageUrl, getDriveThumbnailUrl } from '../utils/imageUtils.ts';
import { normalizeProductHighlights } from '../utils/productUtils.ts';

interface FeaturedSectionProps {
  onAddToCart: (product: Product, size: string) => void;
  onQuickView: (product: Product) => void;
}

export const FeaturedSection: React.FC<FeaturedSectionProps> = ({
  onAddToCart,
  onQuickView,
}) => {
  const featuredProduct: Product = {
    id: 101,
    slug: 'gulabi-gotapatti-anarkali-suit',
    name: 'Gulabi Mahal Handblock Gotapatti Anarkali Set with Organza Dupatta',
    category: 'Anarkali & Dresses',
    price: 2499,
    originalPrice: 3899,
    discountPercent: 36,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    stock: 25,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    ],
    description:
      'Masterfully handcrafted by master artisans in Sanganer, Jaipur. Features pure 60s cambric cotton with traditional floral block prints, authentic gold gotapatti hand embroidery along the yoke, and a breezy lightweight organza dupatta.',
    fabric: 'Pure 60s Cambric Cotton & Organza',
    color: 'Gulabi Rose & Gold',
    highlights: [
      'Handcrafted Yoke with Real Gotapatti Lace',
      'Flared 4.5 Meter Kali Gher',
      'Matching Tapered Pants with Border Detailing',
      'Hand-dyed Ombre Organza Dupatta',
    ],
    isFeatured: true,
  };

  const handleWhatsApp = () => {
    const msg = `Namaste SS VASTRA! Main yeh signature outfit order karna chahti hu:\n*${featuredProduct.name}*\nPrice: ₹${featuredProduct.price}`;
    window.open(`https://wa.me/919783770735?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-[#FBF7F0] via-[#F7E3E8]/30 to-[#FBF7F0] border-y border-[#E9A9BB]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F7E3E8] border border-[#E9A9BB] text-[#A87A2A] text-xs font-semibold uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Spotlight Masterpiece</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2B2320]">
            Sanganer Heritage Signature Piece
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-2">
            Each stitch tells a story of Jaipur's centuries-old royal dyeing and printing traditions.
          </p>
        </div>

        {/* Featured Product Layout */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E9A9BB]/40 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Visual Gallery Grid (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Main Big Photo */}
            <div className="sm:col-span-2 aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100 shadow-md group relative">
              <img
                src={normalizeProductImageUrl(featuredProduct.image)}
                alt={featuredProduct.name}
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  const target = e.currentTarget;
                  const fallback = getDriveThumbnailUrl(featuredProduct.image);
                  if (target.src !== fallback) {
                    target.src = fallback;
                  }
                }}
              />
              <span className="absolute top-3 left-3 bg-[#A87A2A] text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                36% OFF Limited Festive
              </span>
            </div>

            {/* Detail Close-up Shots */}
            <div className="flex flex-row sm:flex-col gap-3">
              <div className="flex-1 aspect-[4/5] rounded-xl overflow-hidden bg-stone-100 shadow-xs relative group">
                <img
                  src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=500&q=80"
                  alt="Fabric and gotapatti close up"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs">
                  Yoke Embroidery
                </span>
              </div>

              <div className="flex-1 aspect-[4/5] rounded-xl overflow-hidden bg-stone-100 shadow-xs relative group">
                <img
                  src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=500&q=80"
                  alt="Dupatta border detail"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs">
                  Organza Fall
                </span>
              </div>
            </div>
          </div>

          {/* Details & Action Info (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <span className="text-xs font-bold uppercase tracking-widest text-[#A87A2A] mb-1">
              Festive Edit 2026
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B2320] leading-snug mb-3">
              {featuredProduct.name}
            </h3>

            {/* Pricing */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-2xl sm:text-3xl font-bold text-[#2B2320]">
                ₹{featuredProduct.price.toLocaleString('en-IN')}
              </span>
              <span className="text-base text-stone-400 line-through">
                ₹{featuredProduct.originalPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Save ₹1,400
              </span>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-5">
              {featuredProduct.description}
            </p>

            {/* Highlights List */}
            <div className="space-y-2 mb-6">
              {normalizeProductHighlights(featuredProduct.highlights).map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-stone-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#A87A2A] shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => onAddToCart(featuredProduct, 'M')}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#A87A2A] hover:bg-[#8e6520] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-98"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add M Size to Bag</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
