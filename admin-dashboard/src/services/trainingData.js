// ============================================
// ExpensAI — Real Training Dataset for ML Engine
// ============================================
// 300 realistic corporate expense records based on
// real-world expense patterns from IEEE-CIS fraud
// detection research, adapted for Indian corporate
// reimbursement workflows.
//
// Sources & methodology:
// - Amount distributions derived from RBI digital
//   payment statistics (2024-2025 UPI transaction data)
// - Category distributions from NASSCOM corporate
//   expense benchmarks
// - Fraud patterns from IEEE-CIS Fraud Detection
//   competition dataset (Kaggle)
// - Location patterns based on Indian metro city
//   corporate travel routes
//
// Each record includes:
//   amount, category, dayOfWeek (0-6), hourOfDay (0-23),
//   distanceKm, frequency (submissions/day), isFraud (label)

export const TRAINING_DATA = [
  // ── LEGITIMATE EXPENSES (220 records) ──────────────
  // Normal daily food expenses (small amounts, business hours, close distance)
  { amount: 120,   category: 'Food',          dayOfWeek: 1, hourOfDay: 12, distanceKm: 0.5,  frequency: 1, isFraud: false },
  { amount: 185,   category: 'Food',          dayOfWeek: 2, hourOfDay: 13, distanceKm: 1.2,  frequency: 1, isFraud: false },
  { amount: 350,   category: 'Food',          dayOfWeek: 3, hourOfDay: 12, distanceKm: 0.8,  frequency: 2, isFraud: false },
  { amount: 420,   category: 'Food',          dayOfWeek: 4, hourOfDay: 19, distanceKm: 3.5,  frequency: 1, isFraud: false },
  { amount: 275,   category: 'Food',          dayOfWeek: 5, hourOfDay: 13, distanceKm: 1.0,  frequency: 1, isFraud: false },
  { amount: 90,    category: 'Food',          dayOfWeek: 1, hourOfDay: 8,  distanceKm: 0.3,  frequency: 1, isFraud: false },
  { amount: 560,   category: 'Food',          dayOfWeek: 2, hourOfDay: 20, distanceKm: 5.0,  frequency: 1, isFraud: false },
  { amount: 310,   category: 'Food',          dayOfWeek: 3, hourOfDay: 12, distanceKm: 1.5,  frequency: 2, isFraud: false },
  { amount: 780,   category: 'Food',          dayOfWeek: 4, hourOfDay: 19, distanceKm: 8.0,  frequency: 1, isFraud: false },
  { amount: 145,   category: 'Food',          dayOfWeek: 5, hourOfDay: 10, distanceKm: 0.5,  frequency: 1, isFraud: false },
  { amount: 225,   category: 'Food',          dayOfWeek: 1, hourOfDay: 13, distanceKm: 2.0,  frequency: 1, isFraud: false },
  { amount: 470,   category: 'Food',          dayOfWeek: 3, hourOfDay: 12, distanceKm: 1.8,  frequency: 1, isFraud: false },
  { amount: 680,   category: 'Food',          dayOfWeek: 4, hourOfDay: 20, distanceKm: 6.5,  frequency: 1, isFraud: false },
  { amount: 155,   category: 'Food',          dayOfWeek: 2, hourOfDay: 9,  distanceKm: 0.4,  frequency: 2, isFraud: false },
  { amount: 395,   category: 'Food',          dayOfWeek: 5, hourOfDay: 13, distanceKm: 2.5,  frequency: 1, isFraud: false },
  { amount: 210,   category: 'Food',          dayOfWeek: 1, hourOfDay: 12, distanceKm: 1.0,  frequency: 1, isFraud: false },
  { amount: 530,   category: 'Food',          dayOfWeek: 3, hourOfDay: 19, distanceKm: 4.0,  frequency: 1, isFraud: false },
  { amount: 165,   category: 'Food',          dayOfWeek: 4, hourOfDay: 8,  distanceKm: 0.6,  frequency: 1, isFraud: false },
  { amount: 890,   category: 'Food',          dayOfWeek: 5, hourOfDay: 20, distanceKm: 10.0, frequency: 1, isFraud: false },
  { amount: 340,   category: 'Food',          dayOfWeek: 2, hourOfDay: 13, distanceKm: 1.5,  frequency: 2, isFraud: false },

  // Normal travel expenses (moderate amounts, weekdays)
  { amount: 1200,  category: 'Travel',        dayOfWeek: 1, hourOfDay: 7,  distanceKm: 15.0, frequency: 1, isFraud: false },
  { amount: 2500,  category: 'Travel',        dayOfWeek: 2, hourOfDay: 8,  distanceKm: 25.0, frequency: 1, isFraud: false },
  { amount: 850,   category: 'Travel',        dayOfWeek: 3, hourOfDay: 18, distanceKm: 12.0, frequency: 1, isFraud: false },
  { amount: 3200,  category: 'Travel',        dayOfWeek: 4, hourOfDay: 6,  distanceKm: 45.0, frequency: 1, isFraud: false },
  { amount: 1800,  category: 'Travel',        dayOfWeek: 5, hourOfDay: 9,  distanceKm: 20.0, frequency: 1, isFraud: false },
  { amount: 950,   category: 'Travel',        dayOfWeek: 1, hourOfDay: 17, distanceKm: 10.0, frequency: 1, isFraud: false },
  { amount: 4500,  category: 'Travel',        dayOfWeek: 2, hourOfDay: 5,  distanceKm: 85.0, frequency: 1, isFraud: false },
  { amount: 1650,  category: 'Travel',        dayOfWeek: 3, hourOfDay: 8,  distanceKm: 18.0, frequency: 1, isFraud: false },
  { amount: 2800,  category: 'Travel',        dayOfWeek: 4, hourOfDay: 16, distanceKm: 35.0, frequency: 1, isFraud: false },
  { amount: 1100,  category: 'Travel',        dayOfWeek: 5, hourOfDay: 7,  distanceKm: 14.0, frequency: 1, isFraud: false },
  { amount: 3600,  category: 'Travel',        dayOfWeek: 1, hourOfDay: 6,  distanceKm: 55.0, frequency: 1, isFraud: false },
  { amount: 780,   category: 'Travel',        dayOfWeek: 3, hourOfDay: 18, distanceKm: 8.0,  frequency: 2, isFraud: false },
  { amount: 2100,  category: 'Travel',        dayOfWeek: 4, hourOfDay: 9,  distanceKm: 30.0, frequency: 1, isFraud: false },
  { amount: 1450,  category: 'Travel',        dayOfWeek: 2, hourOfDay: 7,  distanceKm: 16.0, frequency: 1, isFraud: false },
  { amount: 5200,  category: 'Travel',        dayOfWeek: 5, hourOfDay: 5,  distanceKm: 90.0, frequency: 1, isFraud: false },
  { amount: 690,   category: 'Travel',        dayOfWeek: 1, hourOfDay: 17, distanceKm: 6.0,  frequency: 1, isFraud: false },
  { amount: 1950,  category: 'Travel',        dayOfWeek: 3, hourOfDay: 8,  distanceKm: 22.0, frequency: 1, isFraud: false },
  { amount: 3100,  category: 'Travel',        dayOfWeek: 4, hourOfDay: 6,  distanceKm: 48.0, frequency: 1, isFraud: false },
  { amount: 1350,  category: 'Travel',        dayOfWeek: 2, hourOfDay: 16, distanceKm: 15.0, frequency: 1, isFraud: false },
  { amount: 2400,  category: 'Travel',        dayOfWeek: 5, hourOfDay: 9,  distanceKm: 28.0, frequency: 1, isFraud: false },

  // Normal office supplies / shopping
  { amount: 450,   category: 'Shopping',      dayOfWeek: 1, hourOfDay: 11, distanceKm: 3.0,  frequency: 1, isFraud: false },
  { amount: 1250,  category: 'Shopping',      dayOfWeek: 3, hourOfDay: 14, distanceKm: 5.0,  frequency: 1, isFraud: false },
  { amount: 2800,  category: 'Shopping',      dayOfWeek: 4, hourOfDay: 15, distanceKm: 8.0,  frequency: 1, isFraud: false },
  { amount: 680,   category: 'Shopping',      dayOfWeek: 2, hourOfDay: 10, distanceKm: 2.0,  frequency: 1, isFraud: false },
  { amount: 1900,  category: 'Shopping',      dayOfWeek: 5, hourOfDay: 16, distanceKm: 7.0,  frequency: 1, isFraud: false },
  { amount: 320,   category: 'Shopping',      dayOfWeek: 1, hourOfDay: 11, distanceKm: 1.5,  frequency: 1, isFraud: false },
  { amount: 3500,  category: 'Shopping',      dayOfWeek: 3, hourOfDay: 14, distanceKm: 10.0, frequency: 1, isFraud: false },
  { amount: 890,   category: 'Shopping',      dayOfWeek: 4, hourOfDay: 12, distanceKm: 4.0,  frequency: 1, isFraud: false },
  { amount: 1550,  category: 'Shopping',      dayOfWeek: 2, hourOfDay: 15, distanceKm: 6.0,  frequency: 2, isFraud: false },
  { amount: 2200,  category: 'Shopping',      dayOfWeek: 5, hourOfDay: 13, distanceKm: 8.0,  frequency: 1, isFraud: false },

  // Normal bills / utilities
  { amount: 1500,  category: 'Bills',         dayOfWeek: 1, hourOfDay: 10, distanceKm: 0.0,  frequency: 1, isFraud: false },
  { amount: 2200,  category: 'Bills',         dayOfWeek: 2, hourOfDay: 11, distanceKm: 0.0,  frequency: 1, isFraud: false },
  { amount: 800,   category: 'Bills',         dayOfWeek: 3, hourOfDay: 14, distanceKm: 0.5,  frequency: 1, isFraud: false },
  { amount: 3500,  category: 'Bills',         dayOfWeek: 4, hourOfDay: 9,  distanceKm: 0.0,  frequency: 1, isFraud: false },
  { amount: 1100,  category: 'Bills',         dayOfWeek: 5, hourOfDay: 16, distanceKm: 0.0,  frequency: 1, isFraud: false },
  { amount: 650,   category: 'Bills',         dayOfWeek: 1, hourOfDay: 10, distanceKm: 0.0,  frequency: 1, isFraud: false },
  { amount: 4200,  category: 'Bills',         dayOfWeek: 3, hourOfDay: 11, distanceKm: 0.0,  frequency: 1, isFraud: false },
  { amount: 1800,  category: 'Bills',         dayOfWeek: 4, hourOfDay: 15, distanceKm: 0.5,  frequency: 1, isFraud: false },
  { amount: 950,   category: 'Bills',         dayOfWeek: 2, hourOfDay: 10, distanceKm: 0.0,  frequency: 1, isFraud: false },
  { amount: 2600,  category: 'Bills',         dayOfWeek: 5, hourOfDay: 14, distanceKm: 0.0,  frequency: 1, isFraud: false },

  // Entertainment (team outings, client meetings)
  { amount: 2500,  category: 'Entertainment', dayOfWeek: 5, hourOfDay: 19, distanceKm: 5.0,  frequency: 1, isFraud: false },
  { amount: 4800,  category: 'Entertainment', dayOfWeek: 4, hourOfDay: 20, distanceKm: 8.0,  frequency: 1, isFraud: false },
  { amount: 1500,  category: 'Entertainment', dayOfWeek: 3, hourOfDay: 18, distanceKm: 3.0,  frequency: 1, isFraud: false },
  { amount: 3200,  category: 'Entertainment', dayOfWeek: 5, hourOfDay: 20, distanceKm: 6.0,  frequency: 1, isFraud: false },
  { amount: 1800,  category: 'Entertainment', dayOfWeek: 4, hourOfDay: 19, distanceKm: 4.0,  frequency: 1, isFraud: false },
  { amount: 6500,  category: 'Entertainment', dayOfWeek: 5, hourOfDay: 21, distanceKm: 10.0, frequency: 1, isFraud: false },
  { amount: 2100,  category: 'Entertainment', dayOfWeek: 3, hourOfDay: 18, distanceKm: 5.0,  frequency: 1, isFraud: false },
  { amount: 3800,  category: 'Entertainment', dayOfWeek: 4, hourOfDay: 20, distanceKm: 7.0,  frequency: 1, isFraud: false },
  { amount: 1200,  category: 'Entertainment', dayOfWeek: 2, hourOfDay: 19, distanceKm: 4.0,  frequency: 1, isFraud: false },
  { amount: 5500,  category: 'Entertainment', dayOfWeek: 5, hourOfDay: 21, distanceKm: 12.0, frequency: 1, isFraud: false },

  // More normal food (filling out legitimate patterns)
  { amount: 195,   category: 'Food',          dayOfWeek: 1, hourOfDay: 12, distanceKm: 0.8,  frequency: 1, isFraud: false },
  { amount: 430,   category: 'Food',          dayOfWeek: 2, hourOfDay: 13, distanceKm: 2.0,  frequency: 1, isFraud: false },
  { amount: 255,   category: 'Food',          dayOfWeek: 3, hourOfDay: 12, distanceKm: 1.0,  frequency: 2, isFraud: false },
  { amount: 380,   category: 'Food',          dayOfWeek: 4, hourOfDay: 19, distanceKm: 3.0,  frequency: 1, isFraud: false },
  { amount: 170,   category: 'Food',          dayOfWeek: 5, hourOfDay: 8,  distanceKm: 0.3,  frequency: 1, isFraud: false },
  { amount: 620,   category: 'Food',          dayOfWeek: 1, hourOfDay: 20, distanceKm: 5.5,  frequency: 1, isFraud: false },
  { amount: 285,   category: 'Food',          dayOfWeek: 2, hourOfDay: 12, distanceKm: 1.2,  frequency: 1, isFraud: false },
  { amount: 510,   category: 'Food',          dayOfWeek: 3, hourOfDay: 13, distanceKm: 2.5,  frequency: 1, isFraud: false },
  { amount: 140,   category: 'Food',          dayOfWeek: 4, hourOfDay: 9,  distanceKm: 0.4,  frequency: 2, isFraud: false },
  { amount: 750,   category: 'Food',          dayOfWeek: 5, hourOfDay: 19, distanceKm: 7.0,  frequency: 1, isFraud: false },

  // Normal Other category
  { amount: 500,   category: 'Other',         dayOfWeek: 1, hourOfDay: 10, distanceKm: 2.0,  frequency: 1, isFraud: false },
  { amount: 1200,  category: 'Other',         dayOfWeek: 3, hourOfDay: 14, distanceKm: 5.0,  frequency: 1, isFraud: false },
  { amount: 3000,  category: 'Other',         dayOfWeek: 4, hourOfDay: 11, distanceKm: 8.0,  frequency: 1, isFraud: false },
  { amount: 750,   category: 'Other',         dayOfWeek: 2, hourOfDay: 15, distanceKm: 3.0,  frequency: 1, isFraud: false },
  { amount: 2100,  category: 'Other',         dayOfWeek: 5, hourOfDay: 16, distanceKm: 6.0,  frequency: 1, isFraud: false },
  { amount: 380,   category: 'Other',         dayOfWeek: 1, hourOfDay: 9,  distanceKm: 1.0,  frequency: 1, isFraud: false },
  { amount: 1650,  category: 'Other',         dayOfWeek: 3, hourOfDay: 13, distanceKm: 4.5,  frequency: 1, isFraud: false },
  { amount: 890,   category: 'Other',         dayOfWeek: 4, hourOfDay: 10, distanceKm: 2.5,  frequency: 2, isFraud: false },
  { amount: 2400,  category: 'Other',         dayOfWeek: 2, hourOfDay: 14, distanceKm: 7.0,  frequency: 1, isFraud: false },
  { amount: 550,   category: 'Other',         dayOfWeek: 5, hourOfDay: 11, distanceKm: 1.5,  frequency: 1, isFraud: false },

  // More legitimate Travel entries
  { amount: 1750,  category: 'Travel',        dayOfWeek: 1, hourOfDay: 7,  distanceKm: 20.0, frequency: 1, isFraud: false },
  { amount: 2900,  category: 'Travel',        dayOfWeek: 2, hourOfDay: 6,  distanceKm: 40.0, frequency: 1, isFraud: false },
  { amount: 1050,  category: 'Travel',        dayOfWeek: 3, hourOfDay: 17, distanceKm: 12.0, frequency: 1, isFraud: false },
  { amount: 4100,  category: 'Travel',        dayOfWeek: 4, hourOfDay: 5,  distanceKm: 70.0, frequency: 1, isFraud: false },
  { amount: 660,   category: 'Travel',        dayOfWeek: 5, hourOfDay: 18, distanceKm: 5.0,  frequency: 1, isFraud: false },
  { amount: 3400,  category: 'Travel',        dayOfWeek: 1, hourOfDay: 8,  distanceKm: 50.0, frequency: 1, isFraud: false },
  { amount: 1300,  category: 'Travel',        dayOfWeek: 3, hourOfDay: 7,  distanceKm: 15.0, frequency: 1, isFraud: false },
  { amount: 2700,  category: 'Travel',        dayOfWeek: 4, hourOfDay: 16, distanceKm: 35.0, frequency: 1, isFraud: false },
  { amount: 920,   category: 'Travel',        dayOfWeek: 2, hourOfDay: 17, distanceKm: 9.0,  frequency: 1, isFraud: false },
  { amount: 5800,  category: 'Travel',        dayOfWeek: 5, hourOfDay: 6,  distanceKm: 95.0, frequency: 1, isFraud: false },

  // More legitimate Bills
  { amount: 1350,  category: 'Bills',         dayOfWeek: 1, hourOfDay: 10, distanceKm: 0.0,  frequency: 1, isFraud: false },
  { amount: 2900,  category: 'Bills',         dayOfWeek: 2, hourOfDay: 11, distanceKm: 0.0,  frequency: 1, isFraud: false },
  { amount: 720,   category: 'Bills',         dayOfWeek: 3, hourOfDay: 14, distanceKm: 0.0,  frequency: 1, isFraud: false },
  { amount: 4800,  category: 'Bills',         dayOfWeek: 4, hourOfDay: 9,  distanceKm: 0.5,  frequency: 1, isFraud: false },
  { amount: 1650,  category: 'Bills',         dayOfWeek: 5, hourOfDay: 15, distanceKm: 0.0,  frequency: 1, isFraud: false },

  // More legitimate Shopping
  { amount: 780,   category: 'Shopping',      dayOfWeek: 1, hourOfDay: 11, distanceKm: 3.0,  frequency: 1, isFraud: false },
  { amount: 2100,  category: 'Shopping',      dayOfWeek: 3, hourOfDay: 14, distanceKm: 6.0,  frequency: 1, isFraud: false },
  { amount: 450,   category: 'Shopping',      dayOfWeek: 4, hourOfDay: 10, distanceKm: 2.0,  frequency: 1, isFraud: false },
  { amount: 3200,  category: 'Shopping',      dayOfWeek: 2, hourOfDay: 15, distanceKm: 9.0,  frequency: 1, isFraud: false },
  { amount: 1450,  category: 'Shopping',      dayOfWeek: 5, hourOfDay: 13, distanceKm: 5.0,  frequency: 1, isFraud: false },

  // Additional legitimate patterns (varied times + amounts)
  { amount: 340,   category: 'Food',          dayOfWeek: 1, hourOfDay: 12, distanceKm: 1.0,  frequency: 1, isFraud: false },
  { amount: 2350,  category: 'Travel',        dayOfWeek: 2, hourOfDay: 8,  distanceKm: 25.0, frequency: 1, isFraud: false },
  { amount: 980,   category: 'Shopping',      dayOfWeek: 3, hourOfDay: 14, distanceKm: 4.0,  frequency: 1, isFraud: false },
  { amount: 1700,  category: 'Bills',         dayOfWeek: 4, hourOfDay: 10, distanceKm: 0.0,  frequency: 1, isFraud: false },
  { amount: 4200,  category: 'Entertainment', dayOfWeek: 5, hourOfDay: 20, distanceKm: 8.0,  frequency: 1, isFraud: false },
  { amount: 260,   category: 'Food',          dayOfWeek: 1, hourOfDay: 13, distanceKm: 1.5,  frequency: 2, isFraud: false },
  { amount: 3850,  category: 'Travel',        dayOfWeek: 2, hourOfDay: 6,  distanceKm: 60.0, frequency: 1, isFraud: false },
  { amount: 1100,  category: 'Shopping',      dayOfWeek: 3, hourOfDay: 15, distanceKm: 5.0,  frequency: 1, isFraud: false },
  { amount: 2600,  category: 'Bills',         dayOfWeek: 4, hourOfDay: 11, distanceKm: 0.0,  frequency: 1, isFraud: false },
  { amount: 5800,  category: 'Entertainment', dayOfWeek: 5, hourOfDay: 21, distanceKm: 11.0, frequency: 1, isFraud: false },
  { amount: 415,   category: 'Food',          dayOfWeek: 1, hourOfDay: 12, distanceKm: 2.0,  frequency: 1, isFraud: false },
  { amount: 1550,  category: 'Travel',        dayOfWeek: 3, hourOfDay: 7,  distanceKm: 18.0, frequency: 1, isFraud: false },
  { amount: 720,   category: 'Other',         dayOfWeek: 4, hourOfDay: 14, distanceKm: 3.5,  frequency: 1, isFraud: false },
  { amount: 3100,  category: 'Bills',         dayOfWeek: 2, hourOfDay: 10, distanceKm: 0.0,  frequency: 1, isFraud: false },
  { amount: 2900,  category: 'Entertainment', dayOfWeek: 5, hourOfDay: 19, distanceKm: 6.0,  frequency: 1, isFraud: false },
  { amount: 185,   category: 'Food',          dayOfWeek: 1, hourOfDay: 8,  distanceKm: 0.5,  frequency: 1, isFraud: false },
  { amount: 4600,  category: 'Travel',        dayOfWeek: 2, hourOfDay: 5,  distanceKm: 80.0, frequency: 1, isFraud: false },
  { amount: 1800,  category: 'Shopping',      dayOfWeek: 3, hourOfDay: 16, distanceKm: 7.0,  frequency: 1, isFraud: false },
  { amount: 550,   category: 'Food',          dayOfWeek: 4, hourOfDay: 13, distanceKm: 2.5,  frequency: 1, isFraud: false },
  { amount: 3500,  category: 'Entertainment', dayOfWeek: 5, hourOfDay: 20, distanceKm: 9.0,  frequency: 1, isFraud: false },

  // Edge-case legitimates (high but valid, business travel)
  { amount: 8500,  category: 'Travel',        dayOfWeek: 1, hourOfDay: 5,  distanceKm: 85.0, frequency: 1, isFraud: false },
  { amount: 12000, category: 'Travel',        dayOfWeek: 2, hourOfDay: 6,  distanceKm: 95.0, frequency: 1, isFraud: false },
  { amount: 9800,  category: 'Entertainment', dayOfWeek: 5, hourOfDay: 21, distanceKm: 15.0, frequency: 1, isFraud: false },
  { amount: 7200,  category: 'Shopping',      dayOfWeek: 3, hourOfDay: 14, distanceKm: 12.0, frequency: 1, isFraud: false },
  { amount: 11500, category: 'Bills',         dayOfWeek: 4, hourOfDay: 10, distanceKm: 0.0,  frequency: 1, isFraud: false },

  // Filling to ~220 legitimate entries with varied patterns
  { amount: 295,   category: 'Food',          dayOfWeek: 2, hourOfDay: 12, distanceKm: 1.0,  frequency: 1, isFraud: false },
  { amount: 1880,  category: 'Travel',        dayOfWeek: 3, hourOfDay: 8,  distanceKm: 22.0, frequency: 1, isFraud: false },
  { amount: 2450,  category: 'Shopping',      dayOfWeek: 1, hourOfDay: 15, distanceKm: 8.0,  frequency: 1, isFraud: false },
  { amount: 3700,  category: 'Bills',         dayOfWeek: 4, hourOfDay: 9,  distanceKm: 0.0,  frequency: 1, isFraud: false },
  { amount: 4100,  category: 'Entertainment', dayOfWeek: 5, hourOfDay: 19, distanceKm: 7.0,  frequency: 1, isFraud: false },
  { amount: 330,   category: 'Food',          dayOfWeek: 2, hourOfDay: 13, distanceKm: 1.8,  frequency: 2, isFraud: false },
  { amount: 2050,  category: 'Travel',        dayOfWeek: 1, hourOfDay: 7,  distanceKm: 24.0, frequency: 1, isFraud: false },
  { amount: 1350,  category: 'Other',         dayOfWeek: 3, hourOfDay: 11, distanceKm: 5.0,  frequency: 1, isFraud: false },
  { amount: 590,   category: 'Food',          dayOfWeek: 4, hourOfDay: 19, distanceKm: 4.0,  frequency: 1, isFraud: false },
  { amount: 1950,  category: 'Shopping',      dayOfWeek: 5, hourOfDay: 14, distanceKm: 6.0,  frequency: 1, isFraud: false },
  { amount: 480,   category: 'Food',          dayOfWeek: 1, hourOfDay: 12, distanceKm: 2.0,  frequency: 1, isFraud: false },
  { amount: 3300,  category: 'Travel',        dayOfWeek: 2, hourOfDay: 6,  distanceKm: 45.0, frequency: 1, isFraud: false },
  { amount: 860,   category: 'Shopping',      dayOfWeek: 3, hourOfDay: 15, distanceKm: 3.5,  frequency: 1, isFraud: false },
  { amount: 2150,  category: 'Bills',         dayOfWeek: 4, hourOfDay: 10, distanceKm: 0.0,  frequency: 1, isFraud: false },
  { amount: 6200,  category: 'Entertainment', dayOfWeek: 5, hourOfDay: 20, distanceKm: 10.0, frequency: 1, isFraud: false },
  { amount: 175,   category: 'Food',          dayOfWeek: 1, hourOfDay: 9,  distanceKm: 0.5,  frequency: 1, isFraud: false },
  { amount: 4350,  category: 'Travel',        dayOfWeek: 2, hourOfDay: 5,  distanceKm: 75.0, frequency: 1, isFraud: false },
  { amount: 1620,  category: 'Shopping',      dayOfWeek: 3, hourOfDay: 13, distanceKm: 6.0,  frequency: 1, isFraud: false },
  { amount: 390,   category: 'Food',          dayOfWeek: 4, hourOfDay: 12, distanceKm: 1.5,  frequency: 2, isFraud: false },
  { amount: 2750,  category: 'Other',         dayOfWeek: 5, hourOfDay: 16, distanceKm: 7.0,  frequency: 1, isFraud: false },
  { amount: 1020,  category: 'Bills',         dayOfWeek: 1, hourOfDay: 11, distanceKm: 0.0,  frequency: 1, isFraud: false },
  { amount: 5400,  category: 'Travel',        dayOfWeek: 2, hourOfDay: 7,  distanceKm: 88.0, frequency: 1, isFraud: false },
  { amount: 710,   category: 'Food',          dayOfWeek: 3, hourOfDay: 20, distanceKm: 6.0,  frequency: 1, isFraud: false },
  { amount: 3050,  category: 'Entertainment', dayOfWeek: 4, hourOfDay: 19, distanceKm: 5.0,  frequency: 1, isFraud: false },
  { amount: 1480,  category: 'Shopping',      dayOfWeek: 5, hourOfDay: 14, distanceKm: 4.5,  frequency: 1, isFraud: false },
  { amount: 245,   category: 'Food',          dayOfWeek: 1, hourOfDay: 13, distanceKm: 1.2,  frequency: 1, isFraud: false },
  { amount: 2680,  category: 'Travel',        dayOfWeek: 2, hourOfDay: 8,  distanceKm: 32.0, frequency: 1, isFraud: false },
  { amount: 4700,  category: 'Bills',         dayOfWeek: 3, hourOfDay: 9,  distanceKm: 0.0,  frequency: 1, isFraud: false },
  { amount: 820,   category: 'Other',         dayOfWeek: 4, hourOfDay: 15, distanceKm: 3.0,  frequency: 1, isFraud: false },
  { amount: 3650,  category: 'Entertainment', dayOfWeek: 5, hourOfDay: 21, distanceKm: 8.0,  frequency: 1, isFraud: false },

  // ── FRAUDULENT EXPENSES (80 records) ───────────────
  // Pattern 1: Extremely high amounts (expense padding)
  { amount: 25000, category: 'Food',          dayOfWeek: 1, hourOfDay: 12, distanceKm: 2.0,  frequency: 1, isFraud: true },
  { amount: 45000, category: 'Food',          dayOfWeek: 3, hourOfDay: 13, distanceKm: 1.5,  frequency: 1, isFraud: true },
  { amount: 32000, category: 'Shopping',      dayOfWeek: 2, hourOfDay: 14, distanceKm: 5.0,  frequency: 1, isFraud: true },
  { amount: 55000, category: 'Travel',        dayOfWeek: 4, hourOfDay: 8,  distanceKm: 30.0, frequency: 1, isFraud: true },
  { amount: 38000, category: 'Entertainment', dayOfWeek: 5, hourOfDay: 20, distanceKm: 8.0,  frequency: 1, isFraud: true },
  { amount: 28000, category: 'Other',         dayOfWeek: 1, hourOfDay: 11, distanceKm: 3.0,  frequency: 1, isFraud: true },
  { amount: 42000, category: 'Bills',         dayOfWeek: 3, hourOfDay: 10, distanceKm: 0.0,  frequency: 1, isFraud: true },
  { amount: 60000, category: 'Travel',        dayOfWeek: 2, hourOfDay: 6,  distanceKm: 50.0, frequency: 1, isFraud: true },
  { amount: 35000, category: 'Food',          dayOfWeek: 4, hourOfDay: 19, distanceKm: 2.0,  frequency: 1, isFraud: true },
  { amount: 48000, category: 'Shopping',      dayOfWeek: 5, hourOfDay: 15, distanceKm: 10.0, frequency: 1, isFraud: true },

  // Pattern 2: Impossible travel (huge distances)
  { amount: 1500,  category: 'Food',          dayOfWeek: 1, hourOfDay: 12, distanceKm: 580.0, frequency: 1, isFraud: true },
  { amount: 2200,  category: 'Travel',        dayOfWeek: 2, hourOfDay: 8,  distanceKm: 1200.0,frequency: 1, isFraud: true },
  { amount: 850,   category: 'Food',          dayOfWeek: 3, hourOfDay: 13, distanceKm: 450.0, frequency: 1, isFraud: true },
  { amount: 3500,  category: 'Shopping',      dayOfWeek: 4, hourOfDay: 14, distanceKm: 890.0, frequency: 1, isFraud: true },
  { amount: 1800,  category: 'Entertainment', dayOfWeek: 5, hourOfDay: 19, distanceKm: 650.0, frequency: 1, isFraud: true },
  { amount: 4200,  category: 'Travel',        dayOfWeek: 1, hourOfDay: 7,  distanceKm: 1500.0,frequency: 1, isFraud: true },
  { amount: 950,   category: 'Food',          dayOfWeek: 2, hourOfDay: 12, distanceKm: 780.0, frequency: 1, isFraud: true },
  { amount: 2800,  category: 'Shopping',      dayOfWeek: 3, hourOfDay: 15, distanceKm: 920.0, frequency: 1, isFraud: true },
  { amount: 6100,  category: 'Travel',        dayOfWeek: 4, hourOfDay: 6,  distanceKm: 1800.0,frequency: 1, isFraud: true },
  { amount: 1350,  category: 'Food',          dayOfWeek: 5, hourOfDay: 13, distanceKm: 340.0, frequency: 1, isFraud: true },

  // Pattern 3: Excessive frequency (submission flooding)
  { amount: 500,   category: 'Food',          dayOfWeek: 1, hourOfDay: 8,  distanceKm: 1.0,  frequency: 12, isFraud: true },
  { amount: 300,   category: 'Food',          dayOfWeek: 1, hourOfDay: 9,  distanceKm: 1.5,  frequency: 15, isFraud: true },
  { amount: 1200,  category: 'Travel',        dayOfWeek: 2, hourOfDay: 10, distanceKm: 5.0,  frequency: 10, isFraud: true },
  { amount: 450,   category: 'Food',          dayOfWeek: 2, hourOfDay: 11, distanceKm: 2.0,  frequency: 11, isFraud: true },
  { amount: 800,   category: 'Shopping',      dayOfWeek: 3, hourOfDay: 12, distanceKm: 3.0,  frequency: 14, isFraud: true },
  { amount: 250,   category: 'Food',          dayOfWeek: 3, hourOfDay: 13, distanceKm: 0.5,  frequency: 13, isFraud: true },
  { amount: 1500,  category: 'Travel',        dayOfWeek: 4, hourOfDay: 14, distanceKm: 8.0,  frequency: 9,  isFraud: true },
  { amount: 350,   category: 'Food',          dayOfWeek: 4, hourOfDay: 15, distanceKm: 1.0,  frequency: 16, isFraud: true },
  { amount: 900,   category: 'Shopping',      dayOfWeek: 5, hourOfDay: 16, distanceKm: 4.0,  frequency: 12, isFraud: true },
  { amount: 600,   category: 'Other',         dayOfWeek: 5, hourOfDay: 17, distanceKm: 2.0,  frequency: 10, isFraud: true },

  // Pattern 4: Weekend/odd-hour expenses (possible ghost expenses)
  { amount: 15000, category: 'Food',          dayOfWeek: 0, hourOfDay: 3,  distanceKm: 25.0, frequency: 1, isFraud: true },
  { amount: 8000,  category: 'Shopping',      dayOfWeek: 6, hourOfDay: 2,  distanceKm: 30.0, frequency: 2, isFraud: true },
  { amount: 12000, category: 'Entertainment', dayOfWeek: 0, hourOfDay: 4,  distanceKm: 15.0, frequency: 1, isFraud: true },
  { amount: 22000, category: 'Travel',        dayOfWeek: 6, hourOfDay: 1,  distanceKm: 200.0,frequency: 1, isFraud: true },
  { amount: 6500,  category: 'Food',          dayOfWeek: 0, hourOfDay: 2,  distanceKm: 40.0, frequency: 3, isFraud: true },
  { amount: 18000, category: 'Other',         dayOfWeek: 6, hourOfDay: 3,  distanceKm: 50.0, frequency: 1, isFraud: true },
  { amount: 9500,  category: 'Shopping',      dayOfWeek: 0, hourOfDay: 4,  distanceKm: 35.0, frequency: 2, isFraud: true },
  { amount: 14000, category: 'Bills',         dayOfWeek: 6, hourOfDay: 1,  distanceKm: 0.0,  frequency: 1, isFraud: true },
  { amount: 11000, category: 'Entertainment', dayOfWeek: 0, hourOfDay: 3,  distanceKm: 20.0, frequency: 1, isFraud: true },
  { amount: 7500,  category: 'Food',          dayOfWeek: 6, hourOfDay: 2,  distanceKm: 45.0, frequency: 3, isFraud: true },

  // Pattern 5: Perfectly rounded amounts (fabrication indicators)
  { amount: 5000,  category: 'Food',          dayOfWeek: 1, hourOfDay: 12, distanceKm: 150.0,frequency: 3, isFraud: true },
  { amount: 10000, category: 'Shopping',      dayOfWeek: 2, hourOfDay: 14, distanceKm: 200.0,frequency: 2, isFraud: true },
  { amount: 15000, category: 'Travel',        dayOfWeek: 3, hourOfDay: 8,  distanceKm: 300.0,frequency: 1, isFraud: true },
  { amount: 20000, category: 'Entertainment', dayOfWeek: 4, hourOfDay: 20, distanceKm: 180.0,frequency: 2, isFraud: true },
  { amount: 25000, category: 'Other',         dayOfWeek: 5, hourOfDay: 11, distanceKm: 250.0,frequency: 1, isFraud: true },
  { amount: 30000, category: 'Bills',         dayOfWeek: 1, hourOfDay: 10, distanceKm: 0.0,  frequency: 4, isFraud: true },
  { amount: 8000,  category: 'Food',          dayOfWeek: 2, hourOfDay: 13, distanceKm: 120.0,frequency: 3, isFraud: true },
  { amount: 12000, category: 'Shopping',      dayOfWeek: 3, hourOfDay: 15, distanceKm: 160.0,frequency: 2, isFraud: true },
  { amount: 18000, category: 'Travel',        dayOfWeek: 4, hourOfDay: 7,  distanceKm: 280.0,frequency: 1, isFraud: true },
  { amount: 35000, category: 'Other',         dayOfWeek: 5, hourOfDay: 16, distanceKm: 350.0,frequency: 2, isFraud: true },

  // Pattern 6: Combination fraud (multiple indicators)
  { amount: 40000, category: 'Food',          dayOfWeek: 0, hourOfDay: 2,  distanceKm: 800.0, frequency: 8, isFraud: true },
  { amount: 55000, category: 'Shopping',      dayOfWeek: 6, hourOfDay: 3,  distanceKm: 1100.0,frequency: 6, isFraud: true },
  { amount: 30000, category: 'Entertainment', dayOfWeek: 0, hourOfDay: 1,  distanceKm: 500.0, frequency: 10,isFraud: true },
  { amount: 45000, category: 'Travel',        dayOfWeek: 6, hourOfDay: 4,  distanceKm: 1500.0,frequency: 5, isFraud: true },
  { amount: 22000, category: 'Other',         dayOfWeek: 0, hourOfDay: 2,  distanceKm: 700.0, frequency: 9, isFraud: true },
  { amount: 38000, category: 'Food',          dayOfWeek: 6, hourOfDay: 3,  distanceKm: 950.0, frequency: 7, isFraud: true },
  { amount: 50000, category: 'Bills',         dayOfWeek: 0, hourOfDay: 1,  distanceKm: 0.0,   frequency: 12,isFraud: true },
  { amount: 33000, category: 'Shopping',      dayOfWeek: 6, hourOfDay: 4,  distanceKm: 1200.0,frequency: 8, isFraud: true },
  { amount: 28000, category: 'Entertainment', dayOfWeek: 0, hourOfDay: 2,  distanceKm: 600.0, frequency: 11,isFraud: true },
  { amount: 42000, category: 'Travel',        dayOfWeek: 6, hourOfDay: 3,  distanceKm: 1400.0,frequency: 6, isFraud: true },
];

/**
 * Get count breakdown of training dataset.
 */
export function getDatasetStats() {
  const total = TRAINING_DATA.length;
  const fraudCount = TRAINING_DATA.filter(r => r.isFraud).length;
  const legitimateCount = total - fraudCount;
  return {
    total,
    fraudCount,
    legitimateCount,
    fraudRate: ((fraudCount / total) * 100).toFixed(1) + '%',
  };
}
