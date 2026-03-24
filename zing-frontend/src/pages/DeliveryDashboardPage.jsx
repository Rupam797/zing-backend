import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Truck, Package, Check, MapPin, Clock, RefreshCw,
  DollarSign, History, ArrowRight, User,
} from 'lucide-react';

const STATUS_CLS = {
  ACCEPTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PREPARING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  DELIVERED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export default function DeliveryDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [available, setAvailable] = useState([]);
  const [active, setActive] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('available');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sRes, avRes, acRes, hRes] = await Promise.all([
        api.get('/delivery/stats'),
        api.get('/delivery/available'),
        api.get('/delivery/active'),
        api.get('/delivery/history'),
      ]);
      setStats(sRes.data);
      setAvailable(avRes.data);
      setActive(acRes.data);
      setHistory(hRes.data);
    } catch {
      toast.error('Failed to load delivery data');
    } finally {
      setLoading(false);
    }
  };

  const handlePickup = async (id) => {
    try {
      await api.put(`/delivery/orders/${id}/pickup`);
      toast.success('Order picked up! 🚀');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to pick up');
    }
  };

  const handleDeliver = async (id) => {
    try {
      await api.put(`/delivery/orders/${id}/deliver`);
      toast.success('Marked as delivered ✅');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deliver');
    }
  };

  const deliveryFee = (amount) => Math.max(30, amount * 0.10).toFixed(0);

  const tabs = [
    { key: 'available', label: 'Available', count: available.length },
    { key: 'active', label: 'My Pickups', count: active.length },
    { key: 'history', label: 'History', count: history.length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-20 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Delivery Dashboard</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Welcome, {user?.name}</p>
        </div>
        <button
          onClick={loadAll}
          className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-3 sm:grid-cols-4 mb-5">
          <Stat icon={<Package className="h-4 w-4" />} label="Available" value={stats.availableOrders} />
          <Stat icon={<Truck className="h-4 w-4" />} label="Active" value={stats.activeDeliveries} />
          <Stat icon={<Check className="h-4 w-4" />} label="Delivered" value={stats.totalDelivered} />
          <Stat icon={<DollarSign className="h-4 w-4" />} label="Earnings" value={`₹${stats.totalEarnings?.toFixed(0) || 0}`} accent />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 rounded-md p-0.5 w-fit" style={{ backgroundColor: 'var(--bg-input)' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-[11px] px-3 py-1 rounded font-medium transition-colors ${tab === t.key ? 'bg-brand-500 text-white' : ''}`}
            style={tab !== t.key ? { color: 'var(--text-muted)' } : {}}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Available orders */}
      {tab === 'available' && (
        <div>
          {available.length === 0 ? (
            <Empty text="No orders available for delivery right now" />
          ) : (
            <div className="space-y-2">
              {available.map((o) => (
                <OrderCard key={o.id} order={o}>
                  <div className="text-right">
                    <p className="text-[10px] mb-1" style={{ color: 'var(--text-faint)' }}>
                      Earn ₹{deliveryFee(o.totalAmount)}
                    </p>
                    <button
                      onClick={() => handlePickup(o.id)}
                      className="flex items-center gap-1 rounded-md bg-brand-500 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-brand-600 transition-colors"
                    >
                      <Truck className="h-3 w-3" /> Pick Up
                    </button>
                  </div>
                </OrderCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active deliveries */}
      {tab === 'active' && (
        <div>
          {active.length === 0 ? (
            <Empty text="You have no active deliveries" />
          ) : (
            <div className="space-y-2">
              {active.map((o) => (
                <OrderCard key={o.id} order={o}>
                  <div className="text-right">
                    <p className="text-[10px] mb-1" style={{ color: 'var(--text-faint)' }}>
                      Earnings: ₹{deliveryFee(o.totalAmount)}
                    </p>
                    <button
                      onClick={() => handleDeliver(o.id)}
                      className="flex items-center gap-1 rounded-md px-3 py-1.5 text-[11px] font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 transition-colors"
                    >
                      <Check className="h-3 w-3" /> Mark Delivered
                    </button>
                  </div>
                </OrderCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div>
          {history.length === 0 ? (
            <Empty text="No deliveries completed yet — pick up an order to get started!" />
          ) : (
            <div className="space-y-2">
              {history.map((o) => (
                <OrderCard key={o.id} order={o} showDeliveredAt>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      +₹{deliveryFee(o.totalAmount)}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>earned</p>
                  </div>
                </OrderCard>
              ))}

              {/* Total earnings summary */}
              <div className="mt-4 rounded-lg border p-3 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Total from {history.length} deliveries
                </span>
                <span className="text-sm font-bold text-brand-500">
                  ₹{history.reduce((sum, o) => sum + Math.max(30, o.totalAmount * 0.10), 0).toFixed(0)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order: o, children, showDeliveredAt }) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              #{o.id}
            </span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_CLS[o.status] || ''}`}>
              {o.status?.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />{o.restaurant?.name || '—'}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />{o.user?.name || 'Customer'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}
            </span>
          </div>
          <p className="text-xs font-semibold text-brand-500 mt-1">
            ₹{o.totalAmount?.toFixed(2)}
          </p>
          {showDeliveredAt && o.deliveredAt && (
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
              Delivered: {new Date(o.deliveredAt).toLocaleString()}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
        {icon}
      </div>
      <div>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className={`text-sm font-bold ${accent ? 'text-brand-500' : ''}`} style={!accent ? { color: 'var(--text-primary)' } : {}}>
          {value}
        </p>
      </div>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
      <Truck className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--text-faint)' }} />
      <p className="text-xs">{text}</p>
    </div>
  );
}
