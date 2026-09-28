import React from 'react';
import { Category } from '../types.ts';

interface CategoryRowProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (name: string) => void;
}

export const CategoryRow: React.FC<CategoryRowProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const allOption: Category = {
    id: 0,
    slug: 'all',
    name: 'All Products',
    icon: '✨',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&q=80',
  };

  const list = [allOption, ...categories];

  return (
    <section className="py-6 sm:py-8 bg-[#FBF7F0] border-b border-[#E9A9BB]/20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-[#A87A2A] font-semibold block">
              Jaipur Special
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2B2320]">
              Shop By Category
            </h2>
          </div>
          <span className="text-xs text-stone-500 hidden sm:inline">
            Scroll to explore →
          </span>
        </div>

        {/* Round category icons row with horizontal scrolling */}
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-[#E9A9BB] -mx-4 px-4 sm:mx-0 sm:px-0">
          {list.map((cat) => {
            const isSelected =
              selectedCategory.toLowerCase() === cat.name.toLowerCase() ||
              (cat.name === 'All Products' && (!selectedCategory || selectedCategory === 'All Products'));

            return (
              <button
                key={cat.id + cat.name}
                onClick={() => onSelectCategory(cat.name)}
                className="flex flex-col items-center gap-2 group shrink-0 focus:outline-none"
              >
                <div
                  className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full p-1 transition-all duration-300 relative ${
                    isSelected
                      ? 'ring-3 ring-[#A87A2A] shadow-md scale-105'
                      : 'border-2 border-[#E9A9BB]/40 hover:border-[#A87A2A] hover:scale-102'
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#F7E3E8] relative flex items-center justify-center">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <span className="text-2xl">{cat.icon || '👗'}</span>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#A87A2A]/20 backdrop-blur-xs flex items-center justify-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-white shadow-xs" />
                      </div>
                    )}
                  </div>
                </div>

                <span
                  className={`text-xs sm:text-[13px] font-medium tracking-tight text-center max-w-[85px] truncate transition-colors ${
                    isSelected
                      ? 'text-[#A87A2A] font-bold'
                      : 'text-[#2B2320] group-hover:text-[#A87A2A]'
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
