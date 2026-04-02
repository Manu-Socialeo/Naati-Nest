import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeft, CheckCircle2, Star, ChevronRight, ShoppingBag, Clock, XCircle, ChefHat, User, Phone, LogOut } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export const OrderHistoryPage = () => {
  const { t, language } = useLanguage();
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (authLoading) return;

    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (data && data.length > 0) {
          setOrders(data);
        } else {
          const localOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
          setOrders(localOrders);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        const localOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
        setOrders(localOrders);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [authLoading]);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'completed': 
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
          <div className="text-center py-8 text-gray-500">Loading orders...</div>
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
          orders.map((order) => (
            <div 
              key={order.id} 
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
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
              <div className="flex justify-between items-center mb-4">
                <div className="flex-1 border-r border-gray-100 pr-4">
                  <p className="text-xs text-gray-500 mb-1.5">Your Food Rating</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={`food-${star}`} size={16} className="text-gray-300" />
                    ))}
                  </div>
                </div>
                <div className="flex-1 pl-4">
                  <p className="text-xs text-gray-500 mb-1.5">Delivery Rating</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={`delivery-${star}`} size={16} className="text-gray-300" />
                    ))}
                  </div>
                </div>
              </div>

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
          ))
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
