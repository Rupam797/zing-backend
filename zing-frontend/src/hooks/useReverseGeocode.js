import { useState, useEffect, useRef } from 'react';

/**
 * Reverse-geocodes lat/lng → human-readable address using Nominatim.
 * Returns { address, city, state, country, fullAddress, loading, error }
 *
 * @param {number|null} lat
 * @param {number|null} lng
 */
export default function useReverseGeocode(lat, lng) {
  const [result, setResult] = useState({
    address: '',
    city: '',
    state: '',
    country: '',
    fullAddress: '',
    loading: false,
    error: null,
  });
  const cacheRef = useRef(new Map());

  useEffect(() => {
    if (!lat || !lng) return;

    // Round to 4 decimals (~11m accuracy) to cache effectively
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;

    if (cacheRef.current.has(key)) {
      setResult({ ...cacheRef.current.get(key), loading: false, error: null });
      return;
    }

    let cancelled = false;
    setResult((prev) => ({ ...prev, loading: true, error: null }));

    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
      { headers: { 'User-Agent': 'zing-delivery-app/1.0' } }
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;

        const a = data.address || {};

        // Build a short, readable address
        const road = a.road || a.pedestrian || a.footway || '';
        const neighbourhood = a.neighbourhood || a.suburb || a.hamlet || '';
        const city =
          a.city || a.town || a.village || a.county || a.state_district || '';
        const state = a.state || '';
        const country = a.country || '';

        // Compose short address: "Road, Neighbourhood" or display_name fallback
        const shortParts = [road, neighbourhood].filter(Boolean);
        const shortAddress = shortParts.length > 0
          ? shortParts.join(', ')
          : data.display_name?.split(',').slice(0, 2).join(',').trim() || '';

        const fullAddress = data.display_name || '';

        const parsed = { address: shortAddress, city, state, country, fullAddress };

        cacheRef.current.set(key, parsed);
        setResult({ ...parsed, loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setResult((prev) => ({
          ...prev,
          loading: false,
          error: 'Failed to detect address',
        }));
      });

    return () => { cancelled = true; };
  }, [lat, lng]);

  return result;
}
