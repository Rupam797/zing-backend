import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import useGeolocation from '../hooks/useGeolocation';
import useStompClient from '../hooks/useStompClient';
import {
  Truck, Package, Check, MapPin, Clock, RefreshCw,
  DollarSign, ChevronDown, ChevronUp, User, Navigation,
  Wifi, WifiOff, ExternalLink,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const LiveTrackingMap = lazy(() => import('../components/LiveTrackingMap'));

const STATUS_CLS = {
  ACCEPTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PREPARING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  DELIVERED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

/* Geocode cache */
const geocodeCache = new Map();
async function geocodeAddress(address) {
  if (!address) return null;
  if (geocodeCache.has(address)) return geocodeCache.get(address);
  try {
    const q = encodeURIComponent(address);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
      headers: { 'User-Agent': 'zing-delivery-app/1.0' },
    });
    const data = await res.json();
    if (data.length > 0) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache.set(address, coords);
      return coords;
    }
    return null;
  } catch { return null; }
}

export default function DeliveryDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [available, setAvailable] = useState([]);
  const [active, setActive] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('available');
  const [expandedMapId, setExpandedMapId] = useState(null);
  const [restaurantCoords, setRestaurantCoords] = useState({});
  const [customerCoords, setCustomerCoords] = useState({});

  // GPS tracking for delivery partner
  const geo = useGeolocation({ enabled: true, highAccuracy: true });
  const myPos = geo.lat && geo.lng ? { lat: geo.lat, lng: geo.lng } : null;

  // WebSocket for broadcasting location
  const hasActive = active.length > 0;
  const { connectionStatus, send } = useStompClient({ enabled: hasActive });

  // Broadcast interval refs
  const wsBroadcastRef = useRef(null);
  const restPersistRef = useRef(null);

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

      // Geocode restaurant addresses for active orders
      for (const o of acRes.data) {
        const addr = [o.restaurant?.address, o.restaurant?.city].filter(Boolean).join(', ');
        geocodeAddress(addr).then((c) => {
          if (c) setRestaurantCoords((prev) => ({ ...prev, [o.id]: c }));
        });
        // Approximate customer location (offset from restaurant if no real coords)
        if (o.customerLat && o.customerLng) {
          setCustomerCoords((prev) => ({ ...prev, [o.id]: { lat: o.customerLat, lng: o.customerLng } }));
        }
      }
    } catch {
      toast.error('Failed to load delivery data');
    } finally {
      setLoading(false);
    }
  };

  /* ── Broadcast GPS via WebSocket every 3s ── */
  useEffect(() => {
    if (!hasActive || !myPos) return;

    wsBroadcastRef.current = setInterval(() => {
      active.forEach((o) => {
        send('/app/delivery/location', {
          orderId: o.id,
          lat: geo.lat,
          lng: geo.lng,
          heading: geo.heading,
          speed: geo.speed,
          accuracy: geo.accuracy,
          partnerId: user?.id,
          partnerName: user?.name,
        });
      });
    }, 3000);

    return () => { if (wsBroadcastRef.current) clearInterval(wsBroadcastRef.current); };
  }, [hasActive, myPos, active, geo.lat, geo.lng]);

  /* ── Persist location via REST every 10s ── */
  useEffect(() => {
    if (!hasActive || !myPos) return;

    restPersistRef.current = setInterval(() => {
      active.forEach((o) => {
        api.put(`/delivery/orders/${o.id}/location`, { lat: geo.lat, lng: geo.lng }).catch(() => {});
      });
    }, 10000);

    return () => { if (restPersistRef.current) clearInterval(restPersistRef.current); };
  }, [hasActive, myPos, active, geo.lat, geo.lng]);

  const handlePickup = async (id) => {
    try {
      await api.put(`/delivery/orders/${id}/pickup`);
      toast.success('Order picked up! 🚀');
      setExpandedMapId(null);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to pick up');
    }
  };

  const handleDeliver = async (id) => {
    try {
      await api.put(`/delivery/orders/${id}/deliver`);
      toast.success('Marked as delivered ✅');
      setExpandedMapId(null);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deliver');
    }
  };

  const toggleMap = (id) => setExpandedMapId((prev) => (prev === id ? null : id));
  const deliveryFee = (amount) => Math.max(30, amount * 0.10).toFixed(0);

  const openGoogleMaps = (order) => {
    const dest = customerCoords[order.id];
    const restC = restaurantCoords[order.id];
    const target = dest || restC;
    if (target) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}`, '_blank');
    }
  };

  const tabs = [
    { key: 'available', label: 'Available', icon: Package, count: available.length },
    { key: 'active',    label: 'My Pickups', icon: Truck,   count: active.length },
    { key: 'history',   label: 'History',    icon: Clock,   count: history.length },
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
        <div className="flex items-center gap-2">
          {/* GPS status */}
          {hasActive && (
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium"
              style={{ backgroundColor: 'var(--bg-input)', color: myPos ? '#22c55e' : '#ef4444' }}>
              <MapPin className="h-3 w-3" />
              {myPos ? 'GPS Active' : geo.error ? 'GPS Error' : 'GPS Loading…'}
            </div>
          )}
          {hasActive && (
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium"
              style={{ backgroundColor: 'var(--bg-input)', color: connectionStatus === 'connected' ? '#22c55e' : '#f59e0b' }}>
              {connectionStatus === 'connected' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {connectionStatus === 'connected' ? 'Broadcasting' : 'Connecting…'}
            </div>
          )}
          <button onClick={loadAll}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-3 sm:grid-cols-4 mb-6">
          <Stat icon={<Package className="h-4 w-4" />} label="Available" value={stats.availableOrders} />
          <Stat icon={<Truck className="h-4 w-4" />}   label="Active"    value={stats.activeDeliveries} />
          <Stat icon={<Check className="h-4 w-4" />}   label="Delivered" value={stats.totalDelivered} />
          <Stat icon={<DollarSign className="h-4 w-4" />} label="Earnings" value={`₹${stats.totalEarnings?.toFixed(0) || 0}`} accent />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 rounded-xl p-1 w-full sm:w-fit overflow-x-auto" style={{ backgroundColor: 'var(--bg-input)' }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                isActive ? 'bg-brand-500 text-white shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`} style={!isActive ? { color: 'var(--text-muted)' } : {}}>
              <Icon className="h-3 w-3" />
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${isActive ? 'bg-white/20' : 'bg-black/10 dark:bg-white/10'}`}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Available Orders */}
      {tab === 'available' && (
        <div>
          {available.length === 0 ? (
            <Empty text="No orders available for delivery right now" />
          ) : (
            <div className="space-y-3">
              {available.map((o) => (
                <OrderCard key={o.id} order={o}>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Earn ₹{deliveryFee(o.totalAmount)}</p>
                    <button onClick={() => handlePickup(o.id)}
                      className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-600 transition-colors shadow-sm">
                      <Truck className="h-3 w-3" /> Pick Up
                    </button>
                  </div>
                </OrderCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Deliveries with Live Map */}
      {tab === 'active' && (
        <div>
          {active.length === 0 ? (
            <Empty text="You have no active deliveries" />
          ) : (
            <div className="space-y-3">
              {active.map((o) => (
                <div key={o.id} className="rounded-xl border overflow-hidden transition-all" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <OrderInfo order={o} />
                      <div className="text-right flex flex-col items-end gap-2">
                        <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Earnings: ₹{deliveryFee(o.totalAmount)}</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleMap(o.id)}
                            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                              expandedMapId === o.id ? 'bg-indigo-50 border-indigo-300 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-400' : ''
                            }`} style={expandedMapId !== o.id ? { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' } : {}}>
                            <Navigation className="h-3 w-3" />
                            {expandedMapId === o.id ? 'Hide Map' : 'Live Map'}
                            {expandedMapId === o.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                          <button onClick={() => handleDeliver(o.id)}
                            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 transition-colors">
                            <Check className="h-3 w-3" /> Delivered
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live tracking map */}
                  {expandedMapId === o.id && (
                    <div className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center justify-between px-4 py-2 text-[11px]"
                        style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                            {o.restaurant?.name || 'Restaurant'}
                          </span>
                          <span style={{ color: 'var(--text-faint)' }}>→</span>
                          <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                            {o.user?.name || 'Customer'}
                          </span>
                        </div>
                        <button onClick={() => openGoogleMaps(o)}
                          className="flex items-center gap-1 text-brand-500 hover:underline">
                          <ExternalLink className="h-3 w-3" /> Google Maps
                        </button>
                      </div>

                      <Suspense fallback={
                        <div className="h-80 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-card)' }}>
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                        </div>
                      }>
                        <LiveTrackingMap
                          deliveryPos={myPos}
                          customerPos={customerCoords[o.id] || null}
                          restaurantPos={restaurantCoords[o.id] || null}
                          restaurantName={o.restaurant?.name}
                          restaurantAddress={o.restaurant?.address}
                          restaurantCity={o.restaurant?.city}
                          customerName={o.user?.name}
                          orderId={o.id}
                          connectionStatus={connectionStatus}
                          speed={geo.speed}
                          mode="delivery"
                          height={350}
                        />
                      </Suspense>
                    </div>
                  )}
                </div>
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
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+₹{deliveryFee(o.totalAmount)}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>earned</p>
                  </div>
                </OrderCard>
              ))}
              <div className="mt-4 rounded-xl border p-3 flex items-center justify-between"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Total from {history.length} {history.length === 1 ? 'delivery' : 'deliveries'}
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

