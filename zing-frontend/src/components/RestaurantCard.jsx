import { Link } from 'react-router-dom';
import { imageUrl } from '../api/upload';

const PLACEHOLDER_RESTAURANT = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80";

export default function RestaurantCard({ restaurant, distanceKm = null }) {
  const img = imageUrl(restaurant.imageUrl) || PLACEHOLDER_RESTAURANT;

  const formatDist = (d) => {
    if (d === null || d === undefined) return null;
    if (d < 1) return `${Math.round(d * 1000)}m`;
    return `${d.toFixed(1)}km`;
  };

  const distLabel = formatDist(distanceKm);

  return (
    <Link 
      to={`/restaurants/${restaurant.id}`}
      className="group relative bg-white rounded-[40px] overflow-hidden border-4 border-[#e6e3d2] shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col"
    >
      <div className="relative h-64 overflow-hidden bg-[#f1eedd]">
        <img 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
          src={img} 
          alt={restaurant.name}
        />
        <div className="absolute top-6 left-6 flex gap-3 z-20">
          {restaurant.open ? (
            <span className="bg-brand-500 text-white font-label-caps text-[10px] tracking-wider px-5 py-2 rounded-lg uppercase shadow-lg">Open Now</span>
          ) : (
            <span className="bg-[#5b4040] text-white font-label-caps text-[10px] tracking-wider px-5 py-2 rounded-lg uppercase shadow-lg">Closed</span>
          )}
        </div>
        {distLabel && (
          <div className="absolute top-6 right-6 z-20 bg-black/60 backdrop-blur-md text-white font-label-caps text-[10px] tracking-wider px-4 py-2 rounded-full border border-white/10 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">navigation</span>
            {distLabel}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-70 group-hover:opacity-85 transition-opacity duration-500 z-10"></div>
        <div className="absolute bottom-6 left-6 text-white z-20">
          <div className="flex items-center gap-2 font-body-md text-xs uppercase text-white/80 tracking-wide">
            <span className="material-symbols-outlined text-base">location_on</span>
            {restaurant.city || 'Local Area'}
          </div>
        </div>
      </div>
      <div className="p-8 z-20 bg-white flex justify-between items-center flex-1">
        <h3 className="font-headline-lg text-xl text-[#1c1c12] uppercase group-hover:text-brand-500 transition-colors line-clamp-1 pr-2">{restaurant.name}</h3>
        <div className="flex items-center gap-2 bg-[#e6e3d2] px-4 py-1.5 rounded-xl shrink-0">
          <span className="material-symbols-outlined text-brand-500 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="font-headline-md text-sm text-[#1c1c12]">4.6</span>
        </div>
      </div>
    </Link>
  );
}
