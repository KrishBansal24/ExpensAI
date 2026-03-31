import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
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
import { IoBarChartOutline, IoPieChartOutline, IoWalletOutline } from 'react-icons/io5';
import { useAdminData } from '../context/AdminDataContext';
import { formatCurrency } from '../utils';

const BUDGET_CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Other'];
const PIE_COLORS = ['#0f766e', '#2563eb', '#d97706', '#dc2626', '#0ea5e9', '#16a34a'];

const toAmount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
};

const getInitialCategoryDraft = (employee) => {
  const existing = employee?.budgetCategories;
  if (existing && typeof existing === 'object') {
    return BUDGET_CATEGORIES.reduce((acc, key) => {
      acc[key] = toAmount(existing[key]);
      return acc;
    }, {});
  }

  const assigned = toAmount(employee?.walletAssigned || 0);
  return {
    Food: Number((assigned * 0.18).toFixed(2)),
    Travel: Number((assigned * 0.34).toFixed(2)),
    Shopping: Number((assigned * 0.14).toFixed(2)),
    Bills: Number((assigned * 0.16).toFixed(2)),
    Entertainment: Number((assigned * 0.08).toFixed(2)),
    Other: Number((assigned * 0.10).toFixed(2)),
  };
};

export default function BudgetAllocation() {
  const { users, loading, saveEmployeeBudgetCategories } = useAdminData();
  const [draftByEmployee, setDraftByEmployee] = useState({});
  const [savingEmployeeId, setSavingEmployeeId] = useState('');

  const employees = useMemo(() => {
    return users.filter((row) => (row.role || 'employee') === 'employee' && row.active !== false);
  }, [users]);

  useEffect(() => {
    setDraftByEmployee((prev) => {
      const next = { ...prev };
      employees.forEach((employee) => {
        if (!next[employee.id]) {
          next[employee.id] = getInitialCategoryDraft(employee);
        }
      });
      return next;
    });
  }, [employees]);

  const updateCategoryValue = (employeeId, category, rawValue) => {
    setDraftByEmployee((prev) => ({
      ...prev,
      [employeeId]: {
        ...(prev[employeeId] || {}),
        [category]: toAmount(rawValue),
      },
    }));
  };

  const getDraftTotal = (employeeId) => {
    const draft = draftByEmployee[employeeId] || {};
    return BUDGET_CATEGORIES.reduce((sum, key) => sum + toAmount(draft[key]), 0);
  };

  const saveRow = async (employeeId) => {
    setSavingEmployeeId(employeeId);
    try {
      const categories = draftByEmployee[employeeId] || {};
      await saveEmployeeBudgetCategories({ employeeId, categories });
      toast.success('Employee budget allocation saved.');
    } catch (error) {
      toast.error(error.message || 'Failed to save allocation.');
    } finally {
      setSavingEmployeeId('');
    }
  };

  const categoryPieData = useMemo(() => {
    const totals = BUDGET_CATEGORIES.reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});

    employees.forEach((employee) => {
      const draft = draftByEmployee[employee.id] || getInitialCategoryDraft(employee);
      BUDGET_CATEGORIES.forEach((category) => {
        totals[category] += toAmount(draft[category]);
      });
    });

    return BUDGET_CATEGORIES.map((category) => ({
      name: category,
      value: Number(totals[category].toFixed(2)),
    })).filter((row) => row.value > 0);
  }, [draftByEmployee, employees]);

  const employeeBarData = useMemo(() => {
    return employees
      .map((employee) => {
        const allocated = getDraftTotal(employee.id);
        return {
          name: (employee.name || employee.email || 'Employee').slice(0, 14),
          allocated,
          spent: toAmount(employee.walletSpent || 0),
        };
      })
      .sort((a, b) => b.allocated - a.allocated)
      .slice(0, 10);
  }, [draftByEmployee, employees]);

  if (loading) {
    return <div className="page-container"><div className="card">Loading employee budget allocations...</div></div>;
  }

  return (
    <div className="page-container">
      <section className="section-headline" style={{ marginBottom: 16 }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IoWalletOutline size={26} /> Budget Allocation
        </h1>
        <p>Set per-employee category budgets and monitor allocation versus spend through visual summaries.</p>
      </section>

      <section className="analytics-grid" style={{ marginBottom: 16 }}>
        <article className="card chart-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><IoPieChartOutline /> Budget By Category</h3>
          <ResponsiveContainer width="100%" height={290}>
            <PieChart>
              <Pie data={categoryPieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95}>
                {categoryPieData.map((row, index) => (
                  <Cell key={row.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </article>

        <article className="card chart-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><IoBarChartOutline /> Allocation Vs Spend</h3>
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={employeeBarData} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" angle={-20} textAnchor="end" height={64} />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="allocated" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="spent" fill="var(--color-danger)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section className="card" style={{ padding: 0 }}>
        <div className="table-shell">
          <table className="data-table budget-allocation-table">
            <thead>
              <tr>
                <th>Employee</th>
                {BUDGET_CATEGORIES.map((category) => (
                  <th key={category}>{category}</th>
                ))}
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const draft = draftByEmployee[employee.id] || getInitialCategoryDraft(employee);
                const total = getDraftTotal(employee.id);

                return (
                  <tr key={employee.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{employee.name || 'Employee'}</div>
                      <div className="muted-text">Spent: {formatCurrency(employee.walletSpent || 0)}</div>
                    </td>
                    {BUDGET_CATEGORIES.map((category) => (
                      <td key={`${employee.id}-${category}`}>
                        <input
                          className="field budget-cell-input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={draft[category] ?? 0}
                          onChange={(event) => updateCategoryValue(employee.id, category, event.target.value)}
                        />
                      </td>
                    ))}
                    <td style={{ fontWeight: 700 }}>{formatCurrency(total)}</td>
                    <td>
                      <button
                        className="btn btn-primary"
                        onClick={() => saveRow(employee.id)}
                        disabled={savingEmployeeId === employee.id}
                      >
                        {savingEmployeeId === employee.id ? 'Saving...' : 'Save'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {employees.length === 0 ? (
                <tr>
                  <td colSpan={BUDGET_CATEGORIES.length + 3} className="empty-state-cell">
                    No employees found for budget allocation.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
