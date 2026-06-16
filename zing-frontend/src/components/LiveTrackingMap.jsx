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
   Haversine distance (km) — used as fallback
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

function formatDuration(seconds) {
  const mins = Math.round(seconds / 60);
  if (mins < 1) return 'Arriving now';
  if (mins === 1) return '1 min away';
  return `${mins} min away`;
}

/* ──────────────────────────────────────────────────────────────
   OSRM Route Fetching with cache + debounce
   ────────────────────────────────────────────────────────────── */
const osrmCache = new Map();
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

function osrmCacheKey(coords) {
  // Round to 4 decimals (~11m precision) for effective caching
  return coords.map((c) => `${c.lng.toFixed(4)},${c.lat.toFixed(4)}`).join(';');
}

async function fetchOSRMRoute(waypoints) {
  if (waypoints.length < 2) return null;

  const key = osrmCacheKey(waypoints);
  if (osrmCache.has(key)) return osrmCache.get(key);

  try {
    const coordStr = waypoints.map((c) => `${c.lng},${c.lat}`).join(';');
    const url = `${OSRM_BASE}/${coordStr}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;

    const route = data.routes[0];
    const result = {
      geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]), // Leaflet uses [lat, lng]
      distance: route.distance / 1000, // meters → km
      duration: route.duration,         // seconds
      steps: route.legs.flatMap((leg) =>
        leg.steps.map((step) => ({
          instruction: step.maneuver?.type || '',
          modifier: step.maneuver?.modifier || '',
          name: step.name || '',
          distance: step.distance,
          duration: step.duration,
        }))
      ),
    };
    osrmCache.set(key, result);
    return result;
  } catch {
    return null;
  }
}

/* ──────────────────────────────────────────────────────────────
   Leaflet dynamic import
   ────────────────────────────────────────────────────────────── */
let L = null;

/* ──────────────────────────────────────────────────────────────
   Marker HTML builders (inlined in divIcon for max performance)
   ────────────────────────────────────────────────────────────── */
function createMarkerIcon(svgContent, color, glowColor, pulsing = false) {
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
          <span style="transform:rotate(45deg); display:flex; align-items:center; justify-content:center; width:20px; height:20px;">${svgContent}</span>
        </div>
      </div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -46],
  };
}

const RIDER_ICON_CONF = createMarkerIcon(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>`,
  '#8b5cf6',
  'rgba(139,92,246,0.55)',
  true
);
const RESTAURANT_ICON_CONF = createMarkerIcon(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>`,
  '#ef4444',
  'rgba(239,68,68,0.45)'
);
const CUSTOMER_ICON_CONF = createMarkerIcon(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
  '#22c55e',
  'rgba(34,197,94,0.45)'
);

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
  const routeLinesRef = useRef({ toRider: null, toCustomer: null, fallback: null });
  const [status, setStatus] = useState('loading');
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [routeSource, setRouteSource] = useState(null); // 'osrm' | 'straight'
  const restaurantGeocoded = useRef(null);
  const lastRouteReqTime = useRef(0);

  /* ── Geocode restaurant address if coords not provided ── */
  const getRestaurantCoords = useCallback(async () => {
    if (restaurantPosProp) return restaurantPosProp;
    const fullAddr = [restaurantAddress, restaurantCity].filter(Boolean).join(', ');
    if (!fullAddr) return null;
    const coords = await geocodeAddress(fullAddr);
    if (coords) restaurantGeocoded.current = coords;
    return coords;
  }, [restaurantPosProp, restaurantAddress, restaurantCity]);

  /* ── Remove all route lines from map ── */
  function clearRouteLines(map) {
    Object.keys(routeLinesRef.current).forEach((key) => {
      if (routeLinesRef.current[key]) {
        map.removeLayer(routeLinesRef.current[key]);
        routeLinesRef.current[key] = null;
      }
    });
  }

  /* ── Draw OSRM road routes or fall back to straight lines ── */
  async function updateRoutes(map, restCoords, riderCoords, custCoords) {
    clearRouteLines(map);
    if (!L) return;

    // Debounce: at most 1 OSRM request per 5 seconds
    const now = Date.now();
    const timeSinceLast = now - lastRouteReqTime.current;
    const shouldFetchOSRM = timeSinceLast >= 5000;

    let usedOSRM = false;

    if (shouldFetchOSRM) {
      lastRouteReqTime.current = now;

      // Segment 1: Restaurant → Rider (completed leg)
      if (restCoords && riderCoords) {
        const route = await fetchOSRMRoute([restCoords, riderCoords]);
        if (route?.geometry?.length >= 2) {
          routeLinesRef.current.toRider = L.polyline(route.geometry, {
            color: '#8b5cf6',
            weight: 5,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round',
            className: 'route-glow',
          }).addTo(map);
          usedOSRM = true;
        }
      }

      // Segment 2: Rider → Customer (remaining leg)
      if (riderCoords && custCoords) {
        const route = await fetchOSRMRoute([riderCoords, custCoords]);
        if (route?.geometry?.length >= 2) {
          routeLinesRef.current.toCustomer = L.polyline(route.geometry, {
            color: '#8b5cf6',
            weight: 4,
            dashArray: '10, 8',
            opacity: 0.7,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(map);
          usedOSRM = true;

          // Use OSRM distance + duration for ETA
          setDistance(route.distance);
          setEta(formatDuration(route.duration));
          setRouteSource('osrm');
        }
      } else if (restCoords && custCoords && !riderCoords) {
        // No rider yet — show full route Restaurant → Customer
        const route = await fetchOSRMRoute([restCoords, custCoords]);
        if (route?.geometry?.length >= 2) {
          routeLinesRef.current.toCustomer = L.polyline(route.geometry, {
            color: '#8b5cf6',
            weight: 4,
            dashArray: '10, 8',
            opacity: 0.6,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(map);
          usedOSRM = true;
          setDistance(route.distance);
          setRouteSource('osrm');
        }
      }
    }

    // Fallback: straight-line polylines if OSRM didn't work
    if (!usedOSRM) {
      const points = [];
      if (restCoords) points.push([restCoords.lat, restCoords.lng]);
      if (riderCoords) points.push([riderCoords.lat, riderCoords.lng]);
      if (custCoords) points.push([custCoords.lat, custCoords.lng]);

      if (points.length >= 2) {
        routeLinesRef.current.fallback = L.polyline(points, {
          color: '#8b5cf6',
          weight: 3,
          dashArray: '8, 8',
          lineCap: 'round',
          opacity: 0.8,
        }).addTo(map);
      }

      // Haversine ETA fallback
      if (riderCoords && custCoords) {
        const dist = haversineKm(riderCoords.lat, riderCoords.lng, custCoords.lat, custCoords.lng);
        const speedKmH = speed ? (speed * 3.6) : null;
        setDistance(dist);
        setEta(formatETA(dist, speedKmH));
        setRouteSource('straight');
      }
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

      const center = deliveryPos || restCoords || customerPos || { lat: 12.9716, lng: 77.5946 };

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
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      // Add CSS animations for pulse and route glow
      if (!document.getElementById('live-track-css')) {
        const style = document.createElement('style');
        style.id = 'live-track-css';
        style.textContent = `
          @keyframes liveTrackPulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.6); opacity: 0.08; }
          }
          .route-glow {
            filter: drop-shadow(0 0 6px rgba(139, 92, 246, 0.5));
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
              <p style="font-weight:700;margin:0 0 3px;color:#ef4444;">Pickup Point</p>
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
              <p style="font-weight:700;margin:0 0 3px;color:#22c55e;">Drop-off</p>
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
              <p style="font-weight:700;margin:0 0 3px;color:#8b5cf6;">Delivery Partner</p>
              <p style="margin:0;font-size:12px;">${mode === 'delivery' ? 'You' : 'On the way'}</p>
            </div>
          `);
      }

      // Draw OSRM road routes
      await updateRoutes(map, restCoords, deliveryPos, customerPos);

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
      routeLinesRef.current = { toRider: null, toCustomer: null, fallback: null };
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
            <p style="font-weight:700;margin:0;color:#8b5cf6;">Delivery Partner</p>
          </div>
        `);
    }

    // Update route with OSRM
    const restCoords = restaurantPosProp || restaurantGeocoded.current;
    updateRoutes(mapInstance.current, restCoords, deliveryPos, customerPos);
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
            <p style="font-weight:700;margin:0;color:#22c55e;">Drop-off</p>
            <p style="margin:0;font-size:12px;">${customerName}</p>
          </div>
        `);
    }
  }, [customerPos?.lat, customerPos?.lng]);

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
          <div className="flex items-center gap-2.5">
            {distance !== null && (
              <span className="flex items-center gap-1 text-white/60">
                <Navigation className="h-3 w-3" />
                {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
              </span>
            )}
            {routeSource && (
              <span className="text-white/30 text-[8px] uppercase tracking-wider">
                {routeSource === 'osrm' ? '• Road route' : '• Straight line'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
