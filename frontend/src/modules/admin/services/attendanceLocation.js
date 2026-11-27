const LOCATION_OPTIONS = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

export function getDeviceInfo() {
  return typeof navigator === "undefined" ? "Unknown device" : navigator.userAgent || "Unknown browser";
}

export function captureCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("GPS is unavailable in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (![latitude, longitude, accuracy].every(Number.isFinite)) {
          reject(new Error("GPS returned an incomplete location."));
          return;
        }
        if (accuracy > 1000) {
          reject(new Error(`GPS accuracy is too low (${Math.round(accuracy)}m). Please move to an open area and try again.`));
          return;
        }
        resolve({ latitude, longitude, accuracy, capturedAt: new Date().toISOString(), device: getDeviceInfo() });
      },
      (error) => {
        const messages = { 1: "Location permission was denied. Enable location access and try again.", 2: "GPS is unavailable right now. Please try again.", 3: "The GPS request timed out. Please try again." };
        reject(new Error(messages[error.code] || "Unable to capture GPS location."));
      },
      LOCATION_OPTIONS
    );
  });
}

export async function reverseGeocodeLocation(location) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(location.latitude)}&lon=${encodeURIComponent(location.longitude)}&zoom=18&addressdetails=1`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Address lookup failed.");
    const data = await response.json();
    return data.display_name || "Address unavailable";
  } catch (error) {
    console.warn("Reverse geocoding failed; GPS coordinates were preserved.", error);
    return "Address unavailable";
  }
}

export async function captureAttendanceLocation() {
  const location = await captureCurrentLocation();
  return { ...location, address: await reverseGeocodeLocation(location) };
}

export function locationUrl(location) {
  return location && Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude))
    ? `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`
    : null;
}
