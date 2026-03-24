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
        restaurantId,
        items: items.map(({ menuItem, quantity }) => ({ menuItemId: menuItem.id, quantity })),
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
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <ShoppingBag className="h-10 w-10 mb-3" style={{ color: 'var(--text-faint)' }} />
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-secondary)' }}>Your cart is empty</h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Browse restaurants and add some items</p>
        <button onClick={() => navigate('/restaurants')}
          className="mt-5 flex items-center gap-1.5 rounded-md bg-brand-500 px-4 py-2 text-xs font-medium text-white hover:bg-brand-600 transition-colors">
          <ArrowLeft className="h-3 w-3" /> Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-20 pb-12">
      <h1 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Your Cart</h1>

      <div className="space-y-2">
        {items.map(({ menuItem, quantity }) => (
          <div key={menuItem.id} className="flex items-center gap-3 rounded-lg border p-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-base" style={{ backgroundColor: 'var(--bg-input)' }}>🍕</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{menuItem.name}</h4>
              <p className="text-[11px] text-brand-500 font-medium">₹{menuItem.price?.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => updateQuantity(menuItem.id, quantity - 1)}
                className="flex h-6 w-6 items-center justify-center rounded border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-5 text-center text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{quantity}</span>
              <button onClick={() => updateQuantity(menuItem.id, quantity + 1)}
                className="flex h-6 w-6 items-center justify-center rounded border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <span className="w-14 text-right text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>₹{(menuItem.price * quantity).toFixed(2)}</span>
            <button onClick={() => removeItem(menuItem.id)} className="flex h-6 w-6 items-center justify-center rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-5 rounded-lg border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex justify-between text-xs mb-2"><span style={{ color: 'var(--text-muted)' }}>Subtotal</span><span style={{ color: 'var(--text-primary)' }} className="font-medium">₹{total.toFixed(2)}</span></div>
        <div className="flex justify-between text-xs mb-3"><span style={{ color: 'var(--text-muted)' }}>Delivery</span><span className="text-emerald-500 font-medium">FREE</span></div>
        <div className="h-px mb-3" style={{ backgroundColor: 'var(--border-color)' }} />
        <div className="flex justify-between text-sm mb-4"><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Total</span><span className="font-bold text-brand-500">₹{total.toFixed(2)}</span></div>
        <div className="flex gap-2">
          <button onClick={clearCart} className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>Clear</button>
          <button onClick={handlePlaceOrder} disabled={placing}
            className="flex-1 rounded-md bg-brand-500 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">
            {placing ? 'Placing…' : `Place Order — ₹${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
