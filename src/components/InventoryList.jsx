import React from 'react';

// Simple helper to estimate shelf life based on the fruit name
const getShelfLife = (itemName) => {
  const shelfLife = {
    'apple': 14,
    'banana': 5,
    'orange': 21,
    'onion': 30,
    'tomato': 7,
    'potato': 60,
    // Add more defaults as needed
  };
  return shelfLife[itemName?.toLowerCase()] || 7; // Default to 7 days if unknown
};

export default function InventoryList({ items, onClear }) {
  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 flex flex-col h-full min-h-[500px] shadow-2xl relative overflow-hidden">
      
      {/* Background Decor - "Cyber Grid" effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.3)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-end mb-6 relative z-10">
        <div>
          <h3 className="text-2xl font-archivo font-black text-white uppercase tracking-tighter">
            Detected Batch
          </h3>
          <p className="font-mono text-[10px] text-green-500/80 uppercase tracking-widest mt-1">
            Real-time Logistics
          </p>
        </div>
        <div className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
           <span className="font-mono text-xs font-bold text-white">{items.length} Items</span>
        </div>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700 relative z-10">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 space-y-4">
            <div className="w-16 h-16 border-2 border-dashed border-slate-600 rounded-full flex items-center justify-center">
              <span className="text-2xl grayscale">📦</span>
            </div>
            <p className="font-outfit text-sm text-slate-400">Waiting for scans...</p>
          </div>
        ) : (
          items.map((item, i) => {
            // Handle both data structures (just in case)
            const name = item.class || item.label || "Unknown Item";
            const daysLeft = getShelfLife(name);
            const confidence = Math.round((item.confidence || 0) * 100);

            return (
              <div 
                key={item.id || i} 
                className="group flex justify-between items-center bg-slate-800/40 hover:bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50 hover:border-green-500/50 transition-all duration-300 animate-in fade-in slide-in-from-right-8"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  {/* Icon Placeholder */}
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-inner">
                    <span className="text-lg">🍎</span> 
                  </div>
                  
                  <div>
                    <h4 className="text-slate-100 font-outfit font-bold capitalize text-lg leading-tight">
                      {name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                        CONF: {confidence}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="block text-xl font-archivo font-black text-green-400">
                    {daysLeft}d
                  </span>
                  <span className="text-[10px] font-outfit text-slate-500 uppercase font-bold tracking-wider">
                    Shelf Life
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      {items.length > 0 && (
        <div className="pt-4 mt-4 border-t border-slate-800 relative z-10">
          <button 
            onClick={onClear}
            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-archivo font-bold uppercase tracking-wide rounded-xl border border-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear List
          </button>
        </div>
      )}
    </div>
  );
}