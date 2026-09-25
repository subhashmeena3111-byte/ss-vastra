import React from 'react';
import { MessageCircle, Sparkles, ArrowRight, ShieldCheck, Truck } from 'lucide-react';

interface HeroSliderProps {
  onExploreClick: () => void;
  whatsappUrl?: string;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  onExploreClick,
  whatsappUrl = 'https://wa.me/919783770735',
}) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FBF7F0] via-[#F7E3E8]/20 to-[#FBF7F0] py-8 sm:py-14 border-b border-[#E9A9BB]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-8 lg:gap-14">
          
          {/* Left Column: Text Hierarchy - strictly adhering to the typography rules */}
          <div className="w-full lg:w-1/2 flex flex-col items-start text-left">
            {/* Tagline / Subtitle Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7E3E8] border border-[#E9A9BB] text-[#A87A2A] text-xs font-medium tracking-wider uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Direct From Jaipur Looms • Sanganer</span>
            </div>

            {/* Heading H1: Cormorant Garamond, 44px to 74px fluid, weight 600, line-height 1.05, margin-bottom 12px */}
            <h1 className="font-serif font-[600] text-[40px] sm:text-[54px] lg:text-[68px] leading-[1.05] text-[#2B2320] mb-[12px] tracking-tight">
              Elegance in Every Thread
            </h1>

            {/* Subheading H2: 21px to 27px fluid, italic, color gold (#A87A2A), margin-bottom 20px */}
            <h2 className="text-[21px] sm:text-[25px] lg:text-[27px] font-serif italic text-[#A87A2A] font-[500] mb-[20px] tracking-wide">
              Ladies Fashion & Fabrics
            </h2>

            {/* Description P: 16px, muted grey, line-height 1.7, max-width 44 characters, margin-bottom 30px */}
            <p className="text-[16px] text-stone-600 leading-[1.7] max-w-[44ch] mb-[30px]">
              Kurta sets, co-ord sets, anarkali aur fabrics. Roz ke liye bhi, khaas mauke ke liye bhi. Jaipur se seedha aap tak.
            </p>

            {/* Action Buttons: Gold buttons and highlights */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-[#A87A2A] text-white font-[600] text-[15px] tracking-wide hover:bg-[#8e6520] transition-all shadow-md hover:shadow-lg active:scale-98"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>WhatsApp Par Order Karein</span>
              </a>

              <button
                type="button"
                onClick={onExploreClick}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white text-[#2B2320] border border-[#A87A2A]/40 font-[600] text-[15px] tracking-wide hover:bg-[#F7E3E8] hover:border-[#A87A2A] transition-all shadow-xs active:scale-98"
              >
                <span>Collections Dekhein</span>
                <ArrowRight className="w-4 h-4 text-[#A87A2A]" />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 pt-6 border-t border-[#E9A9BB]/30 grid grid-cols-2 sm:grid-cols-3 gap-4 w-full text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#A87A2A] shrink-0" />
                <span>100% Genuine Handblock</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#A87A2A] shrink-0" />
                <span>All India Fast Delivery</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Easy Exchange & Returns</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Product Visual with soft rounded corners */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[460px] aspect-[4/5] sm:aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/80 group">
              <img
                src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85"
                alt="SS VASTRA Royal Ethnic Collection Jaipur"
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              
              {/* Subtle Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

              {/* Floating Highlight Card on Photo */}
              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-[#E9A9BB]/50">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#A87A2A] tracking-wider uppercase block">
                      Featured Festive Drop
                    </span>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-[#2B2320]">
                      Jaipuri Gotapatti Anarkali Sets
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-stone-500 line-through block">₹2,699</span>
                    <span className="text-base font-bold text-[#A87A2A]">₹1,899</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
