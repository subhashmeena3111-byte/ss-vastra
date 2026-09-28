import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Banner } from '../types.ts';

interface HeroSliderProps {
  banners?: Banner[];
  onExploreClick: () => void;
  whatsappUrl?: string;
}

const DEFAULT_BANNER: Banner = {
  id: 1,
  title: 'Elegance in Every Thread',
  subtitle: 'Ladies Fashion & Fabrics',
  imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85',
  ctaText: 'WhatsApp Par Order Karein',
  ctaLink: 'https://wa.me/919783770735',
  isActive: true,
  displayOrder: 1,
};

const FALLBACK_HERO_IMAGE =
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85';

export const HeroSlider: React.FC<HeroSliderProps> = ({
  banners = [],
  onExploreClick,
  whatsappUrl = 'https://wa.me/919783770735',
}) => {
  const activeBanners = banners.filter((b) => b.isActive !== false);
  const slideList = activeBanners.length > 0 ? activeBanners : [DEFAULT_BANNER];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Auto-slide every 5 seconds if not paused and more than 1 banner
  useEffect(() => {
    if (slideList.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideList.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [slideList.length, isPaused]);

  // Reset index if banners change
  useEffect(() => {
    if (currentIndex >= slideList.length) {
      setCurrentIndex(0);
    }
  }, [slideList.length, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slideList.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slideList.length);
  };

  const currentBanner = slideList[currentIndex] || DEFAULT_BANNER;

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-[#FBF7F0] via-[#F7E3E8]/20 to-[#FBF7F0] py-8 sm:py-14 border-b border-[#E9A9BB]/30 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-8 lg:gap-14 min-h-[460px]">
          
          {/* Left Column: Dynamic Banner Content */}
          <div className="w-full lg:w-1/2 flex flex-col items-start text-left transition-all duration-500">
            {/* Tagline / Subtitle Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7E3E8] border border-[#E9A9BB] text-[#A87A2A] text-xs font-semibold tracking-wider uppercase mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#A87A2A]" />
              <span>
                {currentBanner.badge || 'Direct From Jaipur Looms • Sanganer'}
              </span>
            </div>

            {/* Heading H1 */}
            <h1 className="font-serif font-[600] text-[36px] sm:text-[50px] lg:text-[64px] leading-[1.08] text-[#2B2320] mb-[12px] tracking-tight">
              {currentBanner.title}
            </h1>

            {/* Subheading H2 */}
            <h2 className="text-[20px] sm:text-[24px] lg:text-[26px] font-serif italic text-[#A87A2A] font-[500] mb-[18px] tracking-wide">
              {currentBanner.subtitle || 'Ladies Fashion & Fine Fabrics'}
            </h2>

            {/* Description P */}
            <p className="text-[15px] sm:text-[16px] text-stone-600 leading-[1.7] max-w-[46ch] mb-[28px]">
              Kurta sets, co-ord sets, anarkali aur fabrics. Roz ke liye bhi, khaas tyohar ke liye bhi. Jaipur se seedha aapke ghar tak.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <a
                href={currentBanner.ctaLink || whatsappUrl}
                target={currentBanner.ctaLink?.startsWith('http') ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-[#A87A2A] text-white font-[600] text-[15px] tracking-wide hover:bg-[#8e6520] transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>{currentBanner.ctaText || 'WhatsApp Par Order Karein'}</span>
              </a>

              <button
                type="button"
                onClick={onExploreClick}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white text-[#2B2320] border border-[#A87A2A]/40 font-[600] text-[15px] tracking-wide hover:bg-[#F7E3E8] hover:border-[#A87A2A] transition-all shadow-xs active:scale-98 cursor-pointer"
              >
                <span>Collections Dekhein</span>
                <ArrowRight className="w-4 h-4 text-[#A87A2A]" />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 pt-6 border-t border-[#E9A9BB]/30 grid grid-cols-2 sm:grid-cols-3 gap-4 w-full text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#A87A2A] shrink-0" />
                <span className="font-medium">100% Genuine Handblock</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#A87A2A] shrink-0" />
                <span className="font-medium">All India Fast Delivery</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-medium">Easy Exchange & Returns</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual with High-End Styling */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end relative">
            <div className="relative w-full max-w-[460px] aspect-[4/5] sm:aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/80 group">
              <img
                key={currentBanner.id + '-' + currentBanner.imageUrl}
                src={currentBanner.imageUrl || FALLBACK_HERO_IMAGE}
                alt={currentBanner.title}
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105 animate-in fade-in duration-500"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== FALLBACK_HERO_IMAGE) {
                    target.src = FALLBACK_HERO_IMAGE;
                  }
                }}
              />
              
              {/* Subtle Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

              {/* Floating Highlight Card on Photo */}
              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-[#E9A9BB]/50">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <span className="text-[11px] font-bold text-[#A87A2A] tracking-wider uppercase block truncate">
                      {currentBanner.subtitle || 'Exclusive Collection'}
                    </span>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-[#2B2320] truncate">
                      {currentBanner.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={onExploreClick}
                    className="px-3.5 py-1.5 rounded-full bg-[#A87A2A] text-white text-xs font-bold shrink-0 hover:bg-[#8e6520] transition-colors"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>

            {/* Slider Navigation Arrows (shown if multiple banners) */}
            {slideList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-lg border border-stone-200 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-10 cursor-pointer"
                  title="Previous Banner"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-lg border border-stone-200 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-10 cursor-pointer"
                  title="Next Banner"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

        </div>

        {/* Carousel Dots Indicator (if > 1 banner) */}
        {slideList.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8">
            {slideList.map((b, idx) => (
              <button
                key={b.id || idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? 'w-8 h-2.5 bg-[#A87A2A]'
                    : 'w-2.5 h-2.5 bg-stone-300 hover:bg-stone-400'
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
