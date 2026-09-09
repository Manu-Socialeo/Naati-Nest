import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/CartContext';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Minus,
  Plus,
  X,
  Sparkles,
  ChevronRight,
  CreditCard,
  Trash2,
  CheckCircle,
  Utensils,
  Clock,
} from 'lucide-react';
import { MenuItem, CartItem } from '@/lib/types';
import { motion } from 'motion/react';
import { VegIcon, NonVegIcon } from '@/components/menu/VariantModal';

const EditVariantModal = ({
  item,
  currentVariantId,
  onClose,
  onUpdate,
}: {
  item: MenuItem;
  currentVariantId?: string;
  onClose: () => void;
  onUpdate: (variant: import('@/lib/types').Variant) => void;
}) => {
  const { language } = useLanguage();
  const itemName = language === 'en' ? item.name : item.name_kn || item.name;
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    currentVariantId || item.variants?.[0]?.id || ''
  );

  if (!item.variants || item.variants.length === 0) return null;

  const handleUpdate = () => {
    const variant = item.variants?.find(v => v.id === selectedVariantId);
    if (variant) {
      onUpdate(variant);
      onClose();
    }
  };

  const selectedVariant = item.variants.find(v => v.id === selectedVariantId);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center">
      <div
        className="bg-white w-full sm:w-[420px] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-surface-border flex justify-between items-center bg-surface-subtle/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {item.is_veg ? <VegIcon /> : <NonVegIcon />}
              <h3 className="font-extrabold text-gray-900">{itemName}</h3>
            </div>
            <p className="text-xs text-text-muted">Select portion size</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-surface-subtle rounded-full transition-colors cursor-pointer"
          >
            <X size={20} className="text-text-muted" />
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2.5">
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
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-primary bg-white' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                  </div>
                  <span className="font-bold text-sm text-gray-800">{variant.name}</span>
                </div>
                <span className="font-extrabold text-sm text-gray-900">₹{variant.price}</span>
              </label>
            );
          })}
        </div>

        <div className="p-5 border-t border-surface-border bg-surface-subtle">
          <button
            type="button"
            onClick={handleUpdate}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-hover transition-colors shadow-md cursor-pointer active:scale-[0.98]"
          >
            Update Portion — ₹{selectedVariant?.price || item.price}
          </button>
        </div>
      </div>
    </div>
  );
};

