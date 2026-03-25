import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { IoDownloadOutline, IoLocationOutline } from 'react-icons/io5';
import { useAdminData } from '../context/AdminDataContext';
import { formatCurrency, formatDateTime, shortId } from '../utils';

const downloadCsv = (rows) => {
  if (!rows.length) return;

  const headers = [
    'Transaction ID',
    'Employee UID',
    'Employee Name',
    'Category',
    'Amount',
    'Payment Mode',
    'Status',
    'Decision Source',
    'Decision Reason',
    'Timestamp',
    'Latitude',
    'Longitude',
  ];

  const items = rows.map((row) => [
    row.id,
    row.userId || '',
    row.userName || '',
    row.category || '',
    Number(row.amount || 0),
    row.paymentMode || 'UPI',
    row.status || '',
    row.decisionSource || (row.autoDecision ? 'auto' : 'manual'),
    row.decisionReason || '',
    formatDateTime(row.timestamp),
    row.location?.lat ?? '',
    row.location?.lng ?? '',
  ]);

  const csv = [headers, ...items].map((entry) => entry.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `expensai-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export default function Transactions() {
  const { transactions, users, updateTransactionStatus } = useAdminData();
  const [search, setSearch] = useState('');
  const [employee, setEmployee] = useState('all');
  const [status, setStatus] = useState('all');
  const [decision, setDecision] = useState('all');
  const [category, setCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const categories = useMemo(() => {
    return Array.from(new Set(transactions.map((row) => row.category || 'General'))).sort();
  }, [transactions]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((row) => {
      const txDate = new Date(row.timestamp);
      const decisionSource = row.decisionSource || (row.autoDecision ? 'auto' : 'manual');
      const matchesSearch = !query || [row.userName, row.userId, row.category, row.id]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
      const matchesEmployee = employee === 'all' || row.userId === employee;
      const matchesStatus = status === 'all' || row.status === status;
      const matchesDecision = decision === 'all' || decisionSource === decision;
      const txCategory = row.category || 'General';
      const matchesCategory = category === 'all' || txCategory === category;
      const matchesStart = !startDate || txDate >= new Date(`${startDate}T00:00:00`);
      const matchesEnd = !endDate || txDate <= new Date(`${endDate}T23:59:59`);

      return matchesSearch && matchesEmployee && matchesStatus && matchesDecision && matchesCategory && matchesStart && matchesEnd;
    });
  }, [transactions, search, employee, status, decision, category, startDate, endDate]);

  const processStatus = async (transactionId, nextStatus) => {
    try {
      await updateTransactionStatus({ transactionId, status: nextStatus });
      toast.success(`Transaction ${nextStatus}.`);
    } catch (error) {
      toast.error(error.message || 'Action failed.');
    }
  };

  return (
    <div className="page-container">
      <section className="card" style={{ marginBottom: 20 }}>
        <div className="section-headline">
          <h1>Transactions</h1>
          <p>Review all UPI expense transactions in real time and approve or reject pending submissions.</p>
        </div>

        <div className="toolbar-grid transactions-toolbar">
          <input
            className="field"
            placeholder="Search employee, category, uid, transaction id"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select className="field" value={employee} onChange={(event) => setEmployee(event.target.value)}>
            <option value="all">All employees</option>
            {users
              .filter((user) => (user.role || 'employee') === 'employee')
              .map((user) => (
                <option key={user.id} value={user.id}>{user.name || user.email || user.id}</option>
              ))}
          </select>

          <select className="field" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select className="field" value={decision} onChange={(event) => setDecision(event.target.value)}>
            <option value="all">All decisions</option>
            <option value="auto">Auto</option>
            <option value="manual">Manual</option>
          </select>

          <select className="field" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <input className="field" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <input className="field" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />

          <button className="btn btn-outline" onClick={() => downloadCsv(filtered)}>
            <IoDownloadOutline /> Export CSV
          </button>
        </div>
      </section>

      <section className="card">
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Employee</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Location</th>
                <th>Status</th>
                <th>Decision</th>
                <th>Timestamp</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const decisionSource = row.decisionSource || (row.autoDecision ? 'auto' : 'manual');
                const mapLink = row.location?.lat != null && row.location?.lng != null
                  ? `https://maps.google.com/?q=${row.location.lat},${row.location.lng}`
                  : null;

                return (
                  <tr key={row.id}>
                    <td className="mono">{shortId(row.id, 10)}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{row.userName || 'Employee'}</div>
                      <div className="muted-text">{shortId(row.userId || '', 10)}</div>
                    </td>
                    <td>{row.category || 'General'}</td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(row.amount || 0)}</td>
                    <td>{row.paymentMode || 'UPI'}</td>
                    <td>
                      {mapLink ? (
                        <a href={mapLink} target="_blank" rel="noreferrer" className="location-link">
                          <IoLocationOutline />
                          {Number(row.location.lat).toFixed(4)}, {Number(row.location.lng).toFixed(4)}
                        </a>
                      ) : (
                        <span className="muted-text">No GPS</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge status-${row.status || 'pending'}`}>{row.status || 'pending'}</span>
                    </td>
                    <td>
                      <div>
                        <span className={`status-badge ${decisionSource === 'auto' ? 'status-approved' : 'status-pending'}`}>
                          {decisionSource === 'auto' ? 'Auto' : 'Manual'}
                        </span>
                      </div>
                      <div className="muted-text" style={{ marginTop: 6, maxWidth: 280 }}>
                        {row.decisionReason || (row.status === 'pending' ? 'Pending manual review.' : 'Reviewed by admin.')}
                      </div>
                    </td>
                    <td>{formatDateTime(row.timestamp)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {row.status === 'pending' ? (
                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                          <button className="btn btn-success-text" onClick={() => processStatus(row.id, 'approved')}>Approve</button>
                          <button className="btn btn-danger-text" onClick={() => processStatus(row.id, 'rejected')}>Reject</button>
                        </div>
                      ) : (
                        <span className="muted-text">Processed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="empty-state-cell">No transactions match the selected filters.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
