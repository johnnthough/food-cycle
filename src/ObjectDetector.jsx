import React, { useRef, useEffect, useState } from "react";
import CameraPreview from "./components/CameraPreview";
import DetectionLayer from "./components/DetectionLayer";
import { useVisionModel } from "./hooks/useVisionModel";
import { calculateLiveFreshness } from "./utils/objectLogic"; 

export default function ObjectDetector({ onDetect }) {
  const webcamRef = useRef(null);
  const [liveDetections, setLiveDetections] = useState([]);
  const [activeBatchId, setActiveBatchId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const { model, isReady } = useVisionModel();

  const handleAutoLog = (currentDetections) => {
    if (currentDetections.length === 0 || isPaused) return;

    // Use the cleaned display name for the fingerprint
    const fingerprint = `${currentDetections.length}-${currentDetections[0].health.displayName}`;
    
    if (fingerprint !== activeBatchId) {
      setActiveBatchId(fingerprint);
      
      onDetect({
        id: Date.now(),
        label: currentDetections.length > 1 
          ? `${currentDetections.length}x ${currentDetections[0].health.displayName}` 
          : currentDetections[0].health.displayName,
        days: currentDetections[0].health.daysRemaining,
        type: currentDetections.length > 5 ? 'Bulk Box' : 'Single Item'
      });
    }
  };

  const runLiveDetection = async () => {
    if (isPaused || !isReady || !webcamRef.current?.video) return;

    if (webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      
      // Inference from the 83-class Grocery model
      const rawPredictions = await model.detect(video);

      const processed = rawPredictions
        .filter(p => (p.confidence || p.score) > 0.40) 
        .map(p => {
          const healthData = calculateLiveFreshness(p.class, p.confidence || p.score);
          return {
            ...p,
            class: healthData.displayName, // Displays "Beef Tomato"
            health: healthData
          };
        });

      setLiveDetections(processed);
      handleAutoLog(processed);
    }

    if (!isPaused) {
      requestAnimationFrame(runLiveDetection);
    }
  };

  useEffect(() => {
    if (isReady && !isPaused) {
      runLiveDetection();
    } else {
      setLiveDetections([]); 
    }
  }, [isReady, isPaused]);

  return (
    <div className="relative w-full h-full min-h-0 overflow-hidden bg-slate-900 rounded-2xl border border-slate-800">
      <CameraPreview ref={webcamRef} />
      {!isPaused && <DetectionLayer predictions={liveDetections} />}
      
      <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
        <div className="flex justify-between items-start w-full">
            <div className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-widest backdrop-blur-md border ${isPaused ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-green-500/20 border-green-500/50 text-green-400'}`}>
                {isPaused ? "SCANNER PAUSED" : "SCANNER ACTIVE"}
            </div>
        </div>

        <div className="flex justify-center w-full pointer-events-auto pb-4">
            <button 
                onClick={() => setIsPaused(!isPaused)}
                className={`px-10 py-4 rounded-2xl font-bold transition-all shadow-2xl active:scale-95 ${isPaused ? 'bg-green-500 text-slate-950 hover:bg-green-400' : 'bg-red-500 text-white hover:bg-red-400'}`}
            >
                {isPaused ? "RESUME SCANNER" : "STOP SCANNER"}
            </button>
        </div>
      </div>
    </div>
  );
}