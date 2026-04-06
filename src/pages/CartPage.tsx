import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/CartContext';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { ArrowLeft, Minus, Plus, ChevronDown, X, Sparkles, ChevronRight, CreditCard, Trash2, CheckCircle } from 'lucide-react';
import { MenuItem, CartItem } from '@/lib/types';
import { motion } from 'motion/react';

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

const VariantModal = ({ item, currentVariantId, onClose, onUpdate }: { item: MenuItem, currentVariantId?: string, onClose: () => void, onUpdate: (variant: import('@/lib/types').Variant) => void }) => {
  const { language } = useLanguage();
  const itemName = language === 'en' ? item.name : item.name_kn;
  const [selectedVariantId, setSelectedVariantId] = useState<string>(currentVariantId || item.variants?.[0]?.id || '');

  if (!item.variants || item.variants.length === 0) return null;

  const handleUpdate = () => {
    const variant = item.variants?.find(v => v.id === selectedVariantId);
    if (variant) {
      onUpdate(variant);
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
              <h3 className="font-bold text-gray-900">{itemName}</h3>
            </div>
            <p className="text-sm text-gray-500">Customize as per your taste</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <h4 className="font-bold text-gray-800 mb-3">Quantity</h4>
          <div className="space-y-3">
            {item.variants.map(variant => (
              <label key={variant.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedVariantId === variant.id ? 'border-[#1e9e62]' : 'border-gray-300'}`}>
                    {selectedVariantId === variant.id && <div className="w-3 h-3 bg-[#1e9e62] rounded-full" />}
                  </div>
                  <span className="font-medium text-gray-800">{variant.name}</span>
                </div>
                <span className="font-medium text-gray-800">₹{variant.price}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          <button 
            onClick={handleUpdate}
            className="w-full bg-[#1e9e62] text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors"
          >
            Update Item - ₹{item.variants.find(v => v.id === selectedVariantId)?.price}
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
      toast.error('Invalid coupon code');
    }
  };

  const handleBack = () => {
    navigate('/menu'); // Explicitly navigate to menu
  };

  const initiatePhonePePayment = async (orderId: string) => {
    toast.loading('Redirecting to payment...', { duration: 1500 });
    
    setTimeout(() => {
      toast.dismiss();
      toast.success('Payment Successful');
      navigate(`/order-tracking/${orderId}`);
    }, 1500);
  };

  const placeOrder = async () => {
    if (!orderType) {
      setIsShaking(true);
      orderTypeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast.error(t.select_order_type);
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
          name: language === 'en' ? item.name : item.name_kn,
          quantity: item.quantity, 
          price: item.price,
          variant: item.selectedVariant?.name 
        })),
        total_amount: total,
        subtotal: subtotal,
        parcel_charge: parcelCharge,
        order_type: orderType,
        status: 'pending',
        customer_name: user?.full_name || 'Guest',
        customer_phone: user?.phone || 'N/A',
        customer_id: null,
        table_id: localStorage.getItem('naatinest_table_id') || null,
        token: token,
        payment_status: paymentMethod === 'cash' ? 'pending' : 'paid',
        payment_method: paymentMethod,
        tip_amount: tipAmount,
        coupon_code: couponApplied ? couponCode : null,
        coupon_discount: discount,
        scheduled_for: scheduleOrder && scheduledTime ? new Date(scheduledTime).toISOString() : null,
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
        toast.success('Order placed! Pay at the counter.');
        navigate(`/order-tracking/${orderId}`);
      }
      clearCart();
    } catch (error: any) {
      console.error('Order error:', error);
      toast.error(error?.message || t.order_failed);
    } finally {
      setLoading(false);
    }
  };

  // Mock suggested items
  const suggestedItems = [
    { id: 's1', name: 'Tender Coconut Pudding', price: 75, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=150&auto=format&fit=crop', is_veg: true },
    { id: 's2', name: 'Coca Cola 475ml', price: 69, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=150&auto=format&fit=crop', is_veg: true },
    { id: 's3', name: 'Green Salad', price: 79, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=150&auto=format&fit=crop', is_veg: true },
    { id: 's4', name: 'Raita', price: 40, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=150&auto=format&fit=crop', is_veg: true },
  ];

  const handleAddSuggested = (item: typeof suggestedItems[0]) => {
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
    <div className="min-h-screen bg-gray-100 pb-32">
      {/* Header */}
      <header className="bg-white z-20 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-800" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">Naati Nest</h2>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Order Type Selection */}
        {items.length > 0 && (
          <motion.div 
            ref={orderTypeRef}
            animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className={`bg-white rounded-2xl shadow-sm p-4 border-2 transition-colors ${!orderType && isShaking ? 'border-red-500' : 'border-transparent'}`}
          >
            <h3 className="font-bold text-gray-800 mb-3">{t.order_type}</h3>
            <div className="flex gap-3">
              <button 
                onClick={() => setOrderType('dine-in')}
                className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${orderType === 'dine-in' ? 'border-primary bg-orange-50 text-primary' : 'border-gray-100 bg-gray-50 text-gray-500'}`}
              >
                {t.dine_in}
              </button>
              <button 
                onClick={() => setOrderType('takeaway')}
                className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${orderType === 'takeaway' ? 'border-primary bg-orange-50 text-primary' : 'border-gray-100 bg-gray-50 text-gray-500'}`}
              >
                {t.takeaway}
              </button>
            </div>
          </motion.div>
        )}

        {/* Payment Method Selection */}
        {items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <CreditCard size={18} className="text-primary" />
              {t.payment_method || 'Payment Method'}
            </h3>
            <div className="flex gap-3">
              <button 
                onClick={() => setPaymentMethod('online')}
                className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all flex items-center justify-center gap-2 ${paymentMethod === 'online' ? 'border-[#1e9e62] bg-green-50 text-[#1e9e62]' : 'border-gray-100 bg-gray-50 text-gray-500'}`}
              >
                <CreditCard size={18} />
                {t.online || 'Online'}
              </button>
              <button 
                onClick={() => setPaymentMethod('cash')}
                className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all flex items-center justify-center gap-2 ${paymentMethod === 'cash' ? 'border-primary bg-orange-50 text-primary' : 'border-gray-100 bg-gray-50 text-gray-500'}`}
              >
                <span className="text-lg">💵</span>
                {t.cash || 'Cash'}
              </button>
            </div>
          </div>
        )}

        {/* Tip Section */}
        {items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-bold text-gray-800 mb-3">💰 Add a Tip</h3>
            <div className="flex gap-2 mb-3">
              {[20, 50, 100].map(amount => (
                <button
                  key={amount}
                  onClick={() => setTipAmount(tipAmount === amount ? 0 : amount)}
                  className={`flex-1 py-2.5 rounded-xl font-bold border-2 transition-all ${tipAmount === amount ? 'border-primary bg-green-50 text-primary' : 'border-gray-100 bg-gray-50 text-gray-500'}`}
                >
                  ₹{amount}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={tipAmount || ''}
              onChange={(e) => setTipAmount(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="Custom amount"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm"
              min="0"
            />
          </div>
        )}

        {/* Schedule Order */}
        {items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                📅 Schedule Order
              </h3>
              <button
                onClick={() => { setScheduleOrder(!scheduleOrder); if (scheduleOrder) setScheduledTime(''); }}
                className={`w-12 h-7 rounded-full transition-colors relative ${scheduleOrder ? 'bg-primary' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${scheduleOrder ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {scheduleOrder && (
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm"
                min={new Date().toISOString().slice(0, 16)}
              />
            )}
          </div>
        )}

        {/* Cart Items Card */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="space-y-6">
            {items.map(item => (
              <div key={item.cartItemId} className="flex justify-between items-start">
                <div className="flex flex-col flex-1 pr-4">
                  <div className="flex items-start gap-2">
                    <div className="mt-1 flex-shrink-0">
                      {item.is_veg ? <VegIcon /> : <NonVegIcon />}
                    </div>
                    <span className="font-medium text-gray-800 leading-tight">
                      {language === 'en' ? item.name : item.name_kn} {item.selectedVariant ? `(${item.selectedVariant.name})` : ''}
                    </span>
                  </div>
                  {item.variants && item.variants.length > 0 && (
                    <button 
                      onClick={() => setItemToCustomize(item)} 
                      className="text-gray-500 text-sm flex items-center gap-1 mt-1 ml-6 hover:text-gray-700 transition-colors w-fit"
                    >
                      {t.customize} <ChevronDown size={14} />
                    </button>
                  )}
                </div>
                
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm h-8">
                      <button onClick={() => decrementItem(item.cartItemId)} className="px-2.5 h-full text-[#1e9e62] hover:bg-green-50 flex items-center justify-center">
                        <Minus size={16} strokeWidth={3} />
                      </button>
                      <span className="w-6 text-center font-bold text-gray-800 text-sm">{item.quantity}</span>
                      <button onClick={() => addItem(item, item.selectedVariant)} className="px-2.5 h-full text-[#1e9e62] hover:bg-green-50 flex items-center justify-center">
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    </div>
                    <span className="font-medium text-gray-800 w-12 text-right">₹{item.price * item.quantity}</span>
                    <button 
                      onClick={() => removeItem(item.cartItemId)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
              </div>
            ))}
            
            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {t.cart_empty}
          </div>
        )}

        {/* Coupon Code */}
        {items.length > 0 && !couponApplied && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-bold text-gray-800 mb-3">🎟️ Coupon Code</h3>
            <div className="flex gap-2">
              <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter code" className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm uppercase" />
              <button onClick={applyCoupon} className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-green-700 transition-colors">Apply</button>
            </div>
          </div>
        )}
        {couponApplied && (
          <div className="bg-green-50 rounded-2xl p-4 flex items-center justify-between border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-green-600" />
              <span className="text-sm font-bold text-green-700">Coupon Applied — ₹10 off!</span>
            </div>
            <button onClick={() => { setCouponApplied(false); setCouponCode(''); setCouponDiscount(0); }} className="text-sm text-red-500 font-bold hover:text-red-700">Remove</button>
          </div>
        )}
          </div>
        </div>

        {/* Big Add More Items Button */}
        {items.length > 0 && (
          <button 
            onClick={() => navigate('/menu')}
            className="w-full bg-primary text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={20} strokeWidth={3} /> {t.add_more_items}
          </button>
        )}

        {/* Suggested Items */}
        {items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              {t.suggested_title || 'Add More to Your Order'}
            </h3>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
              {suggestedItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleAddSuggested(item)}
                  className="min-w-[120px] bg-gray-50 rounded-xl p-3 flex flex-col items-center gap-2 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs font-medium text-gray-700 text-center line-clamp-2">{item.name}</p>
                  <p className="text-xs font-bold text-primary">₹{item.price}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bill Summary */}
        {items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-8">
            <h3 className="font-bold text-gray-800 mb-4">{t.bill_summary}</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>{t.item_total}</span>
                <span>₹{subtotal}</span>
              </div>
              {orderType === 'takeaway' && (
                <div className="flex justify-between text-gray-600">
                  <span>{t.parcel_charges}</span>
                  <span>₹10</span>
                </div>
              )}
              {tipAmount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Tip</span>
                  <span>₹{tipAmount}</span>
                </div>
              )}
              {couponApplied && discount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Coupon (naatinest10)</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              {scheduleOrder && scheduledTime && (
                <div className="flex justify-between text-blue-600 font-medium">
                  <span>Scheduled for</span>
                  <span>{new Date(scheduledTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              )}
              <div className="h-px bg-gray-100 my-2"></div>
              <div className="flex justify-between font-bold text-gray-900 text-lg">
                <span>{t.total_amount}</span>
                <span>₹{total}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Footer */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-500 tracking-wider flex items-center gap-1">
                <span className="w-4 h-3 bg-gray-200 rounded-sm inline-block"></span> {t.pay_using} {paymentMethod === 'cash' ? <span className="text-sm">💵</span> : <CreditCard size={12} />}
              </p>
              <p className="font-bold text-gray-900">{paymentMethod === 'cash' ? (t.cash || 'Cash') : 'Online'}</p>
            </div>
            <button 
              onClick={placeOrder} 
              disabled={loading}
              className="bg-[#1e9e62] hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl min-w-[140px] transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? t.processing : (
                <>
                  {paymentMethod === 'cash' ? 'Place Order' : t.pay} {formatPrice(total)}
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {itemToCustomize && (
        <VariantModal
          item={itemToCustomize}
          currentVariantId={itemToCustomize.selectedVariant?.id}
          onClose={() => setItemToCustomize(null)}
          onUpdate={(variant) => {
            updateItemVariant(itemToCustomize.cartItemId, variant);
          }}
        />
      )}
    </div>
  );
};
