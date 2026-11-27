import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../auth/AuthContext.jsx';
import { getAvatar, saveAvatar as saveAvatarToStore, removeAvatar as removeAvatarFromStore, subscribeAvatarStore } from '../services/avatarStore.js';
import { COMPANY_CONFIG } from '../data/mockDb.js';

const DEFAULT_USER_PROFILE = {
  name: "Pooja Patel",
  firstName: "Pooja",
  lastName: "Patel",
  email: "pooja.patel@nexora.in",
  employeeId: "EMP-1088",
  companyId: COMPANY_CONFIG.id,
  companyName: COMPANY_CONFIG.name,
  dept: "Human Resources",
  role: "Senior HRBP",
  systemRole: "HR",
  mobile: "+91 98450 12345",
  location: "Hyderabad, Telangana",
  joiningDate: "15 Jan 2022",
  accessStatus: "active",
};

function resolveNames(user) {
  let first = (user?.firstName || "").trim();
  let last = (user?.lastName || "").trim();

  if (!first && user?.name) {
    const parts = user.name.trim().split(/\s+/);
    first = parts[0] || "";
    last = parts.slice(1).join(" ") || "";
  }

  const full = `${first} ${last}`.trim() || user?.name || "HR Administrator";
  return { firstName: first || "Pooja", lastName: last || "Patel", name: full };
}

function resolveHrSystemRole(authUser) {
  const roles = Array.isArray(authUser?.roles) ? authUser.roles : [];
  if (roles.includes("SUPER_ADMIN")) return "Super Admin";
  if (roles.includes("ADMIN")) return "Admin";
  if (roles.includes("HR")) return "HR";
  const raw = String(authUser?.systemRole || authUser?.role || "").toUpperCase();
  if (raw.includes("SUPER_ADMIN")) return "Super Admin";
  if (raw.includes("ADMIN")) return "Admin";
  return "HR";
}

const ProfileContext = createContext(null);

export const ProfileProvider = ({ children }) => {
  const { user: authUser, logout: authLogout, updateProfile: authUpdateProfile } = useAuth();
  const [localOverrides, setLocalOverrides] = useState({});
  const [avatarRevision, setAvatarRevision] = useState(0);

  useEffect(() => {
    const unsub = subscribeAvatarStore(() => {
      setAvatarRevision((r) => r + 1);
    });
    return unsub;
  }, []);

  const profile = useMemo(() => {
    const empId = authUser?.employeeId || authUser?.employee_id || DEFAULT_USER_PROFILE.employeeId;
    const base = {
      ...DEFAULT_USER_PROFILE,
      ...(authUser || {}),
      ...localOverrides,
      employeeId: empId,
      companyId: (!authUser?.companyId || authUser.companyId === "COMP-X" || authUser.companyId === "COMP-Y")
        ? COMPANY_CONFIG.id
        : authUser.companyId,
      companyName: COMPANY_CONFIG.name,
      dept: localOverrides.dept || authUser?.department || authUser?.dept || DEFAULT_USER_PROFILE.dept,
      role: localOverrides.role || authUser?.designation || authUser?.role || DEFAULT_USER_PROFILE.role,
      systemRole: resolveHrSystemRole(authUser),
      roles: authUser?.roles || ["HR"],
      accessStatus: "active",
    };

    const { firstName, lastName, name } = resolveNames(base);
    const storedAvatar = localOverrides.avatarUrl !== undefined
      ? localOverrides.avatarUrl
      : (authUser?.avatarUrl || getAvatar(empId) || null);

    return {
      ...base,
      firstName,
      lastName,
      name,
      avatarUrl: storedAvatar,
      mobile: base.mobile || DEFAULT_USER_PROFILE.mobile,
      location: base.location || DEFAULT_USER_PROFILE.location,
      joiningDate: base.joiningDate || DEFAULT_USER_PROFILE.joiningDate,
    };
  }, [authUser, localOverrides, avatarRevision]);

  const updateProfile = useCallback((updatedFields) => {
    const empId = profile.employeeId || DEFAULT_USER_PROFILE.employeeId;
    const nextFields = { ...updatedFields };

    if (nextFields.firstName !== undefined || nextFields.lastName !== undefined) {
      const first = (nextFields.firstName !== undefined ? nextFields.firstName : profile.firstName || "").trim();
      const last = (nextFields.lastName !== undefined ? nextFields.lastName : profile.lastName || "").trim();
      nextFields.firstName = first;
      nextFields.lastName = last;
      nextFields.name = `${first} ${last}`.trim();
    }

    if (nextFields.avatarUrl !== undefined) {
      if (nextFields.avatarUrl) {
        saveAvatarToStore(empId, nextFields.avatarUrl);
      } else {
        removeAvatarFromStore(empId);
      }
      nextFields.avatarUrl = nextFields.avatarUrl || null;
    }

    setLocalOverrides((prev) => ({ ...prev, ...nextFields }));

    if (typeof authUpdateProfile === "function") {
      authUpdateProfile({
        name: nextFields.name,
        mobile: nextFields.mobile,
        avatarUrl: nextFields.avatarUrl,
      });
    }

    if (typeof window !== "undefined") {
      const merged = { ...profile, ...nextFields };
      window.dispatchEvent(new CustomEvent("hrms_user_updated", { detail: merged }));
      window.dispatchEvent(new CustomEvent("hrms_avatar_updated", {
        detail: { employeeId: empId, avatarUrl: merged.avatarUrl }
      }));
    }
  }, [profile, authUpdateProfile]);

  const setProfile = useCallback((updater) => {
    if (typeof updater === "function") {
      setLocalOverrides((prev) => {
        const next = updater({ ...profile, ...prev });
        return next && typeof next === "object" ? next : prev;
      });
    } else if (updater && typeof updater === "object") {
      setLocalOverrides((prev) => ({ ...prev, ...updater }));
    }
  }, [profile]);

  const logout = useCallback(() => {
    authLogout();
  }, [authLogout]);

  const value = {
    profile,
    currentUser: profile,
    updateProfile,
    logout,
    setProfile,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
