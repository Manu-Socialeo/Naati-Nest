import React, { useState, useMemo } from 'react';
import { Order } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, exportToCSV } from '@/lib/utils';
import {
  Calendar,
  Download,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
  Clock,
  Star,
  EyeOff,
  Filter,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = [
  '#15803d',
  '#f59e0b',
  '#3b82f6',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
  '#ec4899',
];

interface AnalyticsTabProps {
  orders: Order[];
}

export const AnalyticsTab = ({ orders }: AnalyticsTabProps) => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      if (order.status === 'cancelled') return false;
      switch (period) {
        case 'today':
          return orderDate.toDateString() === now.toDateString();
        case 'week': {
          const w = new Date(now);
          w.setDate(w.getDate() - 7);
          return orderDate >= w;
        }
        case 'month': {
          const m = new Date(now);
          m.setMonth(m.getMonth() - 1);
          return orderDate >= m;
        }
        case 'all':
          return true;
      }
    });
  }, [orders, period]);

  const customFiltered = useMemo(() => {
    if (!startDate || !endDate) return filteredOrders;
    const s = new Date(startDate),
      e = new Date(endDate);
    e.setHours(23, 59, 59, 999);
    return filteredOrders.filter(o => {
      const d = new Date(o.created_at);
      return d >= s && d <= e;
    });
  }, [filteredOrders, startDate, endDate]);

  const stats = useMemo(() => {
    const totalRevenue = customFiltered.reduce((s, o) => s + o.total_amount, 0);
    const totalOrders = customFiltered.length;
    return {
      totalRevenue,
      totalOrders,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      uniqueCustomers: new Set(customFiltered.map(o => o.customer_phone)).size,
      cashOrders: customFiltered.filter(o => o.payment_method === 'cash').length,
      onlineOrders: customFiltered.filter(o => o.payment_method === 'online').length,
      dineInOrders: customFiltered.filter(o => o.order_type === 'dine-in').length,
      takeawayOrders: customFiltered.filter(o => o.order_type === 'takeaway').length,
    };
  }, [customFiltered]);

  const revenueByDay = useMemo(() => {
    const map = new Map<string, number>();
    customFiltered.forEach(o => {
      const day = new Date(o.created_at).toLocaleDateString('en-IN');
      map.set(day, (map.get(day) || 0) + o.total_amount);
    });
    return Array.from(map.entries())
      .slice(-30)
      .map(([date, revenue]) => ({ date, revenue }));
  }, [customFiltered]);

  const ordersByHour = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, orders: 0 }));
    customFiltered.forEach(o => {
      hours[new Date(o.created_at).getHours()].orders += 1;
    });
    return hours.filter(h => h.orders > 0);
  }, [customFiltered]);

  const mostSold = useMemo(() => {
    const map = new Map<string, { name: string; qty: number }>();
    customFiltered.forEach(o =>
      o.items.forEach((item: any) => {
        const key = item.name + (item.variant ? ` (${item.variant})` : '');
        const e = map.get(key) || { name: key, qty: 0 };
        e.qty += item.quantity;
        map.set(key, e);
      })
    );
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [customFiltered]);

  const leastSold = useMemo(() => mostSold.slice().reverse().slice(0, 5), [mostSold]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    customFiltered.forEach(o =>
      o.items.forEach((item: any) => {
        const cat = item.category || 'Other';
        map.set(cat, (map.get(cat) || 0) + item.price * item.quantity);
      })
    );
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [customFiltered]);

  const exportOrdersCSV = () => {
    const csvData = customFiltered.map(o => ({
      'Order ID': o.id,
      Token: o.token,
      Customer: o.customer_name,
      Phone: o.customer_phone,
      Type: o.order_type,
      Status: o.status,
      Payment: o.payment_method,
      Total: o.total_amount,
      Date: new Date(o.created_at).toLocaleString('en-IN'),
    }));
    exportToCSV(csvData, `orders-${period}-${new Date().toISOString().split('T')[0]}`);
    toast.success('Orders CSV exported successfully');
  };

  return (
    <div>
      {/* Time Filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div className="flex bg-white rounded-xl border border-surface-border overflow-hidden shadow-xs">
          {(['today', 'week', 'month', 'all'] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                period === p
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-secondary hover:bg-surface-subtle'
              }`}
            >
              {p === 'today'
                ? 'Today'
                : p === 'week'
                ? 'This Week'
                : p === 'month'
                ? 'This Month'
                : 'All Time'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-surface-border shadow-xs">
          <Calendar size={16} className="text-text-muted" />
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-2 py-1 text-xs border-none outline-none font-medium"
          />
          <span className="text-xs text-text-muted">to</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-2 py-1 text-xs border-none outline-none font-medium"
          />
        </div>
        <button
          type="button"
          onClick={exportOrdersCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-surface-border rounded-xl text-xs sm:text-sm font-bold text-text-secondary hover:text-primary hover:border-primary transition-colors cursor-pointer shadow-xs"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-200/80 rounded-lg">
              <DollarSign size={20} className="text-emerald-800" />
            </div>
            <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">
              Total Revenue
            </p>
          </div>
          <p className="text-2xl font-extrabold text-emerald-950 mt-1">
            {formatPrice(stats.totalRevenue)}
          </p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/60 border border-blue-200/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-200/80 rounded-lg">
              <ShoppingBag size={20} className="text-blue-800" />
            </div>
            <p className="text-xs text-blue-800 font-bold uppercase tracking-wider">
              Total Orders
            </p>
          </div>
          <p className="text-2xl font-extrabold text-blue-950 mt-1">{stats.totalOrders}</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100/60 border border-purple-200/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-200/80 rounded-lg">
              <TrendingUp size={20} className="text-purple-800" />
            </div>
            <p className="text-xs text-purple-800 font-bold uppercase tracking-wider">
              Avg Order Value
            </p>
          </div>
          <p className="text-2xl font-extrabold text-purple-950 mt-1">
            {formatPrice(stats.avgOrderValue)}
          </p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-200/80 rounded-lg">
              <Users size={20} className="text-amber-800" />
            </div>
            <p className="text-xs text-amber-800 font-bold uppercase tracking-wider">
              Unique Customers
            </p>
          </div>
          <p className="text-2xl font-extrabold text-amber-950 mt-1">{stats.uniqueCustomers}</p>
        </Card>
      </div>

      {/* Revenue Trend & Orders by Hour */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6 bg-white border border-surface-border shadow-xs">
          <h3 className="text-sm font-extrabold text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wider">
            <TrendingUp size={18} className="text-primary" /> Revenue Trend
          </h3>
          {revenueByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={v => `₹${v}`}
                  stroke="#94a3b8"
                />
                <Tooltip formatter={(v: any) => formatPrice(Number(v))} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#15803d"
                  fill="#15803d"
                  fillOpacity={0.15}
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-text-muted text-sm font-medium">
              No revenue data available
            </div>
          )}
        </Card>
        <Card className="p-6 bg-white border border-surface-border shadow-xs">
          <h3 className="text-sm font-extrabold text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wider">
            <Clock size={18} className="text-blue-600" /> Orders by Hour
          </h3>
          {ordersByHour.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ordersByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-text-muted text-sm font-medium">
              No hourly data available
            </div>
          )}
        </Card>
      </div>

      {/* Most Sold Dishes & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 lg:col-span-2 bg-white border border-surface-border shadow-xs">
          <h3 className="text-sm font-extrabold text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wider">
            <Star size={18} className="text-amber-500 fill-amber-500" /> Top Selling Dishes
          </h3>
          {mostSold.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mostSold.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={130}
                  stroke="#64748b"
                />
                <Tooltip />
                <Bar dataKey="qty" fill="#15803d" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-text-muted text-sm font-medium">
              No dish sales data
            </div>
          )}
        </Card>
        <Card className="p-6 bg-white border border-surface-border shadow-xs">
          <h3 className="text-sm font-extrabold text-gray-800 mb-4 uppercase tracking-wider">
            Sales by Category
          </h3>
          {categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatPrice(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-text-muted text-sm font-medium">
              No category data
            </div>
          )}
        </Card>
      </div>

      {/* Splits: Payment & Order Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6 bg-white border border-surface-border shadow-xs">
          <h3 className="text-sm font-extrabold text-gray-800 mb-4 uppercase tracking-wider">
            Payment Method Split
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-3xl font-extrabold text-emerald-700">{stats.onlineOrders}</p>
              <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider mt-1">
                Online (UPI/Card)
              </p>
            </div>
            <div className="text-center p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-3xl font-extrabold text-amber-700">{stats.cashOrders}</p>
              <p className="text-xs text-amber-800 font-bold uppercase tracking-wider mt-1">
                Cash at Counter
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-white border border-surface-border shadow-xs">
          <h3 className="text-sm font-extrabold text-gray-800 mb-4 uppercase tracking-wider">
            Order Type Split
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-3xl font-extrabold text-blue-700">{stats.dineInOrders}</p>
              <p className="text-xs text-blue-800 font-bold uppercase tracking-wider mt-1">
                Dine-in (QR Tables)
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 border border-purple-100 rounded-xl">
              <p className="text-3xl font-extrabold text-purple-700">{stats.takeawayOrders}</p>
              <p className="text-xs text-purple-800 font-bold uppercase tracking-wider mt-1">
                Takeaway / Parcel
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Dead Stock / Least Sold */}
      {leastSold.length > 0 && (
        <Card className="p-6 mb-8 bg-white border border-surface-border shadow-xs">
          <h3 className="text-sm font-extrabold text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wider">
            <EyeOff size={18} className="text-red-500" /> Slow Moving Items (Attention Needed)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {leastSold.map((item, i) => (
              <div
                key={i}
                className="p-3 bg-red-50 border border-red-100 rounded-xl text-center"
              >
                <p className="text-xs font-bold text-red-800 truncate">{item.name}</p>
                <p className="text-2xl font-extrabold text-red-600 mt-1">{item.qty}</p>
                <p className="text-[10px] text-red-500 uppercase font-semibold">total sold</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Customer Data Export for Ads */}
      <Card className="p-6 bg-white border border-surface-border shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-gray-800 flex items-center gap-2 uppercase tracking-wider">
              <Users size={18} className="text-primary" /> Customer Data — For Ads & Retargeting
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Export phone numbers and order history for WhatsApp/SMS promotions and Meta/Google Ads.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const customerMap = new Map<
                string,
                {
                  name: string;
                  phone: string;
                  orderCount: number;
                  totalSpent: number;
                  lastOrder: string;
                }
              >();
              orders
                .filter(o => o.status !== 'cancelled')
                .forEach(o => {
                  const key = o.customer_phone;
                  if (!key) return;
                  const existing = customerMap.get(key);
                  if (existing) {
                    existing.orderCount += 1;
                    existing.totalSpent += o.total_amount;
                    if (new Date(o.created_at) > new Date(existing.lastOrder))
                      existing.lastOrder = o.created_at;
                  } else {
                    customerMap.set(key, {
                      name: o.customer_name || 'Guest',
                      phone: o.customer_phone,
                      orderCount: 1,
                      totalSpent: o.total_amount,
                      lastOrder: o.created_at,
                    });
                  }
                });
              const csvData = Array.from(customerMap.values()).map(c => ({
                Name: c.name,
                Phone: c.phone,
                'Order Count': c.orderCount,
                'Total Spent': c.totalSpent,
                'Last Order': new Date(c.lastOrder).toLocaleDateString('en-IN'),
              }));
              exportToCSV(
                csvData,
                `customers-retargeting-${new Date().toISOString().split('T')[0]}`
              );
              toast.success(`Exported ${csvData.length} customers`);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-primary-hover transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <Download size={16} /> Export Customer CSV
          </button>
        </div>
      </Card>
    </div>
  );
};
