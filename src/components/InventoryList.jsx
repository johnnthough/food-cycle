export default function InventoryList({ items }) {
  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 flex flex-col h-full min-h-0">
      <h3 className="text-xl font-bold text-white mb-4 shrink-0">Detected Batch</h3>
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
        {items.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No items scanned yet...</p>
        ) : (
          items.map((item, i) => (
            <div key={i} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border-l-4 border-green-500 animate-in fade-in slide-in-from-right-4">
              <span className="text-slate-200 font-medium capitalize">{item.label}</span>
              <span className="text-xs font-mono text-green-400 font-bold">{item.days}d Left</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}