import React from 'react';

// --- SVG Icon Primitives (Lucide equivalent 16px, 1.8 stroke, round caps) ---
export const Icon = ({ name, className = "w-4 h-4 text-muted" }) => {
  const strokeWidth = "1.8";
  const strokeLinecap = "round";
  const strokeLinejoin = "round";

  switch (name) {
    case "layout-dashboard":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      );
    case "layout":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <line x1="3" x2="21" y1="9" y2="9" />
          <line x1="9" x2="9" y1="21" y2="9" />
        </svg>
      );
    case "code":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case "grid":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <rect width="7" height="7" x="3" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="14" rx="1" />
          <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
      );
    case "network":
    case "org-chart":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <rect x="9" y="2" width="6" height="6" rx="1" />
          <rect x="2" y="16" width="6" height="6" rx="1" />
          <rect x="16" y="16" width="6" height="6" rx="1" />
          <path d="M12 8v4m0 0H5v4m7-4h7v4" />
        </svg>
      );
    case "users":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "user-plus":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" x2="19" y1="8" y2="14" />
          <line x1="22" x2="16" y1="11" y2="11" />
        </svg>
      );
    case "briefcase":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <rect width="20" height="14" x="2" y="7" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
    case "clock":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "calendar":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
      );
    case "dollar-sign":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <line x1="12" x2="12" y1="2" y2="22" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case "user-check":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <polyline points="16 11 18 13 22 9" />
        </svg>
      );
    case "trending-up":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      );
    case "file-text":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" x2="8" y1="13" y2="13" />
          <line x1="16" x2="8" y1="17" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    case "graduation-cap":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      );
    case "bar-chart-2":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <line x1="18" x2="18" y1="20" y2="10" />
          <line x1="12" x2="12" y1="20" y2="4" />
          <line x1="6" x2="6" y1="20" y2="14" />
        </svg>
      );
    case "bell":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );
    case "megaphone":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="m3 11 18-5v12L3 14v-3z" />
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
      );
    case "settings":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "check":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case "x":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <line x1="18" x2="6" y1="6" y2="18" />
          <line x1="6" x2="18" y1="6" y2="18" />
        </svg>
      );
    case "search":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" x2="16.65" y1="21" y2="16.65" />
        </svg>
      );
    case "filter":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      );
    case "download":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
      );
    case "eye":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "alert-triangle":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" x2="12" y1="9" y2="13" />
          <line x1="12" x2="12.01" y1="17" y2="17" />
        </svg>
      );
    case "printer":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect width="12" height="8" x="6" y="14" />
        </svg>
      );
    case "eye-off":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <line x1="2" x2="22" y1="2" y2="22" />
        </svg>
      );
    case "lock":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    case "mail":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      );
    case "phone":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      );
    case "shield":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        </svg>
      );
    case "log-out":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" x2="9" y1="12" y2="12" />
        </svg>
      );
    case "user":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "arrow-left":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <line x1="19" x2="5" y1="12" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <line x1="5" x2="19" y1="12" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      );
    case "key":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <circle cx="7.5" cy="15.5" r="5.5" />
          <path d="m21 2-9.6 9.6" />
          <path d="m15.5 7.5 3 3L22 7l-3-3" />
        </svg>
      );
    case "more-horizontal":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      );
    case "more-vertical":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      );
    case "map-pin":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case "trash-2":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          <line x1="10" x2="10" y1="11" y2="17" />
          <line x1="14" x2="14" y1="11" y2="17" />
        </svg>
      );
    case "edit":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      );
    case "coffee":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M10 2v2M14 2v2M6 2v2M18 9h1a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3h-1" />
          <path d="M4 9h14v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9Z" />
        </svg>
      );
    case "pause":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      );
    case "upload":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" x2="12" y1="3" y2="15" />
        </svg>
      );
    case "plus":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <line x1="12" x2="12" y1="5" y2="19" />
          <line x1="5" x2="19" y1="12" y2="12" />
        </svg>
      );
    case "credit-card":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      );
    case "chevron-left":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      );
    case "sparkles":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
      );
    case "home":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "camera":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      );
    case "rotate-cw":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <polyline points="21 3 21 8 16 8" />
        </svg>
      );
    case "zoom-in":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" x2="16.65" y1="21" y2="16.65" />
          <line x1="11" x2="11" y1="8" y2="14" />
          <line x1="8" x2="14" y1="11" y2="11" />
        </svg>
      );
    case "zoom-out":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" x2="16.65" y1="21" y2="16.65" />
          <line x1="8" x2="14" y1="11" y2="11" />
        </svg>
      );
    case "check-square":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case "list":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <line x1="8" x2="21" y1="6" y2="6" />
          <line x1="8" x2="21" y1="12" y2="12" />
          <line x1="8" x2="21" y1="18" y2="18" />
          <line x1="3" x2="3.01" y1="6" y2="6" />
          <line x1="3" x2="3.01" y1="12" y2="12" />
          <line x1="3" x2="3.01" y1="18" y2="18" />
        </svg>
      );
    case "columns":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M12 3v18" />
        </svg>
      );
    case "paperclip":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
      );
    case "message-square":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "check-circle":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case "flag":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" x2="4" y1="22" y2="15" />
        </svg>
      );
    case "play":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      );
    case "video":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      );
    case "external-link":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      );
    case "maximize":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      );
    case "gift":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <polyline points="20 12 20 22 4 22 4 12" />
          <rect x="2" y="7" width="20" height="5" />
          <line x1="12" y1="22" x2="12" y2="7" />
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
      );
    case "sliders":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin}>
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      );
    default:
      return null;
  }
};

export default Icon;
