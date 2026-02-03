import { useState, useEffect } from "react";

export const useVisionModel = () => {
  const [model, setModel] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      // Use the window.roboflow object provided by the CDN script
      if (!window.roboflow) {
        console.error("Roboflow SDK not loaded from CDN");
        return;
      }

      try {
        const rf = window.roboflow(import.meta.env.VITE_ROBOFLOW_API_KEY);
        
        // Using the exact IDs from your Roboflow screenshot
        const instance = await rf
          .workspace("wei-tq4ff")
          .project("grocery-detection-vud86")
          .version(1);
        
        setModel(instance);
        setIsReady(true);
      } catch (error) {
        console.error("Failed to load Grocery model:", error);
      }
    };

    // Small delay to ensure the CDN script is parsed
    const timer = setTimeout(load, 500);
    return () => clearTimeout(timer);
  }, []);

  return { model, isReady };
};