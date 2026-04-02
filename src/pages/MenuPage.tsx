import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { MenuItem, Category } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';
import { useCart } from '@/lib/CartContext';
import { useAuth } from '@/lib/AuthContext';
import { Search, Plus, Minus, ChevronRight, ChevronUp, ArrowLeft, Mic, User, Star, X, ShoppingCart, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const fallbackCategories: Category[] = [
  { id: 'cat-biryani-rice', name: 'Biryani & Rice', name_kn: 'ಬಿರಿಯಾನಿ ಮತ್ತು ಅನ್ನ', sort_order: 1, created_at: new Date().toISOString() },
  { id: 'cat-starters', name: 'Starters', name_kn: 'ಸ್ಟಾರ್ಟರ್ಸ್', sort_order: 2, created_at: new Date().toISOString() },
  { id: 'cat-kabab-more', name: 'Kabab & More', name_kn: 'ಕಬಾಬ್ ಮತ್ತು ಇತರೆ', sort_order: 3, created_at: new Date().toISOString() },
  { id: 'cat-combos', name: 'Combos', name_kn: 'ಕಾಂಬೊಗಳು', sort_order: 4, created_at: new Date().toISOString() },
  { id: 'cat-idlis-dosa', name: 'Idlis & Dosa', name_kn: 'ಇಡ್ಲಿ ಮತ್ತು ದೋಸೆ', sort_order: 5, created_at: new Date().toISOString() },
];

const fallbackMenuItems: MenuItem[] = [
  // Biryani & Rice
  { id: 'br1', category_id: 'cat-biryani-rice', name: 'Chicken Biryani', name_kn: 'ಚಿಕನ್ ಬಿರಿಯಾನಿ', price: 129, image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=400&auto=format&fit=crop', is_available: true, total_ordered: 0, created_at: new Date().toISOString(), is_veg: false, is_bestseller: true, rating: 4.8, rating_count: '5K+' },
  { id: 'br2', category_id: 'cat-biryani-rice', name: 'Mutton Biryani', name_kn: 'ಮಟನ್ ಬಿರಿಯಾನಿ', price: 269, image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=400&auto=format&fit=crop', is_available: true, total_ordered: 0, created_at: new Date().toISOString(), is_veg: false, is_bestseller: true, rating: 4.7, rating_count: '3.5K+' },
  { id: 'br3', category_id: 'cat-biryani-rice', name: 'Biryani Rice', name_kn: 'ಬಿರಿಯಾನಿ ಅನ್ನ', price: 79, image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=400&auto=format&fit=crop', is_available: true, total_ordered: 0, created_at: new Date().toISOString(), is_veg: false, rating: 4.5, rating_count: '4.7K+' },
  { id: 'br4', category_id: 'cat-biryani-rice', name: 'Chicken Leg Piece Biryani', name_kn: 'ಚಿಕನ್ ಲೆಗ್ ಪೀಸ್ ಬಿರಿಯಾನಿ', price: 169, image_url: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?q=80&w=400&auto=format&fit=crop', is_available: true, total_ordered: 0, created_at: new Date().toISOString(), is_veg: false, is_todays_special: true, rating: 4.6, rating_count: '1.2K+' },

  // Starters
  { id: 's1', category_id: 'cat-starters', name: 'Chicken Chops', name_kn: 'ಚಿಕನ್ ಚಾಪ್ಸ್', price: 129, image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=400&auto=format&fit=crop', is_available: true, total_ordered: 0, created_at: new Date().toISOString(), is_veg: false, variants: [{ id: 'half', name: 'Half', price: 79 }, { id: 'full', name: 'Full', price: 129 }] },
  { id: 's2', category_id: 'cat-starters', name: 'Chilly Chicken', name_kn: 'ಚಿಲ್ಲಿ ಚಿಕನ್', price: 129, image_url: 'https://images.unsplash.com/photo-1562607349-590eb551fbdf?q=80&w=400&auto=format&fit=crop', is_available: true, total_ordered: 0, created_at: new Date().toISOString(), is_veg: false, variants: [{ id: 'half', name: 'Half', price: 79 }, { id: 'full', name: 'Full', price: 129 }] },
  { id: 's3', category_id: 'cat-starters', name: 'Chicken Fry', name_kn: 'ಚಿಕನ್ ಫ್ರೈ', price: 129, image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=400&auto=format&fit=crop', is_available: true, total_ordered: 0, created_at: new Date().toISOString(), is_veg: false, variants: [{ id: 'half', name: 'Half', price: 79 }, { id: 'full', name: 'Full', price: 129 }] },
  { id: 's4', category_id: 'cat-starters', name: 'Guntur Chicken', name_kn: 'ಗುಂಟೂರು ಚಿಕನ್', price: 129, image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=400&auto=format&fit=crop', is_available: true, total_ordered: 0, created_at: new Date().toISOString(), is_veg: false, variants: [{ id: 'half', name: 'Half', price: 79 }, { id: 'full', name: 'Full', price: 129 }] },
  { id: 's5', category_id: 'cat-starters', name: 'Lemon Chicken', name_kn: 'ಲೆಮನ್ ಚಿಕನ್', price: 129, image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=400&auto=format&fit=crop', is_available: true, total_ordered: 0, created_at: new Date().toISOString(), is_veg: false, variants: [{ id: 'half', name: 'Half', price: 79 }, { id: 'full', name: 'Full', price: 129 }] },
  { id: 's6', category_id: 'cat-starters', name: 'Pepper Chicken', name_kn: 'ಪೆಪ್ಪರ್ ಚಿಕನ್', price: 129, image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=400&auto=format&fit=crop', is_available: true, total_ordered: 0, created_at: new Date().toISOString(), is_veg: false, variants: [{ id: 'half', name: 'Half', price: 79 }, { id: 'full', name: 'Full', price: 129 }] },
  { id: 's7', category_id: 'cat-starters', name: 'Chicken Sukka', name_kn: 'ಚಿಕನ್ ಸುಕ್ಕಾ', price: 129, image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=400&auto=format&fit=crop', is_available: true, total_ordered: 0, created_at: new Date().toISOString(), is_veg: false, variants: [{ id: 'half', name: 'Half', price: 79 }, { id: 'full', name: 'Full', price: 129 }] },

  // Kabab & More
  { id: 'k1', category_id: 'cat-kabab-more', name: 'Kabab', name_kn: 'ಕಬಾಬ್', price: 110, image_url: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?q=80&w=400&auto=format&fit=crop', is_available: true, total_ordered: 0, created_at: new Date().toISOString(), is_veg: false, variants: [{ id: 'half', name: 'Half', price: 60 }, { id: 'full', name: 'Full', price: 110 }] },
  { id: 'k2', category_id: 'cat-kabab-more', name: 'Lollipop', name_kn: 'ಲಾಲಿಪಾಪ್', price: 129, image_url: 'https://images.unsplash.com/photo-1562607349-590eb551fbdf?q=80&w=400&auto=format&fit=crop', is_available: true, total_ordered: 0, created_at: new Date().toISOString(), is_veg: false, variants: [{ id: 'half', name: 'Half', price: 79 }, { id: 'full', name: 'Full', price: 129 }] },

  // Combos
  { id: 'cb1', category_id: 'cat-combos', name: 'Chicken Combo', name_kn: 'ಚಿಕನ್ ಕಾಂಬೊ', price: 159, image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=400&auto=format&fit=crop', is_available: true, total_ordered: 0, created_at: new Date().toISOString(), is_veg: false, is_bestseller: true },
  { id: 'cb2', category_id: 'cat-combos', name: 'Mutton Combo', name_kn: 'ಮಟನ್ ಕಾಂಬೊ', price: 229, image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=400&auto=format&fit=crop', is_available: true, total_ordered: 0, created_at: new Date().toISOString(), is_veg: false },
  { id: 'cb3', category_id: 'cat-combos', name: 'Biryani Rice Combo', name_kn: 'ಬಿರಿಯಾನಿ ಅನ್ನದ ಕಾಂಬೊ', price: 129, image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=400&auto=format&fit=crop', is_available: true, total_ordered: 0, created_at: new Date().toISOString(), is_veg: false },

  // Idlis & Dosa
  { id: 'id1', category_id: 'cat-idlis-dosa', name: 'Dosa', name_kn: 'ದೋಸೆ', price: 25, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?q=80&w=400&auto=format&fit=crop', is_available: true, total_ordered: 0, created_at: new Date().toISOString(), is_veg: true },
  { id: 'id2', category_id: 'cat-idlis-dosa', name: 'Idli', name_kn: 'ಇಡ್ಲಿ', price: 25, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?q=80&w=400&auto=format&fit=crop', is_available: true, total_ordered: 0, created_at: new Date().toISOString(), is_veg: true },
];

const VegIcon = () => (
  <div className="w-4 h-4 border border-green-600 flex items-center justify-center rounded-sm bg-white">
    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
  </div>
);

const NonVegIcon = () => (
  <div className="w-4 h-4 border border-red-600 flex items-center justify-center rounded-sm bg-white">
    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-red-600"></div>
  </div>
);

const VariantModal = ({ item, onClose, onAdd }: { item: MenuItem, onClose: () => void, onAdd: (item: MenuItem, variant: any) => void }) => {
  const { language } = useLanguage();
  const itemName = language === 'en' ? item.name : item.name_kn;
  const [selectedVariantId, setSelectedVariantId] = useState<string>(item.variants?.[0]?.id || '');

  if (!item.variants || item.variants.length === 0) return null;

  const handleAdd = () => {
    const variant = item.variants?.find(v => v.id === selectedVariantId);
    if (variant) {
      onAdd(item, variant);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:w-[400px] rounded-t-2xl sm:rounded-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {item.is_veg ? <VegIcon /> : <NonVegIcon />}
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Customise {itemName}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm font-bold text-gray-800 mb-3">Quantity</p>
          <div className="space-y-3">
            {item.variants.map((variant) => (
              <label key={variant.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <input
                      type="radio"
                      name="variant"
                      value={variant.id}
                      checked={selectedVariantId === variant.id}
                      onChange={() => setSelectedVariantId(variant.id)}
                      className="appearance-none w-5 h-5 border-2 border-gray-300 rounded-full checked:border-[#1e9e62] transition-colors"
                    />
                    {selectedVariantId === variant.id && (
                      <div className="absolute w-2.5 h-2.5 bg-[#1e9e62] rounded-full"></div>
                    )}
                  </div>
                  <span className="font-medium text-gray-800">{variant.name}</span>
                </div>
                <span className="font-bold text-gray-800">₹{variant.price}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={handleAdd}
            className="w-full bg-[#1e9e62] text-white font-bold py-3.5 rounded-xl hover:bg-green-700 transition-colors shadow-sm"
          >
            Add Item - ₹{item.variants.find(v => v.id === selectedVariantId)?.price}
          </button>
        </div>
      </div>
    </div>
  );
};

export const MenuPage = () => {
  const { language, t } = useLanguage();
  const { addItem, decrementItem, items } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [nonVegOnly, setNonVegOnly] = useState(false);
  const [bestsellerOnly, setBestsellerOnly] = useState(false);
  const [todaysSpecialOnly, setTodaysSpecialOnly] = useState(false);
  const [selectedItemForVariant, setSelectedItemForVariant] = useState<MenuItem | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: catData } = await supabase.from('categories').select('*').order('sort_order');
        const { data: itemData } = await supabase.from('menu_items').select('*');
        
        const finalCategories = catData && catData.length > 0 ? catData : fallbackCategories;
        const finalItems = itemData && itemData.length > 0 ? itemData : fallbackMenuItems;
        
        setCategories(finalCategories);
        setMenuItems(finalItems);
      } catch (error) {
        setCategories(fallbackCategories);
        setMenuItems(fallbackMenuItems);
      }
    };
    fetchData();
  }, []);

  // Get suggested items (items not in cart)
  const suggestedItems = useMemo(() => {
    const inCartIds = new Set(items.map(i => i.id));
    return menuItems.filter(item => !inCartIds.has(item.id)).slice(0, 5);
  }, [items, menuItems]);

  const renderItemCard = (item: MenuItem, isSmall = false) => {
    const itemCartItems = items.filter(i => i.id === item.id);
    const totalQuantity = itemCartItems.reduce((acc, i) => acc + i.quantity, 0);
    const itemName = language === 'en' ? item.name : item.name_kn;
    const itemDesc = language === 'en' ? item.description : item.description_kn;

    const handleAddClick = () => {
      if (item.variants && item.variants.length > 0) {
        setSelectedItemForVariant(item);
      } else {
        addItem(item);
      }
    };

    const handleDecrementClick = () => {
      const cartItem = itemCartItems[itemCartItems.length - 1]; // Remove the most recently added variant
      if (cartItem) decrementItem(cartItem.cartItemId);
    };

    if (isSmall) {
      return (
        <div key={item.id} className="min-w-[280px] max-w-[280px] bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex gap-3 snap-start relative">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
               {item.is_veg ? <VegIcon /> : <NonVegIcon />}
               {item.is_bestseller && <span className="text-[#d9534f] text-[10px] font-bold flex items-center"><Star size={8} className="mr-0.5 fill-[#d9534f]"/> Bestseller</span>}
            </div>
            <h4 className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight">{itemName}</h4>
            <p className="text-gray-600 text-sm mt-1">₹{item.price}</p>
          </div>
          <div className="relative w-24 h-24 flex-shrink-0">
            <img src={item.image_url} alt={itemName} className="w-full h-full object-cover rounded-xl" />
            <button 
              onClick={handleAddClick}
              className="absolute -bottom-2 -right-2 bg-white shadow-md rounded-xl p-1.5 text-[#1e9e62] border border-gray-100 hover:bg-gray-50 transition-colors"
            >
               <Plus size={20} strokeWidth={2.5} />
               {totalQuantity > 0 && (
                 <span className="absolute -top-2 -right-2 bg-[#1e9e62] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                   {totalQuantity}
                 </span>
               )}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={item.id} className="flex gap-4 p-4 border-b border-gray-100 bg-white last:border-0 relative">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {item.is_veg ? <VegIcon /> : <NonVegIcon />}
            {item.is_bestseller && <span className="text-[#d9534f] text-xs font-bold flex items-center"><Star size={10} className="mr-0.5 fill-[#d9534f]"/> Bestseller</span>}
          </div>
          <h3 className="font-bold text-gray-800 text-lg leading-tight">{itemName}</h3>
          <p className="text-gray-800 mt-2">₹{item.price}</p>
        </div>
        <div className="relative w-36 h-32 flex-shrink-0">
          <img src={item.image_url} alt={itemName} className="w-full h-full object-cover rounded-2xl" />
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-200 w-28 h-10 flex items-center justify-center">
              {totalQuantity > 0 ? (
                <div className="flex items-center justify-between w-full px-2 text-[#1e9e62] font-extrabold text-lg">
                  <button onClick={handleDecrementClick} className="p-1 hover:bg-green-50 rounded flex-1 flex justify-center">
                    <Minus size={18} strokeWidth={3} />
                  </button>
                  <span className="w-6 text-center">{totalQuantity}</span>
                  <button onClick={handleAddClick} className="p-1 hover:bg-green-50 rounded flex-1 flex justify-center">
                    <Plus size={18} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleAddClick} 
                  className="w-full h-full text-[#1e9e62] font-extrabold text-center uppercase hover:bg-green-50 transition-colors text-sm tracking-wide"
                >
                  ADD
                </button>
              )}
            </div>
            {item.variants && item.variants.length > 0 && (
              <span className="text-[10px] text-gray-500 mt-1 font-medium bg-white/80 px-1 rounded">Customisable</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Top Header */}
      <header className="bg-white z-20">
        <div className="flex items-center gap-3 p-3">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 border border-transparent focus-within:border-gray-300 focus-within:bg-white transition-all">
            <input
              type="text"
              placeholder={t.search_placeholder}
              className="bg-transparent border-none outline-none w-full text-gray-800 placeholder:text-gray-500 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="text-gray-500 flex-shrink-0" size={20} />
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <button 
                onClick={() => navigate('/admin')}
                className="p-2 bg-orange-100 text-orange-700 rounded-xl hover:bg-orange-200 transition-colors"
                title={t.admin_dashboard}
              >
                <LayoutDashboard size={20} />
              </button>
            )}
            <button 
              onClick={() => navigate('/orders')}
              className="p-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors"
            >
              <User size={20} />
            </button>
            <button 
              onClick={() => navigate('/cart')}
              className="p-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors relative"
            >
              <ShoppingCart size={20} />
              {items.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#e23744] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {items.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-3 px-4 py-3 overflow-x-auto hide-scrollbar border-b border-gray-100">
          {/* Veg Toggle */}
          <button 
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex items-center px-2 py-1.5 border rounded-xl shadow-sm transition-colors ${vegOnly ? 'border-green-700 bg-green-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
          >
            <div className={`relative w-8 h-3.5 rounded-full flex items-center transition-colors ${vegOnly ? 'bg-green-200' : 'bg-gray-200'}`}>
              <div className={`absolute w-5 h-5 bg-white border-2 border-green-700 rounded flex items-center justify-center shadow-sm transition-transform ${vegOnly ? 'right-0 translate-x-1' : '-left-1'}`}>
                <div className="w-2 h-2 bg-green-700 rounded-full"></div>
              </div>
            </div>
          </button>

          {/* Non-Veg Toggle */}
          <button 
            onClick={() => setNonVegOnly(!nonVegOnly)}
            className={`flex items-center px-2 py-1.5 border rounded-xl shadow-sm transition-colors ${nonVegOnly ? 'border-[#e23744] bg-red-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
          >
            <div className={`relative w-8 h-3.5 rounded-full flex items-center transition-colors ${nonVegOnly ? 'bg-red-200' : 'bg-gray-200'}`}>
              <div className={`absolute w-5 h-5 bg-white border-2 border-[#e23744] rounded flex items-center justify-center shadow-sm transition-transform ${nonVegOnly ? 'right-0 translate-x-1' : '-left-1'}`}>
                <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-[#e23744]"></div>
              </div>
            </div>
          </button>

          {/* Bestseller */}
          <button 
            onClick={() => setBestsellerOnly(!bestsellerOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-sm font-medium shadow-sm whitespace-nowrap transition-colors ${
              bestsellerOnly 
                ? 'border-[#e46c35] text-[#e46c35] bg-[#fff5f0] hover:bg-[#ffe8dd]' 
                : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            {t.bestseller} {bestsellerOnly && <X size={14} strokeWidth={3} />}
          </button>

          {/* Today's Special */}
          <button 
            onClick={() => setTodaysSpecialOnly(!todaysSpecialOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-sm font-medium shadow-sm whitespace-nowrap transition-colors ${
              todaysSpecialOnly 
                ? 'border-primary text-primary bg-orange-50 hover:bg-orange-100' 
                : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            {t.todays_special} {todaysSpecialOnly && <X size={14} strokeWidth={3} />}
          </button>
        </div>
      </header>

      {/* Suggested Items Section (Only show if items in cart) */}
      {items.length > 0 && suggestedItems.length > 0 && (
        <div className="bg-gray-50 pt-4 pb-6 px-4 border-b border-gray-200">
          <h2 className="text-lg font-extrabold text-gray-800 mb-4 flex items-center justify-between">
            {t.suggested_title}
            <ChevronUp size={24} className="text-gray-500" />
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar">
            {suggestedItems.map(item => renderItemCard(item, true))}
          </div>
        </div>
      )}

      {/* Main Menu List */}
      <main className="bg-white">
        {categories.map(category => {
          const categoryItems = menuItems.filter(item => {
            const matchesCategory = item.category_id === category.id;
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.name_kn.includes(searchQuery);
            
            if (!matchesCategory || !matchesSearch) return false;

            if (vegOnly && !nonVegOnly && item.is_veg !== true) return false;
            if (nonVegOnly && !vegOnly && item.is_veg === true) return false;
            if (bestsellerOnly && item.is_bestseller !== true) return false;
            if (todaysSpecialOnly && item.is_todays_special !== true) return false;

            return true;
          });
          
          if (categoryItems.length === 0) return null;

          return (
            <div key={category.id} className="pt-6">
              <h2 className="px-4 text-xl font-extrabold text-gray-800 mb-2">
                {language === 'en' ? category.name : category.name_kn} ({categoryItems.length})
              </h2>
              <div className="flex flex-col">
                {categoryItems.map(item => renderItemCard(item))}
              </div>
              <div className="h-4 bg-gray-100 w-full mt-4 border-t border-b border-gray-200" />
            </div>
          );
        })}
        
        {/* Empty State for Search */}
        {menuItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.name_kn.includes(searchQuery)).length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>{t.no_items_found} "{searchQuery}"</p>
          </div>
        )}
      </main>

      {/* Sticky Cart Banner */}
      {items.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-30">
          <button 
            onClick={() => navigate('/cart')}
            className="w-full bg-[#1e9e62] text-white p-4 rounded-xl shadow-xl flex justify-between items-center hover:bg-[#188050] transition-colors"
          >
            <div className="font-bold text-lg">
              {items.reduce((acc, i) => acc + i.quantity, 0)} {t.items_added}
            </div>
            <div className="flex items-center gap-1 font-bold text-lg">
              {t.view_cart} <ChevronRight size={20} />
            </div>
          </button>
        </div>
      )}

      {/* Variant Selection Modal */}
      {selectedItemForVariant && (
        <VariantModal
          item={selectedItemForVariant}
          onClose={() => setSelectedItemForVariant(null)}
          onAdd={addItem}
        />
      )}
    </div>
  );
};
