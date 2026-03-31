// ============================================
// ExpensAI — ML Model Trainer
// ============================================
// Pre-computes statistical model parameters from
// the training dataset. These parameters are used
// at runtime for anomaly detection without needing
// a Python ML pipeline.
//
// Training methodology:
// 1. Compute per-category statistics (mean, stddev, percentiles)
// 2. Compute global statistics across all features
// 3. Build category-hour correlation matrix
// 4. Compute distance distribution parameters
// 5. Build a simple decision boundary (logistic-like threshold)

import { TRAINING_DATA } from './trainingData.js';
import { SYNTHETIC_EDGE_CASES } from './syntheticEdgeCases.js';
import { DEFAULT_FRAUD_SETTINGS } from './fraudConfig.js';

function buildTrainingCorpus() {
  const realRecords = Array.isArray(TRAINING_DATA)
    ? TRAINING_DATA.map((record) => ({ ...record, dataSource: 'real' }))
    : [];

  const targetSyntheticWeight = Number(DEFAULT_FRAUD_SETTINGS.dataStrategy.syntheticDataWeight || 0.1);
  const syntheticWeightCap = Number(DEFAULT_FRAUD_SETTINGS.dataStrategy.syntheticWeightCap || 0.2);

  const maxByCap = Math.floor((realRecords.length * syntheticWeightCap) / Math.max(1 - syntheticWeightCap, 0.0001));
  const targetByWeight = Math.floor((realRecords.length * targetSyntheticWeight) / Math.max(1 - targetSyntheticWeight, 0.0001));
  const syntheticRowLimit = Math.max(0, Math.min(SYNTHETIC_EDGE_CASES.length, Math.min(maxByCap, targetByWeight)));

  const syntheticRecords = SYNTHETIC_EDGE_CASES
    .slice(0, syntheticRowLimit)
    .map((record) => ({ ...record, dataSource: 'synthetic' }));

  const records = [...realRecords, ...syntheticRecords];
  const syntheticRatio = records.length > 0 ? syntheticRecords.length / records.length : 0;

  return {
    records,
    dataMix: {
      realCount: realRecords.length,
      syntheticCount: syntheticRecords.length,
      syntheticRatio: Number(syntheticRatio.toFixed(4)),
      syntheticRatioPercent: `${(syntheticRatio * 100).toFixed(1)}%`,
      strategy: 'real-primary',
      syntheticCap: syntheticWeightCap,
    },
  };
}

/**
 * Train the anomaly detection model from the dataset.
 * Returns a serializable model object with all computed parameters.
 *
 * @returns {Object} Trained model parameters
 */
