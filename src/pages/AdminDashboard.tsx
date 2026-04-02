import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Order } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, LogOut, RefreshCw, CheckCircle, Clock, XCircle, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/utils';

export const AdminDashboard = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    fetchOrders();
    
    // Real-time subscription for new orders
    const subscription = supabase
      .channel('orders-admin')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        setOrders(prev => [payload.new as Order, ...prev]);
        toast.success('New order received!');
      })
      .subscribe();

    return () => {
      subscription?.unsubscribe();
    };
  }, [user, authLoading, navigate]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message === 'Supabase credentials missing') {
          const localOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
          setOrders(localOrders);
        } else {
          throw error;
        }
      } else {
        setOrders(data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) {
        if (error.message === 'Supabase credentials missing') {
          const localOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
          const updatedOrders = localOrders.map((o: Order) => 
            o.id === orderId ? { ...o, status } : o
          );
          localStorage.setItem('local_orders', JSON.stringify(updatedOrders));
          setOrders(updatedOrders);
        } else {
          throw error;
        }
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      }
      toast.success(`Order status updated to ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const printBill = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    const date = new Date(order.created_at).toLocaleDateString('en-IN');
    const time = new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const billNo = order.id.slice(-6).toUpperCase();
    const token = order.token || order.id.slice(-4).toUpperCase();

    let itemsHtml = '';
    order.items.forEach(item => {
      const name = (item.name + (item.variant ? ` (${item.variant})` : '')).padEnd(18).slice(0, 18);
      const qty = item.quantity.toString().padStart(3);
      const price = item.price.toFixed(2).padStart(8);
      const total = (item.price * item.quantity).toFixed(2).padStart(8);
      itemsHtml += `${name} ${qty} ${price} ${total}\n`;
    });

    const content = `
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 12px; line-height: 1.1; width: 300px; margin: 0 auto; white-space: pre;">
NAATI NEST - Token: ${token}
DT: ${date} TM: ${time}
BILL: ${billNo}
-------------------------------------
ITEM               QTY    PRICE   TOTAL
-------------------------------------
${itemsHtml}-------------------------------------
SUB TOTAL                   ${(order.subtotal || order.total_amount).toFixed(2)}
${order.parcel_charge ? `PARCEL CHARGE               ${order.parcel_charge.toFixed(2)}\n` : ''}GRAND TOTAL:               ₹${order.total_amount}
-------------------------------------
PAY: ${order.payment_method || 'ONLINE'}
THANK YOU - VISIT AGAIN
      </div>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Bill - ${billNo}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { margin: 0; padding: 5px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-primary" size={32} />
          <p className="text-gray-500 font-medium">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/menu')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={24} className="text-gray-800" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">{t.admin_dashboard}</h1>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800">{t.manage_orders}</h2>
          <button 
            onClick={fetchOrders}
            className="p-2 text-gray-500 hover:text-primary transition-colors"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {orders.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
              <p className="text-gray-500">{t.no_orders}</p>
            </div>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                        <Badge variant="pending" className="text-[10px] py-0 px-1.5 h-auto bg-gray-50 border-gray-200 text-gray-500">
                          {order.token || order.id.slice(-4).toUpperCase()}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{order.customer_name || 'Guest'}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500">{order.customer_phone || 'No phone'}</p>
                        <span className="text-xs font-bold text-primary uppercase tracking-wide bg-orange-50 px-1.5 py-0.5 rounded">
                          {order.order_type || 'Dine-in'}
                        </span>
                      </div>
                    </div>
                    <Badge variant={
                      order.status === 'pending' ? 'warning' : 
                      order.status === 'preparing' ? 'preparing' : 
                      order.status === 'ready' ? 'ready' : 
                      order.status === 'served' ? 'served' : 'cancelled'
                    }>
                      {t[order.status as keyof typeof t] || order.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.quantity}x {item.name} {item.variant ? `(${item.variant})` : ''}</span>
                        <span className="text-gray-900 font-medium">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold">{t.total}</p>
                      <p className="text-lg font-extrabold text-primary">{formatPrice(order.total_amount)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => printBill(order)}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Print Bill"
                      >
                        <Printer size={20} />
                      </button>
                      {order.status === 'pending' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          title="Start Preparing"
                        >
                          <Clock size={20} />
                        </button>
                      )}
                      {(order.status === 'preparing' || order.status === 'pending') && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          title="Mark as Ready"
                        >
                          <CheckCircle size={20} />
                        </button>
                      )}
                      {order.status !== 'cancelled' && order.status !== 'served' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Cancel Order"
                        >
                          <XCircle size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};
