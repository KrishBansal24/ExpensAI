import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { formatCurrency } from '../utils';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [newBudget, setNewBudget] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(data.filter(u => u.role !== 'manager')); // only show employees
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleUpdateBudget = async (id) => {
    try {
      await updateDoc(doc(db, 'users', id), { budgetAllocated: parseFloat(newBudget) });
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
            {employees.map(emp => (
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
                    formatCurrency(emp.budgetAllocated || 0)
                  )}
                </td>
                <td>
                  {editingId === emp.id ? (
                    <div className="action-buttons">
                      <button className="btn btn-outline" style={{ color: 'var(--color-success)', borderColor: 'var(--color-success)'}} onClick={() => handleUpdateBudget(emp.id)}>Save</button>
                      <button className="btn btn-outline" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button className="btn btn-outline" onClick={() => { setEditingId(emp.id); setNewBudget(emp.budgetAllocated || 0); }}>
                      Edit Budget
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px' }}>No employees found. Register a user via the Mobile App.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
