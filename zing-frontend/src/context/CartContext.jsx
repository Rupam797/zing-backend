import { createContext, useContext, useState } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);

  const addItem = (menuItem, restaurant) => {
    if (restaurantId && restaurantId !== restaurant.id) {
      toast.error('Clear your cart first — items from another restaurant exist.');
      return;
    }
    setRestaurantId(restaurant.id);
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
    toast.success(`${menuItem.name} added to cart`);
  };

  const removeItem = (menuItemId) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.menuItem.id !== menuItemId);
      if (updated.length === 0) setRestaurantId(null);
      return updated;
    });
  };

  const updateQuantity = (menuItemId, quantity) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.menuItem.id === menuItemId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
  };

  const total = items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, restaurantId, addItem, removeItem, updateQuantity, clearCart, total, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
