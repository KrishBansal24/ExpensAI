// ============================================
// ExpensAI — Combined Risk Scorer
// ============================================
// Produces strict fraud outputs with explainable score breakdown:
// {
//   fraudScore: 0-100,
//   confidence: 0-1,
//   decision: APPROVED | REJECTED | UNDECIDED,
//   reasons: []
// }

import {
  DEFAULT_FRAUD_SETTINGS,
  FRAUD_DECISIONS,
  VERIFICATION_MODES,
  decisionFromScore,
  getFraudStatus,
  mergeFraudSettings,
  statusFromDecision,
} from './fraudConfig.js';
import { runRuleEngine } from './fraudEngine.js';
import { runGeoEngine } from './geoFraudEngine.js';
import { runMlEngine } from './mlAnomalyEngine.js';
import { runPolicyEngine } from './policyEngine.js';
import { generateFraudExplanation } from './fraudExplainer.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function uniqueReasons(reasons = []) {
  const seen = new Set();
  const output = [];
  for (const reason of reasons) {
    const text = String(reason || '').trim();
    if (!text) continue;
    if (seen.has(text)) continue;
    seen.add(text);
    output.push(text);
  }
  return output;
}

function computeConfidence({ score, signalScores, reasonsCount, verificationMode }) {
  const activeSignals = signalScores.filter((value) => Number(value) > 0).length;
  const coverageFactor = activeSignals / Math.max(signalScores.length, 1);
  const extremityFactor = Math.abs(Number(score || 0) - 50) / 50;
  const reasonFactor = Math.min(reasonsCount / 6, 1);
  const modeFactor = verificationMode === VERIFICATION_MODES.AUTO ? 0.03 : 0;

  const confidence = 0.42 + (coverageFactor * 0.28) + (extremityFactor * 0.20) + (reasonFactor * 0.07) + modeFactor;
  return Number(clamp(confidence, 0.35, 0.99).toFixed(3));
}

function buildDecisionReason(decision, reasons) {
  if (reasons.length > 0) return reasons[0];
  if (decision === FRAUD_DECISIONS.APPROVED) return 'Low-risk transaction under configured approval threshold.';
  if (decision === FRAUD_DECISIONS.REJECTED) return 'High-risk transaction above configured rejection threshold.';
  return 'Requires manual review under configured risk policy.';
}

function mergeFraudSignals({
  expense,
  settings,
  ruleResult,
  geoResult,
  mlResult,
  policyResult,
}) {
  const weightedScore =
    ruleResult.ruleScore * settings.weights.rules +
    geoResult.geoScore * settings.weights.geo +
    mlResult.mlScore * settings.weights.ml +
    policyResult.policyScore * settings.weights.policy;

  const fraudScore = clamp(Math.round(weightedScore), 0, 100);
  const fraudStatus = getFraudStatus(fraudScore, settings.thresholds);
  const reasons = uniqueReasons([
    ...ruleResult.reasons,
    ...geoResult.reasons,
    ...mlResult.reasons,
    ...policyResult.reasons,
  ]);

  const preModeDecision = decisionFromScore(fraudScore, settings.thresholds);
  const decision = settings.verificationMode === VERIFICATION_MODES.MANUAL
    ? FRAUD_DECISIONS.UNDECIDED
    : preModeDecision;

  const status = statusFromDecision(decision);
  const autoDecision = settings.verificationMode === VERIFICATION_MODES.AUTO && decision !== FRAUD_DECISIONS.UNDECIDED;
  const confidence = computeConfidence({
    score: fraudScore,
    signalScores: [ruleResult.ruleScore, geoResult.geoScore, mlResult.mlScore, policyResult.policyScore],
    reasonsCount: reasons.length,
    verificationMode: settings.verificationMode,
  });

  const decisionReason = buildDecisionReason(decision, reasons);

  const explanationInput = {
    expense,
    fraudScore,
    riskScore: fraudScore,
    confidence,
    decision,
    fraudStatus,
    reasons,
    fraudReasons: reasons,
    policyViolations: policyResult.violations,
    ruleResult,
    geoResult,
    mlResult,
    policyResult,
  };

  const fraudExplanation = generateFraudExplanation(explanationInput);

  return {
    fraudScore,
    confidence,
    decision,
    reasons,
    status,
    autoDecision,
    decisionReason,
    fraudStatus,
    fraudExplanation,
  };
}

/**
 * Run complete fraud detection pipeline with rule + geo + ml + policy signals.
 */
