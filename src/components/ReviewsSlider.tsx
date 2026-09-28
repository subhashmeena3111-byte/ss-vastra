import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

export const ReviewsSlider: React.FC = () => {
  const reviews = [
    {
      name: 'Ananya Sharma',
      city: 'South Delhi',
      product: 'Jaipuri Gotapatti Anarkali Set',
      rating: 5,
      review:
        'The pure cotton fabric is so soft and breathable, perfect for summer poojas and weddings. The flare is huge and gotapatti work looks royal! Delivered to Delhi in just 3 days.',
    },
    {
      name: 'Dr. Meenakshi Iyer',
      city: 'Indiranagar, Bengaluru',
      product: 'Handblock Printed Co-ord Set',
      rating: 5,
      review:
        'SS VASTRA co-ords have become my daily hospital and clinic go-to. Extremely elegant, neat stitching, and doesn’t bleed color at all in wash. Ordering two more pairs today!',
    },
    {
      name: 'Ritu Agarwal',
      city: 'Malabar Hill, Mumbai',
      product: 'Mulmul Straight Kurta with Afghani Pants',
      rating: 5,
      review:
        'Subhash ji on WhatsApp was so courteous and helped me choose the exact bust size. The fit is tailor-made perfection. So proud to support authentic Jaipur weavers.',
    },
    {
      name: 'Pooja Choudhary',
      city: 'Vaishali Nagar, Jaipur',
      product: 'Festive Banarasi & Chanderi Silk Suit',
      rating: 5,
      review:
        'Being a Jaipurite, I am very picky about authentic Sanganeri handblock prints. SS VASTRA’s finishing and quality beats high-end boutique stores at half the price.',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const prevReview = () => {
    setCurrentIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  };

  const nextReview = () => {
    setCurrentIndex((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="py-14 sm:py-20 bg-[#FBF7F0] border-b border-[#E9A9BB]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs uppercase tracking-[0.25em] text-[#A87A2A] font-bold block mb-2">
            Loved By Over 10,000+ Women
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2B2320]">
            Customer Reviews & Stories
          </h2>
          <div className="flex items-center justify-center gap-1 mt-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
            ))}
            <span className="text-xs font-bold text-stone-700 ml-2">
              4.9 / 5.0 Average Rating
            </span>
          </div>
        </div>

        {/* Carousel / Cards View */}
        <div className="relative max-w-4xl mx-auto">
          {/* Active Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E9A9BB]/40 shadow-xl relative overflow-hidden">
            <Quote className="w-16 h-16 text-[#F7E3E8] absolute -top-2 right-4 -rotate-12 pointer-events-none" />

            <div className="flex items-center gap-1 mb-4">
              {[...Array(reviews[currentIndex].rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
              ))}
            </div>

            <p className="font-serif text-lg sm:text-2xl text-[#2B2320] leading-relaxed italic mb-6">
              "{reviews[currentIndex].review}"
            </p>

            <div className="flex items-center justify-between border-t border-stone-100 pt-4">
              <div>
                <h4 className="font-serif text-base font-bold text-[#2B2320]">
                  {reviews[currentIndex].name}
                </h4>
                <p className="text-xs text-stone-500">
                  {reviews[currentIndex].city} • Verified Buyer
                </p>
                <span className="inline-block text-[11px] font-semibold text-[#A87A2A] bg-[#F7E3E8] px-2 py-0.5 rounded-md mt-1">
                  Bought: {reviews[currentIndex].product}
                </span>
              </div>

              {/* Slider Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevReview}
                  className="p-2.5 rounded-full border border-stone-200 text-stone-600 hover:bg-[#A87A2A] hover:text-white transition-colors"
                  aria-label="Previous review"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextReview}
                  className="p-2.5 rounded-full border border-stone-200 text-stone-600 hover:bg-[#A87A2A] hover:text-white transition-colors"
                  aria-label="Next review"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 mt-6">
            {reviews.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentIndex === idx ? 'w-6 bg-[#A87A2A]' : 'w-2 bg-[#E9A9BB]'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};
