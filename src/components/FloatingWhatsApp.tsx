import React from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';

export const FloatingWhatsApp: React.FC = () => {
  const whatsappUrl =
    'https://wa.me/919783770735?text=Namaste%20SS%20VASTRA!%20Mujhe%20styling%20advice%20aur%20outfit%20recommendations%20chahiye';

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 pointer-events-auto">
      {/* Secondary 'Ask an Expert' Link / Trigger with gentle floating animation */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white text-[#8A6218] hover:text-[#5C4010] text-[11px] font-bold shadow-lg border border-[#D4AF37]/60 backdrop-blur-xs transition-all duration-300 hover:scale-105 active:scale-95 animate-float-subtle group/expert cursor-pointer"
        title="Chat with our stylist for personal advice"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#A87A2A] group-hover/expert:rotate-45 transition-transform duration-300 animate-pulse" />
        <span>Ask an Expert</span>
        <span className="text-[10px] text-stone-500 font-medium hidden sm:inline">
          • Styling Advice
        </span>
      </a>

      {/* Main WhatsApp Button with Ripple and Periodic Wiggle Animation */}
      <div className="relative group">
        {/* Glowing pulsing aura in the background */}
        <div className="absolute -inset-1 rounded-full bg-emerald-500/30 blur-sm animate-pulse pointer-events-none" />

        <a
          href="https://wa.me/919783770735?text=Namaste%20SS%20VASTRA!%20Mujhe%20designs%20aur%20order%20ke%20bare%20mein%20puchna%20hai"
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white pl-4 pr-5 py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/80 animate-whatsapp-pulse cursor-pointer"
          aria-label="Order or Chat on WhatsApp"
        >
          <div className="relative">
            <MessageCircle className="w-6 h-6 fill-current animate-whatsapp-wiggle" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-300 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
          </div>
          <div className="text-left hidden sm:block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-100">
              Jaipur Helpline
            </span>
            <span className="block text-xs font-bold leading-tight">
              Order on WhatsApp
            </span>
          </div>
        </a>
      </div>
    </div>
  );
};
