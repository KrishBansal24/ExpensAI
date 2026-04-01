// ============================================
// ExpensAI — Fraud Detection Configuration
// ============================================
// Central configuration and normalization helpers used by
// rule/geo/ml/policy scoring and admin verification controls.

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const VERIFICATION_MODES = {
  MANUAL: 'MANUAL',
  AUTO: 'AUTO',
};

export const FRAUD_DECISIONS = {
  APPROVED: 'APPROVED',
  UNDECIDED: 'UNDECIDED',
  REJECTED: 'REJECTED',
};

export const FRAUD_CONFIG = {
  // Legacy runtime defaults (kept for backward compatibility)
  weights: {
    rules: 0.40,
    geo: 0.30,
    ml: 0.30,
  },
  thresholds: {
    safe: 30,
    review: 70,
  },
  rules: {
    amountThreshold: 15000,
    roundedAmountMin: 5000,
    duplicateTimeWindowMs: 24 * 60 * 60 * 1000,
    duplicateAmountTolerance: 0.10,
    frequencyLimitPerDay: 8,
    amountMismatchTolerance: 0.10,
    missingFieldPenalty: 20,
    duplicatePenalty: 35,
    amountMismatchPenalty: 30,
    highAmountPenalty: 25,
    frequencyPenalty: 20,
    roundedAmountPenalty: 10,
    weekendPenalty: 8,
  },
  geo: {
    distanceThresholdKm: 100,
    impossibleTravelSpeedKmh: 900,
    distancePenaltyPerKm: 0.5,
    maxGeoPenalty: 40,
    impossibleTravelPenalty: 50,
    geocodeTimeoutMs: 5000,
  },
  ml: {
    zScoreThreshold: 2.0,
    percentileThreshold: 95,
    minHistoryForAnalysis: 3,
    amountZScorePenalty: 15,
    frequencyZScorePenalty: 12,
    categoryAnomalyPenalty: 8,
    maxMlPenalty: 50,
  },
  statusLabels: {
    safe: 'safe',
    review: 'review',
    fraud: 'fraud',
    unanalyzed: 'unanalyzed',
  },
};

export const DEFAULT_FRAUD_SETTINGS = {
  verificationMode: VERIFICATION_MODES.MANUAL,
  thresholds: {
    approveMax: 30,
    rejectMin: 70,
    highRisk: 85,
  },
  weights: {
    rules: 0.30,
    geo: 0.20,
    ml: 0.30,
    policy: 0.20,
  },
  policy: {
    defaultCategoryLimit: 15000,
    maxExpensePerCategory: {
      Food: 4000,
      Travel: 25000,
      Shopping: 12000,
      Bills: 18000,
      Entertainment: 12000,
      Other: 10000,
      General: 12000,
    },
    allowedCities: [],
    geofence: {
      enabled: false,
      center: { lat: 28.6139, lng: 77.2090 },
      radiusKm: 150,
    },
    restrictedVendors: [],
    vendorWhitelist: [],
    enforceWhitelist: false,
    timeWindow: {
      enabled: false,
      startHour: 6,
      endHour: 23,
      allowedWeekDays: [0, 1, 2, 3, 4, 5, 6],
    },
    dailyLimit: 25000,
    weeklyLimit: 100000,
    upiSubmitPolicy: {
      timeLimitMinutes: 30,
      radiusKm: 5,
    },
  },
  dataStrategy: {
    realDataWeight: 0.90,
    syntheticDataWeight: 0.10,
    syntheticWeightCap: 0.20,
    primaryDatasets: [
      'IEEE-CIS Fraud Detection (Kaggle)',
      'PaySim Mobile Money Fraud (Kaggle)',
    ],
    syntheticUsage: [
      'edge_cases_only',
      'expense_domain_adaptation',
    ],
  },
};

