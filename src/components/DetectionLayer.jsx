export default function DetectionLayer({ predictions }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {predictions.map((p, i) => (
        <div 
          key={i} 
          className="absolute border-2 border-green-400 rounded-lg flex items-end justify-center"
          style={{ 
            left: p.bbox[0], top: p.bbox[1], 
            width: p.bbox[2], height: p.bbox[3] 
          }}
        >
          <span className="bg-green-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 mb-1 rounded">
            {p.class.toUpperCase()}
          </span>
        </div>
      ))}
    </div>
  );
}