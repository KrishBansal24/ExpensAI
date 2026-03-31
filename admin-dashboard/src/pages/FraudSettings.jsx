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
import {
  IoBarChartOutline,
  IoPieChartOutline,
  IoSaveOutline,
  IoSettingsOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5';
import { useAdminData } from '../context/AdminDataContext';
import {
  FRAUD_DECISIONS,
  VERIFICATION_MODES,
  decisionFromStatus,
  mergeFraudSettings,
} from '../services/fraudConfig';

const PIE_COLORS = ['#16a34a', '#d97706', '#dc2626'];

const toList = (raw) => {
  return String(raw || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const scoreColor = (value) => {
  if (value >= 70) return '#dc2626';
  if (value >= 35) return '#d97706';
  return '#16a34a';
};

export default function FraudSettings() {
  const { transactions, loading, fraudSettings, saveFraudSettings } = useAdminData();

  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(mergeFraudSettings(fraudSettings));
  const [allowedCitiesInput, setAllowedCitiesInput] = useState('');
  const [restrictedVendorsInput, setRestrictedVendorsInput] = useState('');

  useEffect(() => {
    const merged = mergeFraudSettings(fraudSettings);
    setDraft(merged);
    setAllowedCitiesInput((merged.policy.allowedCities || []).join(', '));
    setRestrictedVendorsInput((merged.policy.restrictedVendors || []).join(', '));
  }, [fraudSettings]);

  const updateDraft = (partial) => {
    setDraft((prev) => mergeFraudSettings(prev, partial));
  };

  const decisionData = useMemo(() => {
    const counts = {
      [FRAUD_DECISIONS.APPROVED]: 0,
      [FRAUD_DECISIONS.UNDECIDED]: 0,
      [FRAUD_DECISIONS.REJECTED]: 0,
    };

    transactions.forEach((row) => {
      const decision = row.decision || decisionFromStatus(row.status);
      counts[decision] = (counts[decision] || 0) + 1;
    });

    return [
      { name: 'Approved', value: counts[FRAUD_DECISIONS.APPROVED], decision: FRAUD_DECISIONS.APPROVED },
      { name: 'Undecided', value: counts[FRAUD_DECISIONS.UNDECIDED], decision: FRAUD_DECISIONS.UNDECIDED },
      { name: 'Rejected', value: counts[FRAUD_DECISIONS.REJECTED], decision: FRAUD_DECISIONS.REJECTED },
    ];
  }, [transactions]);

  const categoryRiskData = useMemo(() => {
    const grouped = transactions.reduce((acc, row) => {
      const key = row.category || 'General';
      if (!acc[key]) {
        acc[key] = { category: key, scoreSum: 0, count: 0 };
      }
      acc[key].scoreSum += Number(row.fraudScore ?? row.riskScore ?? 0);
      acc[key].count += 1;
      return acc;
    }, {});

    return Object.values(grouped)
      .map((entry) => ({
        category: entry.category,
        avgRisk: entry.count > 0 ? Number((entry.scoreSum / entry.count).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.avgRisk - a.avgRisk)
      .slice(0, 8);
  }, [transactions]);

  const saveSettings = async () => {
    const normalized = mergeFraudSettings(draft, {
      policy: {
        ...draft.policy,
        allowedCities: toList(allowedCitiesInput),
        restrictedVendors: toList(restrictedVendorsInput),
      },
    });

    setSaving(true);
    try {
      await saveFraudSettings(normalized);
      toast.success('Fraud settings updated.');
    } catch (error) {
      toast.error(error.message || 'Failed to save fraud settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page-container"><div className="card">Loading fraud settings...</div></div>;
  }

  return (
    <div className="page-container">
      <section className="section-headline" style={{ marginBottom: 16 }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IoShieldCheckmarkOutline size={26} /> Fraud Settings
        </h1>
        <p>Simplified controls for verification mode, thresholds, and policy boundaries.</p>
      </section>

      <section className="card fraud-settings-hero" style={{ marginBottom: 16 }}>
        <div className="fraud-settings-hero-title">
          <IoSettingsOutline size={20} />
          <strong>Quick Controls</strong>
        </div>
        <p className="muted-text" style={{ marginTop: 6 }}>
          Keep day-to-day review simple: tune approval windows, risk weights, and critical policy limits in one place.
        </p>
      </section>

      <section className="fraud-settings-grid">
        <article className="card">
          <h3 style={{ marginBottom: 12 }}>Verification</h3>
          <div className="mode-pill-group" style={{ marginBottom: 12 }}>
            <button
              className={`mode-pill ${draft.verificationMode === VERIFICATION_MODES.MANUAL ? 'active' : ''}`}
              onClick={() => updateDraft({ verificationMode: VERIFICATION_MODES.MANUAL })}
              type="button"
            >
              Manual
            </button>
            <button
              className={`mode-pill ${draft.verificationMode === VERIFICATION_MODES.AUTO ? 'active' : ''}`}
              onClick={() => updateDraft({ verificationMode: VERIFICATION_MODES.AUTO })}
              type="button"
            >
              Auto
            </button>
          </div>

          <div className="fraud-settings-form-grid">
            <label>
              <div className="metric-title">Approve Max</div>
              <input
                className="field"
                type="number"
                value={draft.thresholds.approveMax}
                onChange={(event) => updateDraft({ thresholds: { approveMax: Number(event.target.value) } })}
              />
            </label>
            <label>
              <div className="metric-title">Reject Min</div>
              <input
                className="field"
                type="number"
                value={draft.thresholds.rejectMin}
                onChange={(event) => updateDraft({ thresholds: { rejectMin: Number(event.target.value) } })}
              />
            </label>
            <label>
              <div className="metric-title">High-Risk Threshold</div>
              <input
                className="field"
                type="number"
                value={draft.thresholds.highRisk}
                onChange={(event) => updateDraft({ thresholds: { highRisk: Number(event.target.value) } })}
              />
            </label>
          </div>
        </article>

        <article className="card">
          <h3 style={{ marginBottom: 12 }}>Policy Essentials</h3>
          <div className="fraud-settings-form-grid">
            <label>
              <div className="metric-title">Daily Limit</div>
              <input
                className="field"
                type="number"
                value={draft.policy.dailyLimit}
                onChange={(event) => updateDraft({ policy: { dailyLimit: Number(event.target.value) } })}
              />
            </label>
            <label>
              <div className="metric-title">Weekly Limit</div>
              <input
                className="field"
                type="number"
                value={draft.policy.weeklyLimit}
                onChange={(event) => updateDraft({ policy: { weeklyLimit: Number(event.target.value) } })}
              />
            </label>
            <label>
              <div className="metric-title">Allowed Cities</div>
              <input
                className="field"
                value={allowedCitiesInput}
                onChange={(event) => setAllowedCitiesInput(event.target.value)}
                placeholder="Delhi, Mumbai, Bengaluru"
              />
            </label>
            <label>
              <div className="metric-title">Restricted Vendors</div>
              <input
                className="field"
                value={restrictedVendorsInput}
                onChange={(event) => setRestrictedVendorsInput(event.target.value)}
                placeholder="Ghost Vendor LLP, Test Store"
              />
            </label>
          </div>
        </article>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 12 }}>Signal Weights</h3>
        <div className="weight-stack">
          {[
            ['rules', 'Rules'],
            ['geo', 'Geolocation'],
            ['ml', 'ML'],
            ['policy', 'Policy'],
          ].map(([key, label]) => (
            <label key={key} className="weight-row">
              <span>{label}</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={draft.weights[key]}
                onChange={(event) => updateDraft({ weights: { [key]: Number(event.target.value) } })}
              />
              <strong>{(draft.weights[key] * 100).toFixed(0)}%</strong>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <button className="btn btn-primary" onClick={saveSettings} disabled={saving}>
            <IoSaveOutline /> {saving ? 'Saving...' : 'Save Fraud Settings'}
          </button>
        </div>
      </section>

      <section className="analytics-grid" style={{ marginTop: 16 }}>
        <article className="card chart-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><IoPieChartOutline /> Decision Distribution</h3>
          <ResponsiveContainer width="100%" height={290}>
            <PieChart>
              <Pie data={decisionData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95}>
                {decisionData.map((entry, index) => (
                  <Cell key={`${entry.decision}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </article>

        <article className="card chart-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><IoBarChartOutline /> Average Risk By Category</h3>
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={categoryRiskData} margin={{ top: 8, right: 8, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="category" angle={-18} textAnchor="end" height={56} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgRisk" radius={[8, 8, 0, 0]}>
                {categoryRiskData.map((entry) => (
                  <Cell key={entry.category} fill={scoreColor(entry.avgRisk)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </article>
      </section>
    </div>
  );
}
