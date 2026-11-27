import React from 'react';

// Common SVG props: 24px viewBox, stroke 1.8, currentColor, round caps and joins
const baseProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "w-4 h-4 shrink-0"
};

export function IconDashboard({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

export function IconUsers({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function IconKey({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="m15.5 8.5 2 2" />
      <path d="m18 6 2 2" />
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m11.5 11.5 10-10" />
    </svg>
  );
}

export function IconLaptop({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55A1 1 0 0 1 20.38 20H3.62a1 1 0 0 1-.9-1.45L4 16" />
    </svg>
  );
}

export function IconShare({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="M16 3h5v5" />
      <path d="m21 3-9 9" />
      <path d="M4 12v8a2 2 0 0 0 2 2h8" />
    </svg>
  );
}

export function IconHeadphones({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

export function IconPackage({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

export function IconShield({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

export function IconChart({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

export function IconPlus({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

export function IconX({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function IconSearch({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function IconCheck({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconAlertTriangle({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function IconClock({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function IconDownload({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function IconPrinter({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect width="12" height="8" x="6" y="14" />
    </svg>
  );
}

export function IconArrowRight({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export function IconFilter({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export function IconQrCode({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <rect width="5" height="5" x="3" y="3" rx="1" />
      <rect width="5" height="5" x="16" y="3" rx="1" />
      <rect width="5" height="5" x="3" y="16" rx="1" />
      <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
      <path d="M21 21v.01" />
      <path d="M12 7v3a2 2 0 0 1-2 2H7" />
      <path d="M3 12h.01" />
      <path d="M12 3h.01" />
      <path d="M12 16v.01" />
      <path d="M16 12h1" />
      <path d="M21 12v.01" />
      <path d="M12 21v-1" />
    </svg>
  );
}

export function IconLogIn({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

export function IconLogOut({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function IconCamera({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

export function IconChevronDown({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function IconUser({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function IconTrash({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export function IconGlobe({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function IconSettings({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconBell({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function IconGoogle({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function IconChevronRight({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function IconFileText({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export function IconDatabase({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
    </svg>
  );
}

export function IconFolder({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function IconUploadCloud({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
      <polyline points="16 16 12 12 8 16" />
    </svg>
  );
}

export function IconGrid({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function IconList({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

export function IconLock({ className = "w-4 h-4" }) {
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}