export const CartPage = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { items, addItem, decrementItem, removeItem, updateItemVariant, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [itemToCustomize, setItemToCustomize] = useState<CartItem | null>(null);
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('online');
  const [isShaking, setIsShaking] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [scheduleOrder, setScheduleOrder] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const orderTypeRef = useRef<HTMLDivElement>(null);

  const tableId = localStorage.getItem('naatinest_table_id');

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const parcelCharge = orderType === 'takeaway' ? 10 : 0;
  const discount = couponApplied ? couponDiscount : 0;
  const total = Math.max(0, subtotal + parcelCharge + tipAmount - discount);

  const applyCoupon = () => {
    if (couponCode.trim().toLowerCase() === 'naatinest10') {
      setCouponApplied(true);
      setCouponDiscount(10);
      toast.success('Coupon applied! ₹10 off');
    } else {
      toast.error('Invalid coupon code. Try "naatinest10"');
    }
  };

  const handleBack = () => {
    navigate('/menu');
  };

  const initiatePhonePePayment = async (orderId: string) => {
    toast.loading('Redirecting to secure gateway...', { duration: 1500 });

    setTimeout(() => {
      toast.dismiss();
      toast.success('Payment Successful!');
      navigate(`/order-tracking/${orderId}`);
    }, 1500);
  };

  const placeOrder = async () => {
    if (!orderType) {
      setIsShaking(true);
      orderTypeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast.error(t.select_order_type || 'Please select Dine-in or Takeaway');
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setLoading(true);
    try {
      let orderId = `mock-${Date.now()}`;
      const token = Math.floor(100 + Math.random() * 900).toString();

      const orderData = {
        items: items.map(item => ({
          id: item.id,
          name: language === 'en' ? item.name : item.name_kn || item.name,
          quantity: item.quantity,
          price: item.price,
          variant: item.selectedVariant?.name,
        })),
        total_amount: total,
        subtotal: subtotal,
        parcel_charge: parcelCharge,
        order_type: orderType,
        status: 'pending',
        customer_name: user?.full_name || 'Guest',
        customer_phone: user?.phone || 'N/A',
        customer_id: null,
        table_id: tableId || null,
        token: token,
        payment_status: paymentMethod === 'cash' ? 'pending' : 'paid',
        payment_method: paymentMethod,
        tip_amount: tipAmount,
        coupon_code: couponApplied ? couponCode : null,
        coupon_discount: discount,
        scheduled_for:
          scheduleOrder && scheduledTime ? new Date(scheduledTime).toISOString() : null,
      };

      const { data: order, error } = await supabase
        .from('orders')
        .insert(orderData as any)
        .select()
        .single();

      if (error) throw error;
      if (!order) throw new Error('Order creation returned no data');
      orderId = (order as any).id;

      if (paymentMethod === 'online') {
        await initiatePhonePePayment(orderId);
      } else {
        toast.success('Order placed! Pay cash at the counter.');
        navigate(`/order-tracking/${orderId}`);
      }
      clearCart();
    } catch (error: any) {
      console.error('Order error:', error);
      toast.error(error?.message || t.order_failed || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  const suggestedItems = [
    {
      id: 's1',
      name: 'Tender Coconut Pudding',
      price: 75,
      image:
        'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=150&auto=format&fit=crop',
      is_veg: true,
    },
    {
      id: 's2',
      name: 'Cold Drink 475ml',
      price: 69,
      image:
        'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=150&auto=format&fit=crop',
      is_veg: true,
    },
    {
      id: 's3',
      name: 'Green Salad',
      price: 79,
      image:
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=150&auto=format&fit=crop',
      is_veg: true,
    },
    {
      id: 's4',
      name: 'Curd Raita',
      price: 40,
      image:
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=150&auto=format&fit=crop',
      is_veg: true,
    },
  ];

  const handleAddSuggested = (item: (typeof suggestedItems)[0]) => {
    addItem({
      id: item.id,
      category_id: '',
      name: item.name,
      name_kn: item.name,
      description: '',
      description_kn: '',
      price: item.price,
      image_url: item.image,
      is_available: true,
      total_ordered: 0,
      created_at: new Date().toISOString(),
      is_veg: item.is_veg,
      is_bestseller: false,
      is_todays_special: false,
      has_variants: false,
      variants: [],
      rating: 0,
      rating_count: '',
    });
  };

  return (
    <div className="min-h-screen bg-background pb-36 font-sans">
      {/* Header */}
      <header className="bg-white sticky top-0 z-20 shadow-xs border-b border-surface-border">
        <div className="max-w-2xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 -ml-2 hover:bg-surface-subtle rounded-xl transition-colors cursor-pointer text-text-primary"
              title="Back to menu"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 leading-none">Your Cart</h2>
              {tableId && (
                <p className="text-xs text-primary font-bold mt-1">
                  📍 Ordering for Table #{tableId}
                </p>
              )}
            </div>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-xs border border-surface-border p-8 mt-4">
            <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4 text-primary">
              <Utensils size={32} />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-sm text-text-secondary max-w-sm mx-auto mb-6">
              Looks like you haven't added any of our authentic dishes yet.
            </p>
            <button
              type="button"
              onClick={() => navigate('/menu')}
              className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-sm cursor-pointer"
            >
              Explore Menu
            </button>
          </div>
        ) : (
          <>
            {/* Order Type Selection */}
            <motion.div
              ref={orderTypeRef}
              animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`bg-white rounded-2xl shadow-xs p-4 border-2 transition-colors ${
                !orderType && isShaking ? 'border-rose-500 ring-2 ring-rose-200' : 'border-surface-border'
              }`}
            >
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
                {t.order_type || 'Select Dining Mode'} *
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOrderType('dine-in')}
                  className={`py-3 rounded-xl font-extrabold text-sm border-2 transition-all cursor-pointer ${
                    orderType === 'dine-in'
                      ? 'border-primary bg-primary-light text-primary shadow-xs'
                      : 'border-surface-border bg-surface-subtle text-text-secondary hover:border-gray-300'
                  }`}
                >
                  🍽️ {t.dine_in || 'Dine-in'}
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('takeaway')}
                  className={`py-3 rounded-xl font-extrabold text-sm border-2 transition-all cursor-pointer ${
                    orderType === 'takeaway'
                      ? 'border-primary bg-primary-light text-primary shadow-xs'
                      : 'border-surface-border bg-surface-subtle text-text-secondary hover:border-gray-300'
                  }`}
                >
                  🥡 {t.takeaway || 'Takeaway (+₹10)'}
                </button>
              </div>
            </motion.div>

            {/* Cart Items List */}
            <div className="bg-white rounded-2xl shadow-xs p-4 border border-surface-border">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
                Order Items ({items.reduce((s, i) => s + i.quantity, 0)})
              </h3>
              <div className="divide-y divide-surface-border/60">
                {items.map(item => (
                  <div key={item.cartItemId} className="py-3.5 flex justify-between items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.is_veg ? <VegIcon /> : <NonVegIcon />}
                        <p className="font-extrabold text-gray-900 text-sm truncate">{item.name}</p>
                      </div>
                      <p className="text-xs font-bold text-gray-950">₹{item.price}</p>
                      {item.selectedVariant && (
                        <button
                          type="button"
                          onClick={() => setItemToCustomize(item)}
                          className="text-xs text-primary font-semibold hover:underline mt-0.5"
                        >
                          Portion: {item.selectedVariant.name} (edit)
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-white border border-surface-border rounded-xl flex items-center shadow-xs overflow-hidden">
                        <button
                          type="button"
                          onClick={() => decrementItem(item.cartItemId)}
                          className="p-1.5 hover:bg-primary-light text-primary transition-colors cursor-pointer"
                        >
                          <Minus size={14} strokeWidth={2.5} />
                        </button>
                        <span className="w-6 text-center text-xs font-black">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => addItem(item, item.selectedVariant)}
                          className="p-1.5 hover:bg-primary-light text-primary transition-colors cursor-pointer"
                        >
                          <Plus size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.cartItemId)}
                        className="p-1.5 text-text-muted hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white rounded-2xl shadow-xs p-4 border border-surface-border">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <CreditCard size={16} className="text-primary" />
                {t.payment_method || 'Payment Method'}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                  className={`py-3 rounded-xl font-extrabold text-sm border-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    paymentMethod === 'online'
                      ? 'border-primary bg-primary-light text-primary shadow-xs'
                      : 'border-surface-border bg-surface-subtle text-text-secondary hover:border-gray-300'
                  }`}
                >
                  <CreditCard size={18} />
                  <span>UPI / Card (Instant)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-3 rounded-xl font-extrabold text-sm border-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'border-primary bg-primary-light text-primary shadow-xs'
                      : 'border-surface-border bg-surface-subtle text-text-secondary hover:border-gray-300'
                  }`}
                >
                  <span>💵</span>
                  <span>Cash at Counter</span>
                </button>
              </div>
            </div>

            {/* Tip Selection */}
            <div className="bg-white rounded-2xl shadow-xs p-4 border border-surface-border">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
                💰 Tip Your Server
              </h3>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[20, 50, 100].map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setTipAmount(tipAmount === amount ? 0 : amount)}
                    className={`py-2 rounded-xl font-extrabold text-xs border-2 transition-all cursor-pointer ${
                      tipAmount === amount
                        ? 'border-primary bg-primary-light text-primary shadow-xs'
                        : 'border-surface-border bg-surface-subtle text-text-secondary hover:border-gray-300'
                    }`}
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={tipAmount || ''}
                onChange={e => setTipAmount(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Or enter custom tip amount (₹)"
                className="w-full px-4 py-2 border border-surface-border rounded-xl text-xs font-semibold outline-none focus:border-primary"
                min="0"
              />
            </div>

            {/* Schedule Order Toggle */}
            <div className="bg-white rounded-2xl shadow-xs p-4 border border-surface-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-primary" />
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Schedule for Later
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setScheduleOrder(!scheduleOrder);
                    if (scheduleOrder) setScheduledTime('');
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    scheduleOrder ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-xs transition-transform ${
                      scheduleOrder ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              {scheduleOrder && (
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-2 border border-surface-border rounded-xl text-xs font-semibold mt-2 outline-none focus:border-primary"
                  min={new Date().toISOString().slice(0, 16)}
                />
              )}
            </div>

            {/* Coupon Code Section */}
            {!couponApplied ? (
              <div className="bg-white rounded-2xl shadow-xs p-4 border border-surface-border">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2.5">
                  🎟️ Apply Promo Voucher
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter code (e.g. naatinest10)"
                    className="flex-1 px-4 py-2.5 border border-surface-border rounded-xl text-xs font-bold uppercase outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer shadow-xs"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 rounded-2xl p-4 flex items-center justify-between border border-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-600" />
                  <span className="text-xs font-extrabold text-emerald-800">
                    Coupon 'naatinest10' Applied — ₹10 off!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCouponApplied(false);
                    setCouponCode('');
                    setCouponDiscount(0);
                  }}
                  className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Upsell Frequently Paired Items */}
            <div className="bg-white rounded-2xl shadow-xs p-4 border border-surface-border">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles size={16} className="text-amber-500" />
                Frequently Paired Sides & Drinks
              </h3>
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                {suggestedItems.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleAddSuggested(s)}
                    className="min-w-[125px] bg-surface-subtle hover:bg-primary-light/40 border border-surface-border/70 rounded-xl p-3 flex flex-col items-center gap-2 transition-all text-left cursor-pointer group"
                  >
                    <img
                      src={s.image}
                      alt={s.name}
                      className="w-12 h-12 rounded-full object-cover border border-surface-border group-hover:scale-105 transition-transform"
                    />
                    <p className="text-xs font-semibold text-gray-800 text-center line-clamp-2 leading-tight">
                      {s.name}
                    </p>
                    <p className="text-xs font-extrabold text-primary">₹{s.price}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-white rounded-2xl shadow-xs p-5 border border-surface-border">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
                {t.bill_summary || 'Bill Breakdown'}
              </h3>
              <div className="space-y-2 text-xs font-medium text-text-secondary">
                <div className="flex justify-between">
                  <span>{t.item_total || 'Item Total'}</span>
                  <span className="font-bold text-gray-900">₹{subtotal}</span>
                </div>
                {orderType === 'takeaway' && (
                  <div className="flex justify-between">
                    <span>{t.parcel_charges || 'Packaging & Parcel'}</span>
                    <span className="font-bold text-gray-900">₹10</span>
                  </div>
                )}
                {tipAmount > 0 && (
                  <div className="flex justify-between text-primary font-bold">
                    <span>Server Tip</span>
                    <span>₹{tipAmount}</span>
                  </div>
                )}
                {couponApplied && discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Promo Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="h-px bg-surface-border my-2" />
                <div className="flex justify-between font-black text-gray-950 text-base">
                  <span>To Pay</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sticky Bottom Checkout Footer */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-surface-border p-4 z-30 shadow-elevated">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">
                {paymentMethod === 'cash' ? '💵 Cash on Delivery' : '⚡ Online via UPI / Card'}
              </p>
              <p className="text-xl font-black text-gray-950">{formatPrice(total)}</p>
            </div>
            <button
              type="button"
              onClick={placeOrder}
              disabled={loading}
              className="bg-primary hover:bg-primary-hover text-white font-extrabold py-3.5 px-8 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50 min-w-[160px]"
            >
              {loading ? (
                <span>{t.processing || 'Processing...'}</span>
              ) : (
                <>
                  <span>{paymentMethod === 'cash' ? 'Place Order' : 'Pay Now'}</span>
                  <ChevronRight size={18} strokeWidth={3} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Portion Edit Modal */}
      {itemToCustomize && (
        <EditVariantModal
          item={itemToCustomize}
          currentVariantId={itemToCustomize.selectedVariant?.id}
          onClose={() => setItemToCustomize(null)}
          onUpdate={variant => {
            updateItemVariant(itemToCustomize.cartItemId, variant);
          }}
        />
      )}
    </div>
  );
};
