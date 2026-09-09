import React from 'react';
import { MenuItem } from '@/lib/types';
import { VegIcon, NonVegIcon } from './VariantModal';
import { Star, Plus, Minus, Sparkles } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
  isSmall?: boolean;
  totalQuantity: number;
  onAddClick: (item: MenuItem) => void;
  onDecrementClick: (item: MenuItem) => void;
  language: string;
}

export const MenuItemCard = ({
  item,
  isSmall = false,
  totalQuantity,
  onAddClick,
  onDecrementClick,
  language,
}: MenuItemCardProps) => {
  const itemName = language === 'en' ? item.name : item.name_kn || item.name;
  const itemDesc =
    language === 'en'
      ? item.description || ''
      : item.description_kn || item.description || '';

  if (isSmall) {
    return (
      <div className="min-w-[260px] max-w-[260px] bg-white rounded-2xl shadow-xs border border-surface-border p-3 flex gap-3 snap-start relative hover:shadow-md transition-shadow">
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              {item.is_veg ? <VegIcon /> : <NonVegIcon />}
              {item.is_bestseller && (
                <span className="text-amber-600 text-[10px] font-bold flex items-center bg-amber-50 px-1.5 py-0.5 rounded-full">
                  <Star size={8} className="mr-0.5 fill-amber-500 text-amber-500" /> Bestseller
                </span>
              )}
            </div>
            <h4 className="font-bold text-gray-900 text-sm line-clamp-2 leading-snug">
              {itemName}
            </h4>
          </div>
          <p className="text-gray-900 font-extrabold text-sm mt-2">₹{item.price}</p>
        </div>
        <div className="relative w-22 h-22 flex-shrink-0">
          <img
            src={item.image_url}
            alt={itemName}
            loading="lazy"
            className="w-full h-full object-cover rounded-xl border border-surface-border/60"
          />
          <button
            type="button"
            onClick={() => onAddClick(item)}
            className="absolute -bottom-2 -right-2 bg-white shadow-md rounded-xl p-1.5 text-primary border border-surface-border hover:bg-primary-light transition-colors cursor-pointer active:scale-95"
            title="Add item"
          >
            <Plus size={18} strokeWidth={2.5} />
            {totalQuantity > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {totalQuantity}
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 p-4 border-b border-surface-border/70 bg-white last:border-0 hover:bg-surface-subtle/30 transition-colors">
      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          {item.is_veg ? <VegIcon /> : <NonVegIcon />}
          {item.is_bestseller && (
            <span className="text-amber-700 bg-amber-50 border border-amber-200/80 text-[11px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Star size={10} className="fill-amber-500 text-amber-500" /> Bestseller
            </span>
          )}
          {item.is_todays_special && (
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/80 text-[11px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={10} className="text-emerald-600" /> Chef's Special
            </span>
          )}
        </div>

        <h3 className="font-extrabold text-gray-900 text-base sm:text-lg leading-tight">
          {itemName}
        </h3>

        <p className="text-gray-950 font-extrabold text-sm sm:text-base mt-1.5">₹{item.price}</p>

        {itemDesc && (
          <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
            {itemDesc}
          </p>
        )}
      </div>

      {/* Item Image & Action */}
      <div className="relative w-32 sm:w-36 h-28 sm:h-32 flex-shrink-0">
        <img
          src={item.image_url}
          alt={itemName}
          loading="lazy"
          className="w-full h-full object-cover rounded-2xl border border-surface-border shadow-xs"
        />

        {/* Add/Quantity Button */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="bg-white shadow-md rounded-xl overflow-hidden border border-surface-border w-28 h-9 flex items-center justify-center">
            {totalQuantity > 0 ? (
              <div className="flex items-center justify-between w-full px-2 text-primary font-extrabold text-base">
                <button
                  type="button"
                  onClick={() => onDecrementClick(item)}
                  className="p-1 hover:bg-primary-light rounded-lg flex-1 flex justify-center transition-colors cursor-pointer active:scale-90"
                >
                  <Minus size={16} strokeWidth={2.5} />
                </button>
                <span className="w-6 text-center text-sm font-black">{totalQuantity}</span>
                <button
                  type="button"
                  onClick={() => onAddClick(item)}
                  className="p-1 hover:bg-primary-light rounded-lg flex-1 flex justify-center transition-colors cursor-pointer active:scale-90"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onAddClick(item)}
                className="w-full h-full text-primary font-black text-center uppercase hover:bg-primary-light transition-colors text-xs tracking-wider cursor-pointer active:scale-95"
              >
                ADD
              </button>
            )}
          </div>
          {item.variants && item.variants.length > 0 && (
            <span className="text-[10px] text-text-muted mt-1 font-semibold bg-white/90 px-1.5 py-0.2 rounded-md shadow-2xs">
              Portions available
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
