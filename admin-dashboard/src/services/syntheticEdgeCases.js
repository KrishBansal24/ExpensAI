// ============================================
// ExpensAI — Synthetic Edge Cases (Low Weight)
// ============================================
// These records are intentionally limited and used only for
// rare-pattern adaptation, never as the primary training source.

export const SYNTHETIC_EDGE_CASES = [
  { amount: 9999, category: 'Food', dayOfWeek: 0, hourOfDay: 2, distanceKm: 320, frequency: 7, isFraud: true },
  { amount: 10100, category: 'Food', dayOfWeek: 6, hourOfDay: 3, distanceKm: 450, frequency: 8, isFraud: true },
  { amount: 150, category: 'Travel', dayOfWeek: 1, hourOfDay: 6, distanceKm: 2, frequency: 10, isFraud: true },
  { amount: 19800, category: 'Bills', dayOfWeek: 2, hourOfDay: 10, distanceKm: 0, frequency: 1, isFraud: false },
  { amount: 23000, category: 'Shopping', dayOfWeek: 4, hourOfDay: 15, distanceKm: 20, frequency: 2, isFraud: false },
  { amount: 7200, category: 'Travel', dayOfWeek: 5, hourOfDay: 1, distanceKm: 980, frequency: 1, isFraud: true },
  { amount: 5000, category: 'Other', dayOfWeek: 3, hourOfDay: 13, distanceKm: 12, frequency: 1, isFraud: false },
  { amount: 49000, category: 'Entertainment', dayOfWeek: 6, hourOfDay: 4, distanceKm: 1200, frequency: 6, isFraud: true },
  { amount: 3800, category: 'Food', dayOfWeek: 2, hourOfDay: 11, distanceKm: 4, frequency: 1, isFraud: false },
  { amount: 12500, category: 'Other', dayOfWeek: 0, hourOfDay: 23, distanceKm: 360, frequency: 5, isFraud: true },
  { amount: 200, category: 'Food', dayOfWeek: 1, hourOfDay: 0, distanceKm: 1, frequency: 9, isFraud: true },
  { amount: 8200, category: 'Travel', dayOfWeek: 4, hourOfDay: 5, distanceKm: 70, frequency: 2, isFraud: false },
  { amount: 13000, category: 'Bills', dayOfWeek: 3, hourOfDay: 9, distanceKm: 0, frequency: 1, isFraud: false },
  { amount: 45500, category: 'Travel', dayOfWeek: 0, hourOfDay: 2, distanceKm: 1600, frequency: 4, isFraud: true },
  { amount: 650, category: 'Shopping', dayOfWeek: 2, hourOfDay: 14, distanceKm: 3, frequency: 1, isFraud: false },
  { amount: 28000, category: 'Food', dayOfWeek: 6, hourOfDay: 1, distanceKm: 500, frequency: 7, isFraud: true },
  { amount: 2600, category: 'Other', dayOfWeek: 4, hourOfDay: 16, distanceKm: 9, frequency: 1, isFraud: false },
  { amount: 31500, category: 'Shopping', dayOfWeek: 0, hourOfDay: 2, distanceKm: 810, frequency: 5, isFraud: true },
];
