import { describe, expect, it } from 'vitest';
import { runPolicyEngine } from '../policyEngine.js';

describe('PolicyEngine', () => {
  it('flags category limit violations', () => {
    const expense = {
      userId: 'emp-1',
      amount: 9500,
      category: 'Food',
      date: '2026-03-20T11:00:00Z',
      vendor: 'City Restaurant',
    };

    const result = runPolicyEngine(expense, {
      policySettings: {
        maxExpensePerCategory: { Food: 4000 },
        defaultCategoryLimit: 15000,
      },
    });

    expect(result.policyScore).toBeGreaterThan(0);
    expect(result.violations.some((entry) => entry.type === 'CATEGORY_LIMIT_EXCEEDED')).toBe(true);
  });

  it('flags restricted vendor violations', () => {
    const expense = {
      userId: 'emp-1',
      amount: 1200,
      category: 'Other',
      date: '2026-03-20T14:30:00Z',
      vendor: 'Ghost Vendor LLP',
    };

    const result = runPolicyEngine(expense, {
      policySettings: {
        restrictedVendors: ['ghost vendor'],
      },
    });

    expect(result.violations.some((entry) => entry.type === 'RESTRICTED_VENDOR')).toBe(true);
  });

  it('flags projected daily and weekly limit violations', () => {
    const expense = {
      userId: 'emp-42',
      amount: 9000,
      category: 'Travel',
      date: '2026-03-20T09:00:00Z',
      vendor: 'Intercity Cab',
    };

    const history = [
      { userId: 'emp-42', amount: 8000, date: '2026-03-20T06:00:00Z' },
      { userId: 'emp-42', amount: 12000, date: '2026-03-19T11:00:00Z' },
      { userId: 'emp-42', amount: 5000, date: '2026-03-18T11:00:00Z' },
    ];

    const result = runPolicyEngine(expense, {
      userExpenses: history,
      policySettings: {
        dailyLimit: 15000,
        weeklyLimit: 25000,
      },
    });

    expect(result.violations.some((entry) => entry.type === 'DAILY_LIMIT_EXCEEDED')).toBe(true);
    expect(result.violations.some((entry) => entry.type === 'WEEKLY_LIMIT_EXCEEDED')).toBe(true);
  });
});
