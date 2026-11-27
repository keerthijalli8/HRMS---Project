// src/utils/geo.js
// GPS tracking, Haversine distance calculation, and geofence evaluation for employee check-in & check-out.

import { ATTENDANCE_RULES } from '../config/attendanceRules.js';

/**
 * Calculates distance in meters between two GPS coordinates using the Haversine formula.
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return 0;
  const R = 6371000; // Earth radius in meters
  const toRad = (val) => (val * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rLat1) * Math.cos(rLat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Formats decimal latitude/longitude into human-readable coordinates.
 * e.g., 17.4435, 78.3772 -> "17.4435° N, 78.3772° E"
 */
export function formatCoordinates(lat, lng) {
  if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return '--, --';
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

/**
 * Builds a Google Maps search URL for an exact latitude/longitude coordinate pin
 * (avoids /maps/dir road-snapping so the pin lands directly on the exact building/location).
 */
export function buildGoogleMapsPlaceUrl(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined || isNaN(lat) || isNaN(lng)) {
    return 'https://www.google.com/maps';
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${Number(lat)},${Number(lng)}`)}`;
}

/**
 * Builds a Google Maps directions URL between two distinct coordinates (Check-In -> Check-Out).
 */
export function buildGoogleMapsDirectionsUrl(originLoc, destLoc) {
  if (
    originLoc?.latitude == null ||
    originLoc?.longitude == null ||
    destLoc?.latitude == null ||
    destLoc?.longitude == null
  ) {
    return buildGoogleMapsPlaceUrl(originLoc?.latitude ?? destLoc?.latitude, originLoc?.longitude ?? destLoc?.longitude);
  }
  const origin = encodeURIComponent(`${Number(originLoc.latitude)},${Number(originLoc.longitude)}`);
  const destination = encodeURIComponent(`${Number(destLoc.latitude)},${Number(destLoc.longitude)}`);
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
}

/**
 * Builds a Google Maps URL focusing cleanly on the exact punch coordinate pin
 * (works identically for Office, Work from home, and Remote employees without road snapping).
 */
export function buildGoogleMapsPunchUrl(
  checkInLocation,
  checkOutLocation,
  fallbackOffice = ATTENDANCE_RULES.geofence
) {
  const hasIn =
    checkInLocation &&
    typeof checkInLocation.latitude === 'number' &&
    typeof checkInLocation.longitude === 'number';
  const hasOut =
    checkOutLocation &&
    typeof checkOutLocation.latitude === 'number' &&
    typeof checkOutLocation.longitude === 'number';

  if (hasIn) {
    return buildGoogleMapsPlaceUrl(checkInLocation.latitude, checkInLocation.longitude);
  }

  if (hasOut) {
    return buildGoogleMapsPlaceUrl(checkOutLocation.latitude, checkOutLocation.longitude);
  }

  return buildGoogleMapsPlaceUrl(fallbackOffice?.latitude, fallbackOffice?.longitude);
}

/**
 * Formats distance cleanly in meters (<1km) or kilometers (>=1km).
 */
export function formatDistance(meters) {
  const value = Number(meters);
  if (isNaN(value) || value < 0) return '0m';
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} km`;
  }
  return `${Math.round(value)}m`;
}

/**
 * Opens Google Maps in a new browser tab synchronously from a user click event.
 */
export function openPunchInGoogleMaps(
  checkInLocation,
  checkOutLocation,
  fallbackOffice = ATTENDANCE_RULES.geofence
) {
  const url = buildGoogleMapsPunchUrl(checkInLocation, checkOutLocation, fallbackOffice);
  if (typeof window !== 'undefined' && typeof window.open === 'function') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  return url;
}

/**
 * Evaluates whether GPS coordinates fall within the company's designated geofence zone.
 */
export function evaluateGeofence(coords, geofence = ATTENDANCE_RULES.geofence) {
  if (!coords || coords.latitude == null || coords.longitude == null || isNaN(coords.latitude) || isNaN(coords.longitude)) {
    return {
      inGeofence: false,
      distanceMeters: 0,
      campusName: geofence?.campusName || 'HITEC City Campus',
      status: 'No GPS'
    };
  }

  const distance = calculateDistanceMeters(
    coords.latitude,
    coords.longitude,
    geofence.latitude,
    geofence.longitude
  );

  const inGeofence = distance <= geofence.radiusMeters;

  return {
    inGeofence,
    distanceMeters: distance,
    radiusMeters: geofence.radiusMeters,
    campusName: geofence.campusName,
    status: inGeofence ? 'Verified on Campus' : `${formatDistance(distance)} from Campus`
  };
}

/**
 * Requests live high-accuracy device GPS coordinates via browser Geolocation API (`maximumAge: 0`).
 * Works for Office, Work from home, and Remote employees; when browser geolocation is blocked/unavailable,
 * falls back to workMode-appropriate coordinates instead of forcing Office coordinates on Remote employees.
 */
export async function getDeviceGPSLocation(offsetOrOptions = 0, workModeArg = 'Office') {
  const opts =
    typeof offsetOrOptions === 'object' && offsetOrOptions !== null
      ? offsetOrOptions
      : { simulatedOffset: offsetOrOptions, workMode: workModeArg };

  const simulatedOffset = opts.simulatedOffset ?? 0;
  const workMode = opts.workMode || 'Office';
  const highAccuracy = opts.highAccuracy ?? true;

  return new Promise((resolve) => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = Math.round(pos.coords.accuracy || 15);
          const geofenceEval = evaluateGeofence({ latitude: lat, longitude: lng });

          let address;
          if (geofenceEval.inGeofence) {
            address = `${ATTENDANCE_RULES.geofence.campusName}, Hyderabad`;
          } else if (workMode === 'Work from home' || workMode === 'Remote') {
            address = `${workMode} Exact GPS (${formatCoordinates(lat, lng)})`;
          } else {
            address = `Off-Campus Exact GPS (${formatCoordinates(lat, lng)})`;
          }

          resolve({
            latitude: lat,
            longitude: lng,
            accuracy,
            isSimulated: false,
            workMode,
            address,
            inGeofence: geofenceEval.inGeofence,
            distanceMeters: geofenceEval.distanceMeters,
            capturedAt: new Date().toISOString()
          });
        },
        (err) => {
          console.warn('GPS position query fallback:', err.message);
          resolve(getFallbackLocationForMode(workMode, simulatedOffset, err.message));
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: 12000,
          maximumAge: 0
        }
      );
    } else {
      resolve(getFallbackLocationForMode(workMode, simulatedOffset, 'Geolocation API unavailable'));
    }
  });
}

/**
 * Returns realistic fallback GPS coordinates respecting employee workMode when device GPS cannot be read.
 */
export function getFallbackLocationForMode(workMode = 'Office', offsetMeters = 45, reason = '') {
  if (workMode === 'Work from home') {
    const baseLat = 17.4612;
    const baseLng = 78.3582;
    const distance = calculateDistanceMeters(
      baseLat,
      baseLng,
      ATTENDANCE_RULES.geofence.latitude,
      ATTENDANCE_RULES.geofence.longitude
    );
    return {
      latitude: baseLat,
      longitude: baseLng,
      accuracy: 25,
      isSimulated: true,
      gpsFallbackReason: reason || 'Fallback WFH location (enable Location permission for live coordinates)',
      workMode,
      address: 'Kondapur WFH · Fallback GPS (Enable device location for exact pin)',
      inGeofence: false,
      distanceMeters: distance,
      capturedAt: new Date().toISOString()
    };
  }

  if (workMode === 'Remote') {
    const baseLat = 17.4239;
    const baseLng = 78.4738;
    const distance = calculateDistanceMeters(
      baseLat,
      baseLng,
      ATTENDANCE_RULES.geofence.latitude,
      ATTENDANCE_RULES.geofence.longitude
    );
    return {
      latitude: baseLat,
      longitude: baseLng,
      accuracy: 30,
      isSimulated: true,
      gpsFallbackReason: reason || 'Fallback Remote location (enable Location permission for live coordinates)',
      workMode,
      address: 'Remote Location · Fallback GPS (Enable device location for exact pin)',
      inGeofence: false,
      distanceMeters: distance,
      capturedAt: new Date().toISOString()
    };
  }

  return getDefaultCampusLocation(offsetMeters, reason);
}

/**
 * Returns calibrated default office campus GPS location (HITEC City Hyderabad) with optional subtle offset.
 */
export function getDefaultCampusLocation(offsetMeters = 45, reason = '') {
  const baseLat = ATTENDANCE_RULES.geofence?.latitude || 17.4435;
  const baseLng = ATTENDANCE_RULES.geofence?.longitude || 78.3772;

  const latOffset = (offsetMeters / 111111) * (Math.random() > 0.5 ? 1 : -1) * 0.5;
  const lngOffset = (offsetMeters / (111111 * Math.cos((baseLat * Math.PI) / 180))) * (Math.random() > 0.5 ? 1 : -1) * 0.5;

  const lat = parseFloat((baseLat + latOffset).toFixed(6));
  const lng = parseFloat((baseLng + lngOffset).toFixed(6));
  const distance = calculateDistanceMeters(lat, lng, baseLat, baseLng);

  return {
    latitude: lat,
    longitude: lng,
    accuracy: 8,
    isSimulated: true,
    gpsFallbackReason: reason || 'Default Campus GPS fallback',
    workMode: 'Office',
    address: 'HITEC City Campus, Tower B, Hyderabad',
    inGeofence: distance <= (ATTENDANCE_RULES.geofence?.radiusMeters || 300),
    distanceMeters: distance,
    capturedAt: new Date().toISOString()
  };
}

