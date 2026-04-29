import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, AlertCircle, Wifi, WifiOff, Navigation, Clock } from 'lucide-react';

/* ──────────────────────────────────────────────────────────────
   Geocoding cache – avoids hammering Nominatim
   ────────────────────────────────────────────────────────────── */
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

/* ──────────────────────────────────────────────────────────────
   Haversine distance (km)
   ────────────────────────────────────────────────────────────── */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatETA(distKm, speedKmH) {
  const s = speedKmH && speedKmH > 0 ? speedKmH : 20; // default 20 km/h for city delivery
  const mins = Math.round((distKm / s) * 60);
  if (mins < 1) return 'Arriving now';
  if (mins === 1) return '1 min away';
  return `${mins} min away`;
}

/* ──────────────────────────────────────────────────────────────
   Leaflet dynamic import
   ────────────────────────────────────────────────────────────── */
let L = null;

/* ──────────────────────────────────────────────────────────────
   Marker HTML builders (inlined in divIcon for max performance)
   ────────────────────────────────────────────────────────────── */
function createMarkerIcon(emoji, color, glowColor, pulsing = false) {
  const pulseRing = pulsing
    ? `<div style="
        position:absolute; inset:-8px; border-radius:50%;
        background:${glowColor}; opacity:0.3;
        animation:liveTrackPulse 1.8s ease-in-out infinite;
      "></div>`
    : '';

  return {
    className: '',
    html: `
      <div style="position:relative; width:42px; height:42px;">
        ${pulseRing}
        <div style="
          position:relative;
          background:${color};
          color:white;
          border-radius:50% 50% 50% 0;
          width:42px; height:42px;
          display:flex; align-items:center; justify-content:center;
          transform:rotate(-45deg);
          box-shadow:0 4px 14px ${glowColor};
          border:2.5px solid white;
          z-index:2;
        ">
          <span style="transform:rotate(45deg); font-size:18px; line-height:1;">${emoji}</span>
        </div>
      </div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -46],
  };
}

const RIDER_ICON_CONF = createMarkerIcon('🛵', '#8b5cf6', 'rgba(139,92,246,0.55)', true);
const RESTAURANT_ICON_CONF = createMarkerIcon('🍽️', '#ef4444', 'rgba(239,68,68,0.45)');
const CUSTOMER_ICON_CONF = createMarkerIcon('📍', '#22c55e', 'rgba(34,197,94,0.45)');

/* ──────────────────────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────────────────────── */
/**
 * @param {Object} props
 * @param {{ lat:number, lng:number }|null} props.deliveryPos      – rider's live GPS
 * @param {{ lat:number, lng:number }|null} props.customerPos      – customer position (live GPS or geocoded)
 * @param {{ lat:number, lng:number }|null} props.restaurantPos    – restaurant position (geocoded)
 * @param {string} props.restaurantName
 * @param {string} props.restaurantAddress – full address for geocoding fallback
 * @param {string} props.restaurantCity
 * @param {string} props.customerName
 * @param {number} props.orderId
 * @param {string} props.connectionStatus  – 'connected' | 'connecting' | 'disconnected' | 'error'
 * @param {number|null} props.speed        – rider speed m/s
 * @param {string} props.mode             – 'customer' | 'delivery'
 * @param {number} props.height           – map height in px
 */
export default function LiveTrackingMap({
  deliveryPos,
  customerPos,
  restaurantPos: restaurantPosProp,
  restaurantName = 'Restaurant',
  restaurantAddress = '',
  restaurantCity = '',
  customerName = 'Customer',
  orderId,
  connectionStatus = 'disconnected',
  speed = null,
  mode = 'customer',
  height = 400,
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({ rider: null, restaurant: null, customer: null });
  const polylineRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const restaurantGeocoded = useRef(null);

  /* ── Geocode restaurant address if coords not provided ── */
  const getRestaurantCoords = useCallback(async () => {
    if (restaurantPosProp) return restaurantPosProp;
    const fullAddr = [restaurantAddress, restaurantCity].filter(Boolean).join(', ');
    if (!fullAddr) return null;
    const coords = await geocodeAddress(fullAddr);
    if (coords) restaurantGeocoded.current = coords;
    return coords;
  }, [restaurantPosProp, restaurantAddress, restaurantCity]);

  /* ── Init map ── */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!L) {
        L = await import('leaflet');
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
      }

      if (!mapRef.current || !mounted) return;

      // Destroy previous
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      const restCoords = await getRestaurantCoords();
      if (!mounted) return;

      const center = deliveryPos || restCoords || customerPos || { lat: 22.5726, lng: 88.3639 };

      const map = L.map(mapRef.current, {
        center: [center.lat, center.lng],
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: true,
      });
      mapInstance.current = map;

      // Dark CARTO basemap
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      // Add CSS animation for pulse
      if (!document.getElementById('live-track-pulse-css')) {
        const style = document.createElement('style');
        style.id = 'live-track-pulse-css';
        style.textContent = `
          @keyframes liveTrackPulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.6); opacity: 0.08; }
          }
        `;
        document.head.appendChild(style);
      }

      // Restaurant marker
      if (restCoords) {
        const icon = L.divIcon(RESTAURANT_ICON_CONF);
        markersRef.current.restaurant = L.marker([restCoords.lat, restCoords.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:Inter,system-ui,sans-serif;min-width:140px;">
              <p style="font-weight:700;margin:0 0 3px;color:#ef4444;">🍽️ Pickup Point</p>
              <p style="margin:0;font-size:12px;">${restaurantName}</p>
              <p style="margin:2px 0 0;font-size:10px;color:#6b7280;">${restaurantAddress || ''}</p>
            </div>
          `);
      }

      // Customer marker
      if (customerPos) {
        const icon = L.divIcon(CUSTOMER_ICON_CONF);
        markersRef.current.customer = L.marker([customerPos.lat, customerPos.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:Inter,system-ui,sans-serif;min-width:140px;">
              <p style="font-weight:700;margin:0 0 3px;color:#22c55e;">📍 Drop-off</p>
              <p style="margin:0;font-size:12px;">${customerName}</p>
              <p style="margin:2px 0 0;font-size:10px;color:#6b7280;">Order #${orderId || ''}</p>
            </div>
          `);
      }

      // Rider marker
      if (deliveryPos) {
        const icon = L.divIcon(RIDER_ICON_CONF);
        markersRef.current.rider = L.marker([deliveryPos.lat, deliveryPos.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:Inter,system-ui,sans-serif;min-width:140px;">
              <p style="font-weight:700;margin:0 0 3px;color:#8b5cf6;">🛵 Delivery Partner</p>
              <p style="margin:0;font-size:12px;">${mode === 'delivery' ? 'You' : 'On the way'}</p>
            </div>
          `);
      }

      // Route polyline
      updatePolyline(map, restCoords, deliveryPos, customerPos);

      // Fit bounds
      fitMapBounds(map, restCoords, deliveryPos, customerPos);

      if (mounted) setStatus('ready');
    };

    init();

    return () => {
      mounted = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      markersRef.current = { rider: null, restaurant: null, customer: null };
    };
  }, [orderId]); // Only re-init on orderId change

  /* ── Update rider marker position (smooth transition) ── */
  useEffect(() => {
    if (!mapInstance.current || !L) return;
    if (!deliveryPos) return;

    if (markersRef.current.rider) {
      // Smooth animate to new position
      markersRef.current.rider.setLatLng([deliveryPos.lat, deliveryPos.lng]);
    } else {
      const icon = L.divIcon(RIDER_ICON_CONF);
      markersRef.current.rider = L.marker([deliveryPos.lat, deliveryPos.lng], { icon })
        .addTo(mapInstance.current)
        .bindPopup(`
          <div style="font-family:Inter,system-ui,sans-serif;">
            <p style="font-weight:700;margin:0;color:#8b5cf6;">🛵 Delivery Partner</p>
          </div>
        `);
    }

    // Update polyline and bounds
    const restCoords = restaurantPosProp || restaurantGeocoded.current;
    updatePolyline(mapInstance.current, restCoords, deliveryPos, customerPos);

    // Calculate ETA
    if (customerPos && deliveryPos) {
      const dist = haversineKm(deliveryPos.lat, deliveryPos.lng, customerPos.lat, customerPos.lng);
      const speedKmH = speed ? (speed * 3.6) : null;
      setDistance(dist);
      setEta(formatETA(dist, speedKmH));
    }
  }, [deliveryPos?.lat, deliveryPos?.lng]);

  /* ── Update customer marker ── */
  useEffect(() => {
    if (!mapInstance.current || !L || !customerPos) return;

    if (markersRef.current.customer) {
      markersRef.current.customer.setLatLng([customerPos.lat, customerPos.lng]);
    } else {
      const icon = L.divIcon(CUSTOMER_ICON_CONF);
      markersRef.current.customer = L.marker([customerPos.lat, customerPos.lng], { icon })
        .addTo(mapInstance.current)
        .bindPopup(`
          <div style="font-family:Inter,system-ui,sans-serif;">
            <p style="font-weight:700;margin:0;color:#22c55e;">📍 Drop-off</p>
            <p style="margin:0;font-size:12px;">${customerName}</p>
          </div>
        `);
    }
  }, [customerPos?.lat, customerPos?.lng]);

  /* ── Polyline helper ── */
  function updatePolyline(map, restCoords, riderCoords, custCoords) {
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    const points = [];
    if (restCoords) points.push([restCoords.lat, restCoords.lng]);
    if (riderCoords) points.push([riderCoords.lat, riderCoords.lng]);
    if (custCoords) points.push([custCoords.lat, custCoords.lng]);

    if (points.length >= 2) {
      polylineRef.current = L.polyline(points, {
        color: '#8b5cf6',
        weight: 3,
        dashArray: '8, 8',
        lineCap: 'round',
        opacity: 0.8,
      }).addTo(map);
    }
  }

  /* ── Fit bounds helper ── */
  function fitMapBounds(map, restCoords, riderCoords, custCoords) {
    const pts = [];
    if (restCoords) pts.push([restCoords.lat, restCoords.lng]);
    if (riderCoords) pts.push([riderCoords.lat, riderCoords.lng]);
    if (custCoords) pts.push([custCoords.lat, custCoords.lng]);
    if (pts.length >= 2) {
      map.fitBounds(L.latLngBounds(pts), { padding: [50, 50] });
    } else if (pts.length === 1) {
      map.setView(pts[0], 15);
    }
  }

  /* ── Connection status indicator ── */
  const statusColors = {
    connected: { bg: '#22c55e', text: 'Live' },
    connecting: { bg: '#f59e0b', text: 'Connecting…' },
    disconnected: { bg: '#ef4444', text: 'Offline' },
    error: { bg: '#ef4444', text: 'Error' },
  };
  const connInfo = statusColors[connectionStatus] || statusColors.disconnected;

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
      {/* Map container */}
      <div ref={mapRef} style={{ height: `${height}px`, width: '100%', zIndex: 0 }} />

      {/* Loading overlay */}
      {status === 'loading' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10, backdropFilter: 'blur(4px)' }}
        >
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-xs text-white/80 font-medium">Loading map…</p>
        </div>
      )}

      {/* Error overlay */}
      {status === 'error' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--bg-card)', zIndex: 10 }}
        >
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Could not load map
          </p>
        </div>
      )}

      {/* Top-left: Connection status badge */}
      {status === 'ready' && (
        <div
          className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-lg"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)', color: 'white', zIndex: 10, backdropFilter: 'blur(8px)' }}
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{
              backgroundColor: connInfo.bg,
              boxShadow: `0 0 6px ${connInfo.bg}`,
              animation: connectionStatus === 'connected' ? 'liveTrackPulse 2s ease-in-out infinite' : 'none',
            }}
          />
          {connectionStatus === 'connected' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {connInfo.text}
        </div>
      )}

      {/* Top-right: ETA badge */}
      {status === 'ready' && eta && (
        <div
          className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            color: 'white',
            zIndex: 10,
            boxShadow: '0 4px 15px rgba(139,92,246,0.4)',
          }}
        >
          <Clock className="h-3.5 w-3.5" />
          {eta}
        </div>
      )}

      {/* Bottom: Legend bar */}
      {status === 'ready' && (
        <div
          className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-lg px-3 py-2 text-[10px] font-medium shadow-lg"
          style={{
            backgroundColor: 'rgba(0,0,0,0.75)',
            color: 'rgba(255,255,255,0.85)',
            zIndex: 10,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
              Pickup
            </span>
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: '#8b5cf6', boxShadow: '0 0 4px rgba(139,92,246,0.6)' }}
              />
              Rider
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Drop-off
            </span>
          </div>
          {distance !== null && (
            <span className="flex items-center gap-1 text-white/60">
              <Navigation className="h-3 w-3" />
              {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
