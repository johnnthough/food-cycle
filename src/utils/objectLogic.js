
const FOOD_METRICS = {
  // Fruits
  apple: { baseDays: 14, decayRate: 0.05 },
  banana: { baseDays: 7, decayRate: 0.15 },
  orange: { baseDays: 10, decayRate: 0.08 },
  
  // Vegetables
  broccoli: { baseDays: 6, decayRate: 0.12 },
  carrot: { baseDays: 21, decayRate: 0.03 },
  "potted plant": { baseDays: 30, decayRate: 0.01 }, // Often detects herbs/leafy greens as this
  
  // Proteins & Perishables (COCO-SSD categories)
  sandwich: { baseDays: 2, decayRate: 0.40 },
  "hot dog": { baseDays: 5, decayRate: 0.20 },
  pizza: { baseDays: 3, decayRate: 0.30 },
  donut: { baseDays: 2, decayRate: 0.50 },
  cake: { baseDays: 4, decayRate: 0.25 },
};

export const calculateLiveFreshness = (label, score, clusterSize = 1) => {
  const metric = FOOD_METRICS[label] || { baseDays: 5, decayRate: 0.1 };
  
  const confidenceVariance = (1 - score) * 5; 
  const clusterPenalty = clusterSize > 5 ? 1.5 : 0; // Bulk box logic

  const estimatedDays = Math.max(0.5, (metric.baseDays - confidenceVariance - clusterPenalty).toFixed(1));

  return {
    label,
    daysRemaining: estimatedDays,
    confidence: (score * 100).toFixed(1),
    isViable: estimatedDays > 0,
    isBulk: clusterSize > 1,
    color: estimatedDays < 3 ? "#ef4444" : "#22c55e"
  };
};