export async function analyzeExpense(expense, context = {}) {
  const {
    userExpenses = [],
    ocrData = null,
    previousExpense = null,
    googleMapsApiKey = null,
    fraudSettings = DEFAULT_FRAUD_SETTINGS,
  } = context;

  const settings = mergeFraudSettings(DEFAULT_FRAUD_SETTINGS, fraudSettings);
  const ruleResult = runRuleEngine(expense, userExpenses, ocrData);

  let geoResult;
  try {
    geoResult = await runGeoEngine(expense, previousExpense, googleMapsApiKey);
  } catch (err) {
    console.warn('Geo engine error, defaulting to zero:', err);
    geoResult = { geoScore: 0, reasons: [], userLocation: null, vendorLocation: null, distance: null };
  }

  const expenseWithGeo = {
    ...expense,
    userLocation: geoResult.userLocation,
    vendorLocation: geoResult.vendorLocation,
    distance: geoResult.distance,
    distanceKm: geoResult.distance || 0,
  };

  const mlResult = runMlEngine(expenseWithGeo, userExpenses);
  const policyResult = runPolicyEngine(expenseWithGeo, {
    userExpenses,
    policySettings: settings.policy,
  });

  const merged = mergeFraudSignals({
    expense,
    settings,
    ruleResult,
    geoResult,
    mlResult,
    policyResult,
  });

  return {
    // Strict output contract
    fraudScore: merged.fraudScore,
    confidence: merged.confidence,
    decision: merged.decision,
    reasons: merged.reasons,

    // Decision/execution metadata
    verificationMode: settings.verificationMode,
    autoDecision: merged.autoDecision,
    manualReviewRequired: merged.status === 'pending',
    status: merged.status,
    decisionReason: merged.decisionReason,
    overridden: false,
    overrideHistory: [],

    // Policy fields
    policyViolations: policyResult.violations,
    policyResult,

    // Legacy compatibility fields (used by existing UI)
    riskScore: merged.fraudScore,
    fraudStatus: merged.fraudStatus,
    fraudReasons: merged.reasons,
    fraudExplanation: merged.fraudExplanation,

    // Geo fields
    userLocation: geoResult.userLocation,
    vendorLocation: geoResult.vendorLocation,
    distance: geoResult.distance,
    geoData: {
      userLocation: geoResult.userLocation,
      vendorLocation: geoResult.vendorLocation,
      distance: geoResult.distance,
    },

    // Detailed factor breakdown
    scoreBreakdown: {
      ruleScore: ruleResult.ruleScore,
      geoScore: geoResult.geoScore,
      mlScore: mlResult.mlScore,
      policyScore: policyResult.policyScore,
    },
    ruleResult: {
      ruleScore: ruleResult.ruleScore,
      flags: ruleResult.flags,
      reasons: ruleResult.reasons,
    },
    geoResult: {
      geoScore: geoResult.geoScore,
      reasons: geoResult.reasons,
      distance: geoResult.distance,
    },
    mlResult: {
      mlScore: mlResult.mlScore,
      reasons: mlResult.reasons,
      anomalyDetails: mlResult.anomalyDetails,
    },
    settingsSnapshot: {
      thresholds: settings.thresholds,
      weights: settings.weights,
    },
  };
}

/**
 * Quick fraud assessment without geocoding calls.
 */
export function analyzeExpenseSync(expense, userExpenses = [], ocrData = null, context = {}) {
  const settings = mergeFraudSettings(DEFAULT_FRAUD_SETTINGS, context.fraudSettings || {});
  const ruleResult = runRuleEngine(expense, userExpenses, ocrData);
  const mlResult = runMlEngine(expense, userExpenses);
  const geoResult = { geoScore: 0, reasons: [], userLocation: null, vendorLocation: null, distance: null };
  const policyResult = runPolicyEngine(expense, {
    userExpenses,
    policySettings: settings.policy,
  });

  const merged = mergeFraudSignals({
    expense,
    settings,
    ruleResult,
    geoResult,
    mlResult,
    policyResult,
  });

  return {
    fraudScore: merged.fraudScore,
    confidence: merged.confidence,
    decision: merged.decision,
    reasons: merged.reasons,

    verificationMode: settings.verificationMode,
    autoDecision: merged.autoDecision,
    manualReviewRequired: merged.status === 'pending',
    status: merged.status,
    decisionReason: merged.decisionReason,
    overridden: false,
    overrideHistory: [],
    policyViolations: policyResult.violations,
    policyResult,

    riskScore: merged.fraudScore,
    fraudStatus: merged.fraudStatus,
    fraudReasons: merged.reasons,
    fraudExplanation: merged.fraudExplanation,
    userLocation: null,
    vendorLocation: null,
    distance: null,
    scoreBreakdown: {
      ruleScore: ruleResult.ruleScore,
      geoScore: 0,
      mlScore: mlResult.mlScore,
      policyScore: policyResult.policyScore,
    },
    ruleResult: { ruleScore: ruleResult.ruleScore, flags: ruleResult.flags, reasons: ruleResult.reasons },
    geoResult: { geoScore: 0, reasons: [], distance: null },
    mlResult: { mlScore: mlResult.mlScore, reasons: mlResult.reasons, anomalyDetails: mlResult.anomalyDetails },
    settingsSnapshot: {
      thresholds: settings.thresholds,
      weights: settings.weights,
    },
  };
}
