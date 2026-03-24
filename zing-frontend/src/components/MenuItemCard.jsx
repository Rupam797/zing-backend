import { Plus } from 'lucide-react';
import { imageUrl } from '../api/upload';

export default function MenuItemCard({ item, onAdd }) {
  const img = imageUrl(item.imageUrl);

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md overflow-hidden" style={{ backgroundColor: 'var(--bg-input)' }}>
        {img ? (
          <img src={img} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg">🍕</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</h4>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.description || 'Menu item'}</p>
        <p className="text-xs font-semibold text-brand-600 mt-0.5">₹{item.price?.toFixed(2)}</p>
      </div>
      {onAdd && (
        <button
          onClick={() => onAdd(item)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-brand-300 text-brand-500 hover:bg-brand-500 hover:text-white transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
