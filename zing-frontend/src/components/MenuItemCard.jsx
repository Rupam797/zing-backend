import { Plus } from 'lucide-react';

export default function MenuItemCard({ item, onAdd }) {
  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-surface-800/60 bg-surface-900/60 p-4 transition-all duration-300 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5">
      {/* Icon */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 text-3xl">
        🍕
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-white truncate">{item.name}</h4>
        <p className="mt-0.5 text-sm text-surface-400 line-clamp-2">
          {item.description || 'Delicious menu item'}
        </p>
        <p className="mt-1.5 text-base font-bold text-brand-400">₹{item.price?.toFixed(2)}</p>
      </div>

      {/* Add button */}
      {onAdd && (
        <button
          onClick={() => onAdd(item)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-400 transition-all hover:bg-brand-500 hover:text-white hover:shadow-lg hover:shadow-brand-500/25 active:scale-95"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
