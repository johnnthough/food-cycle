import React, { useRef, useEffect, useState } from "react";
import CameraPreview from "./components/CameraPreview";
import DetectionLayer from "./components/DetectionLayer";
import { useVisionModel } from "./hooks/useVisionModel";
import { calculateLiveFreshness } from "./utils/objectLogic";

export default function ObjectDetector({ onDetect }) {
  const webcamRef = useRef(null);
  const [liveDetections, setLiveDetections] = useState([]);
  const [activeBatchId, setActiveBatchId] = useState(null);
  const [isPaused, setIsPaused] = useState(false); // New control state
  const { model, isReady } = useVisionModel();

  const handleAutoLog = (currentDetections) => {
    if (currentDetections.length === 0 || isPaused) return; // Block logging if paused

    const fingerprint = `${currentDetections.length}-${currentDetections[0].class}`;
    
    if (fingerprint !== activeBatchId) {
      setActiveBatchId(fingerprint);
      
      onDetect({
        id: Date.now(),
        label: currentDetections.length > 1 
          ? `${currentDetections.length}x ${currentDetections[0].class}s` 
          : currentDetections[0].class,
        days: currentDetections[0].health.daysRemaining,
        type: currentDetections.length > 5 ? 'Bulk Box' : 'Single Item'
      });
    }
  };

  const runLiveDetection = async () => {
    // Stop the loop if the user presses 'Stop'
    if (isPaused) {
        setLiveDetections([]); // Clear visual boxes
        return;
    }

    if (isReady && webcamRef.current?.video?.readyState === 4) {
      const video = webcamRef.current.video;
      const predictions = await model.detect(video);

      const supportedFood = ["apple", "banana", "orange", "broccoli", "tomato", "carrot"];
      const detectedFood = predictions.filter(p => supportedFood.includes(p.class) && p.score > 0.55);

      const processed = detectedFood.map(p => ({
        ...p,
        health: calculateLiveFreshness(p.class, p.score, detectedFood.length)
      }));

      setLiveDetections(processed);
      handleAutoLog(processed);
    }
    requestAnimationFrame(runLiveDetection);
  };

  useEffect(() => {
    if (isReady && !isPaused) runLiveDetection();
  }, [isReady, isPaused]);

  return (
    <div className="relative w-full h-full min-h-0 overflow-hidden bg-slate-900 rounded-2xl">
      {/* 1. Camera Feed (Remains visible but idle when paused) */}
      <CameraPreview ref={webcamRef} />
      
      {/* 2. AR Layer (Auto-clears when paused) */}
      {!isPaused && <DetectionLayer predictions={liveDetections} />}
      
      {/* 3. Control UI Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
        <div className="flex justify-between items-start w-full">
            <div className={`px-3 py-1 rounded-full text-[10px] font-mono backdrop-blur-md border ${isPaused ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-green-500/20 border-green-500/50 text-green-400'}`}>
                {isPaused ? " Scanner paused" : "Scanner active "}
            </div>
        </div>

        {/* The Action Button */}
        <div className="flex justify-center w-full pointer-events-auto">
            <button 
                onClick={() => setIsPaused(!isPaused)}
                className={`px-8 py-3 rounded-xl font-bold transition-all shadow-xl active:scale-95 ${isPaused ? 'bg-green-500 text-slate-950 hover:bg-green-400' : 'bg-red-500 text-white hover:bg-red-400'}`}
            >
                {isPaused ? "Resume Scanning" : "Stop Scanning"}
            </button>
        </div>
      </div>
    </div>
  );
}