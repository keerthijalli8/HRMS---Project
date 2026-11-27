export function readStorage(key, fallback) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures so callers can continue with fallback state.
  }
}
