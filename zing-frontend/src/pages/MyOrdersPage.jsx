import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Package, ArrowRight, MapPin, RefreshCw } from 'lucide-react';

const statusColor = (s) => ({
  PLACED:           'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ACCEPTED:         'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PREPARING:        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  DELIVERED:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELLED:        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}[s] || 'bg-gray-100 text-gray-600');

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      const res = await api.get('/orders/my');
      setOrders(res.data || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-20 pb-12">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>My Orders</h1>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={loadOrders} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No orders yet</p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Start ordering from your favorite restaurants</p>
          <Link to="/restaurants" className="inline-block mt-4 rounded-md bg-brand-500 px-4 py-2 text-xs font-medium text-white">
            Browse Restaurants
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.sort((a, b) => b.id - a.id).map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}/track`}
              className="block rounded-lg border p-4 transition-colors hover:border-brand-400"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>#{order.id}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusColor(order.status)}`}>
                    {order.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4" style={{ color: 'var(--text-faint)' }} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {order.restaurant?.name || 'Restaurant'}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    <span>{order.createdAt?.split('T')[0]}</span>
                    {order.deliveryPartner && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" /> {order.deliveryPartner.name}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-bold text-brand-500">₹{order.totalAmount?.toFixed(2)}</span>
              </div>

              {/* Track button for active orders */}
              {['OUT_FOR_DELIVERY', 'PREPARING', 'ACCEPTED'].includes(order.status) && (
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-brand-500 font-medium">
                  <MapPin className="h-3 w-3" /> Track Order →
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
