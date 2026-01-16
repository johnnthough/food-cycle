import { useState, useEffect } from 'react';
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";

export const useVisionModel = () => {
  const [model, setModel] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      await tf.ready(); // Ensure engine is ready
      const instance = await cocoSsd.load();
      setModel(instance);
      setIsReady(true);
    };
    load();
  }, []);

  return { model, isReady };
};