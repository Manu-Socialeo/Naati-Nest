import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Order } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/lib/LanguageContext';
import { formatPrice } from '@/lib/utils';
import {
  ArrowLeft,
  ChefHat,
  Clock,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Sparkles,
  Utensils,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';

const STEPS = [
  { key: 'pending', label: 'Confirmed', subtext: 'Order placed & queued' },
  { key: 'preparing', label: 'Cooking', subtext: 'Chefs preparing authentic spices' },
  { key: 'ready', label: 'Ready', subtext: 'Hot & fresh for table/pickup' },
  { key: 'served', label: 'Served', subtext: 'Delivered & enjoyed' },
];

export const OrderTrackingPage = () => {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setOrder(data);
      } catch (error) {
        toast.error('Order not found');
      }
    };
    fetchOrder();

    const channel = supabase
      .channel(`order_${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        payload => {
          setOrder(payload.new as Order);
          toast.success(`Order status updated to: ${payload.new.status}`);
        }
      )
      .subscribe();

    return () => {
      channel?.unsubscribe();
    };
  }, [id]);

  if (!order)
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <RefreshCw size={28} className="animate-spin text-primary mb-3" />
        <p className="text-text-secondary font-medium">{t.loading || 'Loading order details...'}</p>
      </div>
    );

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'preparing':
        return 1;
      case 'ready':
        return 2;
      case 'served':
      case 'completed':
        return 3;
      default:
        return -1;
    }
  };

  const currentStepIdx = getStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-background pb-28 font-sans">
      {/* Header */}
      <header className="sticky top-0 bg-white z-20 shadow-xs border-b border-surface-border">
        <div className="max-w-2xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="p-2 -ml-2 hover:bg-surface-subtle rounded-xl transition-colors cursor-pointer text-text-primary"
              title="Back to my orders"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900 leading-none">
                Order #{order.token || order.id?.slice(0, 6).toUpperCase()}
              </h2>
              <p className="text-xs text-text-muted mt-1">Live Kitchen Tracking</p>
            </div>
          </div>
          <Badge
            variant={
              order.status === 'pending'
                ? 'warning'
                : order.status === 'preparing'
                ? 'preparing'
                : order.status === 'ready'
                ? 'ready'
                : order.status === 'served'
                ? 'served'
                : 'cancelled'
            }
          >
            {order.status}
          </Badge>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Visual Progress Stepper */}
        <Card className="p-6 bg-white border border-surface-border shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
                Order Status
              </p>
              <h3 className="text-xl font-extrabold text-gray-900 mt-0.5">
                {isCancelled
                  ? 'Order Cancelled'
                  : currentStepIdx === 0
                  ? 'Order Confirmed'
                  : currentStepIdx === 1
                  ? 'Kitchen is Cooking 🔥'
                  : currentStepIdx === 2
                  ? 'Dish Ready for Delivery!'
                  : 'Order Completed'}
              </h3>
            </div>
            {order.token && (
              <div className="text-right">
                <span className="text-[10px] font-bold text-text-muted uppercase">Token</span>
                <p className="text-2xl font-black text-primary leading-none">#{order.token}</p>
              </div>
            )}
          </div>

          {!isCancelled ? (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-border">
              {STEPS.map((step, idx) => {
                const isPassed = currentStepIdx >= idx;
                const isCurrent = currentStepIdx === idx;
                return (
                  <div key={step.key} className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 transition-all ${
                        isCurrent
                          ? 'border-primary bg-primary ring-4 ring-primary/20 animate-pulse'
                          : isPassed
                          ? 'border-primary bg-primary'
                          : 'border-gray-300 bg-white'
                      }`}
                    />
                    <div>
                      <p
                        className={`text-sm font-extrabold ${
                          isPassed ? 'text-gray-900' : 'text-text-muted'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">{step.subtext}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center">
              <XCircle size={28} className="mx-auto text-rose-600 mb-1" />
              <p className="text-sm font-bold text-rose-800">This order has been cancelled.</p>
              <p className="text-xs text-rose-600 mt-1">Please check with staff at the counter.</p>
            </div>
          )}
        </Card>

        {/* Order Details Card */}
        <Card className="p-5 bg-white border border-surface-border shadow-xs space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-text-secondary font-medium">Dining Mode</span>
            <span className="font-bold text-gray-900 uppercase tracking-wide bg-surface-subtle px-2 py-0.5 rounded-md">
              {order.order_type === 'takeaway' ? '🥡 Takeaway / Parcel' : '🍽️ Dine-in Table'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-text-secondary font-medium">Payment</span>
            <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'}>
              {order.payment_status === 'paid'
                ? `Paid (${order.payment_method})`
                : `Pending (${order.payment_method})`}
            </Badge>
          </div>
          {order.table_id && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary font-medium">Table</span>
              <span className="font-bold text-primary">Table #{order.table_id}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs">
            <span className="text-text-secondary font-medium">Placed At</span>
            <span className="text-text-muted font-medium">
              {new Date(order.created_at).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
        </Card>

        {/* Items List */}
        <Card className="p-5 bg-white border border-surface-border shadow-xs">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
            Items Ordered ({order.items?.length || 0})
          </h3>
          <div className="divide-y divide-surface-border/60">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <span className="bg-primary-light text-primary text-xs font-extrabold px-2 py-0.5 rounded-md">
                    {item.quantity}×
                  </span>
                  <div>
                    <p className="font-bold text-gray-900">{item.name}</p>
                    {item.variant && (
                      <p className="text-xs text-text-muted">Portion: {item.variant}</p>
                    )}
                  </div>
                </div>
                <span className="font-bold text-gray-900">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="h-px bg-surface-border my-3" />

          {/* Totals */}
          <div className="space-y-1.5 text-xs text-text-secondary">
            <div className="flex justify-between">
              <span>Item Subtotal</span>
              <span>₹{order.subtotal || order.total_amount}</span>
            </div>
            {order.parcel_charge && order.parcel_charge > 0 && (
              <div className="flex justify-between">
                <span>Parcel Charges</span>
                <span>₹{order.parcel_charge}</span>
              </div>
            )}
            {order.tip_amount && order.tip_amount > 0 && (
              <div className="flex justify-between text-primary font-semibold">
                <span>Server Tip</span>
                <span>₹{order.tip_amount}</span>
              </div>
            )}
            {order.coupon_discount && order.coupon_discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount ({order.coupon_code || 'Promo'})</span>
                <span>-₹{order.coupon_discount}</span>
              </div>
            )}
            <div className="h-px bg-surface-border/80 my-2" />
            <div className="flex justify-between font-black text-gray-950 text-base">
              <span>Grand Total</span>
              <span className="text-primary">{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </Card>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => navigate('/menu')}
          className="w-full py-3.5 bg-white border border-surface-border rounded-2xl text-sm font-bold text-text-primary hover:bg-surface-subtle transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Utensils size={18} className="text-primary" />
          <span>Browse More Dishes</span>
        </button>
      </div>
    </div>
  );
};
