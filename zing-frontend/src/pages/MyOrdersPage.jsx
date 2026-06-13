import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Package, ArrowRight, MapPin, RefreshCw } from 'lucide-react';

const statusColor = (s) => ({
  PLACED:           'bg-blue-100 text-blue-800 border-2 border-blue-200',
  ACCEPTED:         'bg-emerald-100 text-emerald-800 border-2 border-emerald-200',
  PREPARING:        'bg-amber-100 text-amber-800 border-2 border-amber-200',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800 border-2 border-purple-200',
  DELIVERED:        'bg-emerald-100 text-emerald-800 border-2 border-emerald-200',
  CANCELLED:        'bg-red-100 text-red-800 border-2 border-red-200',
}[s] || 'bg-[#e6e3d2] text-[#1c1c12] border-2 border-[#e6e3d2]');

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
      <div className="w-full min-h-screen bg-[#fdfae9] text-[#1c1c12] pt-24 pb-20 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#fdfae9] text-[#1c1c12] pt-24 pb-20 px-4 md:px-16 page-enter">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#e6e3d2] pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-brand-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
              <h1 className="font-headline-lg text-3xl text-[#1c1c12] uppercase italic">My Orders</h1>
            </div>
            <p className="text-[#5b4040] font-body-lg text-sm uppercase tracking-wide">{orders.length} order{orders.length !== 1 ? 's' : ''} placed total</p>
          </div>
          <button onClick={loadOrders} className="flex items-center gap-2 rounded-full border-4 border-[#e6e3d2] px-6 py-2.5 text-xs font-label-caps uppercase tracking-wider text-[#1c1c12] bg-white shadow-md hover:bg-[#f7f4e3] transition-colors">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-[#f7f4e3] rounded-[32px] border-4 border-dashed border-[#e6e3d2] max-w-xl mx-auto px-6">
            <Package className="h-12 w-12 mx-auto mb-4 text-[#5b4040]" />
            <h3 className="font-headline-md text-xl uppercase mb-2">No orders yet</h3>
            <p className="font-body-md text-[#5b4040] text-sm uppercase mb-8">Start ordering from your favorite restaurants</p>
            <Link to="/restaurants" className="rounded-full bg-brand-500 text-white px-8 py-3.5 font-label-caps text-xs tracking-wider uppercase hover:brightness-110 shadow-lg inline-flex items-center gap-2">
              Browse Restaurants
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.sort((a, b) => b.id - a.id).map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}/track`}
                className="block rounded-[28px] border-4 border-[#e6e3d2] hover:border-brand-500 bg-white p-6 transition-all duration-300 shadow-md group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-headline-md text-base text-[#1c1c12]">Order #{order.id}</span>
                    <span className={`text-[10px] font-label-caps uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm ${statusColor(order.status)}`}>
                      {order.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-[#5b4040] group-hover:translate-x-1 transition-transform" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-headline-md text-sm text-[#1c1c12] uppercase">
                      {order.restaurant?.name || 'Restaurant'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs font-label-caps uppercase tracking-wider text-[#5b4040]">
                      <span>{order.createdAt?.split('T')[0]}</span>
                      {order.deliveryPartner && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-brand-500" /> {order.deliveryPartner.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-headline-md text-base text-brand-500">₹{order.totalAmount?.toFixed(0)}</span>
                </div>

                {/* Track button for active orders */}
                {['OUT_FOR_DELIVERY', 'PREPARING', 'ACCEPTED'].includes(order.status) && (
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-label-caps uppercase tracking-wider text-brand-500 group-hover:underline">
                    <MapPin className="h-4 w-4" /> Track Order →
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
