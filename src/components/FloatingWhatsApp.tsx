import React, { useState, useEffect } from 'react';
import { MessageCircle, Sparkles, X, ChevronRight, Truck, Scissors, ShoppingBag } from 'lucide-react';

interface WhatsAppSupportChannel {
  id: string;
  name: string;
  role: string;
  phone: string;
  avatarColor: string;
  icon: 'bag' | 'truck' | 'scissors';
  defaultMessage: string;
}

export const FloatingWhatsApp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [channels, setChannels] = useState<WhatsAppSupportChannel[]>([
    {
      id: 'sales',
      name: 'Pooja (Styling & Orders)',
      role: 'Outfits & New Orders Help',
      phone: '9783770735',
      avatarColor: 'bg-rose-500',
      icon: 'bag',
      defaultMessage: 'Namaste SS VASTRA! Mujhe designs aur new outfit order karne ke bare mein jankari chahiye.',
    },
    {
      id: 'tracking',
      name: 'Ramesh (Dispatch & Delivery)',
      role: 'Order Status & Tracking',
      phone: '9783770735',
      avatarColor: 'bg-amber-600',
      icon: 'truck',
      defaultMessage: 'Namaste SS VASTRA! Mujhe mere order status aur courier delivery ke bare mein puchna hai.',
    },
    {
      id: 'tailor',
      name: 'Masterji (Jaipur Atelier)',
      role: 'Custom Sizing & Farshi Fitting',
      phone: '9783770735',
      avatarColor: 'bg-emerald-600',
      icon: 'scissors',
      defaultMessage: 'Namaste! Mujhe custom sizing, bust fit, aur fabric details ke bare mein expert help chahiye.',
    },
  ]);

  // Load configured WhatsApp numbers from store settings if available
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.settings)) {
          const map: Record<string, string> = {};
          data.settings.forEach((s: any) => {
            map[s.key] = s.value;
          });

          const p1 = (map['support_whatsapp_1'] || map['whatsapp'] || map['phone'] || '9783770735').replace(/\D/g, '').slice(-10);
          const p2 = (map['support_whatsapp_2'] || map['phone'] || p1).replace(/\D/g, '').slice(-10);
          const p3 = (map['support_whatsapp_3'] || '9783770735').replace(/\D/g, '').slice(-10);
          const p4 = (map['support_whatsapp_4'] || '').replace(/\D/g, '').slice(-10);

          const list: WhatsAppSupportChannel[] = [
            {
              id: 'sales',
              name: map['support_name_1'] || 'Pooja (Styling & Orders)',
              role: 'Outfits & New Orders Help',
              phone: p1,
              avatarColor: 'bg-rose-500',
              icon: 'bag',
              defaultMessage: 'Namaste SS VASTRA! Mujhe designs aur new outfit order karne ke bare mein jankari chahiye.',
            },
            {
              id: 'tracking',
              name: map['support_name_2'] || 'Ramesh (Dispatch & Delivery)',
              role: 'Order Status & Tracking',
              phone: p2,
              avatarColor: 'bg-amber-600',
              icon: 'truck',
              defaultMessage: 'Namaste SS VASTRA! Mujhe mere order status aur courier delivery ke bare mein puchna hai.',
            },
            {
              id: 'tailor',
              name: map['support_name_3'] || 'Masterji (Jaipur Atelier)',
              role: 'Custom Sizing & Farshi Fitting',
              phone: p3,
              avatarColor: 'bg-emerald-600',
              icon: 'scissors',
              defaultMessage: 'Namaste! Mujhe custom sizing, bust fit, aur fabric details ke bare mein expert help chahiye.',
            },
          ];

          if (p4) {
            list.push({
              id: 'b2b',
              name: map['support_name_4'] || 'Subhash Meena (Founder & B2B)',
              role: 'Wholesale, Bulk & Special Inquiries',
              phone: p4,
              avatarColor: 'bg-sky-600',
              icon: 'bag',
              defaultMessage: 'Namaste Subhash ji! Mujhe SS VASTRA ke wholesale / bulk orders ke bare me baat karni hai.',
            });
          }

          setChannels(list);
        }
      })
      .catch(() => {});
  }, []);

  const openWhatsApp = (phone: string, text: string) => {
    const clean = phone.replace(/\D/g, '').slice(-10);
    const url = `https://wa.me/91${clean}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 pointer-events-auto">
      {/* Multi-Channel WhatsApp Department Popup */}
      {isOpen && (
        <div className="w-[310px] sm:w-[340px] bg-white rounded-3xl shadow-2xl border border-[#E9A9BB]/40 overflow-hidden mb-2 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-[#2B2320] text-white p-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <MessageCircle className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold">SS VASTRA Support</h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Jaipur Team Online</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-stone-300 mt-2">
              Apni zaroorat ke anusaar sahi department par click karein:
            </p>
          </div>

          {/* Department List */}
          <div className="p-3 space-y-2 bg-[#FBF7F0]">
            {channels.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => openWhatsApp(ch.phone, ch.defaultMessage)}
                className="w-full p-3 rounded-2xl bg-white hover:bg-[#F7E3E8]/50 border border-stone-200 hover:border-[#E9A9BB] transition-all text-left flex items-center justify-between gap-3 shadow-2xs group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl ${ch.avatarColor} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                    {ch.icon === 'bag' && <ShoppingBag className="w-5 h-5" />}
                    {ch.icon === 'truck' && <Truck className="w-5 h-5" />}
                    {ch.icon === 'scissors' && <Scissors className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#2B2320] truncate group-hover:text-[#A87A2A]">
                      {ch.name}
                    </h4>
                    <p className="text-[10px] text-stone-500 truncate">{ch.role}</p>
                    <span className="text-[9px] font-mono text-emerald-700 font-semibold">
                      +91 {ch.phone}
                    </span>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>

          <div className="p-2.5 bg-stone-50 border-t border-stone-200 text-center">
            <span className="text-[10px] text-stone-400">
              Instant reply • Monday to Sunday 9 AM - 9 PM IST
            </span>
          </div>
        </div>
      )}

      {/* Floating Buttons Bar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white text-[#8A6218] hover:text-[#5C4010] text-[11px] font-bold shadow-lg border border-[#D4AF37]/60 backdrop-blur-xs transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          title="Direct help from Jaipur master stylists & tracking"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#A87A2A]" />
          <span>WhatsApp Helpline (2+ Numbers)</span>
        </button>

        {/* Main Floating Bubble */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white pl-4 pr-5 py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/80 animate-whatsapp-pulse cursor-pointer"
          aria-label="Order or Chat on WhatsApp"
        >
          <div className="relative">
            <MessageCircle className="w-6 h-6 fill-current" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-300 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
          </div>
          <div className="text-left hidden sm:block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-100">
              Jaipur Support
            </span>
            <span className="block text-xs font-bold leading-tight">
              {isOpen ? 'Close Helpline' : 'Chat on WhatsApp'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
