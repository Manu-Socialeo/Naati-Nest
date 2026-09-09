import React, { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MenuItem, Category } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';
import { useCart } from '@/lib/CartContext';
import { useAuth } from '@/lib/AuthContext';
import {
  Search,
  ChevronRight,
  ArrowLeft,
  User,
  X,
  ShoppingCart,
  LayoutDashboard,
  Utensils,
  ChevronUp,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MenuSkeleton } from '@/components/ui/Skeleton';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { VariantModal, VegIcon, NonVegIcon } from '@/components/menu/VariantModal';
import { formatPrice } from '@/lib/utils';

const fallbackCategories: Category[] = [
  {
    id: 'cat-biryani-rice',
    name: 'Biryani & Rice',
    name_kn: 'ಬಿರಿಯಾನಿ ಮತ್ತು ಅನ್ನ',
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-starters',
    name: 'Starters',
    name_kn: 'ಸ್ಟಾರ್ಟರ್ಸ್',
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-kabab-more',
    name: 'Kabab & More',
    name_kn: 'ಕಬಾಬ್ ಮತ್ತು ಇತರೆ',
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-combos',
    name: 'Combos',
    name_kn: 'ಕಾಂಬೊಗಳು',
    sort_order: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-idlis-dosa',
    name: 'Idlis & Dosa',
    name_kn: 'ಇಡ್ಲಿ ಮತ್ತು ದೋಸೆ',
    sort_order: 5,
    created_at: new Date().toISOString(),
  },
];

