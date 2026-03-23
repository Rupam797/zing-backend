import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { items, total, restaurantId, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setPlacing(true);
    try {
      await api.post('/orders', {
        restaurantId: restaurantId,
        items: items.map(({ menuItem, quantity }) => ({
          menuItemId: menuItem.id,
          quantity,
        })),
      });
      toast.success('Order placed successfully! 🎉');
      clearCart();
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <ShoppingBag className="h-16 w-16 text-surface-700 mb-4" />
        <h2 className="text-2xl font-bold text-surface-300">Your cart is empty</h2>
        <p className="mt-2 text-surface-500">Browse restaurants and add some delicious items!</p>
        <button
          onClick={() => navigate('/restaurants')}
          className="mt-8 flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:shadow-brand-500/40 hover:brightness-110"
        >
          <ArrowLeft className="h-4 w-4" />
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-24 pb-16 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">
        Your <span className="text-brand-500">Cart</span>
      </h1>

      {/* Items */}
      <div className="space-y-3">
        {items.map(({ menuItem, quantity }) => (
          <div
            key={menuItem.id}
            className="flex items-center gap-4 rounded-2xl border border-surface-800/60 bg-surface-900/60 p-4"
          >
            {/* Icon */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 text-2xl">
              🍕
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white truncate">{menuItem.name}</h4>
              <p className="text-sm text-brand-400 font-medium">₹{menuItem.price?.toFixed(2)}</p>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(menuItem.id, quantity - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-700 bg-surface-800/60 text-surface-300 transition hover:bg-surface-700 hover:text-white"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
              <button
                onClick={() => updateQuantity(menuItem.id, quantity + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-700 bg-surface-800/60 text-surface-300 transition hover:bg-surface-700 hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Subtotal */}
            <div className="w-20 text-right">
              <span className="text-sm font-semibold text-white">
                ₹{(menuItem.price * quantity).toFixed(2)}
              </span>
            </div>

            {/* Remove */}
            <button
              onClick={() => removeItem(menuItem.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-500 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-8 rounded-2xl border border-surface-800/60 bg-surface-900/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-surface-400">Subtotal</span>
          <span className="text-lg font-semibold text-white">₹{total.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between mb-6">
          <span className="text-surface-400">Delivery Fee</span>
          <span className="text-sm font-medium text-emerald-400">FREE</span>
        </div>
        <div className="h-px bg-surface-800 mb-6" />
        <div className="flex items-center justify-between mb-6">
          <span className="text-lg font-bold">Total</span>
          <span className="text-2xl font-bold text-brand-400">₹{total.toFixed(2)}</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={clearCart}
            className="rounded-xl border border-surface-700 px-5 py-3 text-sm font-medium text-surface-300 transition hover:bg-surface-800 hover:text-white"
          >
            Clear Cart
          </button>
          <button
            onClick={handlePlaceOrder}
            disabled={placing}
            className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:shadow-brand-500/40 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {placing ? 'Placing order…' : `Place Order — ₹${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
