import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/CartContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { ArrowLeft, Minus, Plus, ChevronDown, X, Sparkles, Tag, Check, ChevronRight, UtensilsCrossed, CreditCard } from 'lucide-react';
import { MenuItem, CartItem } from '@/lib/types';
import CryptoJS from 'crypto-js';
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

const VariantModal = ({ item, currentVariantId, onClose, onUpdate }: { item: MenuItem, currentVariantId?: string, onClose: () => void, onUpdate: (variant: any) => void }) => {
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
  const { items, addItem, decrementItem, updateItemVariant, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [itemToCustomize, setItemToCustomize] = useState<CartItem | null>(null);
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const orderTypeRef = useRef<HTMLDivElement>(null);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const parcelCharge = orderType === 'takeaway' ? 10 : 0;
  const total = subtotal + parcelCharge;

  const handleBack = () => {
    navigate('/menu'); // Explicitly navigate to menu
  };

  const initiatePhonePePayment = async (orderId: string) => {
    // This is a simulation of PhonePe integration.
    // In a real app, you would call your backend to generate the payload and checksum.
    // Here we simulate the process for the user.
    
    const merchantId = process.env.PHONEPE_MERCHANT_ID || 'MERCHANT_ID';
    const saltKey = process.env.PHONEPE_SALT_KEY || 'SALT_KEY';
    const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
    
    const payload = {
      merchantId: merchantId,
      merchantTransactionId: `TXN_${orderId}`,
      merchantUserId: `USER_${Date.now()}`,
      amount: total * 100, // Amount in paise
      redirectUrl: `${window.location.origin}/order-tracking/${orderId}`,
      redirectMode: 'REDIRECT',
      callbackUrl: `${window.location.origin}/api/payment-callback`,
      mobileNumber: '9999999999',
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    const base64Payload = btoa(JSON.stringify(payload));
    const stringToHash = base64Payload + '/pg/v1/pay' + saltKey;
    const checksum = CryptoJS.SHA256(stringToHash).toString() + '###' + saltIndex;

    console.log('PhonePe Payload:', payload);
    console.log('PhonePe Checksum:', checksum);

    // In a real scenario, you would POST this to PhonePe API.
    // For now, we simulate a successful redirect.
    toast.loading('Redirecting to PhonePe...', { duration: 2000 });
    
    setTimeout(() => {
      toast.dismiss();
      toast.success('Payment Successful (Simulated)');
      navigate(`/order-tracking/${orderId}`);
    }, 2000);
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
      const token = Math.floor(100 + Math.random() * 900).toString(); // Simple 3-digit token
      
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
        customer_id: user?.id || 'guest',
        token: token,
        payment_status: 'paid',
        payment_method: 'ONLINE',
        created_at: new Date().toISOString()
      };

      const { data: order, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        if (error.message === 'Supabase credentials missing') {
          orderId = `mock-${Date.now()}`;
          const localOrder = { ...orderData, id: orderId };
          const existingOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
          localStorage.setItem('local_orders', JSON.stringify([localOrder, ...existingOrders]));
        } else {
          throw error;
        }
      } else {
        orderId = order.id;
        const existingOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
        localStorage.setItem('local_orders', JSON.stringify([order, ...existingOrders]));
      }

      await initiatePhonePePayment(orderId);
      clearCart();
    } catch (error) {
      console.error('Order error:', error);
      toast.error(t.order_failed);
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
                
                <div className="flex items-center gap-4 flex-shrink-0">
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
                </div>
              </div>
            ))}
            
            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {t.cart_empty}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {items.length > 0 && (
            <div className="flex gap-2 mt-6 overflow-x-auto hide-scrollbar pb-1">
              {/* Removed Cooking requests and Cutlery buttons */}
            </div>
          )}
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
                <span className="w-4 h-3 bg-gray-200 rounded-sm inline-block"></span> {t.pay_using} <CreditCard size={12} />
              </p>
              <p className="font-bold text-gray-900">PhonePe</p>
            </div>
            <button 
              onClick={placeOrder} 
              disabled={loading}
              className="bg-[#1e9e62] hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl min-w-[140px] transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? t.processing : (
                <>
                  {t.pay} {formatPrice(total)}
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
