// ============================================
// ExpensAI — Fraud Test Dataset  
// ============================================
// 20+ mock records for testing the fraud detection engine.
// Covers normal, review, and fraud scenarios.

export const FRAUD_TEST_DATA = [
  // ── NORMAL / SAFE (10 records) ──────────────────
  {
    id: 'test-safe-01', userId: 'emp001', userName: 'Rajesh Kumar',
    vendor: 'Cafe Coffee Day', amount: 280, category: 'Food',
    date: '2026-03-20T12:30:00Z', receiptImage: 'https://test/receipt1.jpg',
    locationString: '28.49450, 77.08800',
    ocrData: { amount: 280, vendor: 'Cafe Coffee Day', invoice_number: 'CCD-001' },
  },
  {
    id: 'test-safe-02', userId: 'emp002', userName: 'Priya Sharma',
    vendor: 'Uber India', amount: 1200, category: 'Travel',
    date: '2026-03-20T08:15:00Z', receiptImage: 'https://test/receipt2.jpg',
    locationString: '28.61390, 77.20900',
    ocrData: { amount: 1200, vendor: 'Uber', invoice_number: 'UB-2026-123' },
  },
  {
    id: 'test-safe-03', userId: 'emp003', userName: 'Amit Patel',
    vendor: 'Amazon Business', amount: 2500, category: 'Shopping',
    date: '2026-03-19T14:00:00Z', receiptImage: 'https://test/receipt3.jpg',
    locationString: '19.07600, 72.87770',
    ocrData: { amount: 2500, vendor: 'Amazon', invoice_number: 'AMZ-9876' },
  },
  {
    id: 'test-safe-04', userId: 'emp001', userName: 'Rajesh Kumar',
    vendor: 'Swiggy', amount: 450, category: 'Food',
    date: '2026-03-21T19:30:00Z', receiptImage: 'https://test/receipt4.jpg',
    locationString: '28.49450, 77.08800',
    ocrData: { amount: 450, vendor: 'Swiggy', invoice_number: 'SWG-4534' },
  },
  {
    id: 'test-safe-05', userId: 'emp004', userName: 'Sunita Reddy',
    vendor: 'Indian Oil', amount: 3200, category: 'Travel',
    date: '2026-03-18T07:00:00Z', receiptImage: 'https://test/receipt5.jpg',
    locationString: '12.97160, 77.59460',
    ocrData: { amount: 3200, vendor: 'Indian Oil', invoice_number: 'IO-7789' },
  },
  {
    id: 'test-safe-06', userId: 'emp005', userName: 'Deepak Verma',
    vendor: 'Starbucks', amount: 650, category: 'Food',
    date: '2026-03-20T10:00:00Z', receiptImage: 'https://test/receipt6.jpg',
    locationString: '28.63200, 77.21900',
  },
  {
    id: 'test-safe-07', userId: 'emp002', userName: 'Priya Sharma',
    vendor: 'Medical Plus', amount: 890, category: 'Other',
    date: '2026-03-17T11:30:00Z', receiptImage: 'https://test/receipt7.jpg',
    locationString: '28.52100, 77.16500',
  },
  {
    id: 'test-safe-08', userId: 'emp003', userName: 'Amit Patel',
    vendor: 'Big Bazaar', amount: 1850, category: 'Shopping',
    date: '2026-03-16T16:00:00Z', receiptImage: 'https://test/receipt8.jpg',
    locationString: '19.11800, 72.90500',
  },
  {
    id: 'test-safe-09', userId: 'emp004', userName: 'Sunita Reddy',
    vendor: 'Jio Recharge', amount: 599, category: 'Bills',
    date: '2026-03-15T09:00:00Z', receiptImage: 'https://test/receipt9.jpg',
    locationString: '12.97160, 77.59460',
  },
  {
    id: 'test-safe-10', userId: 'emp005', userName: 'Deepak Verma',
    vendor: 'Haldirams', amount: 320, category: 'Food',
    date: '2026-03-19T13:00:00Z', receiptImage: 'https://test/receipt10.jpg',
    locationString: '28.63200, 77.21900',
  },

  // ── REVIEW (MODERATE RISK) ──────────────────────
  {
    id: 'test-review-01', userId: 'emp001', userName: 'Rajesh Kumar',
    vendor: 'Taj Hotel', amount: 12000, category: 'Entertainment',
    date: '2026-03-20T21:00:00Z', receiptImage: 'https://test/receipt11.jpg',
    locationString: '28.60300, 77.22500',
    ocrData: { amount: 11200, vendor: 'Taj Palace', invoice_number: 'TAJ-5555' },
    // Triggers: high amount + OCR mismatch
  },
  {
    id: 'test-review-02', userId: 'emp002', userName: 'Priya Sharma',
    vendor: 'Zomato', amount: 5000, category: 'Food',
    date: '2026-03-20T13:00:00Z', receiptImage: 'https://test/receipt12.jpg',
    locationString: '28.61390, 77.20900',
    // Triggers: rounded amount
  },
  {
    id: 'test-review-03', userId: 'emp003', userName: 'Amit Patel',
    vendor: 'Unknown Store', amount: 8500, category: 'Shopping',
    date: '2026-03-22T02:00:00Z',
    locationString: '19.07600, 72.87770',
    // Triggers: no receipt + late night
  },
  {
    id: 'test-review-04', userId: 'emp004', userName: 'Sunita Reddy',
    vendor: 'FabIndia', amount: 7200, category: 'Shopping',
    date: '2026-03-21T15:00:00.000Z', receiptImage: 'https://test/receipt14.jpg',
    locationString: '12.97160, 77.59460',
    ocrData: { amount: 4800, vendor: 'FabIndia', invoice_number: 'FB-3322' },
    // Triggers: OCR mismatch (big difference)
  },
  {
    id: 'test-review-05', userId: 'emp001', userName: 'Rajesh Kumar',
    vendor: 'Cafe Coffee Day', amount: 290, category: 'Food',
    date: '2026-03-20T13:00:00Z', receiptImage: 'https://test/receipt15.jpg',
    locationString: '28.49450, 77.08800',
    // Triggers: potential duplicate of test-safe-01
  },

  // ── FRAUD (HIGH RISK) ───────────────────────────
  {
    id: 'test-fraud-01', userId: 'emp005', userName: 'Deepak Verma',
    vendor: 'Electronics Bazaar', amount: 45000, category: 'Shopping',
    date: '2026-03-20T03:00:00Z',
    locationString: '28.63200, 77.21900',
    // Triggers: extremely high amount + no receipt + 3 AM
  },
  {
    id: 'test-fraud-02', userId: 'emp001', userName: 'Rajesh Kumar',
    vendor: 'Delhi Restaurant', amount: 25000, category: 'Food',
    date: '2026-03-20T14:00:00Z', receiptImage: 'https://test/receipt17.jpg',
    locationString: '12.97160, 77.59460',
    ocrData: { amount: 2500, vendor: 'Delhi Dhaba', invoice_number: 'DD-001' },
    // Triggers: amount 10x OCR + food ₹25K absurd + location Bangalore vs Delhi vendor
  },
  {
    id: 'test-fraud-03', userId: 'emp002', userName: 'Priya Sharma',
    vendor: 'Ghost Vendor XYZ', amount: 30000, category: 'Other',
    date: '2026-03-23T01:00:00Z',
    locationString: '28.61390, 77.20900',
    // Triggers: no receipt + very high + 1 AM + unknown vendor
  },
  {
    id: 'test-fraud-04', userId: 'emp003', userName: 'Amit Patel',
    vendor: 'Hyderabad Biryani', amount: 15000, category: 'Food',
    date: '2026-03-20T12:30:00Z', receiptImage: 'https://test/receipt19.jpg',
    locationString: '22.57260, 88.36390',
    // Triggers: Mumbai user location shows Kolkata (impossible travel) + ₹15K food
  },
  {
    id: 'test-fraud-05', userId: 'emp004', userName: 'Sunita Reddy',
    vendor: 'Luxury Watches', amount: 55000, category: 'Shopping',
    date: '2026-03-22T04:00:00Z',
    locationString: '28.70410, 77.10250',
    ocrData: { amount: 5500, vendor: 'Watch Hub', invoice_number: 'WH-999' },
    // Triggers: 10x OCR mismatch + extremely high + 4 AM + no Bangalore location
  },
];
