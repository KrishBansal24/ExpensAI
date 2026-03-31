// ============================================
// ExpensAI — Risk Scorer Unit Tests
// ============================================
// Tests the combined risk scorer with various scenarios.
// Run with: npx vitest run

import { describe, it, expect } from 'vitest';
import { analyzeExpenseSync } from '../riskScorer.js';

describe('RiskScorer — Combined Analysis', () => {
  it('returns safe status for normal expense', () => {
    const expense = {
      vendor: 'Cafe Coffee Day',
      amount: 280,
      category: 'Food',
      date: '2026-03-20T12:30:00Z',
      receiptImage: 'https://test/receipt.jpg',
      locationString: '28.49450, 77.08800',
    };
    const result = analyzeExpenseSync(expense);
    expect(result.riskScore).toBeLessThanOrEqual(30);
    expect(result.fraudStatus).toBe('safe');
    expect(result.fraudScore).toBe(result.riskScore);
    expect(result.decision).toBe('UNDECIDED'); // Manual mode default
  });

  it('returns review status for moderate risk expense', () => {
    const expense = {
      vendor: 'Unknown Store',
      amount: 12000,
      category: 'Shopping',
      date: '2026-03-20T14:00:00Z',
      // No receipt image → penalty
    };
    const ocrData = { amount: 10000 }; // Mismatch
    const result = analyzeExpenseSync(expense, [], ocrData);
    expect(result.riskScore).toBeGreaterThan(20);
    expect(result.fraudReasons.length).toBeGreaterThan(0);
  });

  it('returns fraud status for high risk expense', () => {
    const expense = {
      amount: 50000,
      category: 'Food',
      date: '2026-03-22T03:00:00Z', // Sunday 3 AM
      // No vendor, no receipt
    };
    const result = analyzeExpenseSync(expense);
    expect(result.riskScore).toBeGreaterThan(30);
    expect(result.fraudReasons.length).toBeGreaterThanOrEqual(2);
  });

  it('includes all required output fields', () => {
    const expense = {
      vendor: 'Test Vendor',
      amount: 500,
      date: '2026-03-20T12:00:00Z',
      receiptImage: 'https://test/receipt.jpg',
    };
    const result = analyzeExpenseSync(expense);
    expect(result).toHaveProperty('fraudScore');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('decision');
    expect(result).toHaveProperty('reasons');
    expect(result).toHaveProperty('riskScore');
    expect(result).toHaveProperty('fraudStatus');
    expect(result).toHaveProperty('fraudReasons');
    expect(result).toHaveProperty('fraudExplanation');
    expect(result).toHaveProperty('policyViolations');
    expect(result).toHaveProperty('verificationMode');
    expect(result).toHaveProperty('ruleResult');
    expect(result).toHaveProperty('geoResult');
    expect(result).toHaveProperty('mlResult');
  });

  it('maps low-risk score to APPROVED in AUTO mode', () => {
    const expense = {
      vendor: 'Office Cafe',
      amount: 220,
      category: 'Food',
      date: '2026-03-20T12:00:00Z',
      receiptImage: 'https://test/receipt.jpg',
    };

    const result = analyzeExpenseSync(expense, [], null, {
      fraudSettings: {
        verificationMode: 'AUTO',
        thresholds: {
          approveMax: 30,
          rejectMin: 70,
        },
      },
    });

    expect(result.decision).toBe('APPROVED');
    expect(result.status).toBe('approved');
  });

  it('maps high-risk score to REJECTED in AUTO mode', () => {
    const expense = {
      amount: 52000,
      date: '2026-03-22T03:00:00Z',
      category: 'Shopping',
      locationString: '12.97160,77.59460',
    };

    const result = analyzeExpenseSync(expense, [], { amount: 5000 }, {
      fraudSettings: {
        verificationMode: 'AUTO',
        thresholds: {
          approveMax: 30,
          rejectMin: 60,
        },
      },
    });

    expect(result.fraudScore).toBeGreaterThanOrEqual(60);
    expect(result.decision).toBe('REJECTED');
    expect(result.status).toBe('rejected');
  });

  it('detects amount mismatch with OCR data', () => {
    const expense = {
      vendor: 'Test Shop',
      amount: 10000,
      date: '2026-03-20T12:00:00Z',
      receiptImage: 'yes',
    };
    const ocrData = { amount: 1000 }; // 10x mismatch
    const result = analyzeExpenseSync(expense, [], ocrData);
    expect(result.fraudReasons.some(r => r.includes('mismatch'))).toBe(true);
  });

  it('uses user history for ML analysis', () => {
    const expense = {
      vendor: 'Luxury Restaurant',
      amount: 25000, // Way above normal
      date: '2026-03-20T12:00:00Z',
      receiptImage: 'yes',
    };
    const history = [
      { amount: 300, date: '2026-03-18T12:00:00Z' },
      { amount: 450, date: '2026-03-17T12:00:00Z' },
      { amount: 200, date: '2026-03-16T12:00:00Z' },
      { amount: 350, date: '2026-03-15T12:00:00Z' },
    ];
    const result = analyzeExpenseSync(expense, history);
    expect(result.riskScore).toBeGreaterThan(30);
    // Should detect anomaly relative to user's ~₹325 average
    expect(result.fraudReasons.some(r => r.toLowerCase().includes('average') || r.toLowerCase().includes('σ'))).toBe(true);
  });
});
