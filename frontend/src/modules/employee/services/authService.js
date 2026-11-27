// src/modules/employee/services/authService.js
// Profile & local preference helpers for Employee module (authentication is owned by shared AuthContext).

import { INITIAL_EMPLOYEE } from '../data/employee.js';

const AVATAR_STORAGE_KEY = 'hrms_employee_avatar_url';
const PROFILE_STORAGE_KEY = 'hrms_employee_profile_overrides';

function readProfileOverrides() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export const authService = {
  getStoredProfile() {
    const overrides = readProfileOverrides();
    const savedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY) || null;
    return {
      ...INITIAL_EMPLOYEE,
      ...overrides,
      avatarUrl: savedAvatar || overrides.avatarUrl || INITIAL_EMPLOYEE.avatarUrl || null
    };
  },

  async updateProfile(updates = {}) {
    const currentOverrides = readProfileOverrides();
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...currentOverrides, ...updates }));
    return { user: this.getStoredProfile() };
  },

  async updateAvatar(avatarUrl) {
    if (avatarUrl) {
      localStorage.setItem(AVATAR_STORAGE_KEY, avatarUrl);
    } else {
      localStorage.removeItem(AVATAR_STORAGE_KEY);
    }
    return { user: this.getStoredProfile() };
  }
};

export default authService;
