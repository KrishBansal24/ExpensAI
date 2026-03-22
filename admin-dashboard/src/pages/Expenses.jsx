import { useState } from 'react';
import { initialExpenses } from '../data';
import { formatCurrency, timeAgo } from '../utils';

export default function Expenses() {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  const handleApprove = (id) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' } : e));
  };

  const handleReject = (id) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'rejected' } : e));
  };

  const filteredExpenses = expenses.filter(e => {
    if (filter === 'all') return true;
    return e.status === filter;
  });

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>All Expenses</h1>
        
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          style={{ 
            padding: '8px 12px', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)'
          }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee</th>
              <th>Merchant & Category</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map(exp => (
              <tr key={exp.id}>
                <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  {exp.id.slice(0, 8)}...
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{exp.userId === 'emp_001' ? 'Jyoti Sharma' : 'Employee'}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{exp.vendor}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                    {exp.category}
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{formatCurrency(exp.amount)}</td>
                <td style={{ fontSize: '0.875rem' }}>{timeAgo(exp.date)}</td>
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
            
            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>
                  No expenses found for the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
