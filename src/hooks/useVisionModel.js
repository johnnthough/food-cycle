import { useState, useEffect } from "react";
import { roboflow } from "roboflow";

export const useVisionModel = () => {
  const [model, setModel] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      // 1. Authenticate with your VITE_ prefixed key
      const rf = roboflow(import.meta.env.VITE_ROBOFLOW_API_KEY); 
      
      try {
        // 2. Load the specific dataset from your screenshot
        const instance = await rf
          .workspace("wei-tq4ff") 
          .project("grocery-detection-vud86") 
          .version(1); // Check the 'Deploy' tab in Roboflow for version updates
        
        setModel(instance);
        setIsReady(true);
      } catch (error) {
        console.error("Failed to load Grocery model:", error);
      }
    };
    load();
  }, []);

  return { model, isReady };
};