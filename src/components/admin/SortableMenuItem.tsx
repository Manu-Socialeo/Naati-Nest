import React from 'react';
import { MenuItem } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { GripVertical, Star, Sparkles, Edit2, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableMenuItemProps {
  item: MenuItem;
  toggleAvailability: (item: MenuItem) => void;
  toggleBestseller: (item: MenuItem) => void;
  toggleTodaysSpecial: (item: MenuItem) => void;
  deleteItem: (item: MenuItem) => void;
  setEditingItem: (item: MenuItem | null) => void;
  setShowAddForm: (show: boolean) => void;
  isDragging: boolean;
}

export const SortableMenuItem = ({
  item,
  toggleAvailability,
  toggleBestseller,
  toggleTodaysSpecial,
  deleteItem,
  setEditingItem,
  setShowAddForm,
  isDragging,
}: SortableMenuItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-40' : ''}>
      <Card className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg"
          title="Drag to reorder"
        >
          <GripVertical size={20} className="text-gray-400" />
        </div>
        <img
          src={item.image_url || 'https://via.placeholder.com/80'}
          alt={item.name}
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-gray-100 border border-gray-200"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-gray-800 truncate">{item.name}</p>
            {item.name_kn && (
              <span className="text-xs text-gray-500 truncate hidden sm:inline">
                ({item.name_kn})
              </span>
            )}
            {item.is_bestseller && (
              <Star size={14} className="text-amber-500 fill-amber-500 flex-shrink-0" />
            )}
            {item.is_todays_special && (
              <Sparkles size={14} className="text-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-sm font-semibold text-gray-700">
            ₹{item.price}
            {item.variants && item.variants.length > 0
              ? ` • ${item.variants.length} portions`
              : ''}
          </p>
          {item.available_from && item.available_until && (
            <p className="text-xs text-blue-600 font-medium mt-1">
              🕒 {item.available_from} - {item.available_until}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              type="button"
              onClick={() => toggleAvailability(item)}
              className={
                'px-2.5 py-0.5 text-xs font-bold rounded-full transition-colors cursor-pointer ' +
                (item.is_available
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200')
              }
            >
              {item.is_available ? 'In Stock' : 'Out of Stock'}
            </button>
            <button
              type="button"
              onClick={() => toggleBestseller(item)}
              className={
                'px-2.5 py-0.5 text-xs font-bold rounded-full transition-colors cursor-pointer ' +
                (item.is_bestseller
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
              }
            >
              Bestseller
            </button>
            <button
              type="button"
              onClick={() => toggleTodaysSpecial(item)}
              className={
                'px-2.5 py-0.5 text-xs font-bold rounded-full transition-colors cursor-pointer ' +
                (item.is_todays_special
                  ? 'bg-primary-light text-primary hover:bg-primary-muted'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
              }
            >
              Today's Special
            </button>
          </div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              setEditingItem(item);
              setShowAddForm(true);
            }}
            className="p-2 text-gray-400 hover:text-primary hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
            title="Edit dish"
          >
            <Edit2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => deleteItem(item)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Delete dish"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </Card>
    </div>
  );
};
