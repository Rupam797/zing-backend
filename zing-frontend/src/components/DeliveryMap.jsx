import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, AlertCircle, Loader2 } from 'lucide-react';

// Cache geocoding results so we don't hammer Nominatim
const geocodeCache = new Map();

async function geocodeAddress(address) {
  if (!address) return null;
  if (geocodeCache.has(address)) return geocodeCache.get(address);

  try {
    const query = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'zing-delivery-app/1.0' },
    });
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

// Dynamically import Leaflet only in browser environment
let L = null;

export default function DeliveryMap({ restaurantName, restaurantAddress, restaurantCity, customerName, orderId }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  const fullAddress = [restaurantAddress, restaurantCity].filter(Boolean).join(', ');

  useEffect(() => {
    let mounted = true;
    let mapInstance = null;

    const initMap = async () => {
      // Dynamically import Leaflet (fixes SSR issues)
      if (!L) {
        L = await import('leaflet');
        // Fix Leaflet's default icon paths broken by bundlers
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
      }

      if (!mapRef.current || !mounted) return;

      // Geocode the restaurant address
      const coords = await geocodeAddress(fullAddress);
      if (!mounted) return;

      if (!coords) {
        setStatus('error');
        return;
      }

      // Approximate customer location: ~1.5km offset from restaurant
      const customerCoords = {
        lat: coords.lat + 0.012,
        lng: coords.lng + 0.009,
      };

      // Destroy previous map instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Create map
      mapInstance = L.map(mapRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: true,
      });
      mapInstanceRef.current = mapInstance;

      // CartoDB Dark Matter — dark monochrome tile style (Swiggy / Zomato look)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(mapInstance);

      // Restaurant marker (red)
      const restaurantIcon = L.divIcon({
        className: '',
        html: `
          <div style="
            background: #ef4444;
            color: white;
            border-radius: 50% 50% 50% 0;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(239,68,68,0.5);
            border: 2px solid white;
          ">
            <span style="transform: rotate(45deg); font-size: 16px;">🍽</span>
          </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -40],
      });

      // Customer marker (green)
      const customerIcon = L.divIcon({
        className: '',
        html: `
          <div style="
            background: #22c55e;
            color: white;
            border-radius: 50% 50% 50% 0;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(34,197,94,0.5);
            border: 2px solid white;
          ">
            <span style="transform: rotate(45deg); font-size: 16px;">🏠</span>
          </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -40],
      });

      // Add markers
      const rMarker = L.marker([coords.lat, coords.lng], { icon: restaurantIcon })
        .addTo(mapInstance)
        .bindPopup(`
          <div style="font-family: sans-serif; min-width: 150px;">
            <p style="font-weight: 700; margin: 0 0 4px; color: #ef4444;">📍 Pickup</p>
            <p style="margin: 0; font-size: 13px;">${restaurantName || 'Restaurant'}</p>
            <p style="margin: 2px 0 0; font-size: 11px; color: #6b7280;">${fullAddress}</p>
          </div>
        `);

      const cMarker = L.marker([customerCoords.lat, customerCoords.lng], { icon: customerIcon })
        .addTo(mapInstance)
        .bindPopup(`
          <div style="font-family: sans-serif; min-width: 150px;">
            <p style="font-weight: 700; margin: 0 0 4px; color: #22c55e;">🏠 Delivery</p>
            <p style="margin: 0; font-size: 13px;">${customerName || 'Customer'}</p>
            <p style="margin: 2px 0 0; font-size: 11px; color: #6b7280;">Order #${orderId}</p>
          </div>
        `);

      // Draw dashed route polyline
      const routeLine = L.polyline(
        [[coords.lat, coords.lng], [customerCoords.lat, customerCoords.lng]],
        {
          color: '#6366f1',
          weight: 3,
          dashArray: '8, 6',
          lineCap: 'round',
          opacity: 0.85,
        }
      ).addTo(mapInstance);

      // Fit both markers in view with padding
      const bounds = L.latLngBounds(
        [[coords.lat, coords.lng], [customerCoords.lat, customerCoords.lng]]
      );
      mapInstance.fitBounds(bounds, { padding: [50, 50] });

      // Open restaurant popup by default
      rMarker.openPopup();

      if (mounted) setStatus('ready');
    };

    initMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [fullAddress, restaurantName, customerName, orderId]);

  return (
    <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
      {/* Map container */}
      <div ref={mapRef} style={{ height: '320px', width: '100%', zIndex: 0 }} />

      {/* Loading overlay */}
      {status === 'loading' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 10 }}
        >
          <Loader2 className="h-7 w-7 animate-spin text-white" />
          <p className="text-xs text-white/80 font-medium">Locating restaurant…</p>
        </div>
      )}

      {/* Error overlay */}
      {status === 'error' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--bg-card)', zIndex: 10 }}
        >
          <AlertCircle className="h-7 w-7 text-red-400" />
          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Could not locate "{fullAddress}"
          </p>
          <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
            Try again later or check the restaurant address.
          </p>
        </div>
      )}

      {/* Legend */}
      {status === 'ready' && (
        <div
          className="absolute bottom-2 left-2 flex items-center gap-3 rounded-lg px-3 py-1.5 text-[10px] font-medium shadow-lg"
          style={{ backgroundColor: 'var(--bg-card)', zIndex: 10, color: 'var(--text-secondary)' }}
        >
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            Pickup
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            Delivery
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-0.5 w-5"
              style={{ background: 'repeating-linear-gradient(90deg, #6366f1 0, #6366f1 6px, transparent 6px, transparent 12px)' }}
            />
            Route
          </span>
        </div>
      )}
    </div>
  );
}
