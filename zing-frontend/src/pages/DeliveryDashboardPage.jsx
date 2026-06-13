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
  ACCEPTED: 'bg-emerald-100 text-emerald-800 border-2 border-emerald-200',
  PREPARING: 'bg-amber-100 text-amber-800 border-2 border-amber-200',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800 border-2 border-purple-200',
  DELIVERED: 'bg-emerald-100 text-emerald-800 border-2 border-emerald-200',
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

  if (loading) return (
    <div className="w-full min-h-screen bg-[#fdfae9] text-[#1c1c12] pt-24 pb-20 flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-[#fdfae9] text-[#1c1c12] pt-24 pb-20 px-4 md:px-16 page-enter">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#e6e3d2] pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-brand-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>sports_motorsports</span>
              <h1 className="font-headline-lg text-3xl text-[#1c1c12] uppercase italic">Delivery Dashboard</h1>
            </div>
            <p className="text-sm font-body-lg text-[#5b4040] uppercase tracking-wide">Welcome, {user?.name || 'Partner'}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {hasActive && (
              <div className="flex items-center gap-1.5 rounded-full border-2 px-4 py-1.5 text-[10px] font-label-caps uppercase tracking-wider bg-white"
                style={{ borderColor: myPos ? '#22c55e' : '#ef4444', color: myPos ? '#16a34a' : '#ef4444' }}>
                <MapPin className="h-3.5 w-3.5" />
                {myPos ? 'GPS Active' : geo.error ? 'GPS Error' : 'GPS Loading…'}
              </div>
            )}
            {hasActive && (
              <div className="flex items-center gap-1.5 rounded-full border-2 px-4 py-1.5 text-[10px] font-label-caps uppercase tracking-wider bg-white"
                style={{ borderColor: connectionStatus === 'connected' ? '#22c55e' : '#f59e0b', color: connectionStatus === 'connected' ? '#16a34a' : '#d97706' }}>
                {connectionStatus === 'connected' ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                {connectionStatus === 'connected' ? 'Broadcasting' : 'Connecting…'}
              </div>
            )}
            <button onClick={loadAll}
              className="flex items-center gap-2 rounded-full border-4 border-[#e6e3d2] px-6 py-2.5 text-xs font-label-caps uppercase tracking-wider text-[#1c1c12] bg-white shadow-md hover:bg-[#f7f4e3] transition-colors">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-4 mb-8">
            <Stat icon={<Package className="h-5 w-5" />} label="Available Orders" value={stats.availableOrders} />
            <Stat icon={<Truck className="h-5 w-5" />}   label="Active Runs"    value={stats.activeDeliveries} />
            <Stat icon={<Check className="h-5 w-5" />}   label="Delivered Count" value={stats.totalDelivered} />
            <Stat icon={<DollarSign className="h-5 w-5" />} label="Payout Earnings" value={`₹${stats.totalEarnings?.toFixed(0) || 0}`} accent />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 rounded-full border-4 border-[#e6e3d2] p-1.5 w-full sm:w-fit bg-white shadow-md overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button 
                key={t.key} 
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 text-xs font-label-caps uppercase tracking-wider px-5 py-2.5 rounded-full transition-all whitespace-nowrap ${
                  isActive ? 'bg-brand-500 text-white shadow-md' : 'text-[#5b4040] hover:text-brand-500'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-[#e6e3d2] text-[#1c1c12]'}`}>
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
              <div className="space-y-4">
                {available.map((o) => (
                  <OrderCard key={o.id} order={o}>
                    <div className="text-right flex flex-col items-end gap-2 shrink-0">
                      <p className="text-[10px] font-label-caps uppercase tracking-wider text-[#5b4040]">Payout: ₹{deliveryFee(o.totalAmount)}</p>
                      <button onClick={() => handlePickup(o.id)}
                        className="flex items-center gap-1.5 rounded-full bg-brand-500 text-white px-5 py-2.5 text-xs font-label-caps uppercase tracking-wider hover:brightness-110 shadow-md transition-transform hover:scale-105">
                        <Truck className="h-3.5 w-3.5" /> Pick Up
                      </button>
                    </div>
                  </OrderCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active Deliveries */}
        {tab === 'active' && (
          <div>
            {active.length === 0 ? (
              <Empty text="You have no active deliveries" />
            ) : (
              <div className="space-y-4">
                {active.map((o) => (
                  <div key={o.id} className="rounded-[32px] border-4 border-[#e6e3d2] overflow-hidden bg-white shadow-xl">
                    <div className="p-6">
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <OrderInfo order={o} />
                        <div className="text-right flex flex-col items-end gap-2.5 w-full sm:w-auto mt-4 sm:mt-0">
                          <p className="text-[10px] font-label-caps uppercase tracking-wider text-[#5b4040]">Payout: ₹{deliveryFee(o.totalAmount)}</p>
                          <div className="flex items-center gap-2 flex-wrap justify-end w-full">
                            <button onClick={() => toggleMap(o.id)}
                              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-full border-4 px-4 py-2 text-xs font-label-caps uppercase tracking-wider transition-all ${
                                expandedMapId === o.id ? 'bg-[#f7f4e3] border-brand-500 text-brand-500' : 'bg-white border-[#e6e3d2] text-[#1c1c12] hover:bg-[#f7f4e3]'
                              }`}
                            >
                              <Navigation className="h-3.5 w-3.5" />
                              {expandedMapId === o.id ? 'Hide Map' : 'Live Map'}
                              {expandedMapId === o.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </button>
                            <button onClick={() => handleDeliver(o.id)}
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-label-caps uppercase tracking-wider bg-emerald-500 hover:brightness-110 text-white shadow-md transition-all">
                              <Check className="h-3.5 w-3.5" /> Delivered
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Live tracking map */}
                    {expandedMapId === o.id && (
                      <div className="border-t-4 border-[#e6e3d2] relative" style={{ height: '380px' }}>
                        <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between px-4 py-2.5 rounded-xl bg-black/85 backdrop-blur-md text-white text-[10px] font-label-caps uppercase tracking-wider border border-white/10">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                              {o.restaurant?.name || 'Restaurant'}
                            </span>
                            <span className="text-white/40">→</span>
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                              {o.user?.name || 'Customer'}
                            </span>
                          </div>
                          <button onClick={() => openGoogleMaps(o)}
                            className="flex items-center gap-1 text-brand-500 hover:underline">
                            <ExternalLink className="h-3 w-3" /> Navigate
                          </button>
                        </div>

                        <Suspense fallback={
                          <div className="h-full flex items-center justify-center bg-[#f1eedd]/50">
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
                            height={376}
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
              <div className="space-y-4">
                {history.map((o) => (
                  <OrderCard key={o.id} order={o} showDeliveredAt>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-headline-md text-emerald-600">+₹{deliveryFee(o.totalAmount)}</p>
                      <p className="text-[10px] font-label-caps uppercase tracking-wider text-[#5b4040]">earned</p>
                    </div>
                  </OrderCard>
                ))}
                
                <div className="rounded-[24px] border-4 border-[#e6e3d2] p-5 flex items-center justify-between bg-white shadow-md">
                  <span className="text-xs font-label-caps uppercase tracking-wider text-[#5b4040]">
                    Total Payout ({history.length} runs)
                  </span>
                  <span className="text-base font-headline-md text-brand-500">
                    ₹{history.reduce((sum, o) => sum + Math.max(30, o.totalAmount * 0.10), 0).toFixed(0)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function OrderInfo({ order: o, showDeliveredAt }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="font-headline-md text-base text-[#1c1c12]">Order #{o.id}</span>
        <span className={`text-[9px] font-label-caps uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm ${STATUS_CLS[o.status] || ''}`}>
          {o.status?.replace(/_/g, ' ')}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs font-label-caps uppercase tracking-wider text-[#5b4040]">
        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm text-brand-500">store</span> {o.restaurant?.name || '—'}</span>
        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm text-brand-500">person</span> {o.user?.name || 'Customer'}</span>
        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm text-brand-500">calendar_month</span> {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</span>
      </div>
      <p className="text-sm font-headline-md text-brand-500 mt-2">Value: ₹{o.totalAmount?.toFixed(0)}</p>
      {showDeliveredAt && o.deliveredAt && (
        <p className="text-[9px] font-label-caps uppercase tracking-wider text-white/40 mt-1">Delivered: {new Date(o.deliveredAt).toLocaleString()}</p>
      )}
    </div>
  );
}

function OrderCard({ order: o, children, showDeliveredAt }) {
  return (
    <div className="rounded-[32px] border-4 border-[#e6e3d2] hover:border-brand-500 p-6 bg-white shadow-md transition-all duration-300">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <OrderInfo order={o} showDeliveredAt={showDeliveredAt} />
        {children}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-4 rounded-[28px] border-4 border-[#e6e3d2] p-5 bg-white shadow-md">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 border-2 border-brand-500/20">{icon}</div>
      <div>
        <p className="text-xs font-label-caps uppercase tracking-wider text-[#5b4040]">{label}</p>
        <p className={`text-xl font-headline-md mt-0.5 ${accent ? 'text-brand-500' : 'text-[#1c1c12]'}`}>{value}</p>
      </div>
    </div>
  );
}

function Empty({ text, icon: Icon = Truck }) {
  return (
    <div className="text-center py-20 bg-[#f7f4e3] rounded-[32px] border-4 border-dashed border-[#e6e3d2] max-w-xl mx-auto px-6">
      <Icon className="h-10 w-10 mx-auto mb-4 text-[#5b4040]" />
      <p className="text-xs font-label-caps uppercase tracking-wider text-[#5b4040]">{text}</p>
    </div>
  );
}
