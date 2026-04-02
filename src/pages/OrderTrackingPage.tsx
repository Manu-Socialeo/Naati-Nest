import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Order } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/lib/LanguageContext';
import { formatPrice } from '@/lib/utils';

import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
        console.error('Error fetching order:', error);
        // Fallback to local storage
        const localOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
        const localOrder = localOrders.find((o: any) => o.id === id);
        if (localOrder) {
          setOrder(localOrder);
        }
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
      <div className="p-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">{t.status}:</span>
            <Badge variant={order.status === 'pending' ? 'warning' : 'success'}>{order.status === 'pending' ? t.pending : t.delivered}</Badge>
          </div>
          <div className="flex justify-between mb-4">
            <span className="text-gray-600">{t.order_type}:</span>
            <span className="font-bold text-gray-900 capitalize">{order.order_type === 'takeaway' ? t.takeaway : t.dine_in}</span>
          </div>
          {order.parcel_charge > 0 && (
            <div className="flex justify-between mb-2 text-sm text-gray-500">
              <span>{t.parcel_charges}:</span>
              <span>₹{order.parcel_charge}</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-4 flex justify-between font-bold text-gray-900">
            <span>{t.total}:</span>
            <span>{formatPrice(order.total_amount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
