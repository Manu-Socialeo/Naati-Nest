import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Order } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/lib/LanguageContext';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, ChefHat, Clock, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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

export const OrderTrackingPage = () => {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
        if (error) throw error;
        setOrder(data);
      } catch (error) {
        toast.error('Order not found');
      }
    };
    fetchOrder();

    const channel = supabase
      .channel('order_updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, (payload) => {
        setOrder(payload.new as Order);
      })
      .subscribe();

    return () => { channel?.unsubscribe(); };
  }, [id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'served':
      case 'completed':
        return <CheckCircle2 size={20} className="text-[#1e9e62]" />;
      case 'cancelled':
        return <XCircle size={20} className="text-[#d9534f]" />;
      case 'preparing':
        return <ChefHat size={20} className="text-[#e46c35]" />;
      default:
        return <Clock size={20} className="text-blue-500" />;
    }
  };

  if (!order) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">{t.loading}</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 bg-white z-20 shadow-sm">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => navigate('/orders')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-800" />
          </button>
          <h2 className="text-xl font-extrabold text-gray-900">{t.my_orders} #{order.id?.slice(0, 8).toUpperCase() || order.token}</h2>
        </div>
      </header>
      <div className="p-4 space-y-4">
        {/* Status Card */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-medium">{t.status}</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(order.status)}
              <Badge variant={order.status === 'pending' ? 'warning' : order.status === 'cancelled' ? 'cancelled' : order.status === 'served' ? 'served' : 'success'}>
                {order.status === 'pending' ? t.pending : order.status === 'served' ? t.delivered : order.status === 'preparing' ? t.preparing : order.status === 'ready' ? t.ready : t.cancelled}
              </Badge>
            </div>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">{t.order_type}:</span>
            <span className="font-bold text-gray-900 capitalize">{order.order_type === 'takeaway' ? t.takeaway : t.dine_in}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">{t.payment_status || 'Payment'}:</span>
            <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'}>
              {order.payment_status === 'paid' ? (t.paid || 'Paid') : (t.pending_payment || 'Pending')}
            </Badge>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-3">{t.items || 'Order Items'}</h3>
          <div className="space-y-3">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg">
                    {item.quantity}x
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {item.name || 'Item'}
                    </p>
                    {item.variant && (
                      <p className="text-xs text-gray-500">{item.variant}</p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-900">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bill Summary */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-3">{t.bill_summary || 'Bill Summary'}</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600 text-sm">
              <span>{t.item_total || 'Item Total'}</span>
              <span>₹{order.subtotal || order.total_amount}</span>
            </div>
            {order.parcel_charge && order.parcel_charge > 0 && (
              <div className="flex justify-between text-gray-600 text-sm">
                <span>{t.parcel_charges}</span>
                <span>₹{order.parcel_charge}</span>
              </div>
            )}
            <div className="h-px bg-gray-100 my-2"></div>
            <div className="flex justify-between font-bold text-gray-900 text-lg">
              <span>{t.total}:</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-2">{t.customer_details || 'Customer'}</h3>
          <p className="text-sm text-gray-700">{order.customer_name || 'Guest'}</p>
          <p className="text-sm text-gray-500">{order.customer_phone || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};
