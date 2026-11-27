import React, { useState, useEffect } from 'react';
import { getAvatar, subscribeAvatarStore } from '../services/avatarStore.js';

// Enhanced Avatar Component:
// Supports custom uploaded profile images, deterministic HSL initial fallbacks,
// and real-time synchronization with avatarStore updates.
export const Avatar = ({
  name = "Employee",
  employeeId = null,
  photoUrl = null,
  size = "md",
  className = "",
  alt = null
}) => {
  const [storedAvatar, setStoredAvatar] = useState(() => {
    return photoUrl || getAvatar(employeeId || name);
  });

  // Re-sync on prop change
  useEffect(() => {
    if (photoUrl) {
      setStoredAvatar(photoUrl);
    } else {
      setStoredAvatar(getAvatar(employeeId || name));
    }
  }, [photoUrl, employeeId, name]);

  // Reactive subscription to global avatar updates
  useEffect(() => {
    const unsub = subscribeAvatarStore(() => {
      if (photoUrl) {
        setStoredAvatar(photoUrl);
      } else {
        setStoredAvatar(getAvatar(employeeId || name));
      }
    });
    return unsub;
  }, [photoUrl, employeeId, name]);

  // Compute initials
  const initials = (name || "Employee")
    .split(" ")
    .filter(Boolean)
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "E";

  // Compute deterministic hue from name
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);

  // Default size mapping (if className doesn't specify width/height)
  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-[28px] h-[28px] text-[11px]",
    md: "w-[34px] h-[34px] text-xs",
    lg: "w-12 h-12 text-base",
    xl: "w-20 h-20 text-2xl"
  };

  const defaultDimension = sizeClasses[size] || sizeClasses.md;

  if (storedAvatar) {
    return (
      <div
        className={`${defaultDimension} rounded-full overflow-hidden shrink-0 shadow-sm border border-line/40 bg-surface2 ${className}`}
        aria-label={alt || name}
      >
        <img
          src={storedAvatar}
          alt={alt || name}
          className="w-full h-full object-cover rounded-full"
          onError={() => setStoredAvatar(null)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${defaultDimension} rounded-full flex items-center justify-center font-display font-semibold text-white shrink-0 shadow-sm ${className}`}
      style={{ backgroundColor: `hsl(${hue}, 52%, 40%)` }}
      aria-label={alt || name}
    >
      {initials}
    </div>
  );
};
