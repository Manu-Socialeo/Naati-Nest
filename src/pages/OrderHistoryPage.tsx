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
      try {
        let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (user?.phone) {
          query = query.eq('customer_phone', user.phone);
        }
        const { data, error } = await query;
        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        toast.error('Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    const fetchStats = async () => {
      if (!user?.phone) return;
      try {
        const { data } = await supabase.from('profiles').select('total_orders, total_spent, favourite_item').eq('phone', user.phone).single() as any;
        if (data) setCustomerStats({ totalOrders: data.total_orders || 0, totalSpent: data.total_spent || 0, favouriteItem: data.favourite_item || '' });
      } catch {}
      try {
        const { data } = await supabase.from('order_ratings').select('order_id');
        if (data) setRatedOrders(new Set(data.map((r: any) => r.order_id)));
      } catch {}
    };
    fetchStats();

    const channel = supabase
      .channel('order-updates-customer')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const newOrder = payload.new as any;
        setOrders(prev => prev.map(o => o.id === newOrder.id ? newOrder : o));
        setStatusUpdates(prev => ({ ...prev, [newOrder.id]: newOrder.status }));
        toast.success(`Order #${newOrder.token || newOrder.id.slice(-4)} is now ${newOrder.status}`);
      })
      .subscribe();

    return () => { channel?.unsubscribe(); };
  }, [authLoading, user]);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'completed':
      case 'served':
        return (
          <div className="flex items-center gap-1 text-[#1e9e62] font-bold text-sm">
            {t.delivered} <CheckCircle2 size={16} className="fill-[#1e9e62] text-white" />
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center gap-1 text-[#d9534f] font-bold text-sm">
            {t.cancelled} <XCircle size={16} className="fill-[#d9534f] text-white" />
          </div>
        );
      case 'preparing':
        return (
          <div className="flex items-center gap-1 text-[#e46c35] font-bold text-sm">
            {t.preparing} <ChefHat size={16} />
          </div>
        );
      case 'ready':
        return (
          <div className="flex items-center gap-1 text-blue-500 font-bold text-sm">
            {t.ready || 'Ready'} <CheckCircle2 size={16} />
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-blue-500 font-bold text-sm">
            {t.pending} <Clock size={16} />
          </div>
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
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
              <User size={32} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user?.full_name || 'Guest User'}</h1>
              <p className="text-sm text-gray-500">{t.member_since} {user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear()}</p>
            </div>
          </div>
          
          {/* CRM Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <p className="text-xl font-extrabold text-blue-600">{customerStats.totalOrders}</p>
              <p className="text-[10px] text-blue-500 font-bold uppercase">Orders</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <p className="text-xl font-extrabold text-green-600">₹{customerStats.totalSpent}</p>
              <p className="text-[10px] text-green-500 font-bold uppercase">Total Spent</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-xl">
              <p className="text-sm font-extrabold text-purple-600 truncate">{customerStats.favouriteItem || '—'}</p>
              <p className="text-[10px] text-purple-500 font-bold uppercase">Favourite</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-700">
              <div className="p-2 bg-gray-50 rounded-lg">
                <Phone size={18} className="text-gray-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.enter_phone}</p>
                <p className="text-sm font-medium">{user?.phone || 'Not provided'}</p>
              </div>
            </div>

            {user?.role === 'admin' && (
              <button 
                onClick={() => navigate('/admin')}
                className="w-full mt-4 flex items-center justify-center gap-2 p-3 bg-primary text-white rounded-xl font-bold shadow-sm hover:opacity-90 transition-opacity"
              >
                {t.admin_dashboard}
              </button>
            )}

            <button 
              onClick={handleLogout}
              className="w-full mt-2 flex items-center justify-center gap-2 p-3 bg-gray-50 text-red-600 rounded-xl font-bold border border-red-100 hover:bg-red-50 transition-colors"
            >
              <LogOut size={18} />
              {t.logout}
            </button>
          </div>
        </div>

        <h3 className="font-bold text-gray-900 text-lg px-1">{t.past_orders}</h3>

        {loading ? (
          <OrdersSkeleton />
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{t.no_orders}</h3>
            <p className="text-gray-500">Looks like you haven't placed any orders.</p>
            <button 
              onClick={() => navigate('/menu')}
              className="mt-6 bg-[#1e9e62] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-sm"
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
                className="w-full bg-orange-50 text-orange-600 font-bold py-3 rounded-xl flex items-center justify-center gap-1 hover:bg-orange-100 transition-colors"
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
          <div className="py-4 flex justify-center items-center gap-1 text-orange-600 font-bold text-sm cursor-pointer">
            VIEW MORE ORDERS <ChevronRight size={16} className="rotate-90" />
          </div>
        )}
      </div>
    </div>
  );
};
