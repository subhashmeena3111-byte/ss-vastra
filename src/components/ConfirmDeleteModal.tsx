import React from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { Product } from '../types.ts';
import { normalizeProductImageUrl } from '../utils/imageUtils.ts';

interface ConfirmDeleteModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (product: Product) => void;
  isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-stone-900">
                Delete Outfit (हटाएं)
              </h3>
              <p className="text-[11px] text-stone-500">ID: #{product.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product preview card */}
        <div className="my-4 p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-3">
          <img
            src={normalizeProductImageUrl(product.image)}
            alt={product.name}
            className="w-14 h-16 object-cover object-top rounded-xl border border-stone-200 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-stone-900 truncate">
              {product.name}
            </p>
            <p className="text-[11px] text-[#A87A2A] font-semibold mt-0.5">
              ₹{product.price.toLocaleString('en-IN')}{' '}
              <span className="text-stone-400 font-normal">({product.category})</span>
            </p>
          </div>
        </div>

        {/* Warning text */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            Kya aap sach me is outfit ko catalog se hatana chahte hain? Yeh live catalog se turant hat jayega.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(product)}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-rose-600/20 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Deleting...' : 'Haan, Delete Karein'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
