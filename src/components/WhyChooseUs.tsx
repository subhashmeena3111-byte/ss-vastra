import React from 'react';
import { Sparkles, ShieldCheck, HeartHandshake, Truck, RefreshCw, Award } from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const features = [
    {
      icon: Sparkles,
      title: 'Authentic Sanganer Craft',
      desc: 'Handblock printed and tailored directly in Sanganer, Jaipur using time-honored artisanal wooden blocks and natural colors.',
    },
    {
      icon: Award,
      title: '100% Breathable Fabrics',
      desc: 'Pure 60s cambric cotton, mulmul, and chanderi silks that stay feather-light, soft on skin, and vibrant after multiple washes.',
    },
    {
      icon: Truck,
      title: 'Express All-India Delivery',
      desc: 'Partnered with Delhivery and BlueDart Express with automated real-time tracking links sent directly to your phone.',
    },
    {
      icon: HeartHandshake,
      title: 'Direct Weaver Pricing',
      desc: 'Zero middlemen and zero showroom markups. Premium boutique quality ethnic wear straight from the artisan looms to your closet.',
    },
    {
      icon: RefreshCw,
      title: 'Hassle-Free Exchanges',
      desc: 'Not the right fit? Relax! We offer prompt size exchanges and friendly WhatsApp customer support for total peace of mind.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Razorpay & COD',
      desc: 'Pay seamlessly with UPI, Google Pay, Cards, NetBanking via RBI-approved Razorpay, or choose Cash on Delivery at your doorstep.',
    },
  ];

  return (
    <section className="py-14 sm:py-20 bg-white border-b border-[#E9A9BB]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-[0.25em] text-[#A87A2A] font-bold block mb-2">
            The SS VASTRA Promise
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2B2320]">
            Why Ladies Across India Love Us
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-2">
            Jaipur's rich textile heritage crafted into contemporary fits for daily grace and grand festivities.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#FBF7F0] border border-[#E9A9BB]/30 hover:border-[#A87A2A]/40 transition-all duration-300 hover:shadow-lg group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#F7E3E8] text-[#A87A2A] flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#2B2320] mb-2 group-hover:text-[#A87A2A] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
