import { useState, useEffect } from 'react';
import { formatCurrency, timeAgo } from '../utils';
import { IoDownloadOutline, IoEyeOutline, IoCloseOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoLocationOutline, IoCameraOutline, IoCardOutline, IoShieldCheckmarkOutline, IoWarningOutline, IoAlertCircleOutline } from 'react-icons/io5';
import { useAdminData } from '../context/AdminDataContext';
import { getFraudStatus, FRAUD_CONFIG } from '../services/fraudConfig';
import toast from 'react-hot-toast';

export default function Expenses() {
  const { transactions, loading, updateTransactionStatus, markAsFraud } = useAdminData();
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState('pending'); 
  const [search, setSearch] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [geoCache, setGeoCache] = useState({});
  const [showSuspiciousOnly, setShowSuspiciousOnly] = useState(false);
  
  // Modal State
  const [selectedExpense, setSelectedExpense] = useState(null);

  const getReceiptUrl = (row) => {
    return row?.receiptImage || row?.receiptImageUrl || row?.receiptUrl || row?.screenshotUrl || row?.proofImage || '';
  };

  useEffect(() => {
    setExpenses(transactions || []);
  }, [transactions]);

  const getCoords = (row) => {
    if (row?.location?.lat != null && row?.location?.lng != null) {
      return { lat: Number(row.location.lat), lng: Number(row.location.lng) };
    }

    const location = row?.locationString;
    if (typeof location === 'string') {
      const match = location.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
      if (match) {
        return { lat: Number(match[1]), lng: Number(match[2]) };
      }
    }
    return null;
  };

  const getCoordsKey = (row) => {
    const coords = getCoords(row);
    if (!coords) return null;
    return `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`;
  };

  const reverseGeocode = async (row) => {
    const key = getCoordsKey(row);
    if (!key || geoCache[key]) return;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    const coords = getCoords(row);
    if (!coords) return;

    try {
      setGeoCache((prev) => ({ ...prev, [key]: 'Resolving location...' }));
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.status === 'OK' && data?.results?.[0]?.formatted_address) {
        setGeoCache((prev) => ({ ...prev, [key]: data.results[0].formatted_address }));
        return;
      }

      const statusText = data?.status ? `Location unavailable (${data.status})` : 'Location unavailable';
      setGeoCache((prev) => ({ ...prev, [key]: statusText }));
    } catch (err) {
      console.error('Geocoding failed:', err);
      setGeoCache((prev) => ({ ...prev, [key]: 'Location unavailable' }));
    }
  };

  useEffect(() => {
    if (selectedExpense) {
      reverseGeocode(selectedExpense);
    }
  }, [selectedExpense]);

  const getLocationText = (row) => {
    if (row?.locationString && !/^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(row.locationString.trim())) {
      return row.locationString;
    }

    const key = getCoordsKey(row);
    if (key && geoCache[key]) return geoCache[key];

    const coords = getCoords(row);
    if (coords) return `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;

    return 'Location not captured during submission.';
  };

  const handleApprove = async (id) => {
    if (actionInProgress) return;
    try {
      setActionInProgress(true);
      await updateTransactionStatus({ transactionId: id, status: 'approved' });
      setExpenses((prev) => prev.map((row) => (row.id === id ? { ...row, status: 'approved' } : row)));
      if (selectedExpense?.id === id) setSelectedExpense((prev) => (prev ? { ...prev, status: 'approved' } : prev));
      toast.success('Expense approved.');
    } catch (err) {
      console.error("Approve failed:", err);
      toast.error(err?.message || 'Approve failed.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleReject = async (id) => {
    if (actionInProgress) return;
    try {
      setActionInProgress(true);
      await updateTransactionStatus({ transactionId: id, status: 'rejected' });
      setExpenses((prev) => prev.map((row) => (row.id === id ? { ...row, status: 'rejected' } : row)));
      if (selectedExpense?.id === id) setSelectedExpense((prev) => (prev ? { ...prev, status: 'rejected' } : prev));
      if (filter === 'pending' && selectedExpense?.id === id) {
        setSelectedExpense(null);
      }
      toast.success('Expense rejected.');
    } catch (err) {
      console.error("Reject failed:", err);
      toast.error(err?.message || 'Reject failed.');
    } finally {
      setActionInProgress(false);
    }
  };

  const exportToCSV = () => {
    if (expenses.length === 0) return;
    const headers = ['ID', 'Employee Name', 'Merchant', 'Category', 'Amount', 'Date', 'Status', 'Location', 'UPI ID'];
    const rows = expenses.map(exp => [
      exp.id, `"${exp.userName || 'Employee'}"`, `"${exp.vendor || exp.merchantName || 'Unknown'}"`, `"${exp.category || 'general'}"`,
      exp.amount, `"${new Date(exp.timestamp || exp.date).toLocaleDateString()}"`, exp.status,
      `"${exp.locationString || (exp.location?.lat ? `${exp.location.lat}, ${exp.location.lng}` : 'Unknown')}"`, `"${exp.upiIdScanned || exp.upiReference || 'N/A'}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `expensai_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMarkFraud = async (id) => {
    if (actionInProgress) return;
    try {
      setActionInProgress(true);
      await markAsFraud(id);
      setExpenses((prev) => prev.map((row) => (row.id === id ? { ...row, fraudStatus: 'fraud', status: 'rejected' } : row)));
      if (selectedExpense?.id === id) setSelectedExpense((prev) => (prev ? { ...prev, fraudStatus: 'fraud', status: 'rejected' } : prev));
      toast.success('Marked as fraud and rejected.');
    } catch (err) {
      console.error('Mark fraud failed:', err);
      toast.error(err?.message || 'Failed to mark as fraud.');
    } finally {
      setActionInProgress(false);
    }
  };

  const getFraudBadge = (row) => {
    const status = row.fraudStatus || 'unanalyzed';
    const score = row.riskScore;
    const icons = {
      safe: <IoShieldCheckmarkOutline size={14} />,
      review: <IoWarningOutline size={14} />,
      fraud: <IoAlertCircleOutline size={14} />,
    };
    return (
      <span className={`fraud-badge fraud-${status}`}>
        {icons[status] || null} {status === 'unanalyzed' ? '—' : `${status} (${score})`}
      </span>
    );
  };

  const filteredExpenses = expenses.filter(e => {
    const matchesFilter = filter === 'all' || e.status === filter;
    const matchesSearch = ((e.vendor || e.merchantName || '').toLowerCase().includes(search.toLowerCase())) || 
                          (e.userName || '').toLowerCase().includes(search.toLowerCase());
    const matchesSuspicious = !showSuspiciousOnly || (e.fraudStatus === 'review' || e.fraudStatus === 'fraud');
    return matchesFilter && matchesSearch && matchesSuspicious;
  });

  return (
    <div className="page-container relative">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Manual Verification Queue</h1>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
            <input type="checkbox" checked={showSuspiciousOnly} onChange={(e) => setShowSuspiciousOnly(e.target.checked)} />
            Show Suspicious Only
          </label>
          <input type="text" placeholder="Search vendor or employee..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', width: '250px' }}
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}>
            <option value="pending">Needs Review (Pending)</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Statuses</option>
          </select>
          <button onClick={exportToCSV} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IoDownloadOutline /> Export
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>Syncing database...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Merchant</th>
                <th>Amount</th>
                <th>Risk</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(exp => (
                <tr key={exp.id} className={exp.fraudStatus === 'fraud' ? 'row-fraud' : exp.fraudStatus === 'review' ? 'row-review' : exp.status === 'pending' ? 'row-highlight' : ''}>
                  <td style={{ fontSize: '0.875rem' }}>
                     <div>{new Date(exp.timestamp || exp.date).toLocaleDateString()}</div>
                     <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>{timeAgo(exp.timestamp || exp.date)}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{exp.userName || 'Employee'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>UID: {exp.userId?.slice(0,6)}</div>
                  </td>
                  <td>
                     <div style={{ fontWeight: 500 }}>{exp.vendor || exp.merchantName || 'Unknown Merchant'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}><IoLocationOutline style={{transform:'translateY(2px)'}}/> {getLocationText(exp).split(',')[0]}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(exp.amount)}</td>
                  <td>{getFraudBadge(exp)}</td>
                  <td><span className={`status-badge status-${exp.status}`}>{exp.status}</span></td>
                  <td style={{ textAlign: 'center' }}>
                     <button onClick={() => setSelectedExpense(exp)} className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <IoEyeOutline size={16} /> Review
                     </button>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>No expenses match criteria.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* DETAILED VERIFICATION MODAL */}
      {selectedExpense && (
         <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div className="card" style={{ width: '900px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: 0 }}>
               
               {/* Modal Header */}
               <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-surface-hover)' }}>
                  <h2 style={{ margin: 0 }}>Verification: {selectedExpense.userName}</h2>
                  <button onClick={() => setSelectedExpense(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}><IoCloseOutline size={32}/></button>
               </div>

               {/* Modal Body */}
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', padding: '32px' }}>
                  
                  {/* Left Column: Image */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                     <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><IoCameraOutline size={20}/> Scanned Receipt</h3>
                     <div style={{ width: '100%', height: '400px', backgroundColor: '#e2e8f0', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getReceiptUrl(selectedExpense) ? (
                        <img src={getReceiptUrl(selectedExpense)} alt="Receipt" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                           <div style={{ color: '#64748b' }}>No receipt image provided.</div>
                        )}
                     </div>
                  </div>

                  {/* Right Column: Details & UPI */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                     
                     <div style={{ padding: '24px', backgroundColor: 'var(--color-surface-hover)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                        <h3 style={{ marginBottom: '16px' }}>AI Extracted Data</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                           <span style={{ color: 'var(--color-text-secondary)' }}>Merchant:</span>
                           <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{selectedExpense.vendor || selectedExpense.merchantName || 'Unknown Merchant'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                           <span style={{ color: 'var(--color-text-secondary)' }}>Amount Claimed:</span>
                           <span style={{ fontWeight: 'bold', fontSize: '1.5rem', color: 'var(--color-primary)' }}>{formatCurrency(selectedExpense.amount)}</span>
                        </div>
                        
                        {(selectedExpense.vatTax !== undefined || selectedExpense.confidence) && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                             <span style={{ color: 'var(--color-text-secondary)' }}>VAT / Tax:</span>
                             <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{selectedExpense.vatTax ? formatCurrency(selectedExpense.vatTax) : 'N/A'}</span>
                             <span style={{ color: 'var(--color-text-secondary)', marginLeft: 8 }}>Confidence:</span>
                             <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{selectedExpense.confidence ? (selectedExpense.confidence * 100).toFixed(0) + "%" : 'N/A'}</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.85rem' }}>
                           <span style={{ color: 'var(--color-text-secondary)' }}>Extracted Date:</span>
                           <span>{new Date(selectedExpense.timestamp || selectedExpense.date).toLocaleString()}</span>
                        </div>

                        {selectedExpense.items && selectedExpense.items.length > 0 && (
                          <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Itemized Bill:</span>
                            <ul style={{ paddingLeft: '20px', margin: '8px 0 0 0', fontSize: '0.85rem' }}>
                              {selectedExpense.items.map((it, idx) => (
                                <li key={idx}><strong>{it.quantity || 1}x</strong> {it.name} - {formatCurrency(it.price)}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                     </div>

                     <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><IoLocationOutline size={20}/> GPS Tag</h3>
                        <div style={{ padding: '16px', background: 'var(--color-surface-hover)', borderRadius: '8px', fontSize: '0.875rem' }}>
                          {getLocationText(selectedExpense)}
                        </div>
                     </div>

                     <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><IoCardOutline size={20}/> UPI Transaction Match</h3>
                        <div style={{ padding: '16px', background: 'var(--color-surface-hover)', borderRadius: '8px', borderLeft: '4px solid #8b5cf6' }}>
                           <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Scanned Merchant UPI ID:</div>
                           <div style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{selectedExpense.upiIdScanned || selectedExpense.upiReference || "Not Paid via App QR Scanner"}</div>
                           {selectedExpense.notes && <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Notes: {selectedExpense.notes}</div>}
                        </div>
                     </div>

                  </div>
               </div>

               {/* Modal Footer (Actions) */}
               <div style={{ padding: '24px 32px', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)', display: 'flex', justifyContent: 'flex-end', gap: '16px', alignItems: 'center' }}>
                  {selectedExpense.status === 'pending' ? (
                     <>
                        <span style={{ marginRight: 'auto', fontWeight: 500, color: 'var(--color-warning)' }}>Review Required</span>
                        <button disabled={actionInProgress} onClick={() => handleMarkFraud(selectedExpense.id)} className="btn" style={{ backgroundColor: 'rgba(220,38,38,0.1)', color: 'var(--color-danger)', border: '1px solid rgba(220,38,38,0.3)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', opacity: actionInProgress ? 0.7 : 1 }}>
                           <IoAlertCircleOutline size={20}/> Mark as Fraud
                        </button>
                        <button disabled={actionInProgress} onClick={() => handleReject(selectedExpense.id)} className="btn btn-outline" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', opacity: actionInProgress ? 0.7 : 1 }}>
                           <IoCloseCircleOutline size={20}/> Reject Claim
                        </button>
                        <button disabled={actionInProgress} onClick={() => handleApprove(selectedExpense.id)} className="btn btn-primary" style={{ backgroundColor: 'var(--color-success)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', opacity: actionInProgress ? 0.7 : 1 }}>
                           <IoCheckmarkCircleOutline size={20}/> Authenticate & Approve
                        </button>
                     </>
                  ) : (
                     <span className={`status-badge status-${selectedExpense.status}`} style={{ fontSize: '1rem', padding: '8px 16px' }}>
                        Previously {selectedExpense.status.toUpperCase()}
                     </span>
                  )}
               </div>

            </div>
         </div>
      )}
    </div>
  );
}
