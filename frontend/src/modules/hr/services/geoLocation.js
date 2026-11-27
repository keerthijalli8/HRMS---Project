// true = block check-in and check-out when location is unavailable
export const REQUIRE_LOCATION = false;

/**
 * Retrieves the current GPS location and reverse-geocodes it to a readable city/state label.
 * Always resolves to { ok: true, lat, lon, accuracy, label, shared: true }
 * or { ok: false, reason: "denied" | "timeout" | "unavailable" | "unsupported" }
 * Never throws.
 */
export function getCurrentLocation({ timeoutMs = 10000 } = {}) {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !navigator || !navigator.geolocation) {
      return resolve({ ok: false, reason: "unsupported" });
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const accuracy = Math.round(pos.coords.accuracy || 0);

          let label = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);

            if (res.ok) {
              const data = await res.json();
              const localityOrCity = data.locality || data.city;
              const state = data.principalSubdivision;
              if (localityOrCity && state) {
                label = `${localityOrCity}, ${state}`;
              } else if (localityOrCity) {
                label = `${localityOrCity}, ${data.countryName || 'India'}`;
              } else if (state) {
                label = `${state}, ${data.countryName || 'India'}`;
              }
            }
          } catch (fetchErr) {
            // Reverse geocode failed or timed out: fall back to lat, lon label
          }

          resolve({
            ok: true,
            lat,
            lon,
            accuracy,
            label,
            shared: true
          });
        } catch (err) {
          resolve({ ok: false, reason: "unavailable" });
        }
      },
      (err) => {
        let reason = "unavailable";
        if (err.code === 1) { // PERMISSION_DENIED
          reason = "denied";
        } else if (err.code === 3) { // TIMEOUT
          reason = "timeout";
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
          reason = "unavailable";
        }
        resolve({ ok: false, reason });
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 0
      }
    );
  });
}
