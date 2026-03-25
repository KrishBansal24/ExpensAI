// ============================================
// ExpensAI — Add Expense Screen
// ============================================
// Features: Receipt upload, OCR simulation, auto-fill,
// duplicate detection, spending limit check, fraud flags.

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { simulateOCR } from '../utils/ocrSimulation';
import { checkDuplicate, checkSpendingLimit, checkFraudFlags, formatCurrency } from '../utils/smartFeatures';
import AlertModal from '../components/AlertModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IoCameraOutline, IoImageOutline, IoCloudUploadOutline,
  IoCheckmarkCircle, IoArrowBack, IoScanOutline, IoDocumentTextOutline
} from 'react-icons/io5';

const categories = [
  { id: 'food', label: 'Food', icon: '🍽️' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'hotel', label: 'Hotel', icon: '🏨' },
  { id: 'transport', label: 'Transport', icon: '🚕' },
  { id: 'office', label: 'Office', icon: '📎' },
  { id: 'client', label: 'Client', icon: '🎭' },
  { id: 'general', label: 'General', icon: '💳' },
];

export default function AddExpense() {
  const navigate = useNavigate();
  const { addExpense, budget, myExpenses } = useApp();
  const fileInputRef = useRef(null);

  // Form state
  const [receipt, setReceipt] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('2026-03-22');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('Gurugram, India');

  // Alerts
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'warning' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Handle receipt upload
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceipt(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptPreview(ev.target.result);
    reader.readAsDataURL(file);

    // Start OCR simulation
    setIsScanning(true);
    setScanComplete(false);

    try {
      const result = await simulateOCR(file);
      setOcrResult(result);
      setVendor(result.vendor);
      setAmount(String(result.amount));
      setDate(result.date);
      setScanComplete(true);
    } catch {
      setScanComplete(false);
    } finally {
      setIsScanning(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!vendor || !amount || !date || !category) {
      setAlertModal({
        isOpen: true,
        title: 'Missing Information',
        message: 'Please fill in all required fields: vendor, amount, date, and category.',
        type: 'warning',
      });
      return;
    }

    const expenseData = {
      vendor,
      amount: parseFloat(amount),
      date,
      category,
      notes,
      location,
      receipt: receiptPreview,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      coordinates: { lat: 28.4595, lng: 77.0266 },
    };

    // Check for duplicates
    const dupCheck = checkDuplicate(expenseData, myExpenses);
    if (dupCheck.isDuplicate) {
      setAlertModal({
        isOpen: true,
        title: '⚠️ Possible Duplicate',
        message: dupCheck.message,
        type: 'warning',
        onConfirm: () => {
          setAlertModal({ isOpen: false });
          submitExpense(expenseData);
        },
      });
      return;
    }

    // Check spending limit
    const limitCheck = checkSpendingLimit(budget.spent, budget.total, parseFloat(amount));
    if (limitCheck.level === 'critical') {
      setAlertModal({
        isOpen: true,
        title: '🚫 Budget Exceeded',
        message: limitCheck.message,
        type: 'critical',
        onConfirm: () => {
          setAlertModal({ isOpen: false });
          submitExpense(expenseData);
        },
      });
      return;
    }

    if (limitCheck.level === 'warning') {
      setAlertModal({
        isOpen: true,
        title: '⚠️ Approaching Limit',
        message: limitCheck.message,
        type: 'caution',
        onConfirm: () => {
          setAlertModal({ isOpen: false });
          submitExpense(expenseData);
        },
      });
      return;
    }

    // Check fraud flags
    const fraudCheck = checkFraudFlags(expenseData);
    if (fraudCheck.hasFraudFlags) {
      setAlertModal({
        isOpen: true,
        title: '🔍 Flagged for Review',
        message: fraudCheck.flags[0].message + ' This expense may require additional approval.',
        type: 'info',
        onConfirm: () => {
          setAlertModal({ isOpen: false });
          submitExpense(expenseData);
        },
      });
      return;
    }

    submitExpense(expenseData);
  };

  const submitExpense = (expenseData) => {
    setIsSubmitting(true);
    setTimeout(() => {
      addExpense(expenseData);
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => navigate('/home'), 1500);
    }, 1000);
  };

  // Success State
  if (submitted) {
    return (
      <div className="screen success-screen">
        <motion.div
          className="success-content"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <div className="success-icon">
            <IoCheckmarkCircle />
          </div>
          <h2>Expense Submitted!</h2>
          <p>Your expense of {formatCurrency(amount)} has been submitted for review.</p>
          <p className="success-note">You'll be notified when it's approved.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="screen add-expense-screen">
      {/* Header */}
      <div className="screen-header">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <IoArrowBack />
        </button>
        <h2 className="screen-title">Add Expense</h2>
        <div style={{ width: 40 }} />
      </div>

      <form className="add-expense-form" onSubmit={handleSubmit}>
        {/* Receipt Upload */}
        <div className="upload-section">
          <AnimatePresence mode="wait">
            {!receiptPreview ? (
              <motion.div
                key="upload"
                className="upload-area"
                onClick={() => fileInputRef.current?.click()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileTap={{ scale: 0.98 }}
              >
                <IoCloudUploadOutline className="upload-icon" />
                <p className="upload-text">Upload Receipt</p>
                <p className="upload-hint">Tap to use camera or gallery</p>
                <div className="upload-buttons">
                  <span className="upload-btn"><IoCameraOutline /> Camera</span>
                  <span className="upload-btn"><IoImageOutline /> Gallery</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                className="receipt-preview"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <img src={receiptPreview} alt="Receipt" className="receipt-image" />

                {/* Scanning overlay */}
                {isScanning && (
                  <div className="scan-overlay">
                    <div className="scan-line" />
                    <div className="scan-info">
                      <IoScanOutline className="scan-icon spinning" />
                      <p>Scanning receipt with AI...</p>
                    </div>
                  </div>
                )}

                {/* Scan complete indicator */}
                {scanComplete && (
                  <motion.div
                    className="scan-complete"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <IoCheckmarkCircle />
                    <span>OCR Complete — {ocrResult?.confidence}% confidence</span>
                  </motion.div>
                )}

                <button
                  type="button"
                  className="btn-text change-receipt-btn"
                  onClick={() => {
                    setReceipt(null);
                    setReceiptPreview(null);
                    setScanComplete(false);
                    setOcrResult(null);
                  }}
                >
                  Change Receipt
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {/* OCR extracted data indicator */}
        {scanComplete && (
          <motion.div
            className="ocr-banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <IoDocumentTextOutline />
            <span>Fields auto-filled from receipt scan. Please verify and edit if needed.</span>
          </motion.div>
        )}

        {/* Form Fields */}
        <div className="form-fields">
          <div className="form-group">
            <label className="form-label">Vendor *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Starbucks Coffee"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              className="form-input form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              type="text"
              className="form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Auto-detected GPS location"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Add any additional notes or justification..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Submit */}
        <motion.button
          className="btn btn-primary btn-full btn-lg"
          type="submit"
          disabled={isSubmitting}
          whileTap={{ scale: 0.97 }}
        >
          {isSubmitting ? <div className="spinner" /> : 'Submit Expense'}
        </motion.button>
      </form>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onConfirm={alertModal.onConfirm}
        confirmText="Submit Anyway"
      />
    </div>
  );
}
