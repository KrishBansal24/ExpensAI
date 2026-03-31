import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { formatCurrency } from '../utils';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [newBudget, setNewBudget] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  const getUserTimestamp = (user) => {
    const raw = user?.createdAt || user?.date || user?.updatedAt;
    if (raw && typeof raw === 'object' && typeof raw.seconds === 'number') {
      return raw.seconds * 1000;
    }
    const parsed = Date.parse(raw || '');
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const employeeRows = data.filter((u) => u.role !== 'manager');
      setEmployees(employeeRows);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const liveSearch = searchInput.trim().toLowerCase();

  const visibleEmployees = [...employees]
    .filter((emp) => {
      if (!liveSearch) return true;
      return [emp.name, emp.email, emp.department, emp.upiId, emp.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(liveSearch));
    })
    .sort((a, b) => {
      if (sortBy === 'latest') return getUserTimestamp(b) - getUserTimestamp(a);
      if (sortBy === 'oldest') return getUserTimestamp(a) - getUserTimestamp(b);
      if (sortBy === 'name-az') return String(a.name || '').localeCompare(String(b.name || ''));
      if (sortBy === 'name-za') return String(b.name || '').localeCompare(String(a.name || ''));
      return 0;
    });

  const handleUpdateBudget = async (id) => {
    try {
      const parsedBudget = Number(newBudget);
      if (!Number.isFinite(parsedBudget) || parsedBudget < 0) {
        alert('Please enter a valid budget amount.');
        return;
      }

      const employee = employees.find((emp) => emp.id === id);
      const walletSpent = Number(employee?.walletSpent || 0);
      const walletBalance = Math.max(parsedBudget - walletSpent, 0);

      await updateDoc(doc(db, 'users', id), {
        walletAssigned: parsedBudget,
        walletBalance,
        period: 'Monthly',
        updatedAt: new Date().toISOString(),
      });

      setEditingId(null);
    } catch (e) {
      alert("Failed to update budget.");
      console.error(e);
    }
  };

  if (loading) return <div style={{ padding: '48px', textAlign: 'center' }}>Loading employees...</div>;

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: '24px' }}>Team Management</h1>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
          <input
            type="text"
            className="field"
            placeholder="Search by name, email, department, phone, or UPI"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <select className="field" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="latest">Latest Added</option>
            <option value="oldest">Oldest Added</option>
            <option value="name-az">Name A-Z</option>
            <option value="name-za">Name Z-A</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Contact / UPI</th>
              <th>Allocated Monthly Budget</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleEmployees.map(emp => (
              <tr key={emp.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{emp.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{emp.email}</div>
                </td>
                <td>{emp.department || 'Unassigned'}</td>
                <td>
                  <div>{emp.phone || 'N/A'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>{emp.upiId}</div>
                </td>
                <td style={{ fontWeight: 600 }}>
                  {editingId === emp.id ? (
                    <input 
                      type="number" 
                      value={newBudget} 
                      onChange={(e) => setNewBudget(e.target.value)}
                      style={{ padding: '4px', width: '100px' }}
                      autoFocus
                    />
                  ) : (
                    formatCurrency(emp.walletAssigned ?? emp.budgetAllocated ?? 0)
                  )}
                </td>
                <td>
                  {editingId === emp.id ? (
                    <div className="action-buttons">
                      <button className="btn btn-outline" style={{ color: 'var(--color-success)', borderColor: 'var(--color-success)'}} onClick={() => handleUpdateBudget(emp.id)}>Save</button>
                      <button className="btn btn-outline" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="btn btn-outline" onClick={() => { setEditingId(emp.id); setNewBudget(String(emp.walletAssigned ?? emp.budgetAllocated ?? 0)); }}>
                      Edit Budget
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {visibleEmployees.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px' }}>No employees found. Register a user via the Mobile App.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
