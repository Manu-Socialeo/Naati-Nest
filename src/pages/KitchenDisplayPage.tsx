import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Order } from '@/lib/types';
import { CheckCircle, Clock, ChefHat, XCircle, ArrowLeft, Printer, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

export const KitchenDisplayPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('kds-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
        if (audioEnabled) {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==');
          audio.play().catch(() => {});
        }
      })
      .subscribe();
    return () => { channel?.unsubscribe(); };
  }, [audioEnabled]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setOrders(data?.filter(o => o.status !== 'served' && o.status !== 'cancelled') || []);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast.success(`Order marked as ${status}`);
    } catch { toast.error('Failed to update'); }
  };

  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  const getElapsed = (dateStr: string) => {
    const mins = Math.floor((now - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  const getUrgency = (dateStr: string) => {
    const mins = Math.floor((now - new Date(dateStr).getTime()) / 60000);
    if (mins > 20) return 'critical';
    if (mins > 10) return 'warning';
    return 'normal';
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-xl">Loading KDS...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-700 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">🍳 Kitchen Display</h1>
          <span className="bg-blue-600 text-sm font-bold px-3 py-1 rounded-full">{activeOrders.length} Active</span>
          <span className="bg-green-600 text-sm font-bold px-3 py-1 rounded-full">{readyOrders.length} Ready</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setAudioEnabled(!audioEnabled)} className={`px-4 py-2 rounded-lg text-sm font-bold ${audioEnabled ? 'bg-green-600' : 'bg-gray-600'}`}>
            🔔 Sound {audioEnabled ? 'ON' : 'OFF'}
          </button>
          <span className="text-gray-400">{new Date(now).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </header>

      <main className="p-6">
        {/* Active Orders */}
        <h2 className="text-lg font-bold text-blue-400 mb-4 uppercase tracking-wider">Active Orders</h2>
        {activeOrders.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl p-12 text-center text-gray-500 mb-8">
            <ChefHat size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl">No active orders — kitchen is clear!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {activeOrders.map(order => {
              const urgency = getUrgency(order.created_at);
              const borderColor = urgency === 'critical' ? 'border-red-500 ring-2 ring-red-500/30' :
                                  urgency === 'warning' ? 'border-amber-500 ring-2 ring-amber-500/30' :
                                  'border-gray-700';
              return (
                <div key={order.id} className={`bg-gray-800 rounded-2xl border-2 ${borderColor} overflow-hidden`}>
                  <div className={`px-4 py-3 flex justify-between items-center ${
                    urgency === 'critical' ? 'bg-red-900/50' : urgency === 'warning' ? 'bg-amber-900/50' : 'bg-gray-750'
                  }`}>
                    <div>
                      <span className="text-lg font-bold">#{order.token}</span>
                      <span className="text-sm text-gray-400 ml-2">{order.order_type}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Clock size={14} />
                      {getElapsed(order.created_at)}
                    </div>
                  </div>
                  <div className="p-4">
                    {(order.items || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-2 border-b border-gray-700 last:border-0">
                        <span className="text-sm">{item.quantity}x {item.name} {item.variant ? `(${item.variant})` : ''}</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 pb-4 flex gap-2">
                    {order.status === 'pending' && (
                      <button onClick={() => updateStatus(order.id, 'preparing')} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-sm transition-colors">
                        Start Cooking
                      </button>
                    )}
                    {(order.status === 'preparing' || order.status === 'pending') && (
                      <button onClick={() => updateStatus(order.id, 'ready')} className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold text-sm transition-colors">
                        Mark Ready
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Ready Orders */}
        {readyOrders.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-green-400 mb-4 uppercase tracking-wider">Ready for Pickup</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {readyOrders.map(order => (
                <div key={order.id} className="bg-green-900/30 border-2 border-green-600 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 flex justify-between items-center bg-green-900/50">
                    <span className="text-lg font-bold">#{order.token}</span>
                    <span className="text-sm text-green-400">{order.customer_name}</span>
                  </div>
                  <div className="p-4">
                    {(order.items || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-2 border-b border-gray-700 last:border-0 text-sm">
                        <span>{item.quantity}x {item.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 pb-4">
                    <button onClick={() => updateStatus(order.id, 'served')} className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold text-sm transition-colors">
                      ✓ Served / Delivered
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
