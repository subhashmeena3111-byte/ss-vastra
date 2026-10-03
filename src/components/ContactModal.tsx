import React, { useState } from 'react';
import {
  X,
  MapPin,
  Phone,
  Mail,
  Instagram,
  MessageCircle,
  Clock,
  Send,
  CheckCircle,
  ExternalLink,
  ShoppingBag,
  Truck,
  Scissors,
  Users,
} from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScrollToMap?: () => void;
  businessEmail?: string;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  onScrollToMap,
  businessEmail = 'contact@ssvastra.com',
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const encoded = encodeURIComponent(
      `Namaste SS VASTRA Team!\nNaam: ${name}\nPhone: ${phone}\nSandesh: ${message}`
    );
    window.open(`https://wa.me/919783770735?text=${encoded}`, '_blank');
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      setName('');
      setPhone('');
      setMessage('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#FBF7F0] rounded-3xl shadow-2xl overflow-hidden border border-[#E9A9BB]/40 my-6 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E9A9BB]/30 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#2B2320]">
              Sampark Karein (Contact SS VASTRA)
            </h2>
            <p className="text-xs text-[#A87A2A] font-semibold">
              Jaipur Boutique & Handblock Artisan Workshop
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white overflow-y-auto">
          {/* Left info box */}
          <div className="space-y-4 text-xs text-[#2B2320]">
            <div className="p-4 rounded-2xl bg-[#F7E3E8]/40 border border-[#E9A9BB]/40 space-y-3">
              <h3 className="font-serif text-base font-bold text-[#2B2320] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#A87A2A]" />
                Showroom & Workshop Address
              </h3>
              <p className="text-stone-700 leading-relaxed font-medium">
                SS VASTRA<br />
                Green Vihar Vatika, Sanganer,<br />
                Jaipur, Rajasthan 303905
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onScrollToMap) onScrollToMap();
                  else document.getElementById('store-location')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[11px] font-bold text-[#A87A2A] hover:underline flex items-center gap-1"
              >
                View on Interactive Map <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Multiple Dedicated WhatsApp Helpline Options */}
            <div className="space-y-2">
              <span className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                WhatsApp Contact Options (विभागीय सहायता):
              </span>

              {/* Option 1: New Orders & Fashion Styling */}
              <a
                href="https://wa.me/919783770735?text=Namaste%20SS%20VASTRA!%20Mujhe%20naye%20outfits%20dekhne%20aur%20order%20karne%20ke%20bare%20mein%20jankari%20chahiye."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 transition-all font-semibold hover:shadow-xs group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-[#2B2320] group-hover:text-emerald-700">1. Orders & New Booking</div>
                  <div className="text-[10px] text-stone-500 truncate">Designs & Shopping Help • +91 9783770735</div>
                </div>
              </a>

              {/* Option 2: Parcel Tracking & Dispatch */}
              <a
                href="https://wa.me/919783770735?text=Namaste%20SS%20VASTRA!%20Mujhe%20mere%20parcel%20dispatch%20aur%20live%20tracking%20status%20ke%20bare%20mein%20puchna%20hai."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 text-amber-900 transition-all font-semibold hover:shadow-xs group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-[#2B2320] group-hover:text-amber-800">2. Tracking & Delivery</div>
                  <div className="text-[10px] text-stone-500 truncate">Courier & Dispatch Status • +91 9783770735</div>
                </div>
              </a>

              {/* Option 3: Size & Custom Stitching */}
              <a
                href="https://wa.me/919783770735?text=Namaste%20SS%20VASTRA!%20Mujhe%20suit%20fitting%2C%20custom%20sizing%20aur%20alteration%20ke%20bare%20mein%20guidance%20chahiye."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-xl bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200 text-rose-900 transition-all font-semibold hover:shadow-xs group"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <Scissors className="w-4 h-4" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-[#2B2320] group-hover:text-rose-800">3. Sizing & Alteration</div>
                  <div className="text-[10px] text-stone-500 truncate">Masterji Atelier Help • +91 9783770735</div>
                </div>
              </a>

              {/* Option 4: Wholesale & B2B Inquiries */}
              <a
                href="https://wa.me/919783770735?text=Namaste%20Subhash%20ji!%20Mujhe%20SS%20VASTRA%20se%20wholesale%20%2F%20bulk%20boutique%20orders%20ke%20bare%20mein%20baat%20karni%20hai."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-xl bg-sky-50/80 hover:bg-sky-100/80 border border-sky-200 text-sky-900 transition-all font-semibold hover:shadow-xs group"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-[#2B2320] group-hover:text-sky-800">4. Wholesale & B2B Orders</div>
                  <div className="text-[10px] text-stone-500 truncate">Bulk & Boutique Reselling • +91 9783770735</div>
                </div>
              </a>
            </div>

            <div className="space-y-2 pt-2 border-t border-stone-200">
              <a
                href="tel:9783770735"
                className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FBF7F0] hover:bg-[#F7E3E8]/50 border border-[#E9A9BB]/40 text-[#2B2320] transition-colors font-semibold"
              >
                <Phone className="w-4 h-4 text-[#A87A2A] shrink-0" />
                <div className="text-left">
                  <div className="text-[10px] text-stone-500 uppercase font-bold">Direct Phone Call</div>
                  <div className="text-xs">9783770735</div>
                </div>
              </a>

              <a
                href={`mailto:${businessEmail}`}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FBF7F0] hover:bg-[#F7E3E8]/50 border border-[#E9A9BB]/40 text-[#2B2320] transition-colors font-semibold"
              >
                <Mail className="w-4 h-4 text-[#A87A2A] shrink-0" />
                <div className="text-left">
                  <div className="text-[10px] text-stone-500 uppercase font-bold">Email Support</div>
                  <div className="text-xs">{businessEmail}</div>
                </div>
              </a>

              <a
                href="https://instagram.com/SS_vastra"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-900 transition-colors font-semibold"
              >
                <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
                <div className="text-left">
                  <div className="text-[10px] text-pink-600 uppercase font-bold">Instagram</div>
                  <div className="text-xs">@SS_vastra</div>
                </div>
              </a>

              <div className="flex items-center gap-2 p-2.5 text-stone-600 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-[#A87A2A]" />
                <span>Showroom: 10:00 AM - 8:30 PM (Saare 7 din khula)</span>
              </div>
            </div>
          </div>

          {/* Right quick inquiry form */}
          <div className="bg-[#FBF7F0] p-4 rounded-2xl border border-[#E9A9BB]/40 flex flex-col justify-between">
            <div>
              <h3 className="font-serif text-base font-bold text-[#2B2320] mb-1">
                Direct Sandesh Bhejein
              </h3>
              <p className="text-[11px] text-stone-500 mb-3">
                Custom sizing, bulk wholesale orders ya catalog inquiry ke liye form bharein.
              </p>

              {isSent ? (
                <div className="py-8 text-center">
                  <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <p className="font-bold text-sm text-[#2B2320]">Dhanyawaad!</p>
                  <p className="text-xs text-stone-500">Aapka sandesh WhatsApp par khul raha hai...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Aapka Naam *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ananya Meena"
                      className="w-full px-3 py-2 bg-white border border-[#E9A9BB]/50 rounded-xl text-xs text-[#2B2320] focus:outline-none focus:ring-1 focus:ring-[#A87A2A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      WhatsApp Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9783770735"
                      className="w-full px-3 py-2 bg-white border border-[#E9A9BB]/50 rounded-xl text-xs text-[#2B2320] focus:outline-none focus:ring-1 focus:ring-[#A87A2A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Aapka Sawal ya Order Query *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Mujhe Gotapatti Anarkali suit ke baare mein poochna hai..."
                      className="w-full px-3 py-2 bg-white border border-[#E9A9BB]/50 rounded-xl text-xs text-[#2B2320] focus:outline-none focus:ring-1 focus:ring-[#A87A2A]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#A87A2A] hover:bg-[#8e6520] text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp Par Bhejein</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
