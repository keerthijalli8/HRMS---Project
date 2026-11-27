// src/utils/deviceFingerprint.js

const STORAGE_KEY = 'hrms_device_salt_v1';

function getOrCreateDeviceSalt() {
  let salt = localStorage.getItem(STORAGE_KEY);
  if (!salt) {
    const arr = new Uint8Array(16);
    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(arr);
      salt = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
    } else {
      salt = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }
    localStorage.setItem(STORAGE_KEY, salt);
  }
  return salt;
}

function fallbackHash(str) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}`;
}

let cachedDeviceHash = null;

export async function getDeviceHash() {
  if (cachedDeviceHash) return cachedDeviceHash;

  const salt = getOrCreateDeviceSalt();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const raw = [
    navigator.userAgent || '',
    navigator.platform || '',
    navigator.language || '',
    `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    tz,
    salt
  ].join('|');

  if (window.crypto?.subtle?.digest) {
    try {
      const encoded = new TextEncoder().encode(raw);
      const digest = await window.crypto.subtle.digest('SHA-256', encoded);
      const hex = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
      cachedDeviceHash = hex.slice(0, 32);
      return cachedDeviceHash;
    } catch {
      // Fallback below
    }
  }

  cachedDeviceHash = fallbackHash(raw);
  return cachedDeviceHash;
}

