import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { profileService } from '../services/profileService';
import { defaultProfile } from '../data/profile';
import { defaultSettings } from '../data/settings';

const ManagerProfileContext = createContext(null);

export function ManagerProfileProvider({ children }) {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(defaultProfile);
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted manager profile/settings overrides
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [prof, sett] = await Promise.all([
          profileService.getProfile(),
          profileService.getSettings(),
        ]);
        if (mounted) {
          if (prof) setProfile(prof);
          if (sett) setSettings(sett);
        }
      } catch (err) {
        console.error('Failed to load manager profile/settings:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Merge shared authenticated identity over local mock profile fields
  const user = useMemo(() => {
    if (!authUser) return profile;
    const displayName = authUser.name || profile.name;
    const initials = displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
    return {
      ...profile,
      id: authUser.id || profile.id,
      name: displayName,
      preferredName: authUser.preferredName || displayName.split(' ')[0] || profile.preferredName,
      avatar: initials || profile.avatar,
      employeeId: authUser.employeeId || authUser.employee_id || profile.employeeId,
      workEmail: authUser.email || profile.workEmail,
      department: authUser.department || profile.department,
      designation: authUser.designation || profile.designation,
      roles: authUser.roles,
      photoUrl: authUser.avatarUrl || profile.photoUrl,
    };
  }, [authUser, profile]);

  const updateUser = async (updates) => {
    const updated = await profileService.updateProfile(updates);
    setProfile(updated);
    return updated;
  };

  const updatePhoto = async (dataUrl) => {
    const updated = await profileService.uploadPhoto(dataUrl);
    setProfile(updated);
    return updated;
  };

  const removePhoto = async () => {
    const updated = await profileService.removePhoto();
    setProfile(updated);
    return updated;
  };

  const updateSettingsSection = async (sectionKey, sectionValues) => {
    const updated = await profileService.updateSettings(sectionKey, sectionValues);
    setSettings(updated);
    return updated;
  };

  return (
    <ManagerProfileContext.Provider
      value={{
        user,
        settings,
        isLoading,
        updateUser,
        updatePhoto,
        removePhoto,
        updateSettingsSection,
      }}
    >
      {children}
    </ManagerProfileContext.Provider>
  );
}

export function useManagerProfile() {
  const ctx = useContext(ManagerProfileContext);
  if (!ctx) {
    throw new Error('useManagerProfile must be used within a ManagerProfileProvider');
  }
  return ctx;
}
