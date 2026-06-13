import { Plus } from 'lucide-react';
import { imageUrl } from '../api/upload';

const PLACEHOLDER_FOOD = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80";

export default function MenuItemCard({ item, onAdd }) {
  const img = imageUrl(item.imageUrl) || PLACEHOLDER_FOOD;

  return (
    <div className="bg-white rounded-[24px] border-4 border-[#e6e3d2] hover:border-brand-500 p-4 transition-all duration-300 flex items-center gap-4 shadow-md group">
      <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-[#f1eedd] border-2 border-[#e6e3d2]">
        <img src={img} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-headline-md text-base text-[#1c1c12] uppercase truncate leading-tight mb-1">{item.name}</h4>
        <p className="text-[#5b4040] font-body-md text-xs uppercase opacity-80 line-clamp-2 mb-2">{item.description || 'A delicious and freshly prepared meal full of authentic flavors.'}</p>
        <p className="text-sm font-headline-md text-brand-500">₹{item.price?.toFixed(0)}</p>
      </div>
      {onAdd && (
        <button
          onClick={() => onAdd(item)}
          className="w-10 h-10 shrink-0 bg-brand-500 text-white rounded-xl hover:scale-110 transition-transform shadow-md flex items-center justify-center"
        >
          <Plus className="h-5 w-5 font-bold" />
        </button>
      )}
    </div>
  );
}
