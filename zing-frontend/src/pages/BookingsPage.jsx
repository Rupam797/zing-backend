import { useEffect, useState } from 'react';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';
import api from '../api/axios';

export default function BookingsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/restaurants').then((r) => { setRestaurants(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) { setBookings([]); return; }
    api.get(`/bookings/restaurant/${selectedId}`).then((r) => setBookings(r.data)).catch(() => {});
  }, [selectedId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-20 pb-12">
      <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>My Bookings</h1>
      <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>View your table reservations</p>

      <div className="mt-4">
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-xs outline-none focus:border-brand-500"
          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="">Select a restaurant</option>
          {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      <div className="mt-4 space-y-2">
        {bookings.length === 0 && selectedId && (
          <div className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>No bookings found for this restaurant</div>
        )}
        {bookings.map((b) => (
          <div key={b.id} className="rounded-lg border p-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Booking #{b.id}</span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                {b.status}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{b.date}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{b.time}</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{b.guests} guests</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
