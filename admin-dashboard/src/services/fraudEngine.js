// ============================================
// ExpensAI — Rule-Based Fraud Detection Engine
// ============================================
// Implements 6 configurable fraud detection rules.
// Each rule returns a penalty score and a reason.
// The engine aggregates all penalties into a single
// rule score capped at 100.

import { FRAUD_CONFIG } from './fraudConfig.js';

const { rules: R } = FRAUD_CONFIG;

/**
 * Run all rule-based fraud checks on an expense.
 *
 * @param {Object} expense - The expense being evaluated
 * @param {Object[]} userExpenses - All previous expenses for this user
 * @param {Object|null} ocrData - Structured OCR extraction (if available)
 * @returns {{ ruleScore: number, reasons: string[], flags: string[] }}
 */
export function runRuleEngine(expense, userExpenses = [], ocrData = null) {
  const reasons = [];
  const flags = [];
  let totalPenalty = 0;

  // ── Rule 1: Duplicate Invoice Detection ──────────
  // Flags expenses with a similar vendor + amount within 24h
  const duplicateResult = checkDuplicateInvoice(expense, userExpenses);
  if (duplicateResult.isDuplicate) {
    totalPenalty += R.duplicatePenalty;
    reasons.push(duplicateResult.reason);
    flags.push('DUPLICATE_INVOICE');
  }

  // ── Rule 2: Amount Mismatch (OCR vs User Input) ──
  // Compares the OCR-extracted amount against user-entered amount
  if (ocrData && ocrData.amount != null) {
    const mismatchResult = checkAmountMismatch(expense.amount, ocrData.amount);
    if (mismatchResult.isMismatch) {
      totalPenalty += R.amountMismatchPenalty;
      reasons.push(mismatchResult.reason);
      flags.push('AMOUNT_MISMATCH');
    }
  }

  // ── Rule 3: Amount Threshold ─────────────────────
  // Flags single expenses exceeding the policy limit
  if (Number(expense.amount) > R.amountThreshold) {
    totalPenalty += R.highAmountPenalty;
    reasons.push(
      `Amount ₹${Number(expense.amount).toLocaleString('en-IN')} exceeds the single-transaction policy limit of ₹${R.amountThreshold.toLocaleString('en-IN')}.`
    );
    flags.push('HIGH_AMOUNT');
  }

  // ── Rule 4: Frequency Burst ──────────────────────
  // Flags if user submitted too many expenses in 24 hours
  const freqResult = checkFrequencyBurst(expense, userExpenses);
  if (freqResult.isBurst) {
    totalPenalty += R.frequencyPenalty;
    reasons.push(freqResult.reason);
    flags.push('FREQUENCY_BURST');
  }

  // ── Rule 5: Missing Required Fields ──────────────
  // Penalizes expenses with missing vendor, amount, or receipt
  const missingResult = checkMissingFields(expense);
  if (missingResult.hasMissing) {
    totalPenalty += R.missingFieldPenalty * missingResult.missingCount;
    reasons.push(...missingResult.reasons);
    flags.push('MISSING_FIELDS');
  }

  // ── Rule 6: Suspiciously Rounded Amount ──────────
  // Large perfectly round amounts may indicate fabrication
  const amount = Number(expense.amount);
  if (amount >= R.roundedAmountMin && amount % 1000 === 0) {
    totalPenalty += R.roundedAmountPenalty;
    reasons.push(
      `Exact rounded amount (₹${amount.toLocaleString('en-IN')}) may require additional verification.`
    );
    flags.push('ROUNDED_AMOUNT');
  }

  // ── Rule 6b: Weekend Expense Without Notes ───────
  const expDate = new Date(expense.date || expense.timestamp);
  const dayOfWeek = expDate.getDay();
  if ((dayOfWeek === 0 || dayOfWeek === 6) && (!expense.notes || expense.notes.length < 10)) {
    totalPenalty += R.weekendPenalty;
    reasons.push('Expense submitted on a weekend without detailed justification.');
    flags.push('WEEKEND_NO_NOTES');
  }

  // Cap the rule score at 100
  const ruleScore = Math.min(totalPenalty, 100);

  return { ruleScore, reasons, flags };
}

// ── Helpers ──────────────────────────────────────────

/**
 * Check if the expense is a potential duplicate of a recent submission.
 */
function checkDuplicateInvoice(expense, userExpenses) {
  const newDate = new Date(expense.date || expense.timestamp).getTime();
  const newAmount = Number(expense.amount);
  const newVendor = (expense.vendor || expense.merchantName || '').toLowerCase();

  if (!newVendor || !newAmount) {
    return { isDuplicate: false };
  }

  for (const prev of userExpenses) {
    // Skip the same document
    if (prev.id && prev.id === expense.id) continue;

    const prevDate = new Date(prev.date || prev.timestamp).getTime();
    const prevAmount = Number(prev.amount);
    const prevVendor = (prev.vendor || prev.merchantName || '').toLowerCase();

    const timeDiff = Math.abs(newDate - prevDate);
    const amountDiff = Math.abs(newAmount - prevAmount) / Math.max(newAmount, prevAmount, 1);
    const sameVendor = prevVendor.includes(newVendor) || newVendor.includes(prevVendor);

    if (
      timeDiff <= R.duplicateTimeWindowMs &&
      amountDiff <= R.duplicateAmountTolerance &&
      sameVendor
    ) {
      return {
        isDuplicate: true,
        reason: `Potential duplicate: A similar expense of ₹${prevAmount.toLocaleString('en-IN')} at "${prev.vendor || prev.merchantName}" was submitted ${Math.round(timeDiff / 3600000)}h ago.`,
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Check if OCR-extracted amount differs significantly from user input.
 */
function checkAmountMismatch(userAmount, ocrAmount) {
  const uAmt = Number(userAmount);
  const oAmt = Number(ocrAmount);

  if (!uAmt || !oAmt) return { isMismatch: false };

  const diff = Math.abs(uAmt - oAmt) / Math.max(uAmt, oAmt, 1);

  if (diff > R.amountMismatchTolerance) {
    return {
      isMismatch: true,
      reason: `Amount mismatch: User entered ₹${uAmt.toLocaleString('en-IN')} but OCR extracted ₹${oAmt.toLocaleString('en-IN')} (${(diff * 100).toFixed(1)}% difference).`,
    };
  }

  return { isMismatch: false };
}

/**
 * Check if user has submitted too many expenses in a 24h window.
 */
function checkFrequencyBurst(expense, userExpenses) {
  const now = new Date(expense.date || expense.timestamp).getTime();
  const recentCount = userExpenses.filter((e) => {
    const t = new Date(e.date || e.timestamp).getTime();
    return Math.abs(now - t) <= R.duplicateTimeWindowMs;
  }).length;

  if (recentCount >= R.frequencyLimitPerDay) {
    return {
      isBurst: true,
      reason: `Frequency anomaly: ${recentCount} expenses submitted within 24 hours (limit: ${R.frequencyLimitPerDay}).`,
    };
  }

  return { isBurst: false };
}

/**
 * Check for missing required fields in the expense.
 */
function checkMissingFields(expense) {
  const missing = [];

  if (!expense.vendor && !expense.merchantName) {
    missing.push('Missing required field: vendor/merchant name.');
  }
  if (!expense.amount || Number(expense.amount) <= 0) {
    missing.push('Missing or invalid required field: amount.');
  }
  if (!expense.receiptImage) {
    missing.push('Missing required field: receipt image.');
  }

  return {
    hasMissing: missing.length > 0,
    missingCount: missing.length,
    reasons: missing,
  };
}
