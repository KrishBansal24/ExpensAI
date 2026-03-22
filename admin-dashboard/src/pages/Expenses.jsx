import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, runTransaction, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { formatCurrency, timeAgo } from '../utils';
import { IoDownloadOutline } from 'react-icons/io5';

export default function Expenses() {
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('50000');
  const [filter, setFilter] = useState('all'); 
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const liveData = snapshot.docs
        .map((docItem) => ({ id: docItem.id, ...docItem.data() }))
        .sort((a, b) => Date.parse(b?.timestamp || 0) - Date.parse(a?.timestamp || 0));
      setTransactions(liveData);
      setLoading(false);
    }, (error) => {
      console.error('Transactions sync error:', error);
      setLoading(false);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const liveUsers = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
      setUsers(liveUsers);
      if (!selectedUserId && liveUsers.length > 0) {
        setSelectedUserId(liveUsers[0].id);
      }
    }, (error) => {
      console.error('Users sync error:', error);
    });

    return () => {
      unsubTransactions();
      unsubUsers();
    };
  }, [selectedUserId]);

  const handleApprove = async (id) => {
    try {
      await setDoc(doc(db, 'transactions', id), { status: 'approved' }, { merge: true });
    } catch (err) {
      console.error("Approve failed:", err);
    }
  };

  const handleReject = async (id) => {
    try {
      const txRef = doc(db, 'transactions', id);
      await runTransaction(db, async (transaction) => {
        const txSnap = await transaction.get(txRef);
        if (!txSnap.exists()) {
          throw new Error('Transaction not found');
        }
        const txData = txSnap.data();
        if (txData.status === 'rejected') {
          return;
        }

        transaction.set(txRef, { status: 'rejected' }, { merge: true });

        const userRef = doc(db, 'users', txData.userId);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          return;
        }

        const userData = userSnap.data();
        const amount = Number(txData.amount || 0);
        transaction.set(userRef, {
          walletBalance: Number(userData.walletBalance || 0) + amount,
          walletSpent: Math.max(Number(userData.walletSpent || 0) - amount, 0),
        }, { merge: true });
      });
    } catch (err) {
      console.error("Reject failed:", err);
    }
  };

  const assignBudget = async () => {
    const parsed = Number(budgetAmount);
    if (!selectedUserId || !Number.isFinite(parsed) || parsed <= 0) {
      return;
    }

    try {
      await setDoc(doc(db, 'users', selectedUserId), {
        walletAssigned: parsed,
        walletBalance: parsed,
        walletSpent: 0,
        period: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      }, { merge: true });
    } catch (error) {
      console.error('Assign budget failed:', error);
    }
  };

  const exportToCSV = () => {
    if (transactions.length === 0) return;
    
    // Create CSV header
    const headers = ['ID', 'Employee Name', 'Category', 'Amount', 'Payment Mode', 'Status', 'Timestamp', 'Latitude', 'Longitude'];
    
    // Map data to rows
    const rows = transactions.map(tx => [
      tx.id,
      `"${tx.userName || 'Employee'}"`,
      `"${tx.category || 'general'}"`,
      tx.amount,
      tx.paymentMode || 'UPI',
      tx.status,
      `"${tx.timestamp || ''}"`,
      tx.location?.lat ?? '',
      tx.location?.lng ?? ''
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `expensai_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = transactions.filter(e => {
    const matchesFilter = filter === 'all' || e.status === filter;
    const matchesSearch = (e.category || '').toLowerCase().includes(search.toLowerCase()) || 
                          (e.userName || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="page-container">
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '12px' }}>Wallet Management</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.name || user.email || user.id}</option>
            ))}
          </select>
          <input
            type="number"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value)}
            placeholder="Assigned budget"
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
          />
          <button onClick={assignBudget} className="btn btn-primary">Assign Budget</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>UPI Transactions</h1>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <input 
            type="text"
            placeholder="Search category or employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)', color: 'var(--color-text)',
              width: '250px'
            }}
          />
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ 
              padding: '8px 12px', borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)', color: 'var(--color-text)'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button onClick={exportToCSV} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IoDownloadOutline /> Export CSV
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>Loading database...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Location</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(exp => (
                <tr key={exp.id}>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    {exp.id.slice(0, 8)}...
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{exp.userName || 'Employee'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {exp.userId?.slice(0,8)}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{exp.category || 'General'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                      {exp.paymentMode || 'UPI'} • {timeAgo(exp.timestamp)}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(exp.amount)}</td>
                  <td style={{ fontSize: '0.875rem' }}>
                    {exp.location?.lat ? `${exp.location.lat.toFixed(5)}, ${exp.location.lng.toFixed(5)}` : 'N/A'}
                  </td>
                  <td><span className={`status-badge status-${exp.status}`}>{exp.status}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    {exp.status === 'pending' ? (
                      <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                        <button onClick={() => handleApprove(exp.id)} className="btn btn-outline" style={{ color: 'var(--color-success)', borderColor: 'var(--color-success)', padding: '4px 8px', fontSize: '0.75rem' }}>Approve</button>
                        <button onClick={() => handleReject(exp.id)} className="btn btn-outline" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', padding: '4px 8px', fontSize: '0.75rem' }}>Reject</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Processed</span>
                    )}
                  </td>
                </tr>
              ))}
              
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
