import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowLeft, MapPin, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { imageUrl } from '../api/upload';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const DELIVERY_FEE = 30;
const PLATFORM_FEE = 5;

export default function CartPage() {
  const { items, total, restaurantId, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [placing, setPlacing] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  // Address states
  const [houseNo, setHouseNo] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [cityStatePin, setCityStatePin] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.deliveryLat) setLat(user.deliveryLat);
      if (user.deliveryLng) setLng(user.deliveryLng);

      if (user.deliveryAddress) {
        try {
          const parsed = JSON.parse(user.deliveryAddress);
          if (parsed && typeof parsed === 'object') {
            setHouseNo(parsed.houseNo || '');
            setBuildingName(parsed.buildingName || '');
            setStreet(parsed.street || '');
            setArea(parsed.area || '');
            setCityStatePin(parsed.cityStatePin || '');
            setIsEditing(false);
            return;
          }
        } catch (e) {
          // Plain text fallback
          setStreet(user.deliveryAddress);
          setHouseNo('');
          setBuildingName('');
          setArea('');
          setCityStatePin('');
          setIsEditing(false);
          return;
        }
      }
      setIsEditing(true);
    }
  }, [user]);

  const getFullAddressString = () => {
    const parts = [
      houseNo ? `Flat/House ${houseNo}` : '',
      buildingName,
      street,
      area,
      cityStatePin
    ].filter(Boolean);
    return parts.join(', ');
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLoadingLocation(true);

    const successCallback = async (position) => {
      const { latitude, longitude } = position.coords;
      setLat(latitude);
      setLng(longitude);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=18`,
          { headers: { 'User-Agent': 'zing-delivery-app/1.0' } }
        );
        const data = await response.json();
        const a = data.address || {};

        const house = a.house_number || a.house_name || '';
        setHouseNo(house);

        const bldg = a.building || a.apartment || a.residential || '';
        setBuildingName(bldg);

        const road = a.road || a.pedestrian || a.footway || a.path || '';
        setStreet(road);

        const areaName = a.neighbourhood || a.suburb || a.city_district || a.village || '';
        setArea(areaName);

        const city = a.city || a.town || a.county || '';
        const state = a.state || '';
        const postcode = a.postcode || '';
        const cityParts = [city, state, postcode].filter(Boolean);
        setCityStatePin(cityParts.join(', '));

        toast.success('Location detected! 📍');
      } catch (err) {
        console.error(err);
        toast.error('Failed to resolve address details');
      } finally {
        setLoadingLocation(false);
      }
    };

    const finalErrorCallback = (error) => {
      console.error('Geolocation final error:', error);
      if (error.code === error.PERMISSION_DENIED) {
        toast.toast ? toast.toast : toast.error('Location permission denied. Please allow location access in your browser settings.');
      } else if (error.code === error.TIMEOUT) {
        toast.error('Location request timed out. Please enter address manually.');
      } else {
        toast.error('Unable to retrieve location. Please check system settings or enter manually.');
      }
      setLoadingLocation(false);
    };

    // Try high accuracy first (5s timeout), fallback to low accuracy (10s timeout)
    navigator.geolocation.getCurrentPosition(
      successCallback,
      (error) => {
        console.warn('High accuracy geolocation failed, trying low accuracy fallback...', error);
        navigator.geolocation.getCurrentPosition(
          successCallback,
          finalErrorCallback,
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 10000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const discount = couponApplied ? Math.round(total * 0.1) : 0;
  const grandTotal = total + DELIVERY_FEE + PLATFORM_FEE - discount;

  const applyCoupon = () => {
    if (coupon.toUpperCase() === 'ZING10') {
      setCouponApplied(true);
      toast.success('Coupon applied! 10% off 🎉');
    } else {
      toast.error('Invalid coupon code');
    }
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    const fullAddress = getFullAddressString();
    if (!fullAddress.trim()) {
      toast.error('Please enter a delivery address');
      setIsEditing(true);
      return;
    }

    setPlacing(true);
    try {
      // 1. Save address coordinates and structured text to profile
      const addressPayload = {
        houseNo,
        buildingName,
        street,
        area,
        cityStatePin
      };
      await api.put('/users/me/address', {
        deliveryAddress: JSON.stringify(addressPayload),
        deliveryLat: lat,
        deliveryLng: lng
      });

      // 2. Place order with coordinates and full address
      await api.post('/orders', {
        restaurantId,
        items: items.map(({ menuItem, quantity }) => ({ menuItemId: menuItem.id, quantity })),
        deliveryAddress: fullAddress,
        customerLat: lat,
        customerLng: lng
      });

      toast.success('Order placed! 🎉');
      clearCart();
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="w-full min-h-screen bg-[#fdfae9] text-[#1c1c12] pt-24 pb-20 px-4 md:px-16 flex flex-col items-center justify-center">
        <div className="max-w-md w-full p-12 text-center bg-white border-4 border-[#e6e3d2] rounded-[32px] shadow-xl page-enter">
          <span className="material-symbols-outlined text-brand-500 text-6xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
          <h2 className="font-headline-lg text-2xl text-[#1c1c12] uppercase mb-2">Your cart is empty</h2>
          <p className="text-sm font-body-lg text-[#5b4040] uppercase tracking-wide mb-8">Browse restaurants and add some delicious items</p>
          <button onClick={() => navigate('/restaurants')}
            className="rounded-full bg-brand-500 text-white px-8 py-3.5 font-label-caps text-xs tracking-wider uppercase hover:brightness-110 shadow-lg flex items-center justify-center gap-2 mx-auto transition-transform hover:scale-105">
            <ArrowLeft className="h-4 w-4" /> Browse Restaurants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#fdfae9] text-[#1c1c12] pt-24 pb-20 px-4 md:px-16 page-enter">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8 border-b border-[#e6e3d2] pb-6">
          <span className="material-symbols-outlined text-brand-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_bag</span>
          <h1 className="font-headline-lg text-3xl text-[#1c1c12] uppercase italic">Your Cart</h1>
        </div>

        {/* Items */}
        <div className="space-y-4 mb-8">
          {items.map(({ menuItem, quantity }) => {
            const img = imageUrl(menuItem.imageUrl) || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80";
            return (
              <div key={menuItem.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-[24px] border-4 border-[#e6e3d2] hover:border-brand-500 bg-white p-4 transition-all duration-300 shadow-md">
                
                {/* Upper row on mobile / Left column on desktop */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Thumbnail */}
                  <div className="h-16 w-16 shrink-0 rounded-2xl overflow-hidden border-2 border-[#e6e3d2] bg-[#f1eedd] flex items-center justify-center">
                    <img src={img} alt={menuItem.name} className="h-full w-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-headline-md text-sm text-[#1c1c12] uppercase truncate mb-1">{menuItem.name}</h4>
                    <p className="text-xs font-headline-md text-brand-500">₹{menuItem.price?.toFixed(0)}</p>
                  </div>

                  {/* Delete button (mobile only) */}
                  <button onClick={() => removeItem(menuItem.id)}
                    className="sm:hidden flex h-9 w-9 items-center justify-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border-2 border-transparent hover:border-red-200 transition-all shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Lower row on mobile / Right column on desktop */}
                <div className="flex items-center justify-between sm:justify-start gap-4 pt-3 sm:pt-0 border-t border-dashed border-[#e6e3d2] sm:border-0">
                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 rounded-xl border-2 border-[#e6e3d2] p-1 bg-[#f1eedd]/20">
                    <button onClick={() => updateQuantity(menuItem.id, quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-brand-500 hover:text-white text-[#5b4040]">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-[#1c1c12]">{quantity}</span>
                    <button onClick={() => updateQuantity(menuItem.id, quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-brand-500 hover:text-white text-[#5b4040]">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="w-20 text-right text-xs font-headline-md text-[#1c1c12] shrink-0 font-bold">
                    ₹{(menuItem.price * quantity).toFixed(0)}
                  </div>

                  {/* Delete button (desktop only) */}
                  <button onClick={() => removeItem(menuItem.id)}
                    className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border-2 border-transparent hover:border-red-200 transition-all shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Delivery Address */}
        <div className="mb-6 border-4 border-[#e6e3d2] rounded-[28px] p-6 bg-white shadow-md">
          <div className="flex items-center justify-between mb-4 border-b border-dashed border-[#e6e3d2] pb-3">
            <label className="flex items-center gap-2 text-xs font-label-caps uppercase tracking-wider text-[#1c1c12]">
              <MapPin className="h-4.5 w-4.5 text-brand-500" /> Delivery Address
            </label>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs font-label-caps text-brand-500 hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">edit</span> Change
              </button>
            )}
          </div>

          {!isEditing ? (
            <div className="space-y-2">
              <div className="p-4 bg-[#fdfae9] rounded-2xl border-2 border-dashed border-brand-500/30">
                <p className="text-xs font-bold text-[#1c1c12] uppercase tracking-wide mb-1">Delivering to:</p>
                <p className="text-sm font-semibold text-[#5b4040] leading-relaxed">
                  {getFullAddressString()}
                </p>
                {lat && lng && (
                  <p className="text-[10px] text-brand-500 font-mono mt-2 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
                    GPS: {lat.toFixed(5)}, {lng.toFixed(5)} (Stored)
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#fdfae9] p-3 rounded-2xl border-2 border-[#e6e3d2]">
                <span className="text-xs text-[#5b4040] font-medium">Auto-fill via GPS location:</span>
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={loadingLocation}
                  className="flex items-center gap-2 rounded-xl bg-brand-500 text-white px-4 py-2 text-xs font-label-caps uppercase tracking-wider hover:brightness-110 disabled:opacity-50 transition-all shadow-sm"
                >
                  {loadingLocation ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                      Locating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">my_location</span>
                      Locate Me
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-label-caps uppercase tracking-wider text-[#5b4040] mb-1.5">
                    House / Flat / Plot No. & Floor
                  </label>
                  <input
                    type="text"
                    value={houseNo}
                    onChange={(e) => setHouseNo(e.target.value)}
                    placeholder="e.g. Flat 302, 3rd Floor"
                    className="w-full rounded-2xl border-4 border-[#e6e3d2] focus:border-brand-500 bg-white px-4 py-3 text-xs outline-none transition-all text-[#1c1c12]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-label-caps uppercase tracking-wider text-[#5b4040] mb-1.5">
                    Building / Apartment / Builder Name
                  </label>
                  <input
                    type="text"
                    value={buildingName}
                    onChange={(e) => setBuildingName(e.target.value)}
                    placeholder="e.g. Royal Crest Apartments"
                    className="w-full rounded-2xl border-4 border-[#e6e3d2] focus:border-brand-500 bg-white px-4 py-3 text-xs outline-none transition-all text-[#1c1c12]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-label-caps uppercase tracking-wider text-[#5b4040] mb-1.5">
                  Street / Road / Landmark
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. 10th Main Road, near Metro Station"
                  className="w-full rounded-2xl border-4 border-[#e6e3d2] focus:border-brand-500 bg-white px-4 py-3 text-xs outline-none transition-all text-[#1c1c12]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-label-caps uppercase tracking-wider text-[#5b4040] mb-1.5">
                    Area / Locality
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Indiranagar"
                    className="w-full rounded-2xl border-4 border-[#e6e3d2] focus:border-brand-500 bg-white px-4 py-3 text-xs outline-none transition-all text-[#1c1c12]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-label-caps uppercase tracking-wider text-[#5b4040] mb-1.5">
                    City, State & Pincode
                  </label>
                  <input
                    type="text"
                    value={cityStatePin}
                    onChange={(e) => setCityStatePin(e.target.value)}
                    placeholder="e.g. Bengaluru, Karnataka - 560038"
                    className="w-full rounded-2xl border-4 border-[#e6e3d2] focus:border-brand-500 bg-white px-4 py-3 text-xs outline-none transition-all text-[#1c1c12]"
                  />
                </div>
              </div>

              {getFullAddressString() && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-xl border-2 border-brand-500 text-brand-500 px-5 py-2 text-xs font-label-caps uppercase tracking-wider hover:bg-brand-50 transition-colors shadow-sm"
                  >
                    Confirm & Save Address
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Coupon */}
        <div className="mb-6 border-4 border-[#e6e3d2] rounded-[28px] p-6 bg-white shadow-md">
          <label className="flex items-center gap-2 text-xs font-label-caps uppercase tracking-wider text-[#1c1c12] mb-3">
            <span className="material-symbols-outlined text-brand-500 text-lg">local_offer</span> Coupon Code
          </label>
          <div className="flex gap-3">
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder="Try ZING10"
              disabled={couponApplied}
              className="flex-1 rounded-2xl border-4 border-[#e6e3d2] focus:border-brand-500 bg-white px-4 py-3 text-xs outline-none transition-all disabled:opacity-60 text-[#1c1c12]"
            />
            <button
              onClick={applyCoupon}
              disabled={couponApplied || !coupon}
              className="rounded-2xl bg-brand-500 px-6 py-3 text-xs font-label-caps uppercase tracking-wider text-white hover:brightness-110 transition-colors disabled:opacity-50 shadow-md"
            >
              {couponApplied ? 'Applied ✓' : 'Apply'}
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="border-4 border-[#e6e3d2] rounded-[32px] p-8 bg-white shadow-xl">
          <h3 className="font-headline-lg text-lg uppercase mb-4 text-[#1c1c12]">Order Summary</h3>

          <div className="space-y-3 text-xs font-label-caps tracking-wider uppercase text-[#5b4040]">
            <div className="flex justify-between">
              <span>Item total ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span className="text-[#1c1c12] font-headline-md text-sm">₹{total.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery fee</span>
              <span className="text-[#1c1c12] font-headline-md text-sm">₹{DELIVERY_FEE}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform fee</span>
              <span className="text-[#1c1c12] font-headline-md text-sm">₹{PLATFORM_FEE}</span>
            </div>
            {couponApplied && (
              <div className="flex justify-between text-emerald-600">
                <span>Coupon (ZING10)</span>
                <span className="font-semibold">-₹{discount}</span>
              </div>
            )}
          </div>

          <div className="my-4 h-1 bg-[#e6e3d2]" />

          <div className="flex justify-between mb-6">
            <span className="font-headline-lg text-lg uppercase text-[#1c1c12]">Total Amount</span>
            <span className="text-xl font-headline-md text-brand-500">₹{grandTotal.toFixed(0)}</span>
          </div>

          <div className="flex flex-wrap gap-4">
            <button onClick={clearCart}
              className="rounded-full border-4 border-[#e6e3d2] hover:bg-red-50 text-red-500 py-3.5 px-8 text-xs font-label-caps uppercase tracking-wider transition-colors shadow-md">
              Clear Cart
            </button>
            <button onClick={handlePlaceOrder} disabled={placing}
              className="flex-1 rounded-full bg-brand-500 text-white py-4 text-xs font-label-caps uppercase tracking-wider hover:brightness-110 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2">
              {placing
                ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Placing…</>
                : `Place Order — ₹${grandTotal.toFixed(0)}`
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
