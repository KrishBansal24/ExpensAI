// ============================================
// ExpensAI — ML-Based Anomaly Detection Engine
// ============================================
// Uses pre-trained statistical model parameters
// to detect anomalous expense patterns.
//
// Detection methods:
// 1. Z-score analysis (per-category and global)
// 2. Percentile-based outlier detection
// 3. Category-hour correlation anomaly
// 4. Distance anomaly from trained distribution
// 5. Frequency anomaly from trained distribution
// 6. Multi-feature anomaly scoring

import { FRAUD_CONFIG } from './fraudConfig.js';
import { getTrainedModel } from './modelTrainer.js';

const { ml: M } = FRAUD_CONFIG;

/**
 * Run ML-based anomaly detection on an expense.
 *
 * @param {Object} expense - The expense to analyze
 * @param {Object[]} userHistory - User's past expenses (for per-user profiling)
 * @returns {{ mlScore: number, reasons: string[], anomalyDetails: Object }}
 */
export function runMlEngine(expense, userHistory = []) {
  const model = getTrainedModel();
  const reasons = [];
  let totalPenalty = 0;
  const anomalyDetails = {};

  const amount = Number(expense.amount || 0);
  const category = expense.category || 'Other';
  const distanceKm = Number(expense.distance || expense.distanceKm || 0);
  const expDate = new Date(expense.date || expense.timestamp);
  const hourOfDay = expDate.getHours();
  const dayOfWeek = expDate.getDay();

  // ── 1. Global Amount Z-Score ─────────────────────
  // Compare expense amount against the global legitimate distribution
  const globalZScore = computeZScore(amount, model.globalAmountStats);
  anomalyDetails.globalAmountZScore = Number(globalZScore.toFixed(3));

  if (globalZScore > M.zScoreThreshold) {
    const penalty = Math.min(
      (globalZScore - M.zScoreThreshold) * M.amountZScorePenalty,
      M.maxMlPenalty * 0.4
    );
    totalPenalty += penalty;
    reasons.push(
      `Amount is ${globalZScore.toFixed(1)}σ above the global average (mean: ₹${model.globalAmountStats.mean.toFixed(0)}).`
    );
  }

  // ── 2. Per-Category Z-Score ──────────────────────
  // Compare against the category-specific distribution (more precise)
  if (model.categoryStats[category]?.legitimate) {
    const catStats = model.categoryStats[category].legitimate;
    const catZScore = computeZScore(amount, catStats);
    anomalyDetails.categoryAmountZScore = Number(catZScore.toFixed(3));

    if (catZScore > M.zScoreThreshold && catStats.count >= M.minHistoryForAnalysis) {
      const penalty = Math.min(
        (catZScore - M.zScoreThreshold) * M.amountZScorePenalty,
        M.maxMlPenalty * 0.3
      );
      totalPenalty += penalty;
      reasons.push(
        `Amount is ${catZScore.toFixed(1)}σ above the "${category}" category average (₹${catStats.mean.toFixed(0)}).`
      );
    }
  }

  // ── 3. Percentile-Based Detection ────────────────
  // Flag if expense is above the 95th percentile of legitimate expenses
  const isAboveP95 = amount > model.percentiles.p95;
  const isAboveP99 = amount > model.percentiles.p99;
  anomalyDetails.percentilePosition = isAboveP99 ? '99+' : isAboveP95 ? '95-99' : 'normal';

  if (isAboveP99) {
    totalPenalty += M.amountZScorePenalty;
    reasons.push(
      `Amount is above the 99th percentile of all legitimate expenses (₹${model.percentiles.p99.toFixed(0)}).`
    );
  } else if (isAboveP95) {
    totalPenalty += M.amountZScorePenalty * 0.5;
    reasons.push(
      `Amount is above the 95th percentile of legitimate expenses (₹${model.percentiles.p95.toFixed(0)}).`
    );
  }

  // ── 4. Category-Hour Anomaly ─────────────────────
  // Check if this category is unusual for the time of day
  if (model.categoryHourMatrix[category]) {
    const catHour = model.categoryHourMatrix[category];
    const hourZScore = Math.abs(hourOfDay - catHour.meanHour) / (catHour.stdHour || 1);
    anomalyDetails.categoryHourZScore = Number(hourZScore.toFixed(3));

    if (hourZScore > 2.5) {
      totalPenalty += M.categoryAnomalyPenalty;
      reasons.push(
        `Unusual time: "${category}" expenses typically occur around ${catHour.meanHour.toFixed(0)}:00, but this was at ${hourOfDay}:00.`
      );
    }
  }

  // ── 5. Distance Anomaly ──────────────────────────
  // Compare distance against trained distribution
  if (distanceKm > 0) {
    const distZScore = computeZScore(distanceKm, model.globalDistanceStats);
    anomalyDetails.distanceZScore = Number(distZScore.toFixed(3));

    if (distZScore > M.zScoreThreshold) {
      const penalty = Math.min(distZScore * 5, M.maxMlPenalty * 0.3);
      totalPenalty += penalty;
      reasons.push(
        `Distance (${distanceKm.toFixed(1)} km) is ${distZScore.toFixed(1)}σ above the normal range.`
      );
    }
  }

  // ── 6. Per-User Profile Analysis ─────────────────
  // If we have enough user history, compare against their personal baseline
  if (userHistory.length >= M.minHistoryForAnalysis) {
    const userAmounts = userHistory.map(e => Number(e.amount || 0));
    const userStats = {
      mean: userAmounts.reduce((a, b) => a + b, 0) / userAmounts.length,
      stddev: Math.sqrt(
        userAmounts.reduce((sum, v) => {
          const m = userAmounts.reduce((a, b) => a + b, 0) / userAmounts.length;
          return sum + (v - m) ** 2;
        }, 0) / (userAmounts.length - 1)
      ) || 1,
    };

    const userAmountZScore = (amount - userStats.mean) / userStats.stddev;
    anomalyDetails.userAmountZScore = Number(userAmountZScore.toFixed(3));

    if (userAmountZScore > M.zScoreThreshold) {
      const penalty = Math.min(
        (userAmountZScore - M.zScoreThreshold) * M.amountZScorePenalty * 0.8,
        M.maxMlPenalty * 0.3
      );
      totalPenalty += penalty;
      reasons.push(
        `Amount is ${userAmountZScore.toFixed(1)}σ above your personal average (₹${userStats.mean.toFixed(0)}).`
      );
    }
  }

  // ── 7. Weekend + High-Amount Combination ─────────
  // Trained model shows fraud concentrates on weekends with high amounts
  if ((dayOfWeek === 0 || dayOfWeek === 6) && amount > model.percentiles.p90) {
    const weekendFraudRate = model.dayDistribution.fraud[dayOfWeek] || 0;
    const totalFraud = Object.values(model.dayDistribution.fraud).reduce((a, b) => a + b, 0);
    const weekendConcentration = totalFraud > 0 ? weekendFraudRate / totalFraud : 0;

    anomalyDetails.weekendRiskMultiplier = Number(weekendConcentration.toFixed(3));

    if (weekendConcentration > 0.15) {
      totalPenalty += M.categoryAnomalyPenalty;
      reasons.push(
        `Weekend high-value expense pattern matches ${(weekendConcentration * 100).toFixed(0)}% of trained fraud cases.`
      );
    }
  }

  // ── 8. Multi-Feature Anomaly Score ───────────────
  // Use feature importance to weight the combined anomaly
  const featureImportance = model.featureImportance;
  if (featureImportance?.amount?.cohensD > 0.8 && globalZScore > 1.5) {
    // Amount is a strong fraud indicator per training data
    totalPenalty *= 1.1; // 10% boost for high-importance features
  }

  const mlScore = Math.min(Math.round(totalPenalty), 100);

  return { mlScore, reasons, anomalyDetails };
}

// ── Utility Functions ─────────────────────────────────

/**
 * Compute z-score: how many standard deviations from the mean.
 */
function computeZScore(value, stats) {
  if (!stats || stats.stddev === 0) return 0;
  return (value - stats.mean) / stats.stddev;
}
