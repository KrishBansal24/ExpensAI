// ============================================
// ExpensAI — Geolocation Fraud Detection Engine
// ============================================
// Detects fraud based on geographic anomalies:
// 1. Distance between user GPS and vendor location
// 2. Impossible travel between consecutive expenses
// Uses Haversine formula for accurate distance calculation.

import { FRAUD_CONFIG } from './fraudConfig.js';

const { geo: G } = FRAUD_CONFIG;

/**
 * Run geolocation-based fraud detection.
 *
 * @param {Object} expense - Current expense with location data
 * @param {Object|null} previousExpense - Previous expense for travel check
 * @param {string|null} googleMapsApiKey - API key for forward geocoding
 * @returns {Promise<{ geoScore: number, reasons: string[], userLocation: Object|null, vendorLocation: Object|null, distance: number|null }>}
 */
export async function runGeoEngine(expense, previousExpense = null, googleMapsApiKey = null) {
  const reasons = [];
  let totalPenalty = 0;
  let userLocation = null;
  let vendorLocation = null;
  let distance = null;

  // ── Extract User Location ────────────────────────
  userLocation = extractUserLocation(expense);

  // ── Geocode Vendor Location ──────────────────────
  const vendorName = expense.vendor || expense.merchantName;
  if (vendorName && googleMapsApiKey) {
    try {
      vendorLocation = await geocodeVendor(vendorName, googleMapsApiKey);
    } catch (err) {
      console.warn('Vendor geocoding failed:', err.message);
    }
  }

  // ── Distance Check ───────────────────────────────
  // Compute distance between user GPS and vendor location
  if (userLocation && vendorLocation) {
    distance = haversineDistance(
      userLocation.lat, userLocation.lng,
      vendorLocation.lat, vendorLocation.lng
    );

    if (distance > G.distanceThresholdKm) {
      const excessKm = distance - G.distanceThresholdKm;
      const penalty = Math.min(excessKm * G.distancePenaltyPerKm, G.maxGeoPenalty);
      totalPenalty += penalty;
      reasons.push(
        `Distance between user and vendor is ${distance.toFixed(1)} km (threshold: ${G.distanceThresholdKm} km).`
      );
    }
  }

  // ── Impossible Travel Check ──────────────────────
  // Check if user could have physically traveled from previous expense location
  if (userLocation && previousExpense) {
    const prevLocation = extractUserLocation(previousExpense);
    if (prevLocation) {
      const prevTime = new Date(previousExpense.date || previousExpense.timestamp).getTime();
      const currTime = new Date(expense.date || expense.timestamp).getTime();
      const timeDiffHours = Math.abs(currTime - prevTime) / 3600000;

      if (timeDiffHours > 0) {
        const travelDistance = haversineDistance(
          prevLocation.lat, prevLocation.lng,
          userLocation.lat, userLocation.lng
        );

        const impliedSpeedKmh = travelDistance / timeDiffHours;

        if (impliedSpeedKmh > G.impossibleTravelSpeedKmh && travelDistance > 50) {
          totalPenalty += G.impossibleTravelPenalty;
          reasons.push(
            `Impossible travel detected: ${travelDistance.toFixed(0)} km in ${timeDiffHours.toFixed(1)}h (implied speed: ${impliedSpeedKmh.toFixed(0)} km/h).`
          );
        }
      }
    }
  }

  const geoScore = Math.min(totalPenalty, 100);

  return { geoScore, reasons, userLocation, vendorLocation, distance };
}

// ── Utility Functions ────────────────────────────────

/**
 * Extract structured location from an expense record.
 * Supports both `{ location: { lat, lng } }` and `locationString: "lat, lng"` formats.
 *
 * @param {Object} expense
 * @returns {{ lat: number, lng: number } | null}
 */
export function extractUserLocation(expense) {
  // Structured location object
  if (expense?.location?.lat != null && expense?.location?.lng != null) {
    return { lat: Number(expense.location.lat), lng: Number(expense.location.lng) };
  }

  // Structured userLocation object
  if (expense?.userLocation?.lat != null && expense?.userLocation?.lng != null) {
    return { lat: Number(expense.userLocation.lat), lng: Number(expense.userLocation.lng) };
  }

  // Parse from locationString "lat, lng"
  if (typeof expense?.locationString === 'string') {
    const match = expense.locationString.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
    if (match) {
      return { lat: Number(match[1]), lng: Number(match[2]) };
    }
  }

  return null;
}

/**
 * Forward-geocode a vendor name to coordinates using Google Maps API.
 *
 * @param {string} vendorName - Business name to geocode
 * @param {string} apiKey - Google Maps Geocoding API key
 * @returns {Promise<{ lat: number, lng: number, formattedAddress: string } | null>}
 */
export async function geocodeVendor(vendorName, apiKey) {
  if (!vendorName || !apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), G.geocodeTimeoutMs);

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(vendorName)}&key=${apiKey}`;
    const res = await fetch(url, { signal: controller.signal });
    const data = await res.json();

    if (data?.status === 'OK' && data.results?.[0]) {
      const { lat, lng } = data.results[0].geometry.location;
      return {
        lat,
        lng,
        formattedAddress: data.results[0].formatted_address,
      };
    }
    return null;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('Vendor geocoding timed out for:', vendorName);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Calculate the great-circle distance between two points
 * using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lng1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lng2 - Longitude of point 2 (degrees)
 * @returns {number} Distance in kilometers
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}
