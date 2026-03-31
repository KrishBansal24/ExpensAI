// ============================================
// ExpensAI — Company Policy Fraud Engine
// ============================================
// Evaluates transaction policy compliance and returns
// policy-driven fraud signals for the composite score.

import { DEFAULT_FRAUD_SETTINGS } from './fraudConfig.js';
import { extractUserLocation, haversineDistance } from './geoFraudEngine.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const POLICY_PENALTIES = {
  CATEGORY_LIMIT_EXCEEDED: 25,
  RESTRICTED_VENDOR: 35,
  WHITELIST_VIOLATION: 20,
  TIME_WINDOW_VIOLATION: 15,
  WEEKDAY_VIOLATION: 12,
  CITY_NOT_ALLOWED: 18,
  GEOFENCE_VIOLATION: 22,
  DAILY_LIMIT_EXCEEDED: 22,
  WEEKLY_LIMIT_EXCEEDED: 25,
};

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeList(values) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => normalizeText(value))
    .filter(Boolean);
}

function matchesByContainment(value, candidates) {
  const normalized = normalizeText(value);
  if (!normalized || candidates.length === 0) return false;
  return candidates.some((candidate) => normalized.includes(candidate) || candidate.includes(normalized));
}

function getCategoryLimit(category, policy) {
  const fallback = Number(policy.defaultCategoryLimit || DEFAULT_FRAUD_SETTINGS.policy.defaultCategoryLimit);
  if (!policy.maxExpensePerCategory || typeof policy.maxExpensePerCategory !== 'object') {
    return fallback;
  }

  const exact = policy.maxExpensePerCategory[category];
  if (Number.isFinite(Number(exact))) {
    return Number(exact);
  }

  const normalizedCategory = normalizeText(category);
  for (const [key, value] of Object.entries(policy.maxExpensePerCategory)) {
    if (normalizeText(key) === normalizedCategory && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }

  return fallback;
}

function getTransactionDate(expense) {
  return toDate(expense.timestamp || expense.date || expense.createdAt) || new Date();
}

function sameDay(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function sameWeek(left, right) {
  const leftDay = left.getDay();
  const rightDay = right.getDay();
  const leftStart = new Date(left);
  const rightStart = new Date(right);
  leftStart.setDate(left.getDate() - leftDay);
  rightStart.setDate(right.getDate() - rightDay);
  leftStart.setHours(0, 0, 0, 0);
  rightStart.setHours(0, 0, 0, 0);
  return leftStart.getTime() === rightStart.getTime();
}

function extractCity(expense) {
  const candidates = [
    expense.geoData?.city,
    expense.locationCity,
    expense.city,
    expense.vendorLocation?.city,
    expense.vendorLocation?.formattedAddress,
    expense.locationString,
  ].filter(Boolean);

  if (candidates.length === 0) return '';

  // When address is available, use first comma-separated token likely containing the city/locality.
  const address = String(candidates[0]);
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  return parts.length > 0 ? parts[parts.length >= 2 ? parts.length - 2 : 0] : address;
}

export function runPolicyEngine(expense, context = {}) {
  const policy = {
    ...DEFAULT_FRAUD_SETTINGS.policy,
    ...(context.policySettings || {}),
  };

  const userExpenses = Array.isArray(context.userExpenses) ? context.userExpenses : [];
  const reasons = [];
  const violations = [];
  const details = {};
  let totalPenalty = 0;

  const amount = Number(expense.amount || 0);
  const category = expense.category || 'General';
  const vendor = expense.vendor || expense.merchantName || '';
  const transactionDate = getTransactionDate(expense);

  const addViolation = (type, reason, severity, metadata = {}) => {
    const penalty = POLICY_PENALTIES[type] || 0;
    totalPenalty += penalty;
    reasons.push(reason);
    violations.push({
      type,
      severity,
      penalty,
      reason,
      ...metadata,
    });
  };

  // 1) Category maximum amount policy
  const categoryLimit = getCategoryLimit(category, policy);
  if (amount > categoryLimit) {
    addViolation(
      'CATEGORY_LIMIT_EXCEEDED',
      `Amount ${amount.toFixed(2)} exceeds category limit ${categoryLimit.toFixed(2)} for ${category}.`,
      'high',
      { category, amount, categoryLimit },
    );
  }

  // 2) Vendor controls
  const restrictedVendors = normalizeList(policy.restrictedVendors);
  if (matchesByContainment(vendor, restrictedVendors)) {
    addViolation(
      'RESTRICTED_VENDOR',
      `Vendor ${vendor || 'Unknown'} is in restricted vendor list.`,
      'critical',
      { vendor },
    );
  }

  const vendorWhitelist = normalizeList(policy.vendorWhitelist);
  if (policy.enforceWhitelist && vendorWhitelist.length > 0 && !matchesByContainment(vendor, vendorWhitelist)) {
    addViolation(
      'WHITELIST_VIOLATION',
      `Vendor ${vendor || 'Unknown'} is not part of company vendor whitelist.`,
      'medium',
      { vendor },
    );
  }

  // 3) Time restrictions
  if (policy.timeWindow?.enabled) {
    const startHour = Number(policy.timeWindow.startHour ?? 0);
    const endHour = Number(policy.timeWindow.endHour ?? 23);
    const allowedDays = Array.isArray(policy.timeWindow.allowedWeekDays)
      ? policy.timeWindow.allowedWeekDays.map((value) => Number(value))
      : DEFAULT_FRAUD_SETTINGS.policy.timeWindow.allowedWeekDays;

    const hour = transactionDate.getHours();
    const day = transactionDate.getDay();

    const inHourWindow = startHour <= endHour
      ? hour >= startHour && hour <= endHour
      : hour >= startHour || hour <= endHour;

    if (!inHourWindow) {
      addViolation(
        'TIME_WINDOW_VIOLATION',
        `Transaction hour ${hour}:00 is outside allowed policy window ${startHour}:00-${endHour}:00.`,
        'medium',
        { hour, startHour, endHour },
      );
    }

    if (!allowedDays.includes(day)) {
      addViolation(
        'WEEKDAY_VIOLATION',
        `Transaction weekday ${day} is outside allowed policy weekdays.`,
        'medium',
        { day, allowedDays },
      );
    }
  }

  // 4) Allowed city restrictions
  const allowedCities = normalizeList(policy.allowedCities);
  const city = extractCity(expense);
  details.city = city || null;
  if (allowedCities.length > 0 && city && !allowedCities.includes(normalizeText(city))) {
    addViolation(
      'CITY_NOT_ALLOWED',
      `City ${city} is outside allowed reimbursement cities.`,
      'high',
      { city },
    );
  }

  // 5) Geofencing
  if (policy.geofence?.enabled) {
    const userLocation = extractUserLocation(expense);
    const center = policy.geofence.center || DEFAULT_FRAUD_SETTINGS.policy.geofence.center;
    if (userLocation && Number.isFinite(Number(center.lat)) && Number.isFinite(Number(center.lng))) {
      const distance = haversineDistance(
        Number(userLocation.lat),
        Number(userLocation.lng),
        Number(center.lat),
        Number(center.lng),
      );
      details.geofenceDistanceKm = Number(distance.toFixed(2));
      const radiusKm = Number(policy.geofence.radiusKm || DEFAULT_FRAUD_SETTINGS.policy.geofence.radiusKm);
      if (distance > radiusKm) {
        const scaledPenalty = Math.min(Math.round((distance - radiusKm) * 0.2), 15);
        const basePenalty = POLICY_PENALTIES.GEOFENCE_VIOLATION;
        totalPenalty += basePenalty + scaledPenalty;
        const reason = `Transaction location ${distance.toFixed(1)} km is outside configured geofence radius ${radiusKm} km.`;
        reasons.push(reason);
        violations.push({
          type: 'GEOFENCE_VIOLATION',
          severity: 'high',
          penalty: basePenalty + scaledPenalty,
          reason,
          distanceKm: Number(distance.toFixed(2)),
          radiusKm,
        });
      }
    }
  }

  // 6) Daily and weekly aggregate limits
  const userId = expense.userId;
  const scopedHistory = userExpenses.filter((entry) => {
    if (!userId) return true;
    return entry.userId === userId;
  });

  const dailyTotal = scopedHistory
    .filter((entry) => {
      const date = toDate(entry.timestamp || entry.date);
      return date && sameDay(transactionDate, date);
    })
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0) + amount;

  const weeklyTotal = scopedHistory
    .filter((entry) => {
      const date = toDate(entry.timestamp || entry.date);
      return date && sameWeek(transactionDate, date);
    })
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0) + amount;

  details.dailyProjectedAmount = Number(dailyTotal.toFixed(2));
  details.weeklyProjectedAmount = Number(weeklyTotal.toFixed(2));

  if (policy.dailyLimit > 0 && dailyTotal > Number(policy.dailyLimit)) {
    addViolation(
      'DAILY_LIMIT_EXCEEDED',
      `Projected daily total ${dailyTotal.toFixed(2)} exceeds daily policy limit ${Number(policy.dailyLimit).toFixed(2)}.`,
      'high',
      { dailyTotal, dailyLimit: Number(policy.dailyLimit) },
    );
  }

  if (policy.weeklyLimit > 0 && weeklyTotal > Number(policy.weeklyLimit)) {
    addViolation(
      'WEEKLY_LIMIT_EXCEEDED',
      `Projected weekly total ${weeklyTotal.toFixed(2)} exceeds weekly policy limit ${Number(policy.weeklyLimit).toFixed(2)}.`,
      'high',
      { weeklyTotal, weeklyLimit: Number(policy.weeklyLimit) },
    );
  }

  const policyScore = clamp(Math.round(totalPenalty), 0, 100);

  return {
    policyScore,
    reasons,
    violations,
    details,
  };
}
