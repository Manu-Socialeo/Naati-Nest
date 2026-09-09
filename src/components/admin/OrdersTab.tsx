import React, { useState } from 'react';
import { Order } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/lib/utils';
import { Search, RefreshCw, CheckCircle, Clock, XCircle, Printer } from 'lucide-react';

interface OrdersTabProps {
  orders: Order[];
  pendingOrders: Order[];
  cashPending: Order[];
  updateOrderStatus: (id: string, status: Order['status']) => void;
  printBill: (order: Order) => void;
  fetchOrders: () => void;
  autoPrintEnabled: boolean;
  setAutoPrintEnabled: (v: boolean) => void;
}

export const OrdersTab = ({
  orders,
  pendingOrders,
  cashPending,
  updateOrderStatus,
  printBill,
  fetchOrders,
  autoPrintEnabled,
  setAutoPrintEnabled,
}: OrdersTabProps) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (
      paymentFilter === 'cash-pending' &&
      !(
        order.payment_method === 'cash' &&
        order.payment_status !== 'paid' &&
        order.status !== 'served' &&
        order.status !== 'cancelled'
      )
    )
      return false;
    if (paymentFilter === 'paid' && order.payment_status !== 'paid') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        order.customer_name?.toLowerCase().includes(q) ||
        order.customer_phone?.includes(q) ||
        order.token?.toLowerCase().includes(q) ||
        order.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const todayOrders = orders.filter(
    o => new Date(o.created_at).toDateString() === new Date().toDateString()
  );
  const servedToday = todayOrders.filter(o => o.status === 'served');
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total_amount, 0);

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 border-l-4 border-l-blue-500 bg-white">
          <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{pendingOrders.length}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500 bg-white">
          <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">Collect Cash</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{cashPending.length}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500 bg-white">
          <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">Served Today</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{servedToday.length}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-primary bg-white">
          <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">Today Revenue</p>
          <p className="text-2xl font-extrabold text-primary mt-1">{formatPrice(todayRevenue)}</p>
        </Card>
      </div>

      {/* Auto-Print Banner */}
      <div className="bg-white rounded-2xl shadow-xs border border-surface-border p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-800">Auto-Print New Orders</p>
          <p className="text-xs text-text-secondary">
            OFF = only takeaway auto-prints. ON = all orders auto-print immediately.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAutoPrintEnabled(!autoPrintEnabled)}
          className={`w-14 h-8 rounded-full transition-colors relative cursor-pointer ${
            autoPrintEnabled ? 'bg-primary' : 'bg-gray-300'
          }`}
        >
          <div
            className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
              autoPrintEnabled ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-surface-border focus-within:border-primary transition-colors">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, token, ID..."
              className="bg-transparent border-none outline-none w-full text-sm font-medium"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-surface-border rounded-xl text-sm font-semibold outline-none focus:border-primary"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="served">Served</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={paymentFilter}
          onChange={e => setPaymentFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-surface-border rounded-xl text-sm font-semibold outline-none focus:border-primary"
        >
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="cash-pending">Collect Cash</option>
        </select>
        <button
          type="button"
          onClick={fetchOrders}
          className="p-2.5 bg-white border border-surface-border rounded-xl text-text-secondary hover:text-primary transition-colors cursor-pointer"
          title="Refresh orders"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Order Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl shadow-xs border border-dashed border-gray-300">
            <p className="text-text-secondary font-medium">No orders found matching filters</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <Card
              key={order.id}
              className={`overflow-hidden border border-surface-border shadow-xs hover:shadow-md transition-shadow ${
                order.payment_method === 'cash' &&
                order.status !== 'served' &&
                order.status !== 'cancelled' &&
                order.payment_status !== 'paid'
                  ? 'ring-2 ring-amber-400'
                  : ''
              }`}
            >
              <div className="p-5">
                {order.payment_method === 'cash' &&
                  order.status !== 'served' &&
                  order.status !== 'cancelled' &&
                  order.payment_status !== 'paid' && (
                    <div className="mb-4 -mx-5 -mt-5 px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                      <span className="text-lg">💰</span>
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                        Collect ₹{order.total_amount} — Cash Payment
                      </span>
                    </div>
                  )}
                {order.payment_status === 'paid' && (
                  <div className="mb-4 -mx-5 -mt-5 px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                      Payment Received — ₹{order.total_amount}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <Badge
                        variant="pending"
                        className="text-[10px] py-0 px-1.5 h-auto bg-gray-100 border-gray-200 text-gray-600"
                      >
                        {order.token || order.id.slice(-4).toUpperCase()}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {order.customer_name || 'Guest Customer'}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-text-secondary">{order.customer_phone || 'No phone'}</p>
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wide bg-primary-light px-2 py-0.5 rounded-full">
                        {order.order_type || 'Dine-in'}
                      </span>
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
                <div className="space-y-1.5 mb-4 max-h-48 overflow-y-auto pr-1">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-50">
                      <span className="text-gray-700 font-medium">
                        {item.quantity}× {item.name}{' '}
                        {item.variant ? (
                          <span className="text-xs text-text-muted">({item.variant})</span>
                        ) : (
                          ''
                        )}
                      </span>
                      <span className="text-gray-900 font-semibold">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">
                      Total Bill
                    </p>
                    <p className="text-xl font-extrabold text-primary">
                      {formatPrice(order.total_amount)}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => printBill(order)}
                      className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                      title="Print Bill"
                    >
                      <Printer size={18} />
                    </button>
                    {order.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                        title="Start Preparing"
                      >
                        <Clock size={18} />
                      </button>
                    )}
                    {(order.status === 'preparing' || order.status === 'pending') && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                        title="Mark as Ready"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, 'served')}
                        className="p-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors cursor-pointer"
                        title="Mark as Delivered"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    {order.status !== 'cancelled' && order.status !== 'served' && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                        title="Cancel Order"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-text-muted mt-3">
                  {new Date(order.created_at).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
