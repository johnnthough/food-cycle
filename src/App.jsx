import { useState, useEffect, useRef } from 'react';
import { DetectionOverlay } from "./components/DetectionOverlay";
import InventoryList from './components/InventoryList';
import { useVisionModel } from './hooks/useVisionModel';

function App() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentDetections, setCurrentDetections] = useState([]);
  const { model, isReady } = useVisionModel();
  const videoRef = useRef(null);
  const trackerRef = useRef({});

  // --- 🛑 NEW: ROBUST STOP FUNCTION ---
  const stopCamera = () => {
    // 1. Close the UI state first
    setIsScannerOpen(false);

    // 2. Physically stop the camera stream immediately
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop()); // Stops the hardware light
      videoRef.current.srcObject = null;
    }
  };

  // --- CAMERA CONTROLLER ---
  useEffect(() => {
    if (!isScannerOpen) return;
    let stream = null;

    const startCamera = async () => {
      try {
        // Mobile-optimized constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "environment", 
            width: { ideal: 720 }, // 720p is plenty for AI & runs cooler
            aspectRatio: { ideal: 1 } // Square aspect ratio often helps alignment
          }
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        alert("Camera failed: " + err.message);
        setIsScannerOpen(false);
      }
    };
    startCamera();

    // Cleanup: This ensures camera turns off if user hits "Back" or closes tab
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [isScannerOpen]);

  // --- THROTTLED AI LOOP (Version 5) ---
  useEffect(() => {
    if (!isScannerOpen || !isReady || !model) return;
    let loopId;

    const runInference = async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        try {
          const predictions = await model.detect(videoRef.current);
          const now = Date.now();
          const currentFrameClasses = new Set();

          // Persistence Logic
          const tracked = predictions.filter(p => p.confidence > 0.6).map(pred => {
            const cls = pred.class;
            currentFrameClasses.add(cls);

            if (!trackerRef.current[cls]) trackerRef.current[cls] = now;
            
            const duration = now - trackerRef.current[cls];
            if (duration > 1500) { // Reduced to 1.5s for faster feedback
              setHistory(prev => {
                // Prevent duplicate entries for the same item within 5 seconds
                if (prev[0]?.class === cls && (now - prev[0].addedAt < 5000)) return prev;
                return [{ ...pred, id: now, addedAt: now }, ...prev];
              });
            }
            return { ...pred, firstSeen: trackerRef.current[cls] };
          });

          setCurrentDetections(tracked);

          // Cleanup tracker
          Object.keys(trackerRef.current).forEach(key => {
            if (!currentFrameClasses.has(key)) delete trackerRef.current[key];
          });

        } catch (err) {
          console.error(err);
        }
      }
      // Throttled to 100ms
      loopId = setTimeout(runInference, 100); 
    };

    runInference();
    return () => clearTimeout(loopId);
  }, [isScannerOpen, isReady, model]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-6 font-sans antialiased">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Camera & Controls */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <header className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex justify-between items-center shadow-lg">
            <div>
              <h1 className="text-3xl font-archivo font-black text-white tracking-tighter uppercase">
                Food-Cycle
              </h1>
              <p className="font-outfit text-slate-500 text-xs mt-1">
                Live AI Inventory System v5.0
              </p>
            </div>
            
            {/* Header Status Indicator */}
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${isReady ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
              {isReady ? "SYSTEM ONLINE" : "INITIALIZING..."}
            </div>
          </header>

          <div className="aspect-[4/3] bg-slate-900 rounded-3xl border border-slate-800 relative overflow-hidden shadow-2xl">
            {!isScannerOpen ? (
              // --- DEFAULT SCREEN (Launch Scanner) ---
              <div className="flex flex-col items-center justify-center h-full space-y-6 animate-in fade-in duration-500">
                 <div className="relative">
                   <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20"></div>
                   <div className="text-7xl relative grayscale opacity-50">📷</div>
                 </div>
                 
                 <div className="text-center space-y-2">
                   <h3 className="text-xl font-archivo font-bold text-white">Ready to Scan</h3>
                   <p className="text-slate-500 text-sm font-outfit max-w-[200px]">
                     Point your camera at groceries to add them to your inventory.
                   </p>
                 </div>

                 <button 
                    disabled={!isReady}
                    onClick={() => setIsScannerOpen(true)}
                    className="font-archivo font-black px-10 py-4 bg-green-500 text-slate-950 rounded-2xl hover:bg-green-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_40px_rgba(34,197,94,0.3)]"
                  >
                    {isReady ? "LAUNCH SCANNER" : "LOADING AI..."}
                 </button>
              </div>
            ) : (
              // --- CAMERA ACTIVE SCREEN ---
              <div className="relative h-full w-full">
                <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                <DetectionOverlay videoRef={videoRef} detections={currentDetections} />
                
                {/* 🛑 STOP BUTTON (Floating Overlay) */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center z-50">
                  <button 
                    onClick={stopCamera}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600/90 hover:bg-red-500 text-white font-archivo font-bold rounded-full backdrop-blur-sm transition-all shadow-lg active:scale-95 border border-red-400/30"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    STOP SCANNING
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Inventory */}
        <div className="lg:col-span-1">
           <InventoryList items={history} onClear={() => setHistory([])} />
        </div>
      </div>
    </div>
  );
}

export default App;