import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Flame,
  Crown,
} from 'lucide-react';
import { VideoReel, Product } from '../types';

interface VideoReelsSectionProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onOpenQuickBuy?: (product: Product) => void;
}

export const VideoReelsSection: React.FC<VideoReelsSectionProps> = ({
  products,
  onSelectProduct,
  onOpenQuickBuy,
}) => {
  const [reels, setReels] = useState<VideoReel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeReelId, setActiveReelId] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});

  // Fallback initial sample reels (9:16 vertical videos)
  const defaultReels: VideoReel[] = [
    {
      id: 1,
      title: 'Royal Anarkali Handblock Drape',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-an-orange-dress-41130-large.mp4',
      posterUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
      productTitle: 'Pure Cambric Cotton Jaipuri Anarkali Suit',
      productPrice: 2499,
      productImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
      badge: 'Trending 🔥',
      displayOrder: 1,
      isActive: true,
    },
    {
      id: 2,
      title: 'Jaipur Handcrafted Farshi Suit Fit',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-posing-in-a-white-dress-and-a-hat-41133-large.mp4',
      posterUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800',
      productTitle: 'Blush Pink Cotton Farshi Suit Set',
      productPrice: 1850,
      productImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800',
      badge: 'New Arrival ✨',
      displayOrder: 2,
      isActive: true,
    },
    {
      id: 3,
      title: 'Festive Banarasi & Zari Elegance',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-with-curly-hair-posing-41135-large.mp4',
      posterUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800',
      productTitle: 'Pista Green Rayon Kurta Farshi Set',
      productPrice: 2150,
      productImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800',
      badge: 'Best Seller 👑',
      displayOrder: 3,
      isActive: true,
    },
    {
      id: 4,
      title: 'Mustard Cotton Kurti Flare Look',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-model-posing-in-a-leather-jacket-41134-large.mp4',
      posterUrl: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=800',
      productTitle: 'White & Mustard Embroidered Kurta Set',
      productPrice: 1850,
      productImage: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=800',
      badge: 'Must Have 💖',
      displayOrder: 4,
      isActive: true,
    },
  ];

  useEffect(() => {
    fetch('/api/reels')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.reels) && data.reels.length > 0) {
          setReels(data.reels.filter((r: VideoReel) => r.isActive !== false));
        } else {
          setReels(defaultReels);
        }
      })
      .catch(() => {
        setReels(defaultReels);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === 'left' ? -320 : 320;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const togglePlayReel = (reelId: number) => {
    const video = videoRefs.current[reelId];
    if (!video) return;

    if (activeReelId === reelId && !video.paused) {
      video.pause();
      setActiveReelId(null);
    } else {
      // Pause all others
      Object.keys(videoRefs.current).forEach((key) => {
        const v = videoRefs.current[Number(key)];
        if (v && Number(key) !== reelId) {
          v.pause();
        }
      });
      video.play().catch(() => {});
      setActiveReelId(reelId);
    }
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    Object.values(videoRefs.current).forEach((v) => {
      if (v) v.muted = nextMuted;
    });
  };

  const handleOutfitClick = (reel: VideoReel, e: React.MouseEvent) => {
    e.stopPropagation();
    // Find matching product in catalog or construct fallback product
    const foundProduct = products.find(
      (p) =>
        (reel.productId && p.id === reel.productId) ||
        p.name.toLowerCase().includes((reel.productTitle || '').toLowerCase().slice(0, 15))
    );

    if (foundProduct) {
      onSelectProduct(foundProduct);
    } else {
      // Use fallback product format so modal opens smoothly
      const fallback: Product = {
        id: reel.productId || 9999 + reel.id,
        name: reel.productTitle || reel.title,
        price: reel.productPrice || 1999,
        originalPrice: (reel.productPrice || 1999) + 800,
        category: 'Kurta Sets',
        image: reel.productImage || reel.posterUrl || '',
        images: [reel.productImage || reel.posterUrl || ''],
        description: `Handcrafted with authentic Jaipur block-prints and pure natural fabrics. Seen live in our SS VASTRA Reel: ${reel.title}.`,
        fabric: 'Pure Cambric Cotton 60s',
        stock: 45,
        rating: 4.9,
        reviewsCount: 38,
      };
      onSelectProduct(fallback);
    }
  };

  if (!isLoading && reels.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-[#FAF5EE] via-white to-[#FBF7F0] border-y border-[#E9A9BB]/30 relative overflow-hidden">
      {/* Background Decorative Accents */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#F7E3E8]/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#A87A2A]/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7E3E8] border border-[#A87A2A]/30 text-[#A87A2A] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Watch • Love • Shop</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#2B2320]">
              SS VASTRA In Motion <span className="text-[#A87A2A] font-normal italic">Reels</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl">
              Dekhiye hamare authentic Jaipur outfits live draping mein, aur video se direct apna pasandeeda outfit order karein.
            </p>
          </div>

          {/* Sound & Navigation Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={toggleSound}
              className="px-3.5 py-2 rounded-full bg-white border border-[#E9A9BB]/60 hover:border-[#A87A2A] text-xs font-semibold text-[#2B2320] flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-stone-500" />
                  <span className="hidden sm:inline">Sound Off</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span className="text-emerald-700 font-bold hidden sm:inline">Sound On</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleScroll('left')}
                className="w-9 h-9 rounded-full bg-white border border-[#E9A9BB]/60 hover:bg-[#A87A2A] hover:text-white text-stone-700 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                aria-label="Previous Reels"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleScroll('right')}
                className="w-9 h-9 rounded-full bg-white border border-[#E9A9BB]/60 hover:bg-[#A87A2A] hover:text-white text-stone-700 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                aria-label="Next Reels"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 9:16 Video Reels Horizontal Scroll Carousel */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {reels.map((reel) => {
            const isPlaying = activeReelId === reel.id;

            return (
              <div
                key={reel.id}
                onClick={() => togglePlayReel(reel.id)}
                className="snap-start shrink-0 w-[240px] sm:w-[270px] md:w-[290px] aspect-[9/16] rounded-3xl overflow-hidden relative shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-white/60 hover:border-[#A87A2A]/80 cursor-pointer group select-none bg-stone-900"
              >
                {/* 9:16 HTML5 Video Element */}
                <video
                  ref={(el) => {
                    videoRefs.current[reel.id] = el;
                  }}
                  src={reel.videoUrl}
                  poster={reel.posterUrl}
                  loop
                  playsInline
                  muted={isMuted}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />

                {/* Ambient Top & Bottom Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none" />

                {/* Top Header Badge */}
                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
                  {reel.badge ? (
                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 shadow-sm flex items-center gap-1">
                      {reel.badge.includes('🔥') ? (
                        <Flame className="w-3 h-3 text-orange-400" />
                      ) : (
                        <Crown className="w-3 h-3 text-amber-300" />
                      )}
                      <span>{reel.badge}</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-black/50 text-[10px] text-white/90 font-medium">
                      SS Vastra Live
                    </span>
                  )}

                  {/* Sound indicator badge */}
                  <div className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/80 border border-white/10">
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                </div>

                {/* Center Play / Pause Indicator Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className={`w-14 h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/40 flex items-center justify-center text-white transition-all duration-300 shadow-xl ${
                      isPlaying
                        ? 'opacity-0 scale-75 group-hover:opacity-60 group-hover:scale-100'
                        : 'opacity-90 scale-100'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
                  </div>
                </div>

                {/* Reel Caption */}
                <div className="absolute bottom-24 left-3.5 right-3.5 pointer-events-none">
                  <h3 className="font-serif text-sm font-bold text-white drop-shadow-md line-clamp-1">
                    {reel.title}
                  </h3>
                </div>

                {/* Bottom Pinned Outfit Card Pill */}
                <div
                  onClick={(e) => handleOutfitClick(reel, e)}
                  className="absolute bottom-3 left-3 right-3 p-2 bg-white/95 backdrop-blur-md rounded-2xl border border-white/60 shadow-xl hover:bg-white transition-all duration-200 cursor-pointer flex items-center gap-2.5 group/card"
                >
                  {/* Outfit Thumbnail */}
                  <div className="w-12 h-14 rounded-xl overflow-hidden shrink-0 border border-stone-200 bg-stone-100 relative">
                    <img
                      src={reel.productImage || reel.posterUrl || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=300'}
                      alt={reel.productTitle || reel.title}
                      className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Outfit Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-bold text-[#A87A2A] tracking-wider truncate">
                      Featured Outfit
                    </p>
                    <h4 className="font-serif text-xs font-bold text-[#2B2320] truncate">
                      {reel.productTitle || reel.title}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-extrabold text-[#2B2320]">
                        ₹{(reel.productPrice || 1999).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-stone-400 line-through">
                        ₹{((reel.productPrice || 1999) + 800).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Quick Shop Button */}
                  <div className="w-9 h-9 rounded-xl bg-[#A87A2A] group-hover/card:bg-[#8e6520] text-white flex items-center justify-center shrink-0 shadow-xs transition-colors">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
