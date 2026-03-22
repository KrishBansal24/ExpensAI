import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAdminData } from '../context/AdminDataContext';
import { formatCurrency, shortId } from '../utils';

const INITIAL_FORM = {
  uid: '',
  name: '',
  email: '',
  department: '',
};

export default function Employees() {
  const { users, allocateWallet, upsertEmployee, archiveEmployee } = useAdminData();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [amount, setAmount] = useState('50000');
  const [mode, setMode] = useState('set');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const employees = useMemo(
    () => users.filter((row) => (row.role || 'employee') === 'employee' && row.active !== false),
    [users],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;

    return employees.filter((row) => {
      return [row.name, row.email, row.department, row.uid]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q));
    });
  }, [employees, search]);

  const onAllocate = async () => {
    if (!selectedId) {
      toast.error('Select an employee first.');
      return;
    }

    try {
      await allocateWallet({ employeeId: selectedId, amount, mode });
      toast.success(mode === 'add' ? 'Wallet topped up.' : 'Wallet allocation updated.');
    } catch (error) {
      toast.error(error.message || 'Could not update wallet.');
    }
  };

  const onCreateEmployee = async (event) => {
    event.preventDefault();
    if (!form.uid || !form.email || !form.name) {
      toast.error('UID, name, and email are required.');
      return;
    }

    try {
      await upsertEmployee({
        ...form,
        role: 'employee',
        active: true,
        walletAssigned: 0,
        walletBalance: 0,
        walletSpent: 0,
      });
      setForm(INITIAL_FORM);
      setCreating(false);
      toast.success('Employee profile added.');
    } catch (error) {
      toast.error(error.message || 'Unable to add employee.');
    }
  };

  return (
    <div className="page-container">
      <section className="card" style={{ marginBottom: 20 }}>
        <div className="section-headline">
          <h1>Employees</h1>
          <p>Manage employee wallet allocations and profile records synced to mobile app users.</p>
        </div>

        <div className="toolbar-grid">
          <input
            className="field"
            placeholder="Search by name, email, department or uid"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select className="field" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            <option value="">Select employee for wallet action</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name || employee.email || employee.id}
              </option>
            ))}
          </select>

          <input
            className="field"
            type="number"
            min="0"
            step="100"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Amount"
          />

          <select className="field" value={mode} onChange={(event) => setMode(event.target.value)}>
            <option value="set">Set monthly budget</option>
            <option value="add">Top up wallet</option>
          </select>

          <button className="btn btn-primary" onClick={onAllocate}>Apply</button>
          <button className="btn btn-outline" onClick={() => setCreating((state) => !state)}>
            {creating ? 'Close form' : 'Add employee'}
          </button>
        </div>

        {creating ? (
          <form className="inline-form" onSubmit={onCreateEmployee}>
            <input
              className="field"
              placeholder="Employee UID (same as Firebase Auth uid)"
              value={form.uid}
              onChange={(event) => setForm((state) => ({ ...state, uid: event.target.value.trim() }))}
            />
            <input
              className="field"
              placeholder="Full name"
              value={form.name}
              onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
            />
            <input
              className="field"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
            />
            <input
              className="field"
              placeholder="Department"
              value={form.department}
              onChange={(event) => setForm((state) => ({ ...state, department: event.target.value }))}
            />
            <button className="btn btn-primary" type="submit">Create profile</button>
          </form>
        ) : null}
      </section>

      <section className="card">
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>UID</th>
                <th>Department</th>
                <th>Allocated</th>
                <th>Spent</th>
                <th>Balance</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{employee.name || 'Employee'}</div>
                    <div className="muted-text">{employee.email || 'No email'}</div>
                  </td>
                  <td className="mono">{shortId(employee.uid || employee.id, 10)}</td>
                  <td>{employee.department || 'General'}</td>
                  <td>{formatCurrency(employee.walletAssigned || 0)}</td>
                  <td>{formatCurrency(employee.walletSpent || 0)}</td>
                  <td>{formatCurrency(employee.walletBalance || 0)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-danger-text"
                      onClick={async () => {
                        try {
                          await archiveEmployee(employee.id);
                          toast.success('Employee archived.');
                        } catch (error) {
                          toast.error(error.message || 'Could not archive profile.');
                        }
                      }}
                    >
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state-cell">No employees found for this filter.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
