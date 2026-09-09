import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { Order } from '@/lib/types';
import { ArrowLeft, CheckCircle2, Star, ChevronRight, ShoppingBag, Clock, XCircle, ChefHat, User, Phone, LogOut, Bell, Ticket, Check } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { OrdersSkeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

export const OrderHistoryPage = () => {
  const { t, language } = useLanguage();
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdates, setStatusUpdates] = useState<Record<string, string>>({});
  const [ratedOrders, setRatedOrders] = useState<Set<string>>(new Set());
  const [foodRatings, setFoodRatings] = useState<Record<string, number>>({});
  const [serviceRatings, setServiceRatings] = useState<Record<string, number>>({});
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});
  const [customerStats, setCustomerStats] = useState({ totalOrders: 0, totalSpent: 0, favouriteItem: '' });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (authLoading) return;

    const fetchOrders = async () => {
      let serverOrders: Order[] = [];
      try {
        let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (user?.phone) {
          query = query.eq('customer_phone', user.phone);
        }
        const { data, error } = await query;
        if (!error && data) serverOrders = data;
      } catch {
        // Fallback to local store
      }

      try {
        const localOrders: Order[] = JSON.parse(localStorage.getItem('naatinest_orders') || '[]');
        const userLocalOrders = user?.phone
          ? localOrders.filter(o => o.customer_phone === user.phone)
          : localOrders;

        const map = new Map<string, Order>();
        userLocalOrders.forEach(o => map.set(o.id, o));
        serverOrders.forEach(o => map.set(o.id, o));
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setOrders(merged);

        // Compute CRM stats if server stats empty
        const totalSpent = merged.reduce((s, o) => s + o.total_amount, 0);
        setCustomerStats(prev => ({
          totalOrders: merged.length,
          totalSpent: totalSpent,
          favouriteItem: prev.favouriteItem || merged[0]?.items?.[0]?.name || '',
        }));
      } catch {
        setOrders(serverOrders);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    const fetchStats = async () => {
      if (!user?.phone) return;
      try {
        const { data } = (await supabase
          .from('profiles')
          .select('total_orders, total_spent, favourite_item')
          .eq('phone', user.phone)
          .single()) as any;
        if (data)
          setCustomerStats({
            totalOrders: data.total_orders || 0,
            totalSpent: data.total_spent || 0,
            favouriteItem: data.favourite_item || '',
          });
      } catch {}
      try {
        const { data } = await supabase.from('order_ratings').select('order_id');
        if (data) setRatedOrders(new Set(data.map((r: any) => r.order_id)));
      } catch {}
    };
    fetchStats();

    // Cross-tab storage listener
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'naatinest_orders' || !e.key) {
        fetchOrders();
      }
    };
    window.addEventListener('storage', handleStorage);

    const channel = supabase
      .channel('order-updates-customer')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const newOrder = payload.new as any;
        setOrders(prev => prev.map(o => o.id === newOrder.id ? newOrder : o));
        setStatusUpdates(prev => ({ ...prev, [newOrder.id]: newOrder.status }));
        toast.success(`Order #${newOrder.token || newOrder.id.slice(-4)} is now ${newOrder.status}`);
      })
      .subscribe();

    return () => {
      window.removeEventListener('storage', handleStorage);
      channel?.unsubscribe();
    };
  }, [authLoading, user]);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'completed':
      case 'served':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={14} className="text-emerald-600" />
            {t.delivered}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={14} className="text-rose-600" />
            {t.cancelled}
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <ChefHat size={14} className="text-amber-600" />
            {t.preparing}
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 size={14} className="text-blue-600" />
            {t.ready || 'Ready'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock size={14} className="text-slate-500" />
            {t.pending}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  const handleReorder = () => {
    navigate('/menu');
    toast.success('Select items to reorder from the menu');
  };

  const submitRating = async (orderId: string) => {
    const foodRating = foodRatings[orderId];
    const serviceRating = serviceRatings[orderId];
    if (!foodRating || !serviceRating) { toast.error('Please rate both food and service'); return; }
    try {
      const { error } = await supabase.from('order_ratings').insert({
        order_id: orderId,
        food_rating: foodRating,
        service_rating: serviceRating,
        feedback: feedbackText[orderId] || '',
      } as any);
      if (error) throw error;
      setRatedOrders(prev => new Set([...prev, orderId]));
      toast.success('Thank you for your feedback!');
    } catch { toast.error('Failed to submit rating'); }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <header className="bg-white z-20 shadow-sm sticky top-0">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/menu')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-900" />
            </button>
            <h2 className="text-lg font-extrabold text-gray-900 uppercase tracking-wide">{t.my_account}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full font-bold text-sm">
              Help
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* User Profile Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold shadow-inner border border-primary/20">
              <User size={30} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">{user?.full_name || 'Guest User'}</h1>
              <p className="text-xs text-slate-500 font-medium">{t.member_since} {user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear()}</p>
            </div>
          </div>
          
          {/* CRM Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-blue-50/70 border border-blue-100 rounded-2xl">
              <p className="text-xl font-black text-blue-700">{customerStats.totalOrders}</p>
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-wider">Orders</p>
            </div>
            <div className="text-center p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
              <p className="text-xl font-black text-emerald-700">₹{customerStats.totalSpent}</p>
              <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">Total Spent</p>
            </div>
            <div className="text-center p-3 bg-amber-50/70 border border-amber-100 rounded-2xl">
              <p className="text-sm font-black text-amber-700 truncate">{customerStats.favouriteItem || '—'}</p>
              <p className="text-[10px] text-amber-600 font-black uppercase tracking-wider">Favourite</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="p-2 bg-white rounded-lg shadow-xs">
                <Phone size={16} className="text-slate-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.enter_phone}</p>
                <p className="text-sm font-semibold text-slate-800">{user?.phone || 'Not provided'}</p>
              </div>
            </div>

            {user?.role === 'admin' && (
              <button 
                onClick={() => navigate('/admin')}
                className="w-full mt-3 flex items-center justify-center gap-2 p-3 bg-primary text-white rounded-xl font-bold shadow-md shadow-primary/20 hover:bg-emerald-800 transition-colors"
              >
                {t.admin_dashboard}
              </button>
            )}

            <button 
              onClick={handleLogout}
              className="w-full mt-2 flex items-center justify-center gap-2 p-3 bg-rose-50/60 text-rose-600 rounded-xl font-bold border border-rose-100 hover:bg-rose-100 transition-colors"
            >
              <LogOut size={16} />
              {t.logout}
            </button>
          </div>
        </div>

        <h3 className="font-extrabold text-slate-900 text-lg px-1">{t.past_orders}</h3>

        {loading ? (
          <OrdersSkeleton />
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <ShoppingBag size={32} className="text-primary" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">{t.no_orders}</h3>
            <p className="text-slate-500 text-sm">Looks like you haven't placed any orders yet.</p>
            <button 
              onClick={() => navigate('/menu')}
              className="mt-6 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-800 transition-colors shadow-md shadow-primary/20"
            >
              {t.start_ordering}
            </button>
          </div>
        ) : (
          orders.map((order) => {
            const isActive = order.status === 'pending' || order.status === 'preparing' || order.status === 'ready';
            const hasNewUpdate = statusUpdates[order.id];
            return (
            <div 
              key={order.id} 
              className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition-all ${
                isActive ? 'border-primary' : 'border-gray-100'
              }`}
            >
              {/* Status Ticket Banner */}
              {isActive && (
                <div className={`mb-4 -mx-4 -mt-4 px-4 py-3 flex items-center justify-between rounded-t-2xl ${
                  order.status === 'pending' ? 'bg-blue-50 border-b border-blue-100' :
                  order.status === 'preparing' ? 'bg-orange-50 border-b border-orange-100' :
                  'bg-green-50 border-b border-green-100'
                }`}>
                  <div className="flex items-center gap-2">
                    <Ticket size={18} className={
                      order.status === 'pending' ? 'text-blue-600' :
                      order.status === 'preparing' ? 'text-orange-600' :
                      'text-green-600'
                    } />
                    <span className="text-sm font-bold uppercase tracking-wide" style={{
                      color: order.status === 'pending' ? '#2563eb' :
                             order.status === 'preparing' ? '#ea580c' :
                             '#16a34a'
                    }}>
                      {order.status === 'pending' ? 'Confirmed' : order.status === 'preparing' ? 'Preparing' : 'Ready for Pickup'}
                    </span>
                  </div>
                  {hasNewUpdate && (
                    <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full animate-pulse">
                      <Check size={12} /> Updated
                    </span>
                  )}
                </div>
              )}

              {/* Status Progress Steps */}
              {isActive && (
                <div className="flex items-center justify-between mb-4 px-2">
                  {['pending', 'preparing', 'ready', 'served'].map((step, idx) => {
                    const stepOrder = ['pending', 'preparing', 'ready', 'served'];
                    const currentIdx = stepOrder.indexOf(order.status);
                    const isComplete = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    return (
                      <div key={step} className="flex flex-col items-center gap-1 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isComplete ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
                        } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                          {isComplete ? <Check size={14} /> : idx + 1}
                        </div>
                        <span className={`text-[9px] font-bold uppercase ${isComplete ? 'text-primary' : 'text-gray-400'}`}>
                          {step === 'pending' ? 'Confirmed' : step === 'preparing' ? 'Cooking' : step === 'ready' ? 'Ready' : 'Done'}
                        </span>
                        {idx < 3 && <div className={`w-full h-0.5 mt-1 ${isComplete && idx < currentIdx ? 'bg-primary' : 'bg-gray-200'}`} />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Restaurant Header */}
              <div className="flex items-start justify-between mb-4 cursor-pointer" onClick={() => navigate(`/order-tracking/${order.id}`)}>
                <div className="flex items-center gap-3">
                  <img 
                    src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=100&auto=format&fit=crop" 
                    alt="Restaurant" 
                    className="w-12 h-12 rounded-lg object-cover border border-gray-100"
                  />
                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-tight">Naati Nest</h3>
                    <p className="text-sm text-gray-500 uppercase tracking-wider font-bold">{order.order_type || 'Dine-in'}</p>
                  </div>
                </div>
                <div>
                  {getStatusDisplay(order.status)}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 mb-4">
                {order.items?.map((item: any, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="border border-gray-200 bg-gray-50 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">
                      {item.quantity}X
                    </div>
                    <p className="text-gray-800 text-sm leading-snug">
                      {item.variant ? `(${item.variant}) ` : ''}{item.name || 'Item'}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 my-4"></div>

              {/* Ratings Section */}
              {order.status === 'served' && !ratedOrders.has(order.id) && (
                <div className="mb-4 bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-bold text-gray-700 mb-3">Rate your experience</p>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex-1 text-center pr-2">
                      <p className="text-xs text-gray-500 mb-1">Food</p>
                      <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={`food-${order.id}-${star}`} onClick={() => setFoodRatings(prev => ({ ...prev, [order.id]: star }))}>
                            <Star size={20} className={`${star <= (foodRatings[order.id] || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} transition-colors`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 text-center pl-2">
                      <p className="text-xs text-gray-500 mb-1">Service</p>
                      <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={`service-${order.id}-${star}`} onClick={() => setServiceRatings(prev => ({ ...prev, [order.id]: star }))}>
                            <Star size={20} className={`${star <= (serviceRatings[order.id] || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} transition-colors`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <textarea
                    value={feedbackText[order.id] || ''}
                    onChange={(e) => setFeedbackText(prev => ({ ...prev, [order.id]: e.target.value }))}
                    placeholder="Share your feedback (optional)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm mb-3 resize-none"
                    rows={2}
                  />
                  <button onClick={() => submitRating(order.id)} className="w-full bg-primary text-white font-bold py-2.5 rounded-xl text-sm hover:bg-green-700 transition-colors">
                    Submit Rating
                  </button>
                </div>
              )}
              {order.status === 'served' && ratedOrders.has(order.id) && (
                <div className="mb-4 bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-green-700">✓ Thanks for your feedback!</p>
                </div>
              )}

              {/* Reorder Button */}
              <button 
                onClick={handleReorder}
                className="w-full bg-primary/10 text-primary font-bold py-3 rounded-xl flex items-center justify-center gap-1 hover:bg-primary/15 transition-colors"
              >
                REORDER <ChevronRight size={18} />
              </button>

              {/* Footer */}
              <div className="mt-4 text-xs text-gray-500 flex justify-between items-center">
                <span>Ordered: {formatDate(order.created_at || new Date().toISOString())}</span>
                <span className="font-bold text-gray-900">Bill Total: {formatPrice(order.total_amount)}</span>
              </div>
            </div>
          );
          })
        )}
        
        {orders.length > 0 && (
          <div className="py-4 flex justify-center items-center gap-1 text-primary font-bold text-sm cursor-pointer hover:underline">
            VIEW MORE ORDERS <ChevronRight size={16} className="rotate-90" />
          </div>
        )}
      </div>
    </div>
  );
};
