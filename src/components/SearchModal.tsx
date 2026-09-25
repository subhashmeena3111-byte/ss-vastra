import React, { useState } from 'react';
import { X, Search, ShoppingBag } from 'lucide-react';
import { Product } from '../types.ts';
import { normalizeProductImageUrl, getDriveThumbnailUrl } from '../utils/imageUtils.ts';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = products.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.fabric && p.fabric.toLowerCase().includes(q)) ||
      (p.color && p.color.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E9A9BB]/40 max-h-[80vh] flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 bg-[#FBF7F0] border-b border-[#E9A9BB]/30 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#A87A2A] shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search kurta sets, anarkali, cotton co-ords, fabrics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-sm sm:text-base text-[#2B2320] focus:outline-none placeholder:text-stone-400 font-medium"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500 hover:text-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-4 flex-1 divide-y divide-stone-100">
          {searchTerm.trim() === '' ? (
            <div className="py-8 text-center text-xs text-stone-500">
              <span className="font-semibold block mb-2 text-[#A87A2A]">Popular searches:</span>
              <div className="flex flex-wrap gap-2 justify-center">
                {['Gotapatti Anarkali', 'Cotton Co-ord', 'Mulmul Kurti', 'Sanganer Fabric', 'Festive Silk'].map(
                  (tag) => (
                    <button
                      key={tag}
                      onClick={() => setSearchTerm(tag)}
                      className="px-3 py-1 rounded-full bg-stone-100 hover:bg-[#F7E3E8] text-stone-700 hover:text-[#A87A2A] transition-colors"
                    >
                      {tag}
                    </button>
                  )
                )}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-500">
              No outfits matching "{searchTerm}" found. Try another search keyword.
            </div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  onSelectProduct(p);
                  onClose();
                }}
                className="py-3 flex items-center justify-between gap-3 hover:bg-stone-50 rounded-xl px-2 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={normalizeProductImageUrl(p.image)}
                    alt={p.name}
                    className="w-12 h-16 rounded-lg object-cover bg-stone-100 shrink-0"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback = getDriveThumbnailUrl(p.image);
                      if (target.src !== fallback) {
                        target.src = fallback;
                      }
                    }}
                  />
                  <div>
                    <span className="text-[10px] text-[#A87A2A] font-bold uppercase block">
                      {p.category}
                    </span>
                    <h4 className="font-serif text-xs sm:text-sm font-bold text-[#2B2320]">
                      {p.name}
                    </h4>
                    {p.fabric && (
                      <span className="text-[11px] text-stone-400 block">{p.fabric}</span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-[#2B2320] block">
                    ₹{p.price.toLocaleString('en-IN')}
                  </span>
                  {p.originalPrice > p.price && (
                    <span className="text-xs text-stone-400 line-through">
                      ₹{p.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
