import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-[#fdfae9]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /></div>;
  if (!restaurant) return <div className="pt-24 text-center text-xs font-label-caps uppercase tracking-wider text-[#5b4040]">Restaurant not found</div>;

  const img = imageUrl(restaurant.imageUrl) || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80";

  return (
    <div className="w-full min-h-screen bg-[#fdfae9] text-[#1c1c12] pt-24 pb-20 px-4 md:px-16">
      <div className="max-w-6xl mx-auto">
        {/* Header with image */}
        <div className="relative h-80 rounded-[40px] overflow-hidden border-4 border-[#e6e3d2] shadow-xl mb-12">
          <img src={img} alt={restaurant.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1c1c12]/75 via-[#1c1c12]/30 to-[#1c1c12]/75" />
          <div className="absolute bottom-8 left-8 right-8 text-white z-20 flex justify-between items-end flex-wrap gap-4">
            <div>
              <h1 className="font-display-hero text-3xl md:text-5xl uppercase tracking-tight mb-3">{restaurant.name}</h1>
              <div className="flex items-center gap-4 text-xs font-label-caps uppercase tracking-wider text-white/90">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">map_pin</span> {restaurant.address || restaurant.city}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> {restaurant.open ? 'Open now' : 'Closed'}</span>
              </div>
            </div>
            <span className={`font-label-caps text-xs tracking-wider px-5 py-2.5 rounded-lg uppercase shadow-lg ${
              restaurant.open ? 'bg-brand-500 text-white' : 'bg-[#5b4040] text-white'
            }`}>
              {restaurant.open ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-3">
          {/* Menu */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-brand-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant_menu</span>
              <h2 className="font-headline-lg text-2xl text-[#1c1c12] uppercase italic">Menu</h2>
            </div>
            {menu.length === 0 ? (
              <div className="text-center py-12 bg-[#f7f4e3] rounded-[32px] border-4 border-dashed border-[#e6e3d2]">
                <p className="text-xs font-label-caps uppercase tracking-wider text-[#5b4040]">No menu items available at the moment.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
                {menu.map((item) => (
                  <MenuItemCard 
                    key={item.id} 
                    item={item}
                    onAdd={user?.role === 'USER' ? () => addItem(item, restaurant) : null} 
                  />
                ))}
              </div>
            )}
          </div>

          {/* Book a Table */}
          {user?.role === 'USER' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-brand-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>event_seat</span>
                <h2 className="font-headline-lg text-2xl text-[#1c1c12] uppercase italic">Book a Table</h2>
              </div>
              <form onSubmit={handleBooking} className="border-4 border-[#e6e3d2] rounded-[32px] p-8 bg-white shadow-xl space-y-4">
                <div>
                  <label className="block text-xs font-label-caps uppercase tracking-wider text-[#5b4040] mb-2">Select Date</label>
                  <input type="date" required value={booking.date} onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                    className="w-full rounded-2xl border-4 border-[#e6e3d2] focus:border-brand-500 bg-white px-4 py-3.5 text-sm outline-none transition-all text-[#1c1c12]" />
                </div>
                <div>
                  <label className="block text-xs font-label-caps uppercase tracking-wider text-[#5b4040] mb-2">Select Time</label>
                  <input type="time" required value={booking.time} onChange={(e) => setBooking({ ...booking, time: e.target.value })}
                    className="w-full rounded-2xl border-4 border-[#e6e3d2] focus:border-brand-500 bg-white px-4 py-3.5 text-sm outline-none transition-all text-[#1c1c12]" />
                </div>
                <div>
                  <label className="block text-xs font-label-caps uppercase tracking-wider text-[#5b4040] mb-2">Guests Count</label>
                  <input type="number" min={1} required value={booking.guests} onChange={(e) => setBooking({ ...booking, guests: e.target.value })}
                    className="w-full rounded-2xl border-4 border-[#e6e3d2] focus:border-brand-500 bg-white px-4 py-3.5 text-sm outline-none transition-all text-[#1c1c12]"
                    placeholder="Guests count" />
                </div>
                <button type="submit" disabled={bookingLoading}
                  className="w-full rounded-full bg-brand-500 py-4 text-xs font-label-caps uppercase tracking-wider text-white hover:brightness-110 transition-all disabled:opacity-50 shadow-lg mt-4">
                  {bookingLoading ? 'Booking…' : 'Book Table'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
