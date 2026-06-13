import { useEffect, useState } from 'react';
import { Calendar, Clock, Users } from 'lucide-react';
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

  if (loading) return (
    <div className="w-full min-h-screen bg-[#fdfae9] text-[#1c1c12] pt-24 pb-20 flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-[#fdfae9] text-[#1c1c12] pt-24 pb-20 px-4 md:px-16 page-enter">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 border-b border-[#e6e3d2] pb-6">
          <span className="material-symbols-outlined text-brand-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>event_seat</span>
          <div>
            <h1 className="font-headline-lg text-3xl text-[#1c1c12] uppercase italic">My Bookings</h1>
            <p className="text-sm font-body-lg text-[#5b4040] uppercase tracking-wide">View and manage your table reservations</p>
          </div>
        </div>

        {/* Dropdown Selector */}
        <div className="mb-8 max-w-md">
          <label className="block text-xs font-label-caps uppercase tracking-wider text-[#5b4040] mb-2">Select Restaurant</label>
          <select 
            value={selectedId} 
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-2xl border-4 border-[#e6e3d2] focus:border-brand-500 bg-white px-5 py-3 text-sm outline-none transition-all text-[#1c1c12] cursor-pointer"
          >
            <option value="">Choose a restaurant spot...</option>
            {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        {/* Cards */}
        <div className="space-y-4">
          {!selectedId && (
            <div className="text-center py-16 bg-[#f7f4e3] rounded-[32px] border-4 border-dashed border-[#e6e3d2]">
              <span className="material-symbols-outlined text-[#5b4040]/40 text-5xl mb-3">restaurant</span>
              <p className="text-xs font-label-caps uppercase tracking-wider text-[#5b4040]">Select a restaurant to load your reservations.</p>
            </div>
          )}
          
          {bookings.length === 0 && selectedId && (
            <div className="text-center py-16 bg-[#f7f4e3] rounded-[32px] border-4 border-dashed border-[#e6e3d2]">
              <span className="material-symbols-outlined text-brand-500 text-5xl mb-3">event_busy</span>
              <p className="text-xs font-label-caps uppercase tracking-wider text-[#5b4040]">No bookings found for this restaurant.</p>
            </div>
          )}

          {bookings.map((b) => (
            <div 
              key={b.id} 
              className="bg-white rounded-3xl border-4 border-[#e6e3d2] hover:border-brand-500 p-6 transition-all duration-300 shadow-md flex items-center justify-between flex-wrap gap-4"
            >
              <div>
                <span className="font-headline-md text-base text-[#1c1c12]">Reservation #{b.id}</span>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-label-caps uppercase tracking-wider text-[#5b4040]">
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4 text-brand-500" /> {b.date}</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-brand-500" /> {b.time}</span>
                  <span className="flex items-center gap-1"><Users className="h-4 w-4 text-brand-500" /> {b.guests} guests</span>
                </div>
              </div>
              <span className={`text-[10px] font-label-caps uppercase tracking-wider px-3.5 py-1.5 rounded-lg shadow-sm border-2 ${
                b.status === 'CONFIRMED' 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                  : 'bg-amber-100 text-amber-800 border-amber-200'
              }`}>
                {b.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