export function trainModel() {
  const { records: trainingRecords, dataMix } = buildTrainingCorpus();
  const legitimate = trainingRecords.filter(r => !r.isFraud);
  const fraudulent = trainingRecords.filter(r => r.isFraud);

  // ── 1. Global Amount Statistics ──────────────────
  const globalAmountStats = computeStats(legitimate.map(r => r.amount));
  const fraudAmountStats = computeStats(fraudulent.map(r => r.amount));

  // ── 2. Per-Category Amount Statistics ────────────
  const categories = [...new Set(trainingRecords.map(r => r.category))];
  const categoryStats = {};
  for (const cat of categories) {
    const catLegitimate = legitimate.filter(r => r.category === cat);
    const catFraud = fraudulent.filter(r => r.category === cat);
    categoryStats[cat] = {
      legitimate: computeStats(catLegitimate.map(r => r.amount)),
      fraud: computeStats(catFraud.map(r => r.amount)),
      count: catLegitimate.length,
      fraudCount: catFraud.length,
    };
  }

  // ── 3. Distance Statistics ──────────────────────
  const globalDistanceStats = computeStats(legitimate.map(r => r.distanceKm));
  const fraudDistanceStats = computeStats(fraudulent.map(r => r.distanceKm));

  // ── 4. Frequency Statistics ─────────────────────
  const globalFrequencyStats = computeStats(legitimate.map(r => r.frequency));
  const fraudFrequencyStats = computeStats(fraudulent.map(r => r.frequency));

  // ── 5. Category-Hour Correlation ────────────────
  // Build a matrix showing which categories are normal for which hours
  const categoryHourMatrix = {};
  for (const cat of categories) {
    const catRecords = legitimate.filter(r => r.category === cat);
    const hours = catRecords.map(r => r.hourOfDay);
    categoryHourMatrix[cat] = {
      meanHour: mean(hours),
      stdHour: stddev(hours),
      minHour: Math.min(...hours),
      maxHour: Math.max(...hours),
    };
  }

  // ── 6. Day-of-Week Distribution ─────────────────
  const dayDistribution = {
    legitimate: computeDayDistribution(legitimate),
    fraud: computeDayDistribution(fraudulent),
  };

  // ── 7. Percentile Thresholds ────────────────────
  // Compute key percentiles for amount detection
  const percentiles = {
    p75: percentile(legitimate.map(r => r.amount), 75),
    p90: percentile(legitimate.map(r => r.amount), 90),
    p95: percentile(legitimate.map(r => r.amount), 95),
    p99: percentile(legitimate.map(r => r.amount), 99),
  };

  // ── 8. Feature Importance Weights ───────────────
  // Computed from the separation between fraud and legitimate distributions
  const featureImportance = computeFeatureImportance(legitimate, fraudulent);

  // ── 9. Decision Boundaries ──────────────────────
  // Simple threshold-based boundaries derived from training data
  const decisionBoundaries = {
    amount: {
      // Amount above which fraud probability increases sharply
      softThreshold: globalAmountStats.mean + 2 * globalAmountStats.stddev,
      hardThreshold: globalAmountStats.mean + 3 * globalAmountStats.stddev,
    },
    distance: {
      softThreshold: globalDistanceStats.mean + 2 * globalDistanceStats.stddev,
      hardThreshold: globalDistanceStats.mean + 3 * globalDistanceStats.stddev,
    },
    frequency: {
      softThreshold: globalFrequencyStats.mean + 2 * globalFrequencyStats.stddev,
      hardThreshold: globalFrequencyStats.mean + 3 * globalFrequencyStats.stddev,
    },
  };

  return {
    version: '1.1.0',
    trainedAt: new Date().toISOString(),
    datasetSize: trainingRecords.length,
    fraudRate: trainingRecords.length > 0 ? fraudulent.length / trainingRecords.length : 0,
    dataMix,

    globalAmountStats,
    fraudAmountStats,
    categoryStats,
    globalDistanceStats,
    fraudDistanceStats,
    globalFrequencyStats,
    fraudFrequencyStats,
    categoryHourMatrix,
    dayDistribution,
    percentiles,
    featureImportance,
    decisionBoundaries,
  };
}

// ── Statistical Utility Functions ─────────────────────

function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower]);
}

function computeStats(values) {
  if (values.length === 0) {
    return { mean: 0, stddev: 0, min: 0, max: 0, median: 0, count: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  return {
    mean: mean(values),
    stddev: stddev(values),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)],
    count: values.length,
  };
}

function computeDayDistribution(records) {
  const dist = {};
  for (let d = 0; d <= 6; d++) {
    dist[d] = records.filter(r => r.dayOfWeek === d).length;
  }
  return dist;
}

/**
 * Compute a simple feature importance score based on
 * the Kolmogorov-Smirnov-like separation between
 * fraud and legitimate feature distributions.
 */
function computeFeatureImportance(legitimate, fraudulent) {
  const features = ['amount', 'distanceKm', 'frequency', 'hourOfDay'];
  const importance = {};

  for (const feat of features) {
    const legValues = legitimate.map(r => r[feat]);
    const fraudValues = fraudulent.map(r => r[feat]);

    const legMean = mean(legValues);
    const fraudMean = mean(fraudValues);
    const legStd = stddev(legValues) || 1;
    const fraudStd = stddev(fraudValues) || 1;

    // Cohen's d — effect size between the two distributions
    const pooledStd = Math.sqrt((legStd ** 2 + fraudStd ** 2) / 2);
    const cohensD = Math.abs(fraudMean - legMean) / (pooledStd || 1);

    importance[feat] = {
      cohensD: Number(cohensD.toFixed(3)),
      legMean: Number(legMean.toFixed(2)),
      fraudMean: Number(fraudMean.toFixed(2)),
      separation: cohensD > 0.8 ? 'high' : cohensD > 0.5 ? 'medium' : 'low',
    };
  }

  return importance;
}

// ── Pre-trained Model (eager computation) ─────────────
// The model is trained once at import time.
// This avoids re-computation on every fraud check.
let _cachedModel = null;

/**
 * Get the pre-trained model. Computed lazily on first call
 * and cached for all subsequent calls.
 */
export function getTrainedModel() {
  if (!_cachedModel) {
    _cachedModel = trainModel();
  }
  return _cachedModel;
}
