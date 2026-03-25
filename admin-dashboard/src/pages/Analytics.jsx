import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import MetricCard from '../components/MetricCard';
import { useAdminData } from '../context/AdminDataContext';
import { formatCurrency } from '../utils';

const PALETTE = ['#0f766e', '#2563eb', '#dc2626', '#d97706', '#059669', '#7c3aed'];

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function Analytics() {
  const { users, transactions, totals } = useAdminData();

  const reimbursementTotals = useMemo(() => {
    return transactions.reduce(
      (acc, row) => {
        const amount = Number(row.amount || 0);
        acc.requested += amount;
        if (row.status === 'approved') {
          acc.approved += amount;
        }
        if (row.status === 'rejected') {
          acc.rejected += amount;
        }
        return acc;
      },
      { requested: 0, approved: 0, rejected: 0 },
    );
  }, [transactions]);

  const categoryData = useMemo(() => {
    const grouped = transactions.reduce((acc, row) => {
      const key = row.category || 'General';
      acc[key] = (acc[key] || 0) + Number(row.amount || 0);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((left, right) => right.value - left.value);
  }, [transactions]);

  const employeeSpendData = useMemo(() => {
    return users
      .filter((row) => (row.role || 'employee') === 'employee' && row.active !== false)
      .map((row) => ({
        name: (row.name || row.email || 'Employee').slice(0, 12),
        spent: Number(row.walletSpent || 0),
      }))
      .sort((left, right) => right.spent - left.spent)
      .slice(0, 8);
  }, [users]);

  const employeeReimbursementData = useMemo(() => {
    const grouped = transactions.reduce((acc, row) => {
      const key = row.userId || row.employeeId || row.userEmail || 'unknown';
      if (!acc[key]) {
        acc[key] = {
          id: key,
          name: (row.userName || row.userEmail || 'Employee').slice(0, 14),
          expense: 0,
          reimbursed: 0,
        };
      }
      const amount = Number(row.amount || 0);
      acc[key].expense += amount;
      if (row.status === 'approved') {
        acc[key].reimbursed += amount;
      }
      return acc;
    }, {});

    return Object.values(grouped)
      .sort((left, right) => right.expense - left.expense)
      .slice(0, 8);
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const grouped = transactions.reduce((acc, row) => {
      const date = toDate(row.timestamp);
      if (!date) return acc;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[key] = (acc[key] || 0) + Number(row.amount || 0);
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-6)
      .map(([month, amount]) => ({ month, amount }));
  }, [transactions]);

  const usagePercent = totals.totalAssigned
    ? ((totals.totalSpent / totals.totalAssigned) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="page-container">
      <section className="section-headline" style={{ marginBottom: 16 }}>
        <h1>Analytics</h1>
        <p>Track spending trends, wallet utilization, and high-level employee expenditure patterns.</p>
      </section>

      <section className="stats-grid">
        <MetricCard title="Total expenses" value={formatCurrency(totals.approvedAmount)} subtitle="Approved transactions" />
        <MetricCard
          title="Total reimbursement"
          value={formatCurrency(reimbursementTotals.approved)}
          subtitle={`${formatCurrency(reimbursementTotals.requested)} requested`}
          accent="var(--color-success)"
        />
        <MetricCard title="Wallet utilization" value={`${usagePercent}%`} subtitle={`${formatCurrency(totals.totalSpent)} spent`} accent="var(--color-warning)" />
        <MetricCard title="Employees monitored" value={totals.employeeCount} subtitle="Active employee profiles" accent="var(--color-primary)" />
        <MetricCard title="Pending approvals" value={totals.pendingCount} subtitle="Needs manager action" accent="var(--color-danger)" />
      </section>

      <section className="analytics-grid">
        <article className="card chart-card">
          <h3>Expenses by category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                {categoryData.map((entry, index) => (
                  <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="legend-list">
            {categoryData.slice(0, 6).map((item, index) => (
              <div key={item.name} className="legend-row">
                <span className="legend-dot" style={{ background: PALETTE[index % PALETTE.length] }} />
                <span>{item.name}</span>
                <strong>{formatCurrency(item.value)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="card chart-card">
          <h3>Employee-wise spending</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={employeeSpendData} margin={{ top: 8, right: 8, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="spent" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="card chart-card chart-span">
          <h3>Recent monthly expense trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="amount" fill="var(--color-secondary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="card chart-card chart-span">
          <h3>Employee expense vs reimbursement</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={employeeReimbursementData} margin={{ top: 8, right: 8, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" angle={-20} textAnchor="end" height={64} />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="expense" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="reimbursed" fill="var(--color-success)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
      </section>
    </div>
  );
}
