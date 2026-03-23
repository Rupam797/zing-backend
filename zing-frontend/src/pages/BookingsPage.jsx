import { useEffect, useState } from 'react';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';
import api from '../api/axios';

export default function BookingsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/restaurants')
      .then((res) => setRestaurants(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedRestaurantId) {
      setBookings([]);
      return;
    }
    setLoading(true);
    api.get(`/bookings/restaurant/${selectedRestaurantId}`)
      .then((res) => setBookings(res.data))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [selectedRestaurantId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-400 ring-red-500/30';
      default:
        return 'bg-amber-500/20 text-amber-400 ring-amber-500/30';
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-16 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold">
        My <span className="text-brand-500">Bookings</span>
      </h1>
      <p className="mb-8 text-surface-400">View your table reservations</p>

      {/* Restaurant selector */}
      <div className="mb-8 flex items-center gap-3">
        <MapPin className="h-5 w-5 text-surface-500" />
        <select
          value={selectedRestaurantId}
          onChange={(e) => setSelectedRestaurantId(e.target.value)}
          className="flex-1 appearance-none rounded-xl border border-surface-700 bg-surface-900/60 px-4 py-3 text-sm text-white outline-none focus:border-brand-500"
        >
          <option value="">Select a restaurant…</option>
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* Bookings list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : !selectedRestaurantId ? (
        <div className="rounded-2xl border border-surface-800/60 bg-surface-900/40 py-20 text-center">
          <Calendar className="mx-auto h-12 w-12 text-surface-700 mb-3" />
          <p className="text-surface-400">Select a restaurant to view bookings</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-surface-800/60 bg-surface-900/40 py-20 text-center">
          <Calendar className="mx-auto h-12 w-12 text-surface-700 mb-3" />
          <p className="text-surface-400">No bookings found for this restaurant</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-surface-800/60 bg-surface-900/60 p-5 transition hover:border-surface-700"
            >
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-surface-300">
                    <Calendar className="h-4 w-4 text-brand-400" />
                    <span>{b.bookingDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-surface-300">
                    <Clock className="h-4 w-4 text-brand-400" />
                    <span>{b.bookingTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-surface-300">
                    <Users className="h-4 w-4 text-brand-400" />
                    <span>{b.peopleCount} guests</span>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusColor(b.status)}`}
                >
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