const fallbackMenuItems: MenuItem[] = [
  {
    id: 'br1',
    category_id: 'cat-biryani-rice',
    name: 'Chicken Biryani',
    name_kn: 'ಚಿಕನ್ ಬಿರಿಯಾನಿ',
    price: 129,
    image_url:
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=400&auto=format&fit=crop',
    is_available: true,
    total_ordered: 0,
    created_at: new Date().toISOString(),
    is_veg: false,
    is_bestseller: true,
    rating: 4.8,
    rating_count: '5K+',
    has_variants: false,
  },
  {
    id: 'br2',
    category_id: 'cat-biryani-rice',
    name: 'Mutton Biryani',
    name_kn: 'ಮಟನ್ ಬಿರಿಯಾನಿ',
    price: 269,
    image_url:
      'https://images.unsplash.com/photo-1633945274405-b6c80a919169?q=80&w=400&auto=format&fit=crop',
    is_available: true,
    total_ordered: 0,
    created_at: new Date().toISOString(),
    is_veg: false,
    is_bestseller: true,
    rating: 4.7,
    rating_count: '3.5K+',
    has_variants: false,
  },
  {
    id: 'br3',
    category_id: 'cat-biryani-rice',
    name: 'Biryani Rice',
    name_kn: 'ಬಿರಿಯಾನಿ ಅನ್ನ',
    price: 79,
    image_url:
      'https://images.unsplash.com/photo-1536304993881-460e32f50a14?q=80&w=400&auto=format&fit=crop',
    is_available: true,
    total_ordered: 0,
    created_at: new Date().toISOString(),
    is_veg: false,
    rating: 4.5,
    rating_count: '4.7K+',
    has_variants: false,
  },
  {
    id: 'br4',
    category_id: 'cat-biryani-rice',
    name: 'Chicken Leg Piece Biryani',
    name_kn: 'ಚಿಕನ್ ಲೆಗ್ ಪೀಸ್ ಬಿರಿಯಾನಿ',
    price: 169,
    image_url:
      'https://images.unsplash.com/photo-1606491956689-2ea866880049?q=80&w=400&auto=format&fit=crop',
    is_available: true,
    total_ordered: 0,
    created_at: new Date().toISOString(),
    is_veg: false,
    is_todays_special: true,
    rating: 4.6,
    rating_count: '1.2K+',
    has_variants: false,
  },
  {
    id: 's1',
    category_id: 'cat-starters',
    name: 'Chicken Chops',
    name_kn: 'ಚಿಕನ್ ಚಾಪ್ಸ್',
    price: 129,
    image_url:
      'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=400&auto=format&fit=crop',
    is_available: true,
    total_ordered: 0,
    created_at: new Date().toISOString(),
    is_veg: false,
    has_variants: true,
    variants: [
      { id: 'half', name: 'Half', price: 79 },
      { id: 'full', name: 'Full', price: 129 },
    ],
  },
  {
    id: 's2',
    category_id: 'cat-starters',
    name: 'Chilly Chicken',
    name_kn: 'ಚಿಲ್ಲಿ ಚಿಕನ್',
    price: 129,
    image_url:
      'https://images.unsplash.com/photo-1610057099443-fde6c99db9e1?q=80&w=400&auto=format&fit=crop',
    is_available: true,
    total_ordered: 0,
    created_at: new Date().toISOString(),
    is_veg: false,
    has_variants: true,
    variants: [
      { id: 'half', name: 'Half', price: 79 },
      { id: 'full', name: 'Full', price: 129 },
    ],
  },
  {
    id: 's3',
    category_id: 'cat-starters',
    name: 'Chicken Fry',
    name_kn: 'ಚಿಕನ್ ಫ್ರೈ',
    price: 129,
    image_url:
      'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=400&auto=format&fit=crop',
    is_available: true,
    total_ordered: 0,
    created_at: new Date().toISOString(),
    is_veg: false,
    has_variants: true,
    variants: [
      { id: 'half', name: 'Half', price: 79 },
      { id: 'full', name: 'Full', price: 129 },
    ],
  },
  {
    id: 's4',
    category_id: 'cat-starters',
    name: 'Guntur Chicken',
    name_kn: 'ಗುಂಟೂರು ಚಿಕನ್',
    price: 129,
    image_url:
      'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=400&auto=format&fit=crop',
    is_available: true,
    total_ordered: 0,
    created_at: new Date().toISOString(),
    is_veg: false,
    has_variants: true,
    variants: [
      { id: 'half', name: 'Half', price: 79 },
      { id: 'full', name: 'Full', price: 129 },
    ],
  },
  {
    id: 's5',
    category_id: 'cat-starters',
    name: 'Lemon Chicken',
    name_kn: 'ಲೆಮನ್ ಚಿಕನ್',
    price: 129,
    image_url:
      'https://images.unsplash.com/photo-1525755662997-8b74394b95c6?q=80&w=400&auto=format&fit=crop',
    is_available: true,
    total_ordered: 0,
    created_at: new Date().toISOString(),
    is_veg: false,
    has_variants: true,
    variants: [
      { id: 'half', name: 'Half', price: 79 },
      { id: 'full', name: 'Full', price: 129 },
    ],
  },
  {
    id: 's6',
    category_id: 'cat-starters',
    name: 'Pepper Chicken',
    name_kn: 'ಪೆಪ್ಪರ್ ಚಿಕನ್',
    price: 129,
    image_url:
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=400&auto=format&fit=crop',
    is_available: true,
    total_ordered: 0,
    created_at: new Date().toISOString(),
    is_veg: false,
    has_variants: true,
    variants: [
      { id: 'half', name: 'Half', price: 79 },
      { id: 'full', name: 'Full', price: 129 },
    ],
  },
  {
    id: 's7',
    category_id: 'cat-starters',
    name: 'Chicken Sukka',
    name_kn: 'ಚಿಕನ್ ಸುಕ್ಕಾ',
    price: 129,
    image_url:
      'https://images.unsplash.com/photo-1567171466295-4afa63d45416?q=80&w=400&auto=format&fit=crop',
    is_available: true,
    total_ordered: 0,
    created_at: new Date().toISOString(),
    is_veg: false,
    has_variants: true,
    variants: [
      { id: 'half', name: 'Half', price: 79 },
      { id: 'full', name: 'Full', price: 129 },
    ],
  },
  {
    id: 'k1',
    category_id: 'cat-kabab-more',
    name: 'Kabab',
    name_kn: 'ಕಬಾಬ್',
    price: 110,
    image_url:
      'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=400&auto=format&fit=crop',
    is_available: true,
    total_ordered: 0,
    created_at: new Date().toISOString(),
    is_veg: false,
    has_variants: true,
    variants: [
      { id: 'half', name: 'Half', price: 60 },
      { id: 'full', name: 'Full', price: 110 },
    ],
  },
  {
    id: 'k2',
    category_id: 'cat-kabab-more',
    name: 'Lollipop',
    name_kn: 'ಲಾಲಿಪಾಪ್',
    price: 129,
    image_url:
      'https://images.unsplash.com/photo-1562967916-eb82221dfb44?q=80&w=400&auto=format&fit=crop',
    is_available: true,
    total_ordered: 0,
    created_at: new Date().toISOString(),
    is_veg: false,
    has_variants: true,
    variants: [
      { id: 'half', name: 'Half', price: 79 },
      { id: 'full', name: 'Full', price: 129 },
    ],
  },
  {
    id: 'cb1',
    category_id: 'cat-combos',
    name: 'Chicken Combo',
    name_kn: 'ಚಿಕನ್ ಕಾಂಬೊ',
    price: 159,
    image_url:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=400&auto=format&fit=crop',
    is_available: true,
    total_ordered: 0,
    created_at: new Date().toISOString(),
    is_veg: false,
    is_bestseller: true,
    has_variants: false,
  },
  {
    id: 'cb2',
    category_id: 'cat-combos',
    name: 'Mutton Combo',
    name_kn: 'ಮಟನ್ ಕಾಂಬೊ',
    price: 229,
    image_url:
      'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop',
    is_available: true,
    total_ordered: 0,
    created_at: new Date().toISOString(),
    is_veg: false,
    has_variants: false,
  },
  {
    id: 'cb3',
    category_id: 'cat-combos',
    name: 'Biryani Rice Combo',
    name_kn: 'ಬಿರಿಯಾನಿ ಅನ್ನದ ಕಾಂಬೊ',
    price: 129,
    image_url:
      'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?q=80&w=400&auto=format&fit=crop',
    is_available: true,
    total_ordered: 0,
    created_at: new Date().toISOString(),
    is_veg: false,
    has_variants: false,
  },
  {
    id: 'id1',
    category_id: 'cat-idlis-dosa',
    name: 'Dosa',
    name_kn: 'ದೋಸೆ',
    price: 25,
    image_url:
      'https://images.unsplash.com/photo-1630383249896-424e484df924?q=80&w=400&auto=format&fit=crop',
    is_available: true,
    total_ordered: 0,
    created_at: new Date().toISOString(),
    is_veg: true,
    has_variants: false,
  },
  {
    id: 'id2',
    category_id: 'cat-idlis-dosa',
    name: 'Idli',
    name_kn: 'ಇಡ್ಲಿ',
    price: 25,
    image_url:
      'https://images.unsplash.com/photo-1589301773859-b9af2f36a26e?q=80&w=400&auto=format&fit=crop',
    is_available: true,
    total_ordered: 0,
    created_at: new Date().toISOString(),
    is_veg: true,
    has_variants: false,
  },
];