export function normalizeThresholds(thresholds = {}) {
  const approveMax = clamp(Number(thresholds.approveMax ?? DEFAULT_FRAUD_SETTINGS.thresholds.approveMax), 0, 95);
  const rejectMinRaw = clamp(Number(thresholds.rejectMin ?? DEFAULT_FRAUD_SETTINGS.thresholds.rejectMin), 5, 100);
  const rejectMin = Math.max(rejectMinRaw, approveMax + 1);
  const highRisk = clamp(Number(thresholds.highRisk ?? DEFAULT_FRAUD_SETTINGS.thresholds.highRisk), rejectMin, 100);

  return { approveMax, rejectMin, highRisk };
}

export function normalizeWeights(weights = {}) {
  const next = {
    rules: Number(weights.rules ?? DEFAULT_FRAUD_SETTINGS.weights.rules),
    geo: Number(weights.geo ?? DEFAULT_FRAUD_SETTINGS.weights.geo),
    ml: Number(weights.ml ?? DEFAULT_FRAUD_SETTINGS.weights.ml),
    policy: Number(weights.policy ?? DEFAULT_FRAUD_SETTINGS.weights.policy),
  };

  const nonNegative = Object.fromEntries(
    Object.entries(next).map(([key, value]) => [key, Number.isFinite(value) ? Math.max(value, 0) : 0]),
  );

  const total = Object.values(nonNegative).reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return { ...DEFAULT_FRAUD_SETTINGS.weights };
  }

  return {
    rules: nonNegative.rules / total,
    geo: nonNegative.geo / total,
    ml: nonNegative.ml / total,
    policy: nonNegative.policy / total,
  };
}

function normalizePolicy(policy = {}) {
  const mergedPolicy = {
    ...DEFAULT_FRAUD_SETTINGS.policy,
    ...policy,
    geofence: {
      ...DEFAULT_FRAUD_SETTINGS.policy.geofence,
      ...(policy.geofence || {}),
    },
    timeWindow: {
      ...DEFAULT_FRAUD_SETTINGS.policy.timeWindow,
      ...(policy.timeWindow || {}),
    },
    maxExpensePerCategory: {
      ...DEFAULT_FRAUD_SETTINGS.policy.maxExpensePerCategory,
      ...(policy.maxExpensePerCategory || {}),
    },
    upiSubmitPolicy: {
      ...DEFAULT_FRAUD_SETTINGS.policy.upiSubmitPolicy,
      ...(policy.upiSubmitPolicy || {}),
    },
  };

  const toStringList = (value) => {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.map((entry) => String(entry || '').trim()).filter(Boolean))];
  };

  const allowedWeekDays = Array.isArray(mergedPolicy.timeWindow.allowedWeekDays)
    ? mergedPolicy.timeWindow.allowedWeekDays
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
    : DEFAULT_FRAUD_SETTINGS.policy.timeWindow.allowedWeekDays;

  return {
    ...mergedPolicy,
    defaultCategoryLimit: Math.max(Number(mergedPolicy.defaultCategoryLimit || 0), 0),
    dailyLimit: Math.max(Number(mergedPolicy.dailyLimit || 0), 0),
    weeklyLimit: Math.max(Number(mergedPolicy.weeklyLimit || 0), 0),
    allowedCities: toStringList(mergedPolicy.allowedCities),
    restrictedVendors: toStringList(mergedPolicy.restrictedVendors),
    vendorWhitelist: toStringList(mergedPolicy.vendorWhitelist),
    geofence: {
      ...mergedPolicy.geofence,
      radiusKm: Math.max(Number(mergedPolicy.geofence.radiusKm || 0), 1),
      center: {
        lat: Number(mergedPolicy.geofence.center?.lat ?? DEFAULT_FRAUD_SETTINGS.policy.geofence.center.lat),
        lng: Number(mergedPolicy.geofence.center?.lng ?? DEFAULT_FRAUD_SETTINGS.policy.geofence.center.lng),
      },
    },
    timeWindow: {
      ...mergedPolicy.timeWindow,
      startHour: clamp(Number(mergedPolicy.timeWindow.startHour ?? 0), 0, 23),
      endHour: clamp(Number(mergedPolicy.timeWindow.endHour ?? 23), 0, 23),
      allowedWeekDays,
    },
    upiSubmitPolicy: {
      timeLimitMinutes: Math.max(Number(mergedPolicy.upiSubmitPolicy?.timeLimitMinutes || 30), 1),
      radiusKm: Math.max(Number(mergedPolicy.upiSubmitPolicy?.radiusKm || 5), 0.1),
    },
  };
}

