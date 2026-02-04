import { useState, useEffect } from "react";

export const useVisionModel = () => {
  const [model, setModel] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initRoboflow = async () => {
      if (!window.roboflow) return;

      try {
        const apiKey = import.meta.env.VITE_ROBOFLOW_API_KEY;
        
        if (!apiKey || apiKey.includes("YOUR_")) {
           console.error("Missing valid API Key in .env");
           return;
        }

        // 1. Authenticate
        const rf = await window.roboflow.auth({
          publishable_key: apiKey
        });

        // 2. Load the trained model (Version 3)
        const instance = await rf.load({
          model: "grocery-detection-vud86-qal03",
          version: 3
        });

        // ⚡ NEW: Warm-up Logic
        // This forces the GPU to compile shaders now so the first real scan is instant.
        console.log("Warming up GPU engine...");
        const dummyCanvas = document.createElement('canvas');
        dummyCanvas.width = 640;
        dummyCanvas.height = 640;
        await instance.detect(dummyCanvas); 

        // 3. Finalize
        setModel(instance);
        setIsReady(true);
        console.log("✅ AI Model Ready and Warmed Up");
      } catch (error) {
        console.error("AI Load Failure:", error);
      }
    };

    const timer = setTimeout(initRoboflow, 1000); 
    return () => clearTimeout(timer);
  }, []);

  return { model, isReady };
};