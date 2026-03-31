import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { formatCurrency, timeAgo } from '../utils';
import { IoDownloadOutline, IoEyeOutline, IoCloseOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoLocationOutline, IoCameraOutline, IoCardOutline } from 'react-icons/io5';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState('pending'); 
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedExpense, setSelectedExpense] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, 'expenses'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(liveData);
      setLoading(false);
    }, (error) => {
      console.error("Expenses sync error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleApprove = async (id) => {
    try {
      await updateDoc(doc(db, 'expenses', id), { status: 'approved' });
      if (selectedExpense?.id === id) setSelectedExpense({...selectedExpense, status: 'approved'});
    } catch (err) {
      console.error("Approve failed:", err);
    }
  };

  const handleReject = async (id) => {
    try {
      await updateDoc(doc(db, 'expenses', id), { status: 'rejected' });
      if (selectedExpense?.id === id) setSelectedExpense({...selectedExpense, status: 'rejected'});
    } catch (err) {
      console.error("Reject failed:", err);
    }
  };

  const exportToCSV = () => {
    if (expenses.length === 0) return;
    const headers = ['ID', 'Employee Name', 'Merchant', 'Category', 'Amount', 'Date', 'Status', 'Location', 'UPI ID'];
    const rows = expenses.map(exp => [
      exp.id, `"${exp.userName || 'Employee'}"`, `"${exp.vendor}"`, `"${exp.category || 'general'}"`,
      exp.amount, `"${new Date(exp.date).toLocaleDateString()}"`, exp.status,
      `"${exp.locationString || 'Unknown'}"`, `"${exp.upiIdScanned || 'N/A'}"`
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

  const filteredExpenses = expenses.filter(e => {
    const matchesFilter = filter === 'all' || e.status === filter;
    const matchesSearch = (e.vendor || '').toLowerCase().includes(search.toLowerCase()) || 
                          (e.userName || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="page-container relative">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Manual Verification Queue</h1>
        
        <div style={{ display: 'flex', gap: '16px' }}>
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
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(exp => (
                <tr key={exp.id} className={exp.status === 'pending' ? 'row-highlight' : ''}>
                  <td style={{ fontSize: '0.875rem' }}>
                     <div>{new Date(exp.date).toLocaleDateString()}</div>
                     <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>{timeAgo(exp.date)}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{exp.userName || 'Employee'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>UID: {exp.userId?.slice(0,6)}</div>
                  </td>
                  <td>
                     <div style={{ fontWeight: 500 }}>{exp.vendor}</div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}><IoLocationOutline style={{transform:'translateY(2px)'}}/> {exp.locationString?.split(',')[0] || 'Unknown City'}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(exp.amount)}</td>
                  <td><span className={`status-badge status-${exp.status}`}>{exp.status}</span></td>
                  <td style={{ textAlign: 'center' }}>
                     <button onClick={() => setSelectedExpense(exp)} className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <IoEyeOutline size={16} /> Review
                     </button>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>No expenses match criteria.</td></tr>
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
                        {selectedExpense.receiptImage ? (
                           <img src={selectedExpense.receiptImage} alt="Receipt" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
                           <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{selectedExpense.vendor}</span>
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
                           <span>{new Date(selectedExpense.date).toLocaleString()}</span>
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
                           {selectedExpense.locationString || "Location not captured during submission."}
                        </div>
                     </div>

                     <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><IoCardOutline size={20}/> UPI Transaction Match</h3>
                        <div style={{ padding: '16px', background: 'var(--color-surface-hover)', borderRadius: '8px', borderLeft: '4px solid #8b5cf6' }}>
                           <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Scanned Merchant UPI ID:</div>
                           <div style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{selectedExpense.upiIdScanned || "Not Paid via App QR Scanner"}</div>
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
                        <button onClick={() => handleReject(selectedExpense.id)} className="btn btn-outline" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}>
                           <IoCloseCircleOutline size={20}/> Reject Claim
                        </button>
                        <button onClick={() => handleApprove(selectedExpense.id)} className="btn btn-primary" style={{ backgroundColor: 'var(--color-success)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}>
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
