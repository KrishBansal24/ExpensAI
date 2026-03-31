// ============================================
// ExpensAI — Fraud Explanation Generator
// ============================================
// Generates explainable, audit-friendly narrative outputs.

import {
  FRAUD_CONFIG,
  FRAUD_DECISIONS,
  VERIFICATION_MODES,
  decisionFromScore,
  getFraudStatus,
} from './fraudConfig.js';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function pickReasons(payload) {
  const reasons = payload?.reasons || payload?.fraudReasons || [];
  if (!Array.isArray(reasons)) return [];
  return reasons
    .map((reason) => String(reason || '').trim())
    .filter(Boolean);
}

function pickDecision(payload, score) {
  if (payload?.decision) return payload.decision;
  if (payload?.verificationMode === VERIFICATION_MODES.MANUAL) return FRAUD_DECISIONS.UNDECIDED;
  return decisionFromScore(score, payload?.settingsSnapshot?.thresholds);
}

/**
 * Generates a transparent narrative explanation for a transaction.
 */
export function generateFraudExplanation(payload) {
  if (!payload) {
    return 'Fraud analysis has not been performed on this transaction.';
  }

  const fraudScore = toNumber(payload.fraudScore ?? payload.riskScore, 0);
  const confidence = toNumber(payload.confidence, 0.5);
  const decision = pickDecision(payload, fraudScore);
  const fraudStatus = payload.fraudStatus || getFraudStatus(fraudScore, payload?.settingsSnapshot?.thresholds);
  const reasons = pickReasons(payload);
  const policyViolations = Array.isArray(payload.policyViolations) ? payload.policyViolations : [];

  const lines = [];
  lines.push(`Fraud score: ${fraudScore}/100`);
  lines.push(`Confidence: ${(confidence * 100).toFixed(1)}%`);
  lines.push(`Decision: ${decision}`);
  lines.push(`Fraud status: ${fraudStatus}`);
  lines.push('');

  if (reasons.length > 0) {
    lines.push('Contributing factors:');
    reasons.forEach((reason) => lines.push(`- ${reason}`));
  } else {
    lines.push('Contributing factors:');
    lines.push('- No explicit risk factors detected from current signals.');
  }

  if (policyViolations.length > 0) {
    lines.push('');
    lines.push('Policy violations:');
    policyViolations.forEach((violation) => {
      const type = violation.type || 'POLICY';
      const detail = violation.reason || 'Violation detected.';
      lines.push(`- [${type}] ${detail}`);
    });
  }

  if (payload.scoreBreakdown) {
    const breakdown = payload.scoreBreakdown;
    lines.push('');
    lines.push('Score breakdown:');
    lines.push(`- Rule score: ${toNumber(breakdown.ruleScore)}/100`);
    lines.push(`- Geo score: ${toNumber(breakdown.geoScore)}/100`);
    lines.push(`- ML score: ${toNumber(breakdown.mlScore)}/100`);
    lines.push(`- Policy score: ${toNumber(breakdown.policyScore)}/100`);
  }

  lines.push('');
  if (decision === FRAUD_DECISIONS.REJECTED) {
    lines.push('Recommended action: keep rejected unless validated with strong supporting evidence.');
  } else if (decision === FRAUD_DECISIONS.UNDECIDED) {
    lines.push('Recommended action: route to manual verification and request supporting proof.');
  } else {
    lines.push('Recommended action: approve and continue passive monitoring.');
  }

  return lines.join('\n');
}

export function generateShortSummary(scoreOrPayload, fraudReasons = []) {
  const payload = typeof scoreOrPayload === 'object'
    ? scoreOrPayload
    : { fraudScore: scoreOrPayload, fraudReasons };

  const fraudScore = toNumber(payload.fraudScore ?? payload.riskScore, 0);
  const status = payload.fraudStatus || getFraudStatus(fraudScore);
  const reasons = pickReasons(payload);

  if (reasons.length > 0) {
    return reasons[0];
  }

  if (status === FRAUD_CONFIG.statusLabels.safe) {
    return 'No suspicious patterns detected.';
  }
  if (status === FRAUD_CONFIG.statusLabels.review) {
    return 'Moderate risk, manual review recommended.';
  }
  return 'High fraud risk, reject or escalate investigation.';
}