/* ── Sub-components ── */

function OrderInfo({ order: o, showDeliveredAt }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>#{o.id}</span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${STATUS_CLS[o.status] || ''}`}>
          {o.status?.replace(/_/g, ' ')}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{o.restaurant?.name || '—'}</span>
        <span className="flex items-center gap-1"><User className="h-3 w-3" />{o.user?.name || 'Customer'}</span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</span>
      </div>
      <p className="text-xs font-semibold text-brand-500 mt-1">₹{o.totalAmount?.toFixed(2)}</p>
      {showDeliveredAt && o.deliveredAt && (
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>Delivered: {new Date(o.deliveredAt).toLocaleString()}</p>
      )}
    </div>
  );
}

function OrderCard({ order: o, children, showDeliveredAt }) {
  return (
    <div className="rounded-xl border p-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="flex items-start justify-between gap-3">
        <OrderInfo order={o} showDeliveredAt={showDeliveredAt} />
        {children}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">{icon}</div>
      <div>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className={`text-sm font-bold ${accent ? 'text-brand-500' : ''}`} style={!accent ? { color: 'var(--text-primary)' } : {}}>{value}</p>
      </div>
    </div>
  );
}

function Empty({ text, icon: Icon = Truck }) {
  return (
    <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
      <Icon className="h-9 w-9 mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
      <p className="text-xs">{text}</p>
    </div>
  );
}
