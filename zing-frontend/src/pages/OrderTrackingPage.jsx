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

const STATUS_TOAST_MSG = {
  ACCEPTED: '✅ Restaurant accepted your order!',
  PREPARING: '👨‍🍳 Your food is being prepared!',
  OUT_FOR_DELIVERY: '🚀 Your order is on its way!',
  DELIVERED: '🎉 Your order has been delivered!',
  CANCELLED: '❌ Your order was cancelled.',
};

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

  // ── WebSocket: always connect for active orders ──
  const isActive = order && !['DELIVERED', 'CANCELLED'].includes(order.status);
  const isOutForDelivery = order?.status === 'OUT_FOR_DELIVERY';
  const { connectionStatus, subscribe } = useStompClient({ enabled: !!isActive });

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
          // No saved location yet
        }
      }
    } catch {
      toast.error('Order not found');
    } finally {
      setLoading(false);
    }
  };

  /* ── Subscribe to instant order status updates via WebSocket ── */
  useEffect(() => {
    if (!isActive) return;

    const unsub = subscribe(`/topic/order-status/${id}`, (data) => {
      if (data.status) {
        // Show toast notification for the status change
        const msg = STATUS_TOAST_MSG[data.status];
        if (msg) {
          if (data.status === 'CANCELLED') {
            toast.error(msg);
          } else {
            toast.success(msg);
          }
        }

        // Update order status locally for instant UI feedback
        setOrder((prev) => prev ? { ...prev, status: data.status } : prev);

        // Full reload for complete data (partner info, etc.)
        loadOrder();
      }
    });

    return () => unsub();
  }, [isActive, id, subscribe]);

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

  /* ── Fallback: auto-refresh order status every 30s ── */
  useEffect(() => {
    if (!order || order.status === 'DELIVERED' || order.status === 'CANCELLED') return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/orders/my/${id}`);
        setOrder(res.data);
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [order?.status, id]);

  const currentStepIndex = order ? STATUS_STEPS.findIndex((s) => s.key === order.status) : -1;
  const isCancelled = order?.status === 'CANCELLED';

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#fdfae9] text-[#1c1c12] pt-24 pb-20 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="w-full min-h-screen bg-[#fdfae9] text-[#1c1c12] pt-24 pb-20 px-4 md:px-16 flex flex-col items-center justify-center">
        <div className="max-w-md w-full p-12 text-center bg-white border-4 border-[#e6e3d2] rounded-[32px] shadow-xl">
          <p className="text-sm font-label-caps uppercase tracking-wider text-[#5b4040]">Order not found</p>
          <Link to="/orders" className="mt-4 inline-block rounded-full bg-brand-500 text-white px-8 py-3.5 font-label-caps text-xs tracking-wider uppercase hover:brightness-110 shadow-lg">← Back to orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#fdfae9] text-[#1c1c12] pt-24 pb-20 px-4 md:px-16 page-enter">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 border-b border-[#e6e3d2] pb-6 flex-wrap">
          <Link
            to="/orders"
            className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#e6e3d2] bg-white text-[#5b4040] hover:text-brand-500 transition-colors shadow-md shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-[150px]">
            <h1 className="font-display-hero text-2xl md:text-3xl text-[#1c1c12] uppercase tracking-tight">
              Order #{order.id}
            </h1>
            <p className="text-xs font-label-caps uppercase tracking-wider text-[#5b4040] truncate">
              {order.restaurant?.name} • {order.createdAt?.split('T')[0]}
            </p>
          </div>
          <span
            className={`sm:ml-auto text-xs font-label-caps uppercase tracking-wider px-4 py-2 rounded-lg shadow-sm ${
              isCancelled
                ? 'bg-red-100 text-red-800 border-2 border-red-200'
                : order.status === 'DELIVERED'
                  ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-200'
                  : 'bg-brand-100 text-brand-800 border-2 border-brand-200'
            }`}
          >
            {order.status?.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* ── Live Map ── */}
          <div className="lg:col-span-3">
            <div className="border-4 border-[#e6e3d2] rounded-[32px] overflow-hidden bg-white shadow-xl relative" style={{ height: '450px' }}>
              <Suspense
                fallback={
                  <div className="absolute inset-0 flex items-center justify-center bg-[#f1eedd]/50">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
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
                  height={442}
                />
              </Suspense>
            </div>

            {/* Map info bar */}
            <div className="flex items-center gap-4 mt-4 px-2">
              {isActive && (
                <div className="flex items-center gap-1.5 text-xs font-label-caps uppercase tracking-wider">
                  {connectionStatus === 'connected' ? (
                    <>
                      <Wifi className="h-4 w-4 text-emerald-500" />
                      <span className="text-emerald-500">Live updates active</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-amber-500 text-stroke-primary" />
                      <span className="text-amber-500">
                        {connectionStatus === 'connecting' ? 'Connecting…' : 'Reconnecting…'}
                      </span>
                    </>
                  )}
                </div>
              )}
              {lastUpdate && (
                <div className="flex items-center gap-1.5 text-xs font-label-caps uppercase tracking-wider text-[#5b4040] ml-auto">
                  <Clock className="h-4 w-4" />
                  Updated {Math.round((Date.now() - lastUpdate) / 1000)}s ago
                </div>
              )}
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Timeline */}
            <div className="border-4 border-[#e6e3d2] rounded-[32px] p-6 bg-white shadow-xl">
              <h3 className="font-headline-lg text-lg uppercase mb-4 text-[#1c1c12]">Order Status</h3>
              {isCancelled ? (
                <div className="flex items-center gap-3 text-red-500 bg-red-50 p-4 rounded-2xl border-2 border-red-200">
                  <XCircle className="h-6 w-6" />
                  <div>
                    <p className="text-sm font-headline-md uppercase">Order Cancelled</p>
                    <p className="text-[10px] font-label-caps uppercase tracking-wider text-[#5b4040]">This order has been cancelled</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="flex gap-4 items-start">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                              isCurrent
                                ? 'bg-brand-500 border-brand-500 text-white shadow-lg scale-110'
                                : isCompleted
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-[#e6e3d2] bg-white text-[#5b4040]/50'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          {idx < STATUS_STEPS.length - 1 && (
                            <div
                              className="w-1 h-8 mt-1 -mb-1"
                              style={{
                                backgroundColor: isCompleted
                                  ? 'var(--color-brand-500, #c41e3a)'
                                  : '#e6e3d2',
                              }}
                            />
                          )}
                        </div>
                        <div className="pt-1 flex-1">
                          <p
                            className={`text-xs font-label-caps uppercase tracking-wider ${isCurrent ? 'text-brand-500 font-bold' : isCompleted ? 'text-[#1c1c12]' : 'text-[#5b4040]/55'}`}
                          >
                            {step.label}
                            {isCurrent && (
                              <span className="ml-2 inline-block h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                            )}
                          </p>
                          <p className="text-[10px] font-body-md uppercase text-[#5b4040] opacity-80 mt-0.5">
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
              <div className="border-4 border-[#e6e3d2] rounded-[32px] p-6 bg-white shadow-xl">
                <h3 className="font-headline-lg text-lg uppercase mb-4 text-[#1c1c12]">Delivery Partner</h3>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full text-base font-headline-md bg-brand-500 text-white shadow-md border-2 border-white">
                    {order.deliveryPartner.name ? (
                      order.deliveryPartner.name.charAt(0).toUpperCase()
                    ) : (
                      <Truck className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-headline-md text-sm text-[#1c1c12] uppercase truncate">
                      {order.deliveryPartner.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-label-caps uppercase tracking-wider text-[#5b4040]">
                        Courier agent
                      </span>
                      {isOutForDelivery && connectionStatus === 'connected' && (
                        <span className="flex items-center gap-1 text-[9px] font-label-caps uppercase tracking-wider text-emerald-500 font-medium">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live map
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={`tel:${order.deliveryPartner.phone || ''}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white bg-emerald-500 hover:brightness-110 shadow-lg shrink-0 transition-transform hover:scale-105"
                  >
                    <Phone className="h-4.5 w-4.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="border-4 border-[#e6e3d2] rounded-[32px] p-6 bg-white shadow-xl">
              <h3 className="font-headline-lg text-lg uppercase mb-4 text-[#1c1c12]">Order Summary</h3>
              <div className="space-y-2 text-xs font-label-caps tracking-wider uppercase text-[#5b4040]">
                <div className="flex justify-between">
                  <span>Restaurant</span>
                  <span className="text-[#1c1c12] font-headline-md">{order.restaurant?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Order ID</span>
                  <span className="text-[#1c1c12] font-headline-md">#{order.id}</span>
                </div>
                <div className="flex justify-between items-end pt-2 border-t border-[#e6e3d2]">
                  <span>Total Amount</span>
                  <span className="text-brand-500 font-headline-md text-sm">₹{order.totalAmount?.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Refresh button */}
            <button
              onClick={loadOrder}
              className="w-full flex items-center justify-center gap-2 rounded-full border-4 border-[#e6e3d2] bg-white py-3.5 text-xs font-label-caps uppercase tracking-wider text-[#1c1c12] shadow-md hover:bg-[#f7f4e3] transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Tracking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
