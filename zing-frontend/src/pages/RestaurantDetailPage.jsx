import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Clock, Users } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import MenuItemCard from '../components/MenuItemCard';
import toast from 'react-hot-toast';

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking form
  const [showBooking, setShowBooking] = useState(false);
  const [booking, setBooking] = useState({
    bookingDate: '',
    bookingTime: '',
    peopleCount: 2,
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.get(`/restaurants/${id}`), api.get(`/menus/${id}`)])
      .then(([rRes, mRes]) => {
        setRestaurant(rRes.data);
        setMenu(mRes.data);
      })
      .catch(() => toast.error('Failed to load restaurant'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = (item) => {
    if (!user) {
      toast.error('Please log in to add items to cart');
      return;
    }
    addItem(item, restaurant);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to book a table');
      return;
    }
    setBookingLoading(true);
    try {
      await api.post('/bookings', {
        restaurantId: Number(id),
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime + ':00',
        peopleCount: booking.peopleCount,
      });
      toast.success('Table booked! 🎉');
      setShowBooking(false);
      setBooking({ bookingDate: '', bookingTime: '', peopleCount: 2 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen text-surface-400">
        Restaurant not found
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6">
      {/* Restaurant Header */}
      <div className="relative mb-10 overflow-hidden rounded-3xl border border-surface-800/60 bg-gradient-to-br from-brand-500/10 via-surface-900 to-surface-900 p-8 sm:p-12">
        <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white">{restaurant.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-surface-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {restaurant.address || restaurant.city}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    restaurant.open
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${restaurant.open ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  {restaurant.open ? 'Open Now' : 'Closed'}
                </span>
              </div>
            </div>

            {user && user.role === 'USER' && (
              <button
                onClick={() => setShowBooking(!showBooking)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:shadow-brand-500/40 hover:brightness-110"
              >
                <Users className="h-4 w-4" />
                Book a Table
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Booking Form */}
      {showBooking && (
        <div className="mb-10 rounded-2xl border border-brand-500/30 bg-surface-900/60 p-6 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold">Reserve a Table</h3>
          <form onSubmit={handleBooking} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm text-surface-400">Date</label>
              <input
                type="date"
                required
                value={booking.bookingDate}
                onChange={(e) => setBooking({ ...booking, bookingDate: e.target.value })}
                className="w-full rounded-xl border border-surface-700 bg-surface-800/60 px-4 py-3 text-sm text-white outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-sm text-surface-400">Time</label>
              <input
                type="time"
                required
                value={booking.bookingTime}
                onChange={(e) => setBooking({ ...booking, bookingTime: e.target.value })}
                className="w-full rounded-xl border border-surface-700 bg-surface-800/60 px-4 py-3 text-sm text-white outline-none focus:border-brand-500"
              />
            </div>
            <div className="w-32">
              <label className="mb-1.5 block text-sm text-surface-400">Guests</label>
              <input
                type="number"
                min={1}
                max={20}
                required
                value={booking.peopleCount}
                onChange={(e) => setBooking({ ...booking, peopleCount: Number(e.target.value) })}
                className="w-full rounded-xl border border-surface-700 bg-surface-800/60 px-4 py-3 text-sm text-white outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              disabled={bookingLoading}
              className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
            >
              {bookingLoading ? 'Booking…' : 'Confirm'}
            </button>
          </form>
        </div>
      )}

      {/* Menu */}
      <div>
        <h2 className="mb-6 text-2xl font-bold">
          Menu <span className="text-surface-500 text-lg font-normal">({menu.length} items)</span>
        </h2>
        {menu.length === 0 ? (
          <div className="rounded-2xl border border-surface-800/60 bg-surface-900/40 py-20 text-center">
            <span className="text-4xl mb-3 block">📋</span>
            <p className="text-surface-400">No menu items available yet</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {menu.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onAdd={user?.role === 'USER' ? handleAddToCart : null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
