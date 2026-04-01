import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline,
  IoEyeOutline,
  IoRefreshCircleOutline,
  IoShieldCheckmarkOutline,
  IoWarningOutline,
} from 'react-icons/io5';
import MetricCard from '../components/MetricCard';
import { useAdminData } from '../context/AdminDataContext';
import {
  FRAUD_DECISIONS,
  decisionFromStatus,
  getFraudStatus,
  mergeFraudSettings,
} from '../services/fraudConfig';
import { generateFraudExplanation } from '../services/fraudExplainer';
import { analyzeExpenseSync } from '../services/riskScorer';
import { formatCurrency, timeAgo } from '../utils';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toDecisionBadgeClass = (decision) => {
  if (decision === FRAUD_DECISIONS.APPROVED) return 'status-approved';
  if (decision === FRAUD_DECISIONS.REJECTED) return 'status-rejected';
  return 'status-pending';
};

export default function FraudDashboard() {
  const {
    transactions,
    loading,
    totals,
    fraudSettings,
    overrideTransactionDecision,
    revertTransactionDecision,
  } = useAdminData();

  const [decisionFilter, setDecisionFilter] = useState('all');
  const [highRiskOnly, setHighRiskOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [overrideBusyId, setOverrideBusyId] = useState('');

  const effectiveSettings = useMemo(() => mergeFraudSettings(fraudSettings), [fraudSettings]);

  const analyzedExpenses = useMemo(() => {
    return transactions.map((tx) => {
      if (tx.fraudScore != null && tx.decision) {
        return tx;
      }

      const userHistory = transactions.filter((row) => row.userId === tx.userId && row.id !== tx.id);
      const fallback = analyzeExpenseSync(tx, userHistory, tx.ocrData || null, { fraudSettings });
      return { ...tx, ...fallback };
    });
  }, [fraudSettings, transactions]);

  const normalizedExpenses = useMemo(() => {
    return analyzedExpenses.map((row) => {
      const fraudScore = Number(row.fraudScore ?? row.riskScore ?? 0);
      const decision = row.decision || decisionFromStatus(row.status);
      const confidence = clamp(Number(row.confidence ?? 0.5), 0, 1);
      const reasons = Array.isArray(row.reasons)
        ? row.reasons
        : Array.isArray(row.fraudReasons)
          ? row.fraudReasons
          : [];
      const policyViolations = Array.isArray(row.policyViolations)
        ? row.policyViolations
        : Array.isArray(row.policyResult?.violations)
          ? row.policyResult.violations
          : [];

      return {
        ...row,
        fraudScore,
        confidence,
        decision,
        reasons,
        policyViolations,
        fraudStatus: row.fraudStatus || getFraudStatus(fraudScore, fraudSettings.thresholds),
      };
    });
  }, [analyzedExpenses, fraudSettings.thresholds]);

  const selectedId = selectedExpense?.id;
  useEffect(() => {
    if (!selectedId) return;
    const liveRow = normalizedExpenses.find((row) => row.id === selectedId);
    if (liveRow) {
      setSelectedExpense(liveRow);
    }
  }, [normalizedExpenses, selectedId]);

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();
    const highRiskThreshold = Number(effectiveSettings.thresholds?.highRisk || 85);

    return normalizedExpenses.filter((row) => {
      const matchesDecision = decisionFilter === 'all' || row.decision === decisionFilter;
      const matchesHighRisk = !highRiskOnly || row.fraudScore >= highRiskThreshold;
      const matchesSearch = !query || [row.userName, row.userId, row.vendor, row.merchantName, row.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
      return matchesDecision && matchesHighRisk && matchesSearch;
    });
  }, [decisionFilter, highRiskOnly, normalizedExpenses, search, effectiveSettings.thresholds?.highRisk]);

  const stats = useMemo(() => {
    const overrideCount = normalizedExpenses.filter((row) => row.overridden).length;
    const avgConfidence = normalizedExpenses.length > 0
      ? (normalizedExpenses.reduce((sum, row) => sum + Number(row.confidence || 0), 0) / normalizedExpenses.length)
      : 0;

    return {
      overrideCount,
      avgConfidence: `${(avgConfidence * 100).toFixed(1)}%`,
    };
  }, [normalizedExpenses]);

  const applyOverride = async (transactionId, decision) => {
    setOverrideBusyId(transactionId);
    try {
      await overrideTransactionDecision({
        transactionId,
        decision,
        reason: `Override set to ${decision} from fraud monitoring panel.`,
      });
      toast.success(`Override applied: ${decision}`);
    } catch (error) {
      toast.error(error.message || 'Override failed.');
    } finally {
      setOverrideBusyId('');
    }
  };

  const revertOverride = async (transactionId) => {
    setOverrideBusyId(transactionId);
    try {
      await revertTransactionDecision({
        transactionId,
        reason: 'Override reverted from fraud monitoring panel.',
      });
      toast.success('Override reverted.');
    } catch (error) {
      toast.error(error.message || 'Revert failed.');
    } finally {
      setOverrideBusyId('');
    }
  };

  if (loading) {
    return <div className="page-container"><div className="card">Syncing fraud controls and transactions...</div></div>;
  }

  return (
    <div className="page-container">
      <section className="section-headline" style={{ marginBottom: 16 }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IoShieldCheckmarkOutline size={26} /> Fraud Control Center
        </h1>
        <p>Configure verification mode, policy thresholds, and override outcomes with complete auditability.</p>
      </section>

      <section className="stats-grid">
        <MetricCard title="Monitored Transactions" value={totals.transactionCount} subtitle="Live fraud pipeline coverage" />
        <MetricCard title="High-Risk Queue" value={totals.highRiskCount || 0} subtitle={`Score >= ${effectiveSettings.thresholds.highRisk}`} accent="var(--color-danger)" />
        <MetricCard title="Undecided Decisions" value={totals.undecidedCount || 0} subtitle="Awaiting admin verification" accent="var(--color-warning)" />
        <MetricCard title="Active Overrides" value={stats.overrideCount} subtitle="Reversible admin interventions" accent="var(--color-secondary)" />
        <MetricCard title="Average Confidence" value={stats.avgConfidence} subtitle="Composite model certainty" accent="var(--color-primary)" />
      </section>

      <section className="card" style={{ marginBottom: 18 }}>
        <h2 style={{ marginBottom: 12 }}>Fraud Monitoring Panel</h2>
        <div className="toolbar-grid" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr', marginTop: 0, marginBottom: 14 }}>
          <input
            className="field"
            placeholder="Search transaction, employee, vendor"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select className="field" value={decisionFilter} onChange={(event) => setDecisionFilter(event.target.value)}>
            <option value="all">All decisions</option>
            <option value={FRAUD_DECISIONS.APPROVED}>Approved</option>
            <option value={FRAUD_DECISIONS.REJECTED}>Rejected</option>
            <option value={FRAUD_DECISIONS.UNDECIDED}>Undecided</option>
          </select>
          <label className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={highRiskOnly} onChange={(event) => setHighRiskOnly(event.target.checked)} />
            High-risk only
          </label>
          <div className="field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
            {filteredExpenses.length} result(s)
          </div>
        </div>

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Fraud Score</th>
                <th>Confidence</th>
                <th>Decision</th>
                <th>Override</th>
                <th style={{ textAlign: 'center' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((row) => (
                <tr key={row.id} className={row.fraudScore >= effectiveSettings.thresholds.highRisk ? 'row-fraud' : row.decision === FRAUD_DECISIONS.UNDECIDED ? 'row-review' : ''}>
                  <td>
                    <div>{new Date(row.timestamp || row.date).toLocaleDateString()}</div>
                    <div className="muted-text">{timeAgo(row.timestamp || row.date)}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{row.userName || 'Employee'}</div>
                    <div className="muted-text">{row.userId?.slice(0, 10)}</div>
                  </td>
                  <td>{row.vendor || row.merchantName || 'Unknown'}</td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(row.amount || 0)}</td>
                  <td>
                    <strong>{row.fraudScore}</strong>
                    <div className="muted-text">{row.fraudStatus}</div>
                  </td>
                  <td>{(Number(row.confidence || 0) * 100).toFixed(1)}%</td>
                  <td>
                    <span className={`status-badge ${toDecisionBadgeClass(row.decision)}`}>{row.decision}</span>
                  </td>
                  <td>
                    {row.overridden ? (
                      <span className="status-badge status-pending">Active override</span>
                    ) : (
                      <span className="muted-text">None</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => setSelectedExpense(row)}>
                      <IoEyeOutline size={15} /> Inspect
                    </button>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 ? (
                <tr><td colSpan={9} className="empty-state-cell">No transactions match selected filters.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {selectedExpense ? (
        <div className="modal-overlay" onClick={() => setSelectedExpense(null)}>
          <div className="card fraud-modal" onClick={(event) => event.stopPropagation()}>
            <div className="fraud-modal-header">
              <div>
                <h2 style={{ margin: 0 }}>Transaction Transparency</h2>
                <p className="muted-text" style={{ marginTop: 4 }}>
                  {selectedExpense.userName || 'Employee'} • {formatCurrency(selectedExpense.amount || 0)} • {selectedExpense.id}
                </p>
              </div>
              <span className={`status-badge ${toDecisionBadgeClass(selectedExpense.decision)}`}>{selectedExpense.decision}</span>
            </div>

            <div className="fraud-modal-body">
              <div className="fraud-section">
                <h3>Fraud Output</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
                  <div className="fraud-info-box"><div className="muted-text">Score</div><strong>{selectedExpense.fraudScore}/100</strong></div>
                  <div className="fraud-info-box"><div className="muted-text">Confidence</div><strong>{(selectedExpense.confidence * 100).toFixed(1)}%</strong></div>
                  <div className="fraud-info-box"><div className="muted-text">Decision</div><strong>{selectedExpense.decision}</strong></div>
                  <div className="fraud-info-box"><div className="muted-text">Mode</div><strong>{selectedExpense.verificationMode || effectiveSettings.verificationMode}</strong></div>
                </div>
              </div>

              <div className="fraud-section">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><IoWarningOutline /> Contributing Factors</h3>
                {selectedExpense.reasons.length > 0 ? (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {selectedExpense.reasons.map((reason, index) => (
                      <div key={`${selectedExpense.id}-reason-${index}`} className="fraud-reason-item">{reason}</div>
                    ))}
                  </div>
                ) : (
                  <div className="muted-text">No explicit reasons were stored for this transaction.</div>
                )}
              </div>

              <div className="fraud-section">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><IoAlertCircleOutline /> Policy Violations</h3>
                {selectedExpense.policyViolations.length > 0 ? (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {selectedExpense.policyViolations.map((entry, index) => (
                      <div key={`${selectedExpense.id}-policy-${index}`} className="fraud-reason-item">
                        <strong>[{entry.type}]</strong> {entry.reason}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="muted-text">No policy violations triggered.</div>
                )}
              </div>

              {(selectedExpense.receiptImage) && (
                <div className="fraud-section">
                  <h3>Receipt / Payment Proof</h3>
                  <a href={selectedExpense.receiptImage} target="_blank" rel="noreferrer">
                    <img
                      src={selectedExpense.receiptImage}
                      alt="Receipt"
                      style={{
                        maxWidth: '100%',
                        maxHeight: 300,
                        objectFit: 'contain',
                        borderRadius: 8,
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer',
                      }}
                    />
                  </a>
                  <div className="muted-text" style={{ marginTop: 6, fontSize: '0.78rem' }}>
                    Click image to open full size in new tab
                  </div>
                </div>
              )}

              <div className="fraud-section">
                <h3>AI Explanation</h3>
                <pre className="fraud-explanation">{selectedExpense.fraudExplanation || generateFraudExplanation(selectedExpense)}</pre>
              </div>
            </div>

            <div className="fraud-modal-footer" style={{ justifyContent: 'space-between' }}>
              <div className="action-buttons">
                <button
                  className="btn btn-success-text"
                  onClick={() => applyOverride(selectedExpense.id, FRAUD_DECISIONS.APPROVED)}
                  disabled={overrideBusyId === selectedExpense.id}
                >
                  <IoCheckmarkCircleOutline /> Override Approve
                </button>
                <button
                  className="btn btn-danger-text"
                  onClick={() => applyOverride(selectedExpense.id, FRAUD_DECISIONS.REJECTED)}
                  disabled={overrideBusyId === selectedExpense.id}
                >
                  <IoAlertCircleOutline /> Override Reject
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => revertOverride(selectedExpense.id)}
                  disabled={overrideBusyId === selectedExpense.id || !selectedExpense.overridden}
                >
                  <IoRefreshCircleOutline /> Revert Decision
                </button>
              </div>

              <button className="btn btn-outline" onClick={() => setSelectedExpense(null)}>Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
