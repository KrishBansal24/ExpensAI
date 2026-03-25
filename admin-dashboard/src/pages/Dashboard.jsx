import { useMemo } from 'react';
import { IoAlertCircleOutline, IoTrendingUpOutline } from 'react-icons/io5';
import MetricCard from '../components/MetricCard';
import { useAdminData } from '../context/AdminDataContext';
import { formatCurrency, formatDateTime, timeAgo } from '../utils';

export default function Dashboard() {
  const { transactions, totals, loading, error } = useAdminData();

  const latestTransactions = useMemo(() => transactions.slice(0, 8), [transactions]);

  const notifications = useMemo(() => {
    return transactions
      .filter((tx) => {
        const amount = Number(tx.amount || 0);
        return amount >= 10000 || tx.status === 'rejected';
      })
      .slice(0, 6)
      .map((tx) => {
        const amount = Number(tx.amount || 0);
        const isHighAmount = amount >= 10000;
        return {
          id: tx.id,
          type: isHighAmount ? 'high-value' : 'policy',
          message: isHighAmount
            ? `High-value transaction ${formatCurrency(amount)} by ${tx.userName || 'employee'}`
            : `Rejected transaction detected for ${tx.userName || 'employee'}`,
          timestamp: tx.timestamp,
        };
      });
  }, [transactions]);

  if (loading) {
    return <div className="page-container"><div className="card">Syncing dashboard with Firebase...</div></div>;
  }

  if (error) {
    return <div className="page-container"><div className="card" style={{ color: 'var(--color-danger)' }}>{error}</div></div>;
  }

  return (
    <div className="page-container">
      <section className="section-headline" style={{ marginBottom: 16 }}>
        <h1>Overview</h1>
        <p>Real-time snapshot of wallet allocation, UPI flow, and transaction review workload.</p>
      </section>
      
      <section className="stats-grid">
        <MetricCard title="Total transactions" value={totals.transactionCount} subtitle="All UPI submissions" />
        <MetricCard title="Pending review" value={totals.pendingCount} subtitle="Manager action required" accent="var(--color-warning)" />
        <MetricCard title="Approved spend" value={formatCurrency(totals.approvedAmount)} subtitle="Across all employees" accent="var(--color-success)" />
        <MetricCard title="Wallet assigned" value={formatCurrency(totals.totalAssigned)} subtitle="Current active cycle" />
        <MetricCard title="Wallet balance" value={formatCurrency(totals.totalBalance)} subtitle="Remaining funds" accent="var(--color-secondary)" />
        <MetricCard title="Wallet spent" value={formatCurrency(totals.totalSpent)} subtitle="Real-time from user profiles" accent="var(--color-danger)" />
      </section>

      <section className="dashboard-grid">
        <article className="card" style={{ overflowX: 'auto' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Live UPI Activity</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Decision</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {latestTransactions.map((exp) => (
                <tr key={exp.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{exp.userName || 'Employee'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                      {exp.userId?.slice(0,6)}
                    </div>
                  </td>
                  <td>{exp.category || 'General'}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(exp.amount)}</td>
                  <td><span className={`status-badge status-${exp.status}`}>{exp.status}</span></td>
                  <td>
                    <span className={`status-badge ${(exp.decisionSource || (exp.autoDecision ? 'auto' : 'manual')) === 'auto' ? 'status-approved' : 'status-pending'}`}>
                      {(exp.decisionSource || (exp.autoDecision ? 'auto' : 'manual')) === 'auto' ? 'Auto' : 'Manual'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.875rem' }} title={formatDateTime(exp.timestamp)}>{timeAgo(exp.timestamp)}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>No expenses found in database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </article>

        <aside className="card">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <IoAlertCircleOutline /> Alerts
            </span>
          </h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {notifications.map((item) => (
              <div key={item.id} className="alert-row">
                <div className="alert-icon">
                  <IoTrendingUpOutline />
                </div>
                <div>
                  <p>{item.message}</p>
                  <small className="muted-text">{timeAgo(item.timestamp)}</small>
                </div>
              </div>
            ))}
            {notifications.length === 0 ? <div className="muted-text">No unusual patterns detected.</div> : null}
          </div>
        </aside>
      </section>
    </div>
  );
}
