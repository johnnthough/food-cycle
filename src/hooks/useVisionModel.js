import { useState, useEffect } from "react"; // ADD THIS LINE
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";

export const useVisionModel = () => {
  const [model, setModel] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      await tf.ready();
      
      try {
        const cachedModel = await tf.loadGraphModel('indexeddb://coco-ssd-model');
        setModel(cachedModel);
        setIsReady(true);
      } catch (e) {
        // Defaults to 'lite_mobilenet_v2' for speed if no cache exists
        const instance = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        
        // Save to cache for next time
        await instance.model.save('indexeddb://coco-ssd-model');
        
        setModel(instance);
        setIsReady(true);
      }
    };
    load();
  }, []);

  return { model, isReady };
};