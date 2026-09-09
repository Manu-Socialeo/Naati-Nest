import React, { useState } from 'react';
import { MenuItem } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';
import { X } from 'lucide-react';

interface VariantModalProps {
  item: MenuItem;
  onClose: () => void;
  onAdd: (item: MenuItem, variant: any) => void;
}

export const VegIcon = () => (
  <div className="w-4 h-4 border border-emerald-600 flex items-center justify-center rounded-xs bg-white shadow-xs">
    <div className="w-2 h-2 bg-emerald-600 rounded-full" />
  </div>
);

export const NonVegIcon = () => (
  <div className="w-4 h-4 border border-rose-600 flex items-center justify-center rounded-xs bg-white shadow-xs">
    <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-rose-600" />
  </div>
);

export const VariantModal = ({ item, onClose, onAdd }: VariantModalProps) => {
  const { language } = useLanguage();
  const itemName = language === 'en' ? item.name : item.name_kn || item.name;
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    item.variants?.[0]?.id || ''
  );

  if (!item.variants || item.variants.length === 0) return null;

  const handleAdd = () => {
    const variant = item.variants?.find(v => v.id === selectedVariantId);
    if (variant) {
      onAdd(item, variant);
      onClose();
    }
  };

  const selectedVariant = item.variants.find(v => v.id === selectedVariantId);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center">
      <div
        className="bg-white w-full sm:w-[420px] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-surface-border flex justify-between items-center bg-surface-subtle/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {item.is_veg ? <VegIcon /> : <NonVegIcon />}
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                Select Portion
              </span>
            </div>
            <h3 className="font-extrabold text-gray-900 text-lg">{itemName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-surface-subtle rounded-full transition-colors cursor-pointer"
          >
            <X size={20} className="text-text-muted" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Available Sizes / Portions
          </p>
          <div className="space-y-2.5">
            {item.variants.map(variant => {
              const isSelected = selectedVariantId === variant.id;
              return (
                <label
                  key={variant.id}
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={`flex items-center justify-between p-3.5 border-2 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary-light/50 shadow-xs'
                      : 'border-surface-border hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'border-primary bg-white' : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                      )}
                    </div>
                    <span className="font-bold text-sm text-gray-800">{variant.name}</span>
                  </div>
                  <span className="font-extrabold text-sm text-gray-900">₹{variant.price}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="p-5 border-t border-surface-border bg-surface-subtle">
          <button
            type="button"
            onClick={handleAdd}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-hover transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <span>Add to Cart</span>
            <span>•</span>
            <span>₹{selectedVariant?.price || item.price}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
