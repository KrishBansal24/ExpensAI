import { useState } from 'react';
import { initialExpenses } from '../data';
import { formatCurrency, timeAgo } from '../utils';

export default function Dashboard() {
  const [expenses] = useState(initialExpenses);
  
  // Basic analytics calculations
  const totalExpenses = expenses.length;
  const pendingCount = expenses.filter(e => e.status === 'pending').length;
  
  const totalApprovedAmount = expenses
    .filter(e => e.status === 'approved')
    .reduce((sum, e) => sum + e.amount, 0);

  // Category breakdown
  const categoryTotals = expenses.reduce((acc, exp) => {
    if (exp.status === 'approved') {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    }
    return acc;
  }, {});

  return (
    <div className="page-container">
      <h1 style={{ marginBottom: '24px' }}>Overview</h1>
      
      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="card stat-card">
          <span className="stat-title">Total Submitted</span>
          <span className="stat-value">{totalExpenses}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-title">Pending Review</span>
          <span className="stat-value" style={{ color: 'var(--color-warning)' }}>{pendingCount}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-title">Approved Spend</span>
          <span className="stat-value" style={{ color: 'var(--color-success)' }}>
            {formatCurrency(totalApprovedAmount)}
          </span>
        </div>
      </div>

      {/* Quick Recent List & Category Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Recent Submissions</h2>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Merchant</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {expenses.slice(0, 5).map(exp => (
                <tr key={exp.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{exp.userId === 'emp_001' ? 'Jyoti Sharma' : 'Employee'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Engineering</div>
                  </td>
                  <td>{exp.vendor}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(exp.amount)}</td>
                  <td><span className={`status-badge status-${exp.status}`}>{exp.status}</span></td>
                  <td style={{ fontSize: '0.875rem' }}>{timeAgo(exp.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Spend by Category</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(categoryTotals)
              .sort(([,a], [,b]) => b - a)
              .map(([category, amount]) => (
              <div key={category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                  <span style={{ textTransform: 'capitalize' }}>{category}</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(amount)}</span>
                </div>
                {/* Simple progress bar representation */}
                <div style={{ width: '100%', height: '8px', background: 'var(--color-surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${(amount / totalApprovedAmount) * 100}%`, 
                    height: '100%', 
                    background: 'var(--color-primary)',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