export function mergeFraudSettings(...settingsList) {
  const merged = settingsList.reduce((acc, current) => {
    const next = current || {};
    return {
      ...acc,
      ...next,
      thresholds: {
        ...acc.thresholds,
        ...(next.thresholds || {}),
      },
      weights: {
        ...acc.weights,
        ...(next.weights || {}),
      },
      policy: {
        ...acc.policy,
        ...(next.policy || {}),
      },
      dataStrategy: {
        ...acc.dataStrategy,
        ...(next.dataStrategy || {}),
      },
    };
  }, DEFAULT_FRAUD_SETTINGS);

  const normalized = {
    ...merged,
    verificationMode: merged.verificationMode === VERIFICATION_MODES.AUTO
      ? VERIFICATION_MODES.AUTO
      : VERIFICATION_MODES.MANUAL,
    thresholds: normalizeThresholds(merged.thresholds),
    weights: normalizeWeights(merged.weights),
    policy: normalizePolicy(merged.policy),
  };

  const realDataWeight = clamp(Number(normalized.dataStrategy.realDataWeight || 0.9), 0.5, 0.99);
  const syntheticWeightCap = clamp(Number(normalized.dataStrategy.syntheticWeightCap || 0.2), 0.01, 0.5);
  const syntheticDataWeight = clamp(
    Number(normalized.dataStrategy.syntheticDataWeight || (1 - realDataWeight)),
    0.01,
    syntheticWeightCap,
  );

  return {
    ...normalized,
    dataStrategy: {
      ...normalized.dataStrategy,
      realDataWeight,
      syntheticWeightCap,
      syntheticDataWeight,
    },
  };
}

export function decisionFromScore(score, thresholds = DEFAULT_FRAUD_SETTINGS.thresholds) {
  const safeThresholds = normalizeThresholds(thresholds);
  const safeScore = clamp(Number(score || 0), 0, 100);

  if (safeScore <= safeThresholds.approveMax) return FRAUD_DECISIONS.APPROVED;
  if (safeScore >= safeThresholds.rejectMin) return FRAUD_DECISIONS.REJECTED;
  return FRAUD_DECISIONS.UNDECIDED;
}

export function statusFromDecision(decision) {
  if (decision === FRAUD_DECISIONS.APPROVED) return 'approved';
  if (decision === FRAUD_DECISIONS.REJECTED) return 'rejected';
  return 'pending';
}

export function decisionFromStatus(status) {
  if (status === 'approved') return FRAUD_DECISIONS.APPROVED;
  if (status === 'rejected') return FRAUD_DECISIONS.REJECTED;
  return FRAUD_DECISIONS.UNDECIDED;
}

/**
 * Get legacy fraud status label from a numeric risk score.
 * @param {number} score - Risk score 0-100
 * @param {{ approveMax:number, rejectMin:number }} thresholds
 * @returns {'safe'|'review'|'fraud'}
 */
export function getFraudStatus(score, thresholds = DEFAULT_FRAUD_SETTINGS.thresholds) {
  const safeThresholds = normalizeThresholds(thresholds);
  if (score <= safeThresholds.approveMax) return FRAUD_CONFIG.statusLabels.safe;
  if (score < safeThresholds.rejectMin) return FRAUD_CONFIG.statusLabels.review;
  return FRAUD_CONFIG.statusLabels.fraud;
}
