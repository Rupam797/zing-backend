import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for real-time GPS tracking using the browser Geolocation API.
 * Returns the user's current position, accuracy, heading, speed, and error state.
 * 
 * @param {Object} options
 * @param {boolean} options.enabled - Whether to actively track (default: true)
 * @param {boolean} options.highAccuracy - Use GPS for high accuracy (default: true)
 * @param {number} options.maxAge - Max cached position age in ms (default: 5000)
 * @param {number} options.timeout - Timeout per position request in ms (default: 15000)
 */
export default function useGeolocation({
  enabled = true,
  highAccuracy = true,
  maxAge = 5000,
  timeout = 15000,
} = {}) {
  const [position, setPosition] = useState({
    lat: null,
    lng: null,
    accuracy: null,
    heading: null,
    speed: null,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const watchIdRef = useRef(null);

  const handleSuccess = useCallback((pos) => {
    setPosition({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
    });
    setError(null);
    setLoading(false);
  }, []);

  const handleError = useCallback((err) => {
    let message;
    switch (err.code) {
      case err.PERMISSION_DENIED:
        message = 'Location permission denied. Please enable location access in your browser settings.';
        break;
      case err.POSITION_UNAVAILABLE:
        message = 'Location information is unavailable. Please check your GPS settings.';
        break;
      case err.TIMEOUT:
        message = 'Location request timed out. Retrying…';
        break;
      default:
        message = 'An unknown error occurred while getting your location.';
    }
    setError(message);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    setLoading(true);

    // Get initial position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: highAccuracy,
      maximumAge: maxAge,
      timeout,
    });

    // Watch for position changes
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: highAccuracy,
        maximumAge: maxAge,
        timeout,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, highAccuracy, maxAge, timeout, handleSuccess, handleError]);

  return { ...position, error, loading };
}
