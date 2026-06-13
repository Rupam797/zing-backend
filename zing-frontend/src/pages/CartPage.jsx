import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowLeft, MapPin, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { imageUrl } from '../api/upload';
import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const DELIVERY_FEE = 30;
const PLATFORM_FEE = 5;

export default function CartPage() {
  const { items, total, restaurantId, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState('');
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

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
    if (!address.trim()) {
      toast.error('Please enter a delivery address');
      return;
    }
    setPlacing(true);
    try {
      await api.post('/orders', {
        restaurantId,
        items: items.map(({ menuItem, quantity }) => ({ menuItemId: menuItem.id, quantity })),
      });
      toast.success('Order placed! 🎉 Track it in My Orders.');
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
          <label className="flex items-center gap-2 text-xs font-label-caps uppercase tracking-wider text-[#1c1c12] mb-3">
            <MapPin className="h-4 w-4 text-brand-500" /> Delivery Address
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your full delivery address..."
            rows={2}
            className="w-full rounded-2xl border-4 border-[#e6e3d2] focus:border-brand-500 bg-white px-4 py-3.5 text-xs outline-none transition-all text-[#1c1c12] resize-none"
          />
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