export const MenuPage = () => {
  const { language, t } = useLanguage();
  const { addItem, decrementItem, items } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table');

  useEffect(() => {
    if (tableId) localStorage.setItem('naatinest_table_id', tableId);
    else localStorage.removeItem('naatinest_table_id');
  }, [tableId]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [nonVegOnly, setNonVegOnly] = useState(false);
  const [bestsellerOnly, setBestsellerOnly] = useState(false);
  const [todaysSpecialOnly, setTodaysSpecialOnly] = useState(false);
  const [selectedItemForVariant, setSelectedItemForVariant] = useState<MenuItem | null>(null);
  const [tableLabel, setTableLabel] = useState<string | null>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');

  useEffect(() => {
    const fetchTable = async () => {
      if (!tableId) return;
      try {
        const { data } = (await supabase
          .from('tables')
          .select('label, table_number')
          .eq('id', tableId)
          .single()) as any;
        if (data) setTableLabel(data.label || 'Table ' + data.table_number);
      } catch {}
    };
    fetchTable();
  }, [tableId]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: catData } = await supabase.from('categories').select('*').order('sort_order');
        const { data: itemData } = await supabase.from('menu_items').select('*');

        const finalCategories =
          catData && catData.length > 0 ? catData : fallbackCategories;
        const finalItems = itemData && itemData.length > 0 ? itemData : fallbackMenuItems;

        setCategories(finalCategories);
        setMenuItems(finalItems);
      } catch (error) {
        setCategories(fallbackCategories);
        setMenuItems(fallbackMenuItems);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Suggested items for upsell
  const suggestedItems = useMemo(() => {
    const inCartIds = new Set(items.map(i => i.id));
    return menuItems.filter(item => !inCartIds.has(item.id)).slice(0, 5);
  }, [items, menuItems]);

  const totalCartCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalCartAmount = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

  const handleAddClick = (item: MenuItem) => {
    if (item.variants && item.variants.length > 0) {
      setSelectedItemForVariant(item);
    } else {
      addItem(item);
    }
  };

  const handleDecrementClick = (item: MenuItem) => {
    const itemCartItems = items.filter(i => i.id === item.id);
    const cartItem = itemCartItems[itemCartItems.length - 1];
    if (cartItem) decrementItem(cartItem.cartItemId);
  };

  const scrollToCategory = (categoryId: string) => {
    setActiveCategoryTab(categoryId);
    if (categoryId === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(`cat-section-${categoryId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Table Banner */}
      {tableLabel && (
        <div className="bg-primary text-white text-center py-2.5 px-4 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 sticky top-0 z-30 shadow-xs tracking-wide">
          <span>📍 {tableLabel} — Dine-in</span>
        </div>
      )}

      {/* Top Header */}
      <header className={`${tableLabel ? '' : 'sticky top-0 z-20 '}bg-white border-b border-surface-border shadow-xs`}>
        <div className="flex items-center gap-3 p-3.5 max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 hover:bg-surface-subtle rounded-xl transition-colors cursor-pointer text-text-primary"
            title="Back to home"
          >
            <ArrowLeft size={22} />
          </button>

          {/* Search Bar */}
          <div className="flex-1 flex items-center gap-2 bg-surface-subtle rounded-xl px-3.5 py-2 border border-surface-border/80 focus-within:border-primary focus-within:bg-white transition-all">
            <Search className="text-text-muted shrink-0" size={18} />
            <input
              type="text"
              placeholder={t.search_placeholder || 'Search biryani, starters, kababs...'}
              className="bg-transparent border-none outline-none w-full text-text-primary placeholder:text-text-muted text-sm font-medium"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-text-muted hover:text-text-primary p-0.5"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="p-2.5 bg-primary-light text-primary rounded-xl hover:bg-primary-muted transition-colors cursor-pointer"
                title={t.admin_dashboard || 'Admin Dashboard'}
              >
                <LayoutDashboard size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="p-2.5 bg-surface-subtle text-text-secondary rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              title="My Orders"
            >
              <User size={18} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors relative cursor-pointer shadow-xs"
              title="View Cart"
            >
              <ShoppingCart size={18} />
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter Chips Row */}
        <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto hide-scrollbar border-t border-surface-border/60 max-w-4xl mx-auto">
          {/* Veg Toggle */}
          <button
            type="button"
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
              vegOnly
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                : 'border-surface-border bg-white text-text-secondary hover:bg-surface-subtle'
            }`}
          >
            <VegIcon />
            <span>Pure Veg</span>
          </button>

          {/* Non-Veg Toggle */}
          <button
            type="button"
            onClick={() => setNonVegOnly(!nonVegOnly)}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
              nonVegOnly
                ? 'border-rose-600 bg-rose-50 text-rose-800 shadow-2xs'
                : 'border-surface-border bg-white text-text-secondary hover:bg-surface-subtle'
            }`}
          >
            <NonVegIcon />
            <span>Non-Veg</span>
          </button>

          {/* Bestseller */}
          <button
            type="button"
            onClick={() => setBestsellerOnly(!bestsellerOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              bestsellerOnly
                ? 'border-amber-500 text-amber-800 bg-amber-50 shadow-2xs'
                : 'border-surface-border text-text-secondary bg-white hover:bg-surface-subtle'
            }`}
          >
            <span>{t.bestseller || 'Bestseller'}</span>
            {bestsellerOnly && <X size={12} strokeWidth={3} />}
          </button>

          {/* Today's Special */}
          <button
            type="button"
            onClick={() => setTodaysSpecialOnly(!todaysSpecialOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              todaysSpecialOnly
                ? 'border-primary text-primary bg-primary-light shadow-2xs'
                : 'border-surface-border text-text-secondary bg-white hover:bg-surface-subtle'
            }`}
          >
            <span>{t.todays_special || "Chef's Special"}</span>
            {todaysSpecialOnly && <X size={12} strokeWidth={3} />}
          </button>
        </div>

        {/* Categories Quick Navigation Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto hide-scrollbar border-t border-surface-border/40 bg-surface-subtle/50 max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => scrollToCategory('all')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeCategoryTab === 'all'
                ? 'bg-primary text-white shadow-2xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            All Items
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => scrollToCategory(cat.id)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeCategoryTab === cat.id
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {language === 'en' ? cat.name : cat.name_kn || cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Suggested Items Drawer (Upsell when cart is not empty) */}
      {items.length > 0 && suggestedItems.length > 0 && (
        <div className="bg-emerald-50/40 py-4 px-4 border-b border-emerald-100 max-w-4xl mx-auto">
          <h2 className="text-xs font-extrabold text-emerald-900 mb-3 uppercase tracking-wider flex items-center justify-between">
            <span>{t.suggested_title || 'Customers Also Ordered'}</span>
            <span className="text-[10px] text-emerald-700 font-semibold lowercase">frequently paired</span>
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
            {suggestedItems.map(item => {
              const itemCartItems = items.filter(i => i.id === item.id);
              const qty = itemCartItems.reduce((acc, i) => acc + i.quantity, 0);
              return (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  isSmall={true}
                  totalQuantity={qty}
                  onAddClick={handleAddClick}
                  onDecrementClick={handleDecrementClick}
                  language={language}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Main Menu List */}
      <main className="max-w-4xl mx-auto bg-white border-x border-surface-border shadow-xs min-h-[70vh]">
        {loading && <MenuSkeleton />}
        {!loading && (
          <>
            {categories.map(category => {
              const categoryItems = menuItems.filter(item => {
                const matchesCategory = item.category_id === category.id;
                const matchesSearch =
                  item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (item.name_kn || '').includes(searchQuery);

                if (!matchesCategory || !matchesSearch) return false;

                if (vegOnly && !nonVegOnly && item.is_veg !== true) return false;
                if (nonVegOnly && !vegOnly && item.is_veg === true) return false;
                if (bestsellerOnly && item.is_bestseller !== true) return false;
                if (todaysSpecialOnly && item.is_todays_special !== true) return false;

                const now = new Date();
                const currentTime = now.getHours() * 60 + now.getMinutes();
                if (item.available_from) {
                  const [h, m] = item.available_from.split(':').map(Number);
                  if (currentTime < h * 60 + m) return false;
                }
                if (item.available_until) {
                  const [h, m] = item.available_until.split(':').map(Number);
                  if (currentTime > h * 60 + m) return false;
                }

                return true;
              });

              if (categoryItems.length === 0) return null;

              return (
                <section
                  key={category.id}
                  id={`cat-section-${category.id}`}
                  className="scroll-mt-36"
                >
                  <div className="px-4 py-3.5 bg-surface-subtle/70 border-y border-surface-border/80 flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
                      {language === 'en' ? category.name : category.name_kn || category.name}
                    </h2>
                    <span className="text-xs font-bold text-text-muted bg-white px-2 py-0.5 rounded-full border border-surface-border">
                      {categoryItems.length}
                    </span>
                  </div>
                  <div className="divide-y divide-surface-border/50">
                    {categoryItems.map(item => {
                      const itemCartItems = items.filter(i => i.id === item.id);
                      const qty = itemCartItems.reduce((acc, i) => acc + i.quantity, 0);
                      return (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          totalQuantity={qty}
                          onAddClick={handleAddClick}
                          onDecrementClick={handleDecrementClick}
                          language={language}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })}

            {/* Empty State for Search */}
            {menuItems.filter(
              item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.name_kn || '').includes(searchQuery)
            ).length === 0 && (
              <div className="p-16 text-center text-text-muted">
                <Utensils size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="font-semibold text-text-secondary">No dishes found</p>
                <p className="text-xs text-text-muted mt-1">
                  Try searching for another dish or clear filter chips.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {items.length > 0 && (
        <div className="fixed bottom-5 left-4 right-4 z-40 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="w-full bg-primary text-white p-4 rounded-2xl shadow-elevated flex justify-between items-center hover:bg-primary-hover transition-all cursor-pointer border border-primary-border/30 active:scale-[0.99]"
          >
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-white text-xs font-black px-2 py-0.5 rounded-md">
                  {totalCartCount} {totalCartCount === 1 ? 'ITEM' : 'ITEMS'}
                </span>
                <span className="text-lg font-black">{formatPrice(totalCartAmount)}</span>
              </div>
              <p className="text-[11px] text-white/80 font-medium mt-0.5">
                Plus taxes & charges
              </p>
            </div>
            <div className="flex items-center gap-1 font-extrabold text-sm tracking-wide uppercase bg-white/20 hover:bg-white/30 px-3.5 py-2 rounded-xl transition-colors">
              <span>{t.view_cart || 'View Cart'}</span>
              <ChevronRight size={16} strokeWidth={3} />
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
