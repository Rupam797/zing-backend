import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import api from '../api/axios';
import { imageUrl } from '../api/upload';
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
  const [booking, setBooking] = useState({ date: '', time: '', guests: 2 });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.get(`/restaurants/${id}`), api.get(`/menus/${id}`)])
      .then(([rRes, mRes]) => { setRestaurant(rRes.data); setMenu(mRes.data); })
      .catch(() => toast.error('Failed to load restaurant'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBooking = async (e) => {
    e.preventDefault(); setBookingLoading(true);
    try {
      await api.post('/bookings', { restaurantId: Number(id), ...booking, guests: Number(booking.guests) });
      toast.success('Table booked!'); setBooking({ date: '', time: '', guests: 2 });
    } catch (err) { toast.error(err.response?.data?.message || 'Booking failed'); }
    finally { setBookingLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>;
  if (!restaurant) return <div className="pt-20 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Restaurant not found</div>;

  const img = imageUrl(restaurant.imageUrl);

  return (
    <div className="mx-auto max-w-4xl px-4 pt-20 pb-12">
      {/* Header with image */}
      <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        {img && (
          <div className="h-40 sm:h-52 overflow-hidden">
            <img src={img} alt={restaurant.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{restaurant.name}</h1>
              <div className="mt-1 flex items-center gap-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{restaurant.address || restaurant.city}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{restaurant.open ? 'Open now' : 'Closed'}</span>
              </div>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${restaurant.open ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
              {restaurant.open ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* Menu */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Menu</h2>
          {menu.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No menu items available</p>
          ) : (
            <div className="space-y-2">
              {menu.map((item) => (
                <MenuItemCard key={item.id} item={item}
                  onAdd={user?.role === 'USER' ? () => addItem(item, restaurant) : null} />
              ))}
            </div>
          )}
        </div>

        {/* Book a Table */}
        {user?.role === 'USER' && (
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Book a Table</h2>
            <form onSubmit={handleBooking} className="rounded-lg border p-3 space-y-2" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <input type="date" required value={booking.date} onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                className="w-full rounded-md border px-3 py-1.5 text-xs outline-none focus:border-brand-500"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              <input type="time" required value={booking.time} onChange={(e) => setBooking({ ...booking, time: e.target.value })}
                className="w-full rounded-md border px-3 py-1.5 text-xs outline-none focus:border-brand-500"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              <input type="number" min={1} required value={booking.guests} onChange={(e) => setBooking({ ...booking, guests: e.target.value })}
                className="w-full rounded-md border px-3 py-1.5 text-xs outline-none focus:border-brand-500"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="Guests" />
              <button type="submit" disabled={bookingLoading}
                className="w-full rounded-md bg-brand-500 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50">
                {bookingLoading ? 'Booking…' : 'Book Table'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
