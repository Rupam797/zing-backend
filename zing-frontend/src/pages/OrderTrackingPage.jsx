import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Package, MapPin, Clock, ChefHat, Truck, CheckCircle, XCircle, ArrowLeft, Phone,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const restaurantIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});
const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const STATUS_STEPS = [
  { key: 'PLACED',           icon: Package,      label: 'Order Placed',       desc: 'Your order has been received' },
  { key: 'ACCEPTED',         icon: CheckCircle,  label: 'Accepted',           desc: 'Restaurant confirmed your order' },
  { key: 'PREPARING',        icon: ChefHat,      label: 'Preparing',          desc: 'Your food is being cooked' },
  { key: 'OUT_FOR_DELIVERY', icon: Truck,        label: 'Out for Delivery',   desc: 'Delivery partner is on the way' },
  { key: 'DELIVERED',        icon: CheckCircle,  label: 'Delivered',          desc: 'Enjoy your meal!' },
];

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deliveryPos, setDeliveryPos] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadOrder();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [id]);

  const loadOrder = async () => {
    try {
      const res = await api.get(`/orders/my/${id}`);
      setOrder(res.data);

      // Simulate delivery movement for OUT_FOR_DELIVERY
      if (res.data.status === 'OUT_FOR_DELIVERY') {
        startDeliverySimulation();
      }
    } catch {
      toast.error('Order not found');
    } finally {
      setLoading(false);
    }
  };

  // Simulated positions (Kolkata area as example)
  const restaurantPos = [22.5726, 88.3639];
  const userPos = [22.5826, 88.3539];

  const startDeliverySimulation = () => {
    let progress = 0;
    const startLat = restaurantPos[0];
    const startLng = restaurantPos[1];
    const endLat = userPos[0];
    const endLng = userPos[1];

    setDeliveryPos([startLat, startLng]);

    intervalRef.current = setInterval(() => {
      progress += 0.02;
      if (progress >= 1) {
        progress = 0; // loop
      }
      const lat = startLat + (endLat - startLat) * progress;
      const lng = startLng + (endLng - startLng) * progress;
      setDeliveryPos([lat, lng]);
    }, 500);
  };

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
        <Link to="/orders" className="flex h-8 w-8 items-center justify-center rounded-md border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Order #{order.id}</h1>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {order.restaurant?.name} • {order.createdAt?.split('T')[0]}
          </p>
        </div>
        <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          isCancelled ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          : order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-brand-100 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
        }`}>
          {order.status?.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Map */}
        <div className="lg:col-span-3">
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-color)', height: '380px' }}>
            <MapContainer
              center={[22.5776, 88.3589]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>'
                subdomains="abcd"
                maxZoom={20}
              />
              {/* Restaurant marker */}
              <Marker position={restaurantPos} icon={restaurantIcon}>
                <Popup>
                  <strong>🏪 {order.restaurant?.name || 'Restaurant'}</strong>
                  <br />Preparing your food
                </Popup>
              </Marker>
              {/* User marker */}
              <Marker position={userPos} icon={userIcon}>
                <Popup>
                  <strong>📍 Delivery Location</strong>
                  <br />Your address
                </Popup>
              </Marker>
              {/* Delivery partner marker (moving) */}
              {deliveryPos && order.status === 'OUT_FOR_DELIVERY' && (
                <Marker position={deliveryPos} icon={deliveryIcon}>
                  <Popup>
                    <strong>🛵 Delivery Partner</strong>
                    <br />{order.deliveryPartner?.name || 'On the way!'}
                  </Popup>
                </Marker>
              )}
              {/* Route line */}
              <Polyline
                positions={[restaurantPos, userPos]}
                pathOptions={{ color: '#f97316', weight: 3, dashArray: '10 6' }}
              />
            </MapContainer>
          </div>

          {/* Map Legend */}
          <div className="flex items-center gap-4 mt-2 px-1">
            <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" /> Restaurant
            </div>
            <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" /> You
            </div>
            {order.status === 'OUT_FOR_DELIVERY' && (
              <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" /> Delivery Partner
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status Timeline */}
          <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Order Status</h3>
            {isCancelled ? (
              <div className="flex items-center gap-2 text-red-500">
                <XCircle className="h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">Order Cancelled</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>This order has been cancelled</p>
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
                      {/* Timeline line + dot */}
                      <div className="flex flex-col items-center">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                          isCurrent ? 'bg-brand-500 text-white' : isCompleted ? 'bg-emerald-500 text-white' : 'border'
                        }`} style={!isCompleted && !isCurrent ? { borderColor: 'var(--border-color)', color: 'var(--text-faint)' } : {}}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        {idx < STATUS_STEPS.length - 1 && (
                          <div className="w-0.5 h-6" style={{ backgroundColor: isCompleted ? 'var(--color-brand-500, #f97316)' : 'var(--border-color)' }} />
                        )}
                      </div>
                      {/* Text */}
                      <div className="pt-1">
                        <p className={`text-xs font-medium ${isCurrent ? 'text-brand-500' : ''}`}
                          style={{ color: isCurrent ? undefined : isCompleted ? 'var(--text-primary)' : 'var(--text-faint)' }}>
                          {step.label}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Delivery Partner Info */}
          {order.deliveryPartner && (
            <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Delivery Partner</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-sm font-bold">
                  {order.deliveryPartner.name?.charAt(0) || '🛵'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{order.deliveryPartner.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Delivery Partner</p>
                </div>
                <a href={`tel:${order.deliveryPartner.phone || ''}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white">
                  <Phone className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Order Summary</h3>
            <div className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: 'var(--text-muted)' }}>Restaurant</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{order.restaurant?.name}</span>
            </div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: 'var(--text-muted)' }}>Order ID</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>#{order.id}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--text-muted)' }}>Total</span>
              <span className="font-bold text-brand-500">₹{order.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
