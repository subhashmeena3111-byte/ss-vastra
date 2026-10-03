import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

interface ReviewsSliderProps {
  onViewProduct?: (productId: number) => void;
}

interface ReviewItem {
  id?: number;
  productId?: number;
  name: string;
  city: string;
  product: string;
  rating: number;
  review: string;
}

const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    productId: 12,
    name: 'Ananya Sharma',
    city: 'South Delhi',
    product: 'Olive Green Floral Embroidered Kurta Set',
    rating: 5,
    review:
      'The floral embroidery on the olive green suit is exquisite. The neckline and dupatta lace finishing are high boutique grade. Delivered to Delhi in just 3 days!',
  },
  {
    productId: 11,
    name: 'Dr. Meenakshi Iyer',
    city: 'Indiranagar, Bengaluru',
    product: 'Red & Beige Floral Pure Cotton Alia Cut Kurta Set',
    rating: 5,
    review:
      'The Alia cut flair on this red floral suit gives such an elegant, flattering silhouette. Pure cotton is soft on the skin and breathable for long clinic hours.',
  },
  {
    productId: 10,
    name: 'Ritu Agarwal',
    city: 'Malabar Hill, Mumbai',
    product: 'Peach Mirror Work Pure Cotton Kurti & Pant Set',
    rating: 5,
    review:
      'Subhash ji on WhatsApp helped me choose the exact chest size. The mirror work details on the peach set are gorgeous and look even better in person.',
  },
  {
    productId: 9,
    name: 'Pooja Choudhary',
    city: 'Vaishali Nagar, Jaipur',
    product: 'Teal Blue Floral Print Straight Kurta Pant Set',
    rating: 5,
    review:
      'Being from Jaipur, I know quality Sanganeri print and stitching. SS VASTRA’s teal set has crisp prints, neat seams, and didn’t shrink or bleed color in wash.',
  },
];

export const ReviewsSlider: React.FC<ReviewsSliderProps> = ({ onViewProduct }) => {
  const [reviews, setReviews] = useState<ReviewItem[]>(DEFAULT_REVIEWS);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch('/api/reviews')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.reviews) && data.reviews.length > 0) {
          const mapped: ReviewItem[] = data.reviews.map((r: any) => ({
            id: r.id,
            productId: r.productId,
            name: r.author,
            city: r.city || 'Verified Buyer',
            product: r.productName || 'Handcrafted Ethnic Outfit',
            rating: Number(r.rating) || 5,
            review: r.comment || r.title || 'Great fabric and fit.',
          }));
          setReviews(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const prevReview = () => {
    setCurrentIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  };

  const nextReview = () => {
    setCurrentIndex((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
  };

  const averageRating = (
    reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
  ).toFixed(1);

  return (
    <section className="py-14 sm:py-20 bg-[#FBF7F0] border-b border-[#E9A9BB]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs uppercase tracking-[0.25em] text-[#A87A2A] font-bold block mb-2">
            Verified Boutique Reviews ({reviews.length})
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2B2320]">
            Customer Stories & Experiences
          </h2>
          <div className="flex items-center justify-center gap-1 mt-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
            ))}
            <span className="text-xs font-bold text-stone-700 ml-2">
              {averageRating} / 5.0 Average Rating ({reviews.length} Verified Reviews)
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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-stone-100 pt-4 gap-4">
              <div>
                <h4 className="font-serif text-base font-bold text-[#2B2320]">
                  {reviews[currentIndex].name}
                </h4>
                <p className="text-xs text-stone-500">
                  {reviews[currentIndex].city} • Verified Buyer
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="inline-block text-[11px] font-semibold text-[#A87A2A] bg-[#F7E3E8] px-2.5 py-0.5 rounded-md">
                    Bought: {reviews[currentIndex].product}
                  </span>
                  {onViewProduct && (
                    <button
                      type="button"
                      onClick={() => onViewProduct(reviews[currentIndex].productId)}
                      className="text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      View Outfit →
                    </button>
                  )}
                </div>
              </div>

              {/* Slider Controls */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={prevReview}
                  className="p-2.5 rounded-full border border-stone-200 text-stone-600 hover:bg-[#A87A2A] hover:text-white transition-colors cursor-pointer"
                  aria-label="Previous review"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextReview}
                  className="p-2.5 rounded-full border border-stone-200 text-stone-600 hover:bg-[#A87A2A] hover:text-white transition-colors cursor-pointer"
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
                className={`h-2 rounded-full transition-all cursor-pointer ${
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
