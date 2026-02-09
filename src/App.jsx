import { useState, useEffect, useRef } from 'react';
import { DetectionOverlay } from "./components/DetectionOverlay";
import InventoryList from './components/InventoryList';
import { useVisionModel } from './hooks/useVisionModel';

function App() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentDetections, setCurrentDetections] = useState([]);
  const [rawDebug, setRawDebug] = useState([]); // <--- NEW: Stores everything the AI sees
  const { model, isReady } = useVisionModel();
  const videoRef = useRef(null);
  const trackerRef = useRef({});

  // ... stopCamera function stays the same ...
  const stopCamera = () => {
    setIsScannerOpen(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // ... startCamera effect stays the same ...
  useEffect(() => {
    if (!isScannerOpen) return;
    let stream = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "environment", 
            // V7 is trained on "Fit/Letterbox", so standard aspect ratio is fine now!
            width: { ideal: 720 },
            aspectRatio: { ideal: 1 } // Keep trying square, it's safer
          }
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        alert("Camera failed: " + err.message);
        setIsScannerOpen(false);
      }
    };
    startCamera();
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, [isScannerOpen]);

  // --- INFERENCE LOOP ---
  useEffect(() => {
    if (!isScannerOpen || !isReady || !model) return;
    let loopId;

    const runInference = async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        try {
          // 1. Get Raw Predictions
          const predictions = await model.detect(videoRef.current);
          
          // 2. DUMP RAW DATA TO DEBUG BOX (No filtering!)
          setRawDebug(predictions);

          // 3. Filter for the UI (Keep this strict so users don't see garbage)
          const now = Date.now();
          const currentFrameClasses = new Set();

          const tracked = predictions
            .filter(p => p.confidence > 0.4) // UI only shows strong matches
            .map(pred => {
              const cls = pred.class;
              currentFrameClasses.add(cls);
              if (!trackerRef.current[cls]) trackerRef.current[cls] = now;
              
              const duration = now - trackerRef.current[cls];
              if (duration > 1000) { 
                setHistory(prev => {
                  if (prev[0]?.class === cls && (now - prev[0].addedAt < 5000)) return prev;
                  return [{ ...pred, id: now, addedAt: now }, ...prev];
                });
              }
              return { ...pred, firstSeen: trackerRef.current[cls] };
            });

          setCurrentDetections(tracked);
          Object.keys(trackerRef.current).forEach(key => {
             if (!currentFrameClasses.has(key)) delete trackerRef.current[key];
          });

        } catch (err) {
          console.error(err);
        }
      }
      loopId = setTimeout(runInference, 100); 
    };

    runInference();
    return () => clearTimeout(loopId);
  }, [isScannerOpen, isReady, model]);

  // ... Render Return ...
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-6 font-sans antialiased">
      {/* ... Header and Grid stay the same ... */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <header className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex justify-between items-center shadow-lg">
             <div>
               <h1 className="text-3xl font-archivo font-black text-white uppercase">Food-Cycle</h1>
               <p className="font-outfit text-slate-500 text-xs mt-1">v7.0 (Debug Mode)</p>
             </div>
             <div className={`px-3 py-1 rounded-full text-xs font-bold border ${isReady ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                {isReady ? "SYSTEM ONLINE" : "LOADING..."}
             </div>
          </header>

          <div className="aspect-[4/3] bg-slate-900 rounded-3xl border border-slate-800 relative overflow-hidden shadow-2xl">
            {!isScannerOpen ? (
               /* ... Launch Screen ... */
               <div className="flex flex-col items-center justify-center h-full space-y-6">
                 <button onClick={() => setIsScannerOpen(true)} disabled={!isReady} className="font-archivo font-black px-10 py-4 bg-green-500 text-slate-950 rounded-2xl">
                   {isReady ? "LAUNCH SCANNER" : "LOADING..."}
                 </button>
               </div>
            ) : (
              <div className="relative h-full w-full">
                <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                <DetectionOverlay videoRef={videoRef} detections={currentDetections} />
                <div className="absolute bottom-6 left-0 right-0 flex justify-center z-50">
                  <button onClick={stopCamera} className="px-6 py-3 bg-red-600 text-white font-bold rounded-full">STOP</button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-1">
           <InventoryList items={history} onClear={() => setHistory([])} />
        </div>
      </div>

      {/* 🛑 RAW DEBUG PANEL: Shows EVERYTHING the AI sees */}
      <div className="fixed bottom-0 left-0 w-full bg-black/90 text-green-400 p-2 text-[10px] font-mono h-32 overflow-y-auto z-50 opacity-90 border-t border-green-500/30">
        <div className="font-bold text-white mb-1">RAW MODEL OUTPUT (Threshold: 0%):</div>
        {rawDebug.length === 0 ? (
           <span className="text-slate-500">No raw detections... (Model is running but sees nothing)</span>
        ) : (
           rawDebug.map((d, i) => (
             <div key={i} className="border-b border-white/10 py-1">
               <span className="text-yellow-400">Class: {d.class}</span> | 
               <span className="text-cyan-400"> Conf: {(d.confidence * 100).toFixed(1)}%</span> | 
               <span className="text-slate-400"> Box: [{d.x.toFixed(0)}, {d.y.toFixed(0)}]</span>
             </div>
           ))
        )}
      </div>
    </div>
  );
}
export default App;