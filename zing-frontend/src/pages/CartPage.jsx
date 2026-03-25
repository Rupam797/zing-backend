import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, MapPin, Tag } from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center page-enter">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>Your cart is empty</h2>
        <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>Browse restaurants and add some delicious items</p>
        <button onClick={() => navigate('/restaurants')}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors btn-glow">
          <ArrowLeft className="h-4 w-4" /> Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-20 pb-16 page-enter">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Your Cart</h1>

      {/* Items */}
      <div className="space-y-2 mb-6">
        {items.map(({ menuItem, quantity }) => {
          const img = imageUrl(menuItem.imageUrl);
          return (
            <div key={menuItem.id}
              className="flex items-center gap-3 rounded-2xl border p-3 transition-all hover:border-brand-200 dark:hover:border-brand-800"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              {/* Thumbnail */}
              <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden flex items-center justify-center text-xl"
                style={{ backgroundColor: 'var(--bg-input)' }}>
                {img ? (
                  <img src={img} alt={menuItem.name} className="h-full w-full object-cover" />
                ) : (
                  <span>🍕</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{menuItem.name}</h4>
                <p className="text-[11px] text-brand-500 font-semibold">₹{menuItem.price?.toFixed(0)}</p>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-2 rounded-xl border p-1" style={{ borderColor: 'var(--border-color)' }}>
                <button onClick={() => updateQuantity(menuItem.id, quantity - 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors hover:bg-brand-50 dark:hover:bg-brand-500/10"
                  style={{ color: 'var(--text-muted)' }}>
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{quantity}</span>
                <button onClick={() => updateQuantity(menuItem.id, quantity + 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors hover:bg-brand-50 dark:hover:bg-brand-500/10"
                  style={{ color: 'var(--text-muted)' }}>
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              <span className="w-16 text-right text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                ₹{(menuItem.price * quantity).toFixed(0)}
              </span>
              <button onClick={() => removeItem(menuItem.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Delivery Address */}
      <div className="mb-4 rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <label className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          <MapPin className="h-3.5 w-3.5 text-brand-500" /> Delivery Address
        </label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter your full delivery address..."
          rows={2}
          className="w-full rounded-xl border px-3 py-2.5 text-xs outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"
          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Coupon */}
      <div className="mb-4 rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <label className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          <Tag className="h-3.5 w-3.5 text-brand-500" /> Coupon Code
        </label>
        <div className="flex gap-2">
          <input
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            placeholder="Try ZING10"
            disabled={couponApplied}
            className="flex-1 rounded-xl border px-3 py-2 text-xs outline-none transition-all focus:border-brand-500 disabled:opacity-60"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={applyCoupon}
            disabled={couponApplied || !coupon}
            className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {couponApplied ? 'Applied ✓' : 'Apply'}
          </button>
        </div>
      </div>

      {/* Order Summary */}
      <div className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h3 className="text-xs font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Order Summary</h3>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-muted)' }}>Item total ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
            <span style={{ color: 'var(--text-primary)' }} className="font-medium">₹{total.toFixed(0)}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-muted)' }}>Delivery fee</span>
            <span style={{ color: 'var(--text-primary)' }} className="font-medium">₹{DELIVERY_FEE}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-muted)' }}>Platform fee</span>
            <span style={{ color: 'var(--text-primary)' }} className="font-medium">₹{PLATFORM_FEE}</span>
          </div>
          {couponApplied && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Coupon (ZING10)</span>
              <span className="font-semibold">-₹{discount}</span>
            </div>
          )}
        </div>

        <div className="my-3 h-px" style={{ backgroundColor: 'var(--border-color)' }} />

        <div className="flex justify-between mb-4">
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Total</span>
          <span className="text-sm font-black text-brand-500">₹{grandTotal.toFixed(0)}</span>
        </div>

        <div className="flex gap-2">
          <button onClick={clearCart}
            className="rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500"
            style={{ borderColor: 'var(--border-color)' }}>
            Clear
          </button>
          <button onClick={handlePlaceOrder} disabled={placing}
            className="btn-glow flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50 transition-all">
            {placing
              ? <span className="flex items-center justify-center gap-2"><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Placing…</span>
              : `Place Order — ₹${grandTotal.toFixed(0)}`
            }
          </button>
        </div>
      </div>
    </div>
  );
}
