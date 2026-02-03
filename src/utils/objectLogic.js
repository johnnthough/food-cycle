/** * FOOD_METRICS: Keys must match Roboflow class names EXACTLY (Case-sensitive)
 */
const FOOD_METRICS = {
  "Beef-Tomato": { baseDays: 7, decayRate: 0.1 },
  "Green-Bell-Pepper": { baseDays: 10, decayRate: 0.08 },
  "Red-Bell-Pepper": { baseDays: 8, decayRate: 0.12 },
  "Granny-Smith": { baseDays: 14, decayRate: 0.05 },
  "Banana": { baseDays: 6, decayRate: 0.15 },
  "Carrots": { baseDays: 21, decayRate: 0.03 },
  "Onion": { baseDays: 30, decayRate: 0.02 },
  "Cucumber": { baseDays: 7, decayRate: 0.15 },
  "Ginger": { baseDays: 28, decayRate: 0.02 },
  "Garlic": { baseDays: 60, decayRate: 0.01 }
};

/** * Helper to clean up Roboflow labels (e.g., "Beef-Tomato" -> "Beef Tomato")
 */
export const formatLabel = (label) => {
  if (!label) return "Unknown Item";
  return label.replace(/-/g, ' '); 
};

export const calculateLiveFreshness = (rawLabel, score) => {
  // Use bracket notation to access hyphenated keys safely
  const metric = FOOD_METRICS[rawLabel] || { baseDays: 5, decayRate: 0.1 };

  const confidenceVariance = (1 - (score || 0)) * 5; 
  const estimatedDays = Math.max(0.5, (metric.baseDays - confidenceVariance).toFixed(1));

  return {
    displayName: formatLabel(rawLabel), 
    daysRemaining: estimatedDays,
    confidence: ((score || 0) * 100).toFixed(1),
    color: estimatedDays < 3 ? "#ef4444" : "#22c55e"
  };
};