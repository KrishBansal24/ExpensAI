// ============================================
// ExpensAI — Fraud Engine Unit Tests
// ============================================
// Tests all 6 rules of the rule-based fraud engine.
// Run with: npx vitest run

import { describe, it, expect } from 'vitest';
import { runRuleEngine } from '../fraudEngine.js';

describe('FraudEngine — Rule-Based Detection', () => {
  // ── Rule 1: Duplicate Invoice ──────────────────
  describe('Duplicate Invoice Detection', () => {
    it('flags duplicate expense with same vendor and similar amount within 24h', () => {
      const expense = { vendor: 'Cafe Coffee Day', amount: 280, date: '2026-03-20T14:00:00Z', receiptImage: 'yes' };
      const history = [
        { id: 'prev-1', vendor: 'Cafe Coffee Day', amount: 275, date: '2026-03-20T12:00:00Z' },
      ];
      const result = runRuleEngine(expense, history);
      expect(result.flags).toContain('DUPLICATE_INVOICE');
      expect(result.ruleScore).toBeGreaterThan(0);
    });

    it('does not flag expenses with different vendors', () => {
      const expense = { vendor: 'Starbucks', amount: 280, date: '2026-03-20T14:00:00Z', receiptImage: 'yes' };
      const history = [
        { id: 'prev-1', vendor: 'Cafe Coffee Day', amount: 280, date: '2026-03-20T12:00:00Z' },
      ];
      const result = runRuleEngine(expense, history);
      expect(result.flags).not.toContain('DUPLICATE_INVOICE');
    });

    it('does not flag expenses outside 24h window', () => {
      const expense = { vendor: 'Cafe Coffee Day', amount: 280, date: '2026-03-22T14:00:00Z', receiptImage: 'yes' };
      const history = [
        { id: 'prev-1', vendor: 'Cafe Coffee Day', amount: 280, date: '2026-03-20T12:00:00Z' },
      ];
      const result = runRuleEngine(expense, history);
      expect(result.flags).not.toContain('DUPLICATE_INVOICE');
    });
  });

  // ── Rule 2: Amount Mismatch ────────────────────
  describe('Amount Mismatch (OCR)', () => {
    it('flags when user amount differs >10% from OCR', () => {
      const expense = { vendor: 'Test', amount: 1000, date: '2026-03-20T12:00:00Z', receiptImage: 'yes' };
      const ocrData = { amount: 800 };
      const result = runRuleEngine(expense, [], ocrData);
      expect(result.flags).toContain('AMOUNT_MISMATCH');
    });

    it('does not flag when amounts match within tolerance', () => {
      const expense = { vendor: 'Test', amount: 1000, date: '2026-03-20T12:00:00Z', receiptImage: 'yes' };
      const ocrData = { amount: 950 };
      const result = runRuleEngine(expense, [], ocrData);
      expect(result.flags).not.toContain('AMOUNT_MISMATCH');
    });
  });

  // ── Rule 3: Amount Threshold ───────────────────
  describe('Amount Threshold', () => {
    it('flags expense exceeding policy limit', () => {
      const expense = { vendor: 'Test', amount: 20000, date: '2026-03-20T12:00:00Z', receiptImage: 'yes' };
      const result = runRuleEngine(expense);
      expect(result.flags).toContain('HIGH_AMOUNT');
    });

    it('does not flag normal amounts', () => {
      const expense = { vendor: 'Test', amount: 500, date: '2026-03-20T12:00:00Z', receiptImage: 'yes' };
      const result = runRuleEngine(expense);
      expect(result.flags).not.toContain('HIGH_AMOUNT');
    });
  });

  // ── Rule 4: Frequency Burst ────────────────────
  describe('Frequency Burst', () => {
    it('flags when too many expenses in 24h', () => {
      const expense = { vendor: 'Test', amount: 100, date: '2026-03-20T14:00:00Z', receiptImage: 'yes' };
      const history = Array.from({ length: 10 }, (_, i) => ({
        id: `h-${i}`, vendor: 'Various', amount: 200, date: `2026-03-20T${String(8 + i).padStart(2, '0')}:00:00Z`,
      }));
      const result = runRuleEngine(expense, history);
      expect(result.flags).toContain('FREQUENCY_BURST');
    });
  });

  // ── Rule 5: Missing Fields ─────────────────────
  describe('Missing Fields', () => {
    it('flags expense without receipt', () => {
      const expense = { vendor: 'Test', amount: 500, date: '2026-03-20T12:00:00Z' };
      const result = runRuleEngine(expense);
      expect(result.flags).toContain('MISSING_FIELDS');
    });

    it('flags expense without vendor', () => {
      const expense = { amount: 500, date: '2026-03-20T12:00:00Z', receiptImage: 'yes' };
      const result = runRuleEngine(expense);
      expect(result.flags).toContain('MISSING_FIELDS');
    });
  });

  // ── Rule 6: Rounded Amount ─────────────────────
  describe('Rounded Amount', () => {
    it('flags suspiciously rounded amount ≥ ₹5000', () => {
      const expense = { vendor: 'Test', amount: 10000, date: '2026-03-20T12:00:00Z', receiptImage: 'yes' };
      const result = runRuleEngine(expense);
      expect(result.flags).toContain('ROUNDED_AMOUNT');
    });

    it('does not flag normal non-round amounts', () => {
      const expense = { vendor: 'Test', amount: 4350, date: '2026-03-20T12:00:00Z', receiptImage: 'yes' };
      const result = runRuleEngine(expense);
      expect(result.flags).not.toContain('ROUNDED_AMOUNT');
    });
  });

  // ── Score Capping ──────────────────────────────
  describe('Score Capping', () => {
    it('caps rule score at 100', () => {
      // Trigger as many rules as possible
      const expense = {
        amount: 50000, // HIGH + ROUNDED
        date: '2026-03-22T03:00:00Z', // Weekend
        // No vendor, no receipt → MISSING_FIELDS
      };
      const ocrData = { amount: 5000 }; // AMOUNT_MISMATCH
      const history = Array.from({ length: 10 }, (_, i) => ({
        id: `h-${i}`, vendor: 'X', amount: 200, date: `2026-03-22T${String(i).padStart(2, '0')}:00:00Z`,
      }));
      const result = runRuleEngine(expense, history, ocrData);
      expect(result.ruleScore).toBeLessThanOrEqual(100);
    });
  });
});
