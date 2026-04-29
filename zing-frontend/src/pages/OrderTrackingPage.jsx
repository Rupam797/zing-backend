import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import useStompClient from '../hooks/useStompClient';
import useGeolocation from '../hooks/useGeolocation';
import {
  Package, MapPin, Clock, ChefHat, Truck, CheckCircle, XCircle,
  ArrowLeft, Phone, Wifi, WifiOff, RefreshCw, Navigation,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const LiveTrackingMap = lazy(() => import('../components/LiveTrackingMap'));

const STATUS_STEPS = [
  { key: 'PLACED',           icon: Package,     label: 'Order Placed',     desc: 'Your order has been received' },
  { key: 'ACCEPTED',         icon: CheckCircle, label: 'Accepted',         desc: 'Restaurant confirmed your order' },
  { key: 'PREPARING',        icon: ChefHat,     label: 'Preparing',        desc: 'Your food is being cooked' },
  { key: 'OUT_FOR_DELIVERY', icon: Truck,       label: 'Out for Delivery', desc: 'Delivery partner is on the way' },
  { key: 'DELIVERED',        icon: CheckCircle, label: 'Delivered',        desc: 'Enjoy your meal!' },
];

/* ── Geocoding helper ── */
const geocodeCache = new Map();
async function geocodeAddress(address) {
  if (!address) return null;
  if (geocodeCache.has(address)) return geocodeCache.get(address);
  try {
    const q = encodeURIComponent(address);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { 'User-Agent': 'zing-delivery-app/1.0' } }
    );
    const data = await res.json();
    if (data.length > 0) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache.set(address, coords);
      return coords;
    }
    return null;
  } catch {
    return null;
  }
}

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deliveryPos, setDeliveryPos] = useState(null);
  const [restaurantPos, setRestaurantPos] = useState(null);
  const [riderSpeed, setRiderSpeed] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Customer's own GPS for showing their position on the map
  const geo = useGeolocation({ enabled: true });
  const customerPos = geo.lat && geo.lng ? { lat: geo.lat, lng: geo.lng } : null;

  // WebSocket for real-time rider location
  const isOutForDelivery = order?.status === 'OUT_FOR_DELIVERY';
  const { connectionStatus, subscribe } = useStompClient({ enabled: isOutForDelivery });

  /* ── Load order data ── */
  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const res = await api.get(`/orders/my/${id}`);
      setOrder(res.data);

      // Geocode restaurant address for map
      const addr = [res.data.restaurant?.address, res.data.restaurant?.city].filter(Boolean).join(', ');
      const coords = await geocodeAddress(addr);
      if (coords) setRestaurantPos(coords);

      // Fetch last known delivery location (for reconnection)
      if (res.data.status === 'OUT_FOR_DELIVERY') {
        try {
          const locRes = await api.get(`/tracking/orders/${id}/location`);
          if (locRes.data?.lat && locRes.data?.lng) {
            setDeliveryPos({ lat: locRes.data.lat, lng: locRes.data.lng });
          }
        } catch {
          // No saved location yet, that's fine
        }
      }
    } catch {
      toast.error('Order not found');
    } finally {
      setLoading(false);
    }
  };

  /* ── Subscribe to WebSocket location updates ── */
  useEffect(() => {
    if (!isOutForDelivery) return;

    const unsub = subscribe(`/topic/delivery-location/${id}`, (data) => {
      if (data.lat && data.lng) {
        setDeliveryPos({ lat: data.lat, lng: data.lng });
        if (data.speed !== undefined) setRiderSpeed(data.speed);
        setLastUpdate(Date.now());
      }
    });

    return () => unsub();
  }, [isOutForDelivery, id, subscribe]);

  /* ── Auto-refresh order status every 15s ── */
  useEffect(() => {
    if (!order || order.status === 'DELIVERED' || order.status === 'CANCELLED') return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/orders/my/${id}`);
        setOrder(res.data);
      } catch {}
    }, 15000);
    return () => clearInterval(interval);
  }, [order?.status, id]);

  const currentStepIndex = order ? STATUS_STEPS.findIndex((s) => s.key === order.status) : -1;
  const isCancelled = order?.status === 'CANCELLED';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Order not found</p>
        <Link to="/orders" className="mt-2 text-xs text-brand-500">← Back to orders</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-20 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          to="/orders"
          className="flex h-8 w-8 items-center justify-center rounded-md border"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Order #{order.id}
          </h1>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {order.restaurant?.name} • {order.createdAt?.split('T')[0]}
          </p>
        </div>
        <span
          className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            isCancelled
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : order.status === 'DELIVERED'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-brand-100 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
          }`}
        >
          {order.status?.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* ── Live Map ── */}
        <div className="lg:col-span-3">
          <Suspense
            fallback={
              <div
                className="rounded-xl flex items-center justify-center"
                style={{ height: '400px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
              >
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              </div>
            }
          >
            <LiveTrackingMap
              deliveryPos={deliveryPos}
              customerPos={customerPos}
              restaurantPos={restaurantPos}
              restaurantName={order.restaurant?.name}
              restaurantAddress={order.restaurant?.address}
              restaurantCity={order.restaurant?.city}
              customerName={order.user?.name || 'You'}
              orderId={order.id}
              connectionStatus={isOutForDelivery ? connectionStatus : 'disconnected'}
              speed={riderSpeed}
              mode="customer"
              height={400}
            />
          </Suspense>

          {/* Map info bar */}
          <div className="flex items-center gap-4 mt-2 px-1">
            {isOutForDelivery && (
              <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {connectionStatus === 'connected' ? (
                  <>
                    <Wifi className="h-3 w-3 text-emerald-500" />
                    <span className="text-emerald-500 font-medium">Live tracking active</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-amber-500" />
                    <span className="text-amber-500 font-medium">
                      {connectionStatus === 'connecting' ? 'Connecting…' : 'Reconnecting…'}
                    </span>
                  </>
                )}
              </div>
            )}
            {lastUpdate && (
              <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-faint)' }}>
                <Clock className="h-3 w-3" />
                Updated {Math.round((Date.now() - lastUpdate) / 1000)}s ago
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status Timeline */}
          <div
            className="rounded-lg border p-4"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Order Status
            </h3>
            {isCancelled ? (
              <div className="flex items-center gap-2 text-red-500">
                <XCircle className="h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">Order Cancelled</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    This order has been cancelled
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {STATUS_STEPS.map((step, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                            isCurrent
                              ? 'bg-brand-500 text-white'
                              : isCompleted
                                ? 'bg-emerald-500 text-white'
                                : 'border'
                          }`}
                          style={
                            !isCompleted && !isCurrent
                              ? { borderColor: 'var(--border-color)', color: 'var(--text-faint)' }
                              : isCurrent
                                ? { boxShadow: '0 0 12px rgba(249,115,22,0.4)' }
                                : {}
                          }
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        {idx < STATUS_STEPS.length - 1 && (
                          <div
                            className="w-0.5 h-6"
                            style={{
                              backgroundColor: isCompleted
                                ? 'var(--color-brand-500, #f97316)'
                                : 'var(--border-color)',
                            }}
                          />
                        )}
                      </div>
                      <div className="pt-1">
                        <p
                          className={`text-xs font-medium ${isCurrent ? 'text-brand-500' : ''}`}
                          style={{
                            color: isCurrent ? undefined : isCompleted ? 'var(--text-primary)' : 'var(--text-faint)',
                          }}
                        >
                          {step.label}
                          {isCurrent && (
                            <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
                          )}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Delivery Partner Info */}
          {order.deliveryPartner && (
            <div
              className="rounded-lg border p-4"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Delivery Partner
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
                  }}
                >
                  {order.deliveryPartner.name?.charAt(0) || '🛵'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {order.deliveryPartner.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Delivery Partner
                    </span>
                    {isOutForDelivery && connectionStatus === 'connected' && (
                      <span className="flex items-center gap-1 text-[9px] text-emerald-500 font-medium">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href={`tel:${order.deliveryPartner.phone || ''}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-transform hover:scale-110"
                  style={{
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
                  }}
                >
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div
            className="rounded-lg border p-4"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Order Summary
            </h3>
            <div className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: 'var(--text-muted)' }}>Restaurant</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {order.restaurant?.name}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: 'var(--text-muted)' }}>Order ID</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                #{order.id}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--text-muted)' }}>Total</span>
              <span className="font-bold text-brand-500">₹{order.totalAmount?.toFixed(2)}</span>
            </div>
          </div>

          {/* Refresh button */}
          <button
            onClick={loadOrder}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
          >
            <RefreshCw className="h-3 w-3" />
            Refresh Order
          </button>
        </div>
      </div>
    </div>
  );
}
