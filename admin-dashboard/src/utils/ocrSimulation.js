// ============================================
// ExpensAI — OCR Simulation Utility
// ============================================
// Simulates Optical Character Recognition on uploaded receipts.
// In a real app, this would call Google Cloud Vision / AWS Textract.

import { ocrPatterns } from '../data/dummyData';

/**
 * Simulate OCR extraction from a receipt image.
 * Returns a promise that resolves after a realistic delay
 * with extracted vendor, amount, and date.
 */
export function simulateOCR() {
  return new Promise((resolve) => {
    // Simulate processing delay (1.5 - 3 seconds)
    const delay = 1500 + Math.random() * 1500;

    setTimeout(() => {
      // Pick a random OCR pattern to simulate extraction
      const pattern = ocrPatterns[Math.floor(Math.random() * ocrPatterns.length)];

      // Add slight variation to amount to seem realistic
      const variation = Math.floor(Math.random() * 200) - 100;
      const extractedAmount = Math.max(100, pattern.amount + variation);

      resolve({
        vendor: pattern.vendor,
        amount: extractedAmount,
        date: pattern.date,
        confidence: (85 + Math.random() * 14).toFixed(1), // 85-99% confidence
        rawText: `Receipt from ${pattern.vendor}\nDate: ${pattern.date}\nTotal: ₹${extractedAmount}\nThank you for your purchase!`,
      });
    }, delay);
  });
}
