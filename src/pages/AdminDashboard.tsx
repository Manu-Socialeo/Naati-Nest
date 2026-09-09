import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Order, MenuItem, Category } from '@/lib/types';
import {
  ArrowLeft,
  LogOut,
  RefreshCw,
  ShoppingBag,
  Settings,
  BarChart3,
  QrCode,
  Bell,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { OrdersTab } from '@/components/admin/OrdersTab';
import { AnalyticsTab } from '@/components/admin/AnalyticsTab';
import { MenuManagementTab } from '@/components/admin/MenuManagementTab';
import { QRTab } from '@/components/admin/QRTab';

export const AdminDashboard = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'analytics' | 'menu' | 'qr'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchOrders();
    fetchMenuData();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    const subscription = supabase
      .channel('orders-admin')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        payload => {
          setNewOrderCount(prev => prev + 1);
          const o = payload.new as Order;
          toast.success(`New order #${o.token || '-'} from ${o.customer_name}`);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🔔 New Order - Naati Nest', {
              body: `${o.customer_name} - ₹${o.total_amount} (${o.order_type})`,
              tag: o.id,
            });
          }
          if (autoPrintEnabled || o.order_type === 'takeaway') {
            printBill(o);
          }
          fetchOrders();
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => {
      subscription?.unsubscribe();
    };
  }, [user, authLoading, navigate, autoPrintEnabled]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuData = async () => {
    try {
      const [catRes, itemsRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('menu_items').select('*').order('sort_order'),
      ]);
      if (catRes.error) throw catRes.error;
      if (itemsRes.error) throw itemsRes.error;
      setCategories(catRes.data || []);
      setMenuItems(itemsRes.data || []);
    } catch {
      toast.error('Failed to fetch menu data');
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase.from('orders').update({ status } as any).eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status } : o)));
      toast.success(`Order status updated to ${status}`);
    } catch {
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
    const time = new Date(order.created_at).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const billNo = order.id.slice(-6).toUpperCase();
    const token = order.token || order.id.slice(-4).toUpperCase();
    let itemsHtml = '';
    order.items.forEach(item => {
      const name = (item.name + (item.variant ? ` (${item.variant})` : ''))
        .padEnd(18)
        .slice(0, 18);
      const qty = item.quantity.toString().padStart(3);
      const price = item.price.toFixed(2).padStart(8);
      const total = (item.price * item.quantity).toFixed(2).padStart(8);
      itemsHtml += `${name} ${qty} ${price} ${total}\n`;
    });
    printWindow.document.write(
      `<html><head><title>Print Bill - ${billNo}</title><style>@page { size: 80mm auto; margin: 0; } body { margin: 0; padding: 5px; font-family: 'Courier New', monospace; font-size: 12px; white-space: pre; }</style></head><body onload="window.print(); window.close();">NAATI NEST - Token: ${token}\nDT: ${date} TM: ${time}\nBILL: ${billNo}\n-------------------------------------\nITEM               QTY    PRICE   TOTAL\n-------------------------------------\n${itemsHtml}-------------------------------------\nSUB TOTAL                   ${(
        order.subtotal || order.total_amount
      ).toFixed(2)}\n${
        order.parcel_charge
          ? `PARCEL CHARGE               ${order.parcel_charge.toFixed(2)}\n`
          : ''
      }GRAND TOTAL:               ₹${order.total_amount}\n-------------------------------------\nPAY: ${
        order.payment_method || 'ONLINE'
      }\nTHANK YOU - VISIT AGAIN\n      </body></html>`
    );
    printWindow.document.close();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const cashPending = orders.filter(
    o =>
      o.payment_method === 'cash' &&
      o.status !== 'served' &&
      o.status !== 'cancelled' &&
      o.payment_status !== 'paid'
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-subtle">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-primary" size={32} />
          <p className="text-text-secondary font-medium">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <header className="bg-white border-b border-surface-border sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/menu')}
                className="p-2 -ml-2 hover:bg-surface-subtle rounded-full transition-colors cursor-pointer"
                title="View customer menu"
              >
                <ArrowLeft size={22} className="text-text-primary" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-text-primary flex items-center gap-2">
                  <span>Naati Nest</span>
                  <span className="text-xs bg-primary-light text-primary border border-primary-border font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Admin
                  </span>
                </h1>
              </div>
              {newOrderCount > 0 && (
                <div className="flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                  <Bell size={14} /> {newOrderCount} new
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-200"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-surface-border sticky top-16 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar py-2">
            {[
              {
                key: 'orders' as const,
                label: 'Orders',
                icon: ShoppingBag,
                count: orders.length,
              },
              { key: 'menu' as const, label: 'Menu & Dishes', icon: Settings },
              { key: 'analytics' as const, label: 'Analytics & Reports', icon: BarChart3 },
              { key: 'qr' as const, label: 'QR Tables', icon: QrCode },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      activeTab === tab.key
                        ? 'bg-white/20 text-white'
                        : 'bg-surface-subtle text-text-secondary'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Contents */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'orders' && (
          <OrdersTab
            orders={orders}
            pendingOrders={pendingOrders}
            cashPending={cashPending}
            updateOrderStatus={updateOrderStatus}
            printBill={printBill}
            fetchOrders={fetchOrders}
            autoPrintEnabled={autoPrintEnabled}
            setAutoPrintEnabled={setAutoPrintEnabled}
          />
        )}
        {activeTab === 'analytics' && <AnalyticsTab orders={orders} />}
        {activeTab === 'menu' && (
          <MenuManagementTab
            menuItems={menuItems}
            setMenuItems={setMenuItems}
            categories={categories}
            fetchMenuData={fetchMenuData}
          />
        )}
        {activeTab === 'qr' && <QRTab />}
      </main>
    </div>
  );
};
