// ============================================
// ExpensAI — Smart Feature Utilities
// ============================================
// Implements duplicate detection, spending limit alerts,
// and fraud flag logic for the expense system.

/**
 * Check if an expense is a potential duplicate.
 * Flags expenses with similar amount + vendor within 24 hours.
 */
export function checkDuplicate(newExpense, existingExpenses) {
  const threshold = 0.15; // 15% amount tolerance
  const timeWindow = 24 * 60 * 60 * 1000; // 24 hours in ms

  const newDate = new Date(newExpense.date).getTime();
  const newAmount = parseFloat(newExpense.amount);

  const duplicates = existingExpenses.filter((exp) => {
    const expDate = new Date(exp.date).getTime();
    const expAmount = parseFloat(exp.amount);
    const timeDiff = Math.abs(newDate - expDate);
    const amountDiff = Math.abs(newAmount - expAmount) / Math.max(newAmount, expAmount);

    const sameVendor =
      exp.vendor.toLowerCase().includes(newExpense.vendor.toLowerCase()) ||
      newExpense.vendor.toLowerCase().includes(exp.vendor.toLowerCase());

    return timeDiff <= timeWindow && amountDiff <= threshold && sameVendor;
  });

  if (duplicates.length > 0) {
    return {
      isDuplicate: true,
      message: `Potential duplicate: A similar expense of ₹${duplicates[0].amount} at "${duplicates[0].vendor}" was submitted on ${duplicates[0].date}.`,
      matchedExpense: duplicates[0],
    };
  }

  return { isDuplicate: false, message: null, matchedExpense: null };
}

/**
 * Check if the employee is approaching or exceeding their spending limit.
 * Returns warning level and message.
 */
export function checkSpendingLimit(currentSpent, totalBudget, newAmount) {
  const projectedSpent = currentSpent + newAmount;
  const usagePercent = (projectedSpent / totalBudget) * 100;

  if (projectedSpent > totalBudget) {
    return {
      level: 'critical',
      percent: usagePercent.toFixed(0),
      message: `This expense will exceed your monthly budget by ₹${(projectedSpent - totalBudget).toLocaleString()}. Total: ₹${projectedSpent.toLocaleString()} / ₹${totalBudget.toLocaleString()}.`,
    };
  }

  if (usagePercent >= 90) {
    return {
      level: 'warning',
      percent: usagePercent.toFixed(0),
      message: `You will have used ${usagePercent.toFixed(0)}% of your monthly budget after this expense. Remaining: ₹${(totalBudget - projectedSpent).toLocaleString()}.`,
    };
  }

  if (usagePercent >= 75) {
    return {
      level: 'caution',
      percent: usagePercent.toFixed(0),
      message: `You've used ${usagePercent.toFixed(0)}% of your monthly budget. Consider planning remaining expenses.`,
    };
  }

  return { level: 'ok', percent: usagePercent.toFixed(0), message: null };
}

/**
 * Check for potential fraud indicators in an expense.
 * Returns flags if suspicious patterns are detected.
 */
export function checkFraudFlags(expense) {
  const flags = [];

  // Flag 1: Unusually high single expense
  if (expense.amount > 15000) {
    flags.push({
      type: 'high_amount',
      severity: 'high',
      message: `Unusually high expense: ₹${parseFloat(expense.amount).toLocaleString()} exceeds the single-transaction policy limit.`,
    });
  }

  // Flag 2: Rounded amounts (possible fabrication)
  if (expense.amount % 1000 === 0 && expense.amount >= 5000) {
    flags.push({
      type: 'rounded_amount',
      severity: 'medium',
      message: `Exact rounded amount (₹${parseFloat(expense.amount).toLocaleString()}) — this may require additional verification.`,
    });
  }

  // Flag 3: Weekend/holiday expense without notes
  const expDate = new Date(expense.date);
  const dayOfWeek = expDate.getDay();
  if ((dayOfWeek === 0 || dayOfWeek === 6) && (!expense.notes || expense.notes.length < 10)) {
    flags.push({
      type: 'weekend_expense',
      severity: 'low',
      message: 'Expense submitted on a weekend without detailed justification.',
    });
  }

  return {
    hasFraudFlags: flags.length > 0,
    flags,
  };
}

/**
 * Format currency amount with Indian locale.
 */
export function formatCurrency(amount) {
  return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
}

/**
 * Get time ago string from a timestamp.
 */
export function timeAgo(timestamp) {
  const now = new Date('2026-03-22T15:15:00+05:30');
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
