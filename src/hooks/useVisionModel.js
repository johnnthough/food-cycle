import { useState, useEffect } from "react";

export const useVisionModel = () => {
  const [model, setModel] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initRoboflow = async () => {
      if (!window.roboflow) return;

      try {
        const apiKey = import.meta.env.VITE_ROBOFLOW_API_KEY;
        if (!apiKey) return;

        const rf = await window.roboflow.auth({
          publishable_key: apiKey
        });

        // 🚀 UPDATE: Load Version 7 (The "Fit/Letterbox" Model)
        const instance = await rf.load({
          model: "grocery-detection-vud86-qal03",
          version: 6 
        });

        // Warm-up (384x384)
        const dummy = document.createElement('canvas');
        dummy.width = 384; 
        dummy.height = 384;
        await instance.detect(dummy);

        setModel(instance);
        setIsReady(true);
        console.log("✅ Version 7 Model Loaded (Fit/Letterbox)");
      } catch (error) {
        console.error("AI Load Failure:", error);
      }
    };

    const timer = setTimeout(initRoboflow, 1000);
    return () => clearTimeout(timer);
  }, []);

  return { model, isReady };
};