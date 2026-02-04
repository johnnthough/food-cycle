import { useState, useEffect, useRef } from 'react'
import { DetectionOverlay } from "./components/DetectionOverlay";
import InventoryList from './components/InventoryList'
import { useVisionModel } from './hooks/useVisionModel'

function App() {
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [history, setHistory] = useState([])
  const [currentDetections, setCurrentDetections] = useState([])
  const { model, isReady } = useVisionModel()
  const videoRef = useRef(null)
  const trackerRef = useRef({}); 

  // --- NEW: CAMERA CONTROLLER ---
  useEffect(() => {
    if (!isScannerOpen) return;

    let stream = null;

    const startCamera = async () => {
      try {
        // Request hardware access
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "environment", // Use back camera on phones
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream; // Attach to video element
        }
      } catch (err) {
        console.error("Camera Error:", err);
        alert("Could not access camera. Please check browser permissions.");
        setIsScannerOpen(false);
      }
    };

    startCamera();

    // Cleanup: Turn off camera light when scanner closes
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isScannerOpen]);

  // --- EXISTING: AI INFERENCE LOOP ---
  useEffect(() => {
    if (!isScannerOpen || !isReady || !model) return;

    let animationFrameId;

    const runInference = async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        const predictions = await model.detect(videoRef.current);
        const now = Date.now();
        const currentFrameClasses = new Set();

        const trackedPredictions = predictions.filter(p => p.confidence > 0.6).map(pred => {
          const className = pred.class;
          currentFrameClasses.add(className);

          if (!trackerRef.current[className]) {
            trackerRef.current[className] = now;
          }

          const timeVisible = now - trackerRef.current[className];
          
          if (timeVisible > 2000) {
            setHistory(prev => {
              if (prev[0]?.class === className && (now - prev[0].addedAt < 5000)) return prev;
              return [{ ...pred, id: now, addedAt: now }, ...prev];
            });
          }

          return { ...pred, firstSeen: trackerRef.current[className] };
        });

        setCurrentDetections(trackedPredictions);

        Object.keys(trackerRef.current).forEach(key => {
          if (!currentFrameClasses.has(key)) delete trackerRef.current[key];
        });
      }
      animationFrameId = requestAnimationFrame(runInference);
    };

    runInference();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isScannerOpen, isReady, model]);

  return (
    <div className="h-screen max-h-svh bg-slate-950 text-slate-200 p-4 md:p-6 overflow-hidden flex flex-col font-sans">
      <div className="max-w-6xl mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <header className="bg-slate-900 p-5 rounded-2xl border border-slate-800 mb-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Food-Cycle</h1>
              <p className="text-slate-500 text-xs mt-1">Live AI Inventory System v1.0</p>
            </div>
            {isScannerOpen && (
              <button 
                onClick={() => setIsScannerOpen(false)} 
                className="text-xs bg-red-900/20 text-red-400 px-4 py-2 rounded-xl border border-red-900/50 hover:bg-red-900/40 transition-all"
              >
                Close Camera
              </button>
            )}
          </header>

          <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 relative overflow-hidden min-h-0 shadow-2xl">
            {!isScannerOpen ? (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                 <div className="text-6xl opacity-30">📷</div>
                 <div className="text-center">
                   <h2 className="text-xl font-bold">Ready to scan?</h2>
                   <p className="text-slate-500 text-sm mt-1">Launch the AI scanner to identify items.</p>
                 </div>
                 <button 
                    disabled={!isReady} 
                    onClick={() => setIsScannerOpen(true)}
                    className="px-10 py-4 bg-green-500 text-slate-950 font-black rounded-2xl hover:bg-green-400 transition-all active:scale-95 disabled:opacity-50 shadow-[0_0_30px_rgba(34,197,94,0.2)]"
                  >
                    {isReady ? "Launch Scanner" : "INITIALIZING AI..."}
                 </button>
              </div>
            ) : (
              <div className="relative h-full w-full bg-black">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className="h-full w-full object-cover" 
                />
                <DetectionOverlay videoRef={videoRef} detections={currentDetections} />
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 min-h-0 flex flex-col">
           <InventoryList items={history} onClear={() => setHistory([])} />
        </div>
      </div>
    </div>
  )
}

export default App