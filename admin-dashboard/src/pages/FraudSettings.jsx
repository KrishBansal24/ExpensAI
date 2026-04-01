import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  IoSaveOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5';
import { useAdminData } from '../context/AdminDataContext';
import {
  VERIFICATION_MODES,
  mergeFraudSettings,
} from '../services/fraudConfig';

const toCsv = (value = []) => (Array.isArray(value) ? value.join(', ') : '');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toStringList = (value) => {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const toWeekdayList = (value) => {
  return String(value || '')
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item >= 0 && item <= 6);
};

export default function FraudSettings() {
  const { loading, fraudSettings, saveFraudSettings } = useAdminData();

  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState({});

  useEffect(() => {
    const merged = mergeFraudSettings(fraudSettings);
    setValues({
      verificationMode: merged.verificationMode,
      approveMax: String(merged.thresholds.approveMax),
      rejectMin: String(merged.thresholds.rejectMin),
      highRisk: String(merged.thresholds.highRisk),
      weightRules: String(merged.weights.rules),
      weightGeo: String(merged.weights.geo),
      weightMl: String(merged.weights.ml),
      weightPolicy: String(merged.weights.policy),
      defaultCategoryLimit: String(merged.policy.defaultCategoryLimit),
      categoryLimitsJson: JSON.stringify(merged.policy.maxExpensePerCategory || {}, null, 2),
      dailyLimit: String(merged.policy.dailyLimit),
      weeklyLimit: String(merged.policy.weeklyLimit),
      allowedCities: toCsv(merged.policy.allowedCities),
      restrictedVendors: toCsv(merged.policy.restrictedVendors),
      vendorWhitelist: toCsv(merged.policy.vendorWhitelist),
      enforceWhitelist: String(Boolean(merged.policy.enforceWhitelist)),
      geofenceEnabled: String(Boolean(merged.policy.geofence?.enabled)),
      geofenceCenterLat: String(merged.policy.geofence?.center?.lat ?? 28.6139),
      geofenceCenterLng: String(merged.policy.geofence?.center?.lng ?? 77.2090),
      geofenceRadiusKm: String(merged.policy.geofence?.radiusKm ?? 150),
      timeWindowEnabled: String(Boolean(merged.policy.timeWindow?.enabled)),
      timeWindowStartHour: String(merged.policy.timeWindow?.startHour ?? 6),
      timeWindowEndHour: String(merged.policy.timeWindow?.endHour ?? 23),
      timeWindowAllowedDays: toCsv(merged.policy.timeWindow?.allowedWeekDays || []),
      dataRealWeight: String(merged.dataStrategy.realDataWeight ?? 0.9),
      dataSyntheticWeight: String(merged.dataStrategy.syntheticDataWeight ?? 0.1),
      dataSyntheticWeightCap: String(merged.dataStrategy.syntheticWeightCap ?? 0.2),
      upiTimeLimitMinutes: String(merged.policy.upiSubmitPolicy?.timeLimitMinutes ?? 30),
      upiRadiusKm: String(merged.policy.upiSubmitPolicy?.radiusKm ?? 5),
    });
  }, [fraudSettings]);

  const updateValue = (key, nextValue) => {
    setValues((prev) => ({ ...prev, [key]: nextValue }));
  };

  const saveSettings = async () => {
    let parsedCategoryLimits = {};
    try {
      parsedCategoryLimits = JSON.parse(values.categoryLimitsJson || '{}');
      if (Array.isArray(parsedCategoryLimits) || parsedCategoryLimits == null || typeof parsedCategoryLimits !== 'object') {
        throw new Error('Category limits must be an object map.');
      }
    } catch (error) {
      toast.error(`Invalid CATEGORY_LIMITS_JSON: ${error.message}`);
      return;
    }

    const normalized = mergeFraudSettings(fraudSettings, {
      verificationMode: values.verificationMode === VERIFICATION_MODES.AUTO ? VERIFICATION_MODES.AUTO : VERIFICATION_MODES.MANUAL,
      thresholds: {
        approveMax: toNumber(values.approveMax, 30),
        rejectMin: toNumber(values.rejectMin, 70),
        highRisk: toNumber(values.highRisk, 85),
      },
      weights: {
        rules: toNumber(values.weightRules, 0.3),
        geo: toNumber(values.weightGeo, 0.2),
        ml: toNumber(values.weightMl, 0.3),
        policy: toNumber(values.weightPolicy, 0.2),
      },
      policy: {
        defaultCategoryLimit: toNumber(values.defaultCategoryLimit, 15000),
        maxExpensePerCategory: parsedCategoryLimits,
        dailyLimit: toNumber(values.dailyLimit, 25000),
        weeklyLimit: toNumber(values.weeklyLimit, 100000),
        allowedCities: toStringList(values.allowedCities),
        restrictedVendors: toStringList(values.restrictedVendors),
        vendorWhitelist: toStringList(values.vendorWhitelist),
        enforceWhitelist: values.enforceWhitelist === 'true',
        geofence: {
          enabled: values.geofenceEnabled === 'true',
          center: {
            lat: toNumber(values.geofenceCenterLat, 28.6139),
            lng: toNumber(values.geofenceCenterLng, 77.2090),
          },
          radiusKm: toNumber(values.geofenceRadiusKm, 150),
        },
        timeWindow: {
          enabled: values.timeWindowEnabled === 'true',
          startHour: toNumber(values.timeWindowStartHour, 6),
          endHour: toNumber(values.timeWindowEndHour, 23),
          allowedWeekDays: toWeekdayList(values.timeWindowAllowedDays),
        },
      },
      dataStrategy: {
        realDataWeight: toNumber(values.dataRealWeight, 0.9),
        syntheticDataWeight: toNumber(values.dataSyntheticWeight, 0.1),
        syntheticWeightCap: toNumber(values.dataSyntheticWeightCap, 0.2),
      },
    });

    // Merge UPI submit policy into the normalized object
    normalized.policy.upiSubmitPolicy = {
      timeLimitMinutes: Math.max(toNumber(values.upiTimeLimitMinutes, 30), 1),
      radiusKm: Math.max(toNumber(values.upiRadiusKm, 5), 0.1),
    };

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

  const rows = [
    { key: 'VERIFICATION_MODE', stateKey: 'verificationMode', type: 'select', value: values.verificationMode, options: [VERIFICATION_MODES.MANUAL, VERIFICATION_MODES.AUTO], description: 'Manual keeps admin approval in control. Auto enables score-based decisions.' },
    { key: 'APPROVE_MAX_SCORE', stateKey: 'approveMax', type: 'number', value: values.approveMax, description: 'Transactions with score <= this value can be auto-approved.' },
    { key: 'REJECT_MIN_SCORE', stateKey: 'rejectMin', type: 'number', value: values.rejectMin, description: 'Transactions with score >= this value are auto-rejected.' },
    { key: 'HIGH_RISK_SCORE', stateKey: 'highRisk', type: 'number', value: values.highRisk, description: 'Used for high-risk flagging and dashboard counters.' },
    { key: 'WEIGHT_RULES', stateKey: 'weightRules', type: 'number', value: values.weightRules, description: 'Relative weight for rule-based signals (normalized on save).' },
    { key: 'WEIGHT_GEO', stateKey: 'weightGeo', type: 'number', value: values.weightGeo, description: 'Relative weight for geolocation signals (normalized on save).' },
    { key: 'WEIGHT_ML', stateKey: 'weightMl', type: 'number', value: values.weightMl, description: 'Relative weight for ML anomaly signals (normalized on save).' },
    { key: 'WEIGHT_POLICY', stateKey: 'weightPolicy', type: 'number', value: values.weightPolicy, description: 'Relative weight for policy violations (normalized on save).' },
    { key: 'DEFAULT_CATEGORY_LIMIT', stateKey: 'defaultCategoryLimit', type: 'number', value: values.defaultCategoryLimit, description: 'Fallback per-category limit when category-specific value is missing.' },
    { key: 'CATEGORY_LIMITS_JSON', stateKey: 'categoryLimitsJson', type: 'textarea', value: values.categoryLimitsJson, description: 'JSON object map for per-category max expense limits.' },
    { key: 'DAILY_LIMIT', stateKey: 'dailyLimit', type: 'number', value: values.dailyLimit, description: 'Per-user daily spending cap.' },
    { key: 'WEEKLY_LIMIT', stateKey: 'weeklyLimit', type: 'number', value: values.weeklyLimit, description: 'Per-user weekly spending cap.' },
    { key: 'ALLOWED_CITIES', stateKey: 'allowedCities', type: 'text', value: values.allowedCities, description: 'Comma-separated city names. Leave blank to allow all cities.' },
    { key: 'RESTRICTED_VENDORS', stateKey: 'restrictedVendors', type: 'text', value: values.restrictedVendors, description: 'Comma-separated vendor names that should be blocked or flagged.' },
    { key: 'VENDOR_WHITELIST', stateKey: 'vendorWhitelist', type: 'text', value: values.vendorWhitelist, description: 'Comma-separated approved vendor names.' },
    { key: 'ENFORCE_VENDOR_WHITELIST', stateKey: 'enforceWhitelist', type: 'select', value: values.enforceWhitelist, options: ['false', 'true'], description: 'When true, only whitelisted vendors are allowed.' },
    { key: 'GEOFENCE_ENABLED', stateKey: 'geofenceEnabled', type: 'select', value: values.geofenceEnabled, options: ['false', 'true'], description: 'Enables geofence checks for transaction location.' },
    { key: 'GEOFENCE_CENTER_LAT', stateKey: 'geofenceCenterLat', type: 'number', value: values.geofenceCenterLat, description: 'Latitude of geofence center.' },
    { key: 'GEOFENCE_CENTER_LNG', stateKey: 'geofenceCenterLng', type: 'number', value: values.geofenceCenterLng, description: 'Longitude of geofence center.' },
    { key: 'GEOFENCE_RADIUS_KM', stateKey: 'geofenceRadiusKm', type: 'number', value: values.geofenceRadiusKm, description: 'Radius in kilometers used for geofence validation.' },
    { key: 'TIME_WINDOW_ENABLED', stateKey: 'timeWindowEnabled', type: 'select', value: values.timeWindowEnabled, options: ['false', 'true'], description: 'Restricts expense submissions to configured time window.' },
    { key: 'TIME_WINDOW_START_HOUR', stateKey: 'timeWindowStartHour', type: 'number', value: values.timeWindowStartHour, description: 'Start hour (0-23) for allowed submissions.' },
    { key: 'TIME_WINDOW_END_HOUR', stateKey: 'timeWindowEndHour', type: 'number', value: values.timeWindowEndHour, description: 'End hour (0-23) for allowed submissions.' },
    { key: 'TIME_WINDOW_ALLOWED_DAYS', stateKey: 'timeWindowAllowedDays', type: 'text', value: values.timeWindowAllowedDays, description: 'Comma-separated week days using 0-6 (0=Sun, 6=Sat).' },
    { key: 'DATA_REAL_WEIGHT', stateKey: 'dataRealWeight', type: 'number', value: values.dataRealWeight, description: 'Primary weight for real historical data in model blending.' },
    { key: 'DATA_SYNTHETIC_WEIGHT', stateKey: 'dataSyntheticWeight', type: 'number', value: values.dataSyntheticWeight, description: 'Weight for synthetic data contribution in model blending.' },
    { key: 'DATA_SYNTHETIC_WEIGHT_CAP', stateKey: 'dataSyntheticWeightCap', type: 'number', value: values.dataSyntheticWeightCap, description: 'Upper limit allowed for synthetic data influence.' },
    { key: 'UPI_SUBMIT_TIME_LIMIT_MINUTES', stateKey: 'upiTimeLimitMinutes', type: 'number', value: values.upiTimeLimitMinutes, description: 'Maximum minutes allowed after UPI payment to submit the linked bill/receipt.' },
    { key: 'UPI_SUBMIT_RADIUS_KM', stateKey: 'upiRadiusKm', type: 'number', value: values.upiRadiusKm, description: 'Max GPS radius (km) — bill submission location must be within this distance of the UPI payment location.' },
  ];

  return (
    <div className="page-container">
      <section className="section-headline" style={{ marginBottom: 16 }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IoShieldCheckmarkOutline size={26} /> Fraud &amp; Company Policy Settings
        </h1>
        <p>Simple key-value controls for fraud scoring and company expense policy rules.</p>
      </section>

      <section className="card">
        <div className="kv-settings-header">
          <h3>Settings</h3>
          <p className="muted-text">Use key-value pairs to configure fraud rules and policy controls.</p>
        </div>

        <div className="kv-settings-list">
          {rows.map((row) => (
            <div className="kv-row" key={row.key}>
              <div>
                <div className="kv-key">{row.key}</div>
                <div className="kv-help">{row.description}</div>
              </div>
              <div>
                {row.type === 'select' ? (
                  <select className="field kv-input" value={row.value || ''} onChange={(event) => updateValue(row.stateKey, event.target.value)}>
                    {row.options.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : row.type === 'textarea' ? (
                  <textarea
                    className="field kv-input"
                    style={{ minHeight: 120, resize: 'vertical', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace' }}
                    value={row.value || ''}
                    onChange={(event) => updateValue(row.stateKey, event.target.value)}
                  />
                ) : (
                  <input
                    className="field kv-input"
                    type={row.type}
                    value={row.value || ''}
                    onChange={(event) => updateValue(row.stateKey, event.target.value)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-primary" onClick={saveSettings} disabled={saving}>
            <IoSaveOutline /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </section>
    </div>
  );
}
