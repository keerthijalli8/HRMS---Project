// src/config/navigation.js
// Canonical module navigation registry shared by the left Rail and global Header search bar.

import {
  LayoutDashboard,
  Bell,
  Clock,
  CalendarDays,
  CheckSquare,
  Repeat,
  Calendar,
  Target,
  FileText,
  User,
  Sliders,
  HelpCircle,
  Banknote
} from 'lucide-react';

export const NAV_GROUPS = [
  {
    label: 'MAIN',
    items: [
      {
        to: '/employee/dashboard',
        label: 'Overview',
        icon: LayoutDashboard,
        description: 'Dashboard home, live check-in/out & monthly KPIs',
        keywords: ['dashboard', 'home', 'summary', 'kpi', 'metrics', 'announcements', 'main']
      },
      {
        to: '/employee/notifications',
        label: 'Notifications',
        icon: Bell,
        badgeKey: 'notifs',
        description: 'HR updates, approvals, shift & policy alerts',
        keywords: ['alerts', 'updates', 'bell', 'announcements', 'messages', 'unread']
      }
    ]
  },
  {
    label: 'WORK',
    items: [
      {
        to: '/employee/attendance',
        label: 'Attendance',
        icon: Clock,
        description: 'Daily punch, GPS mapping, breaks, logs & regularisation',
        keywords: ['punch', 'check in', 'check out', 'gps', 'map', 'location', 'geofence', 'breaks', 'regularisation', 'history', 'logs', 'working hours', 'late', 'early']
      },
      {
        to: '/employee/leave',
        label: 'Leave',
        icon: CalendarDays,
        description: 'Apply leave, check balances & track approval status',
        keywords: ['apply leave', 'casual leave', 'sick leave', 'earned leave', 'comp off', 'pto', 'vacation', 'time off', 'balance', 'approvals']
      },
      {
        to: '/employee/tasks',
        label: 'My Tasks',
        icon: CheckSquare,
        badgeKey: 'tasks',
        description: 'Assigned sprint deliverables, progress & work logs',
        keywords: ['todo', 'to-do', 'work', 'projects', 'deadlines', 'pending', 'sprint', 'checklist']
      },
      {
        to: '/employee/shifts',
        label: 'Shifts',
        icon: Repeat,
        description: 'Shift roster, weekly off schedule & change requests',
        keywords: ['schedule', 'roster', 'timings', 'general shift', 'weekly off', 'swap']
      },
      {
        to: '/employee/holidays',
        label: 'Holiday Calendar',
        icon: Calendar,
        description: 'Company & public holidays calendar FY 2026–27',
        keywords: ['festivals', 'public holiday', 'optional holiday', 'calendar', 'vacation days']
      }
    ]
  },
  {
    label: 'FINANCE',
    items: [
      {
        to: '/employee/finance/payroll',
        label: 'Payroll',
        icon: Banknote,
        description: 'Salary structures, monthly payroll processing & payslips',
        keywords: ['salary', 'payslip', 'payroll', 'ctc', 'structure', 'allowances', 'deductions', 'earnings', 'compensation', 'finance', 'bonus', 'tds', 'form 16']
      }
    ]
  },
  {
    label: 'GROWTH',
    items: [
      {
        to: '/employee/performance',
        label: 'Performance',
        icon: Target,
        description: 'Goals, OKRs, appraisal cycles & peer feedback',
        keywords: ['appraisal', 'goals', 'okr', 'review', 'rating', 'feedback', 'skills', 'growth']
      }
    ]
  },
  {
    label: 'DOCUMENTS',
    items: [
      {
        to: '/employee/documents',
        label: 'Documents',
        icon: FileText,
        description: 'Offer letter, Form 16, ID cards & company policies',
        keywords: ['files', 'offer letter', 'form 16', 'pan', 'aadhaar', 'id card', 'certificates', 'policies', 'download', 'upload']
      }
    ]
  },
  {
    label: 'ACCOUNT',
    items: [
      {
        to: '/employee/profile',
        label: 'My Profile',
        icon: User,
        description: 'Personal info, contact details, bio & avatar',
        keywords: ['account', 'personal', 'name', 'phone', 'email', 'address', 'emergency contact', 'avatar', 'bio']
      },
      {
        to: '/employee/settings',
        label: 'Settings',
        icon: Sliders,
        description: 'Password security, preferences & theme appearance',
        keywords: ['preferences', 'password', 'security', 'theme', 'appearance', 'privacy', '2fa']
      },
      {
        to: '/employee/support',
        label: 'Help & Support',
        icon: HelpCircle,
        description: 'HR helpdesk tickets, FAQs & IT support contact',
        keywords: ['help', 'ticket', 'faq', 'hr desk', 'it support', 'issue', 'contact', 'query']
      }
    ]
  }
];

export const ALL_MODULES = NAV_GROUPS.flatMap((group) =>
  group.items.map((item, idx) => ({
    ...item,
    group: group.label,
    order: idx
  }))
);

function scoreModule(mod, tokens) {
  const label = mod.label.toLowerCase();
  const desc = (mod.description || '').toLowerCase();
  const keywords = (mod.keywords || []).map((k) => k.toLowerCase());
  const route = mod.to.toLowerCase();

  let totalScore = 0;

  for (const token of tokens) {
    let tokenScore = 0;

    if (label === token) {
      tokenScore = 120;
    } else if (label.startsWith(token)) {
      tokenScore = 100;
    } else if (label.includes(token)) {
      tokenScore = 75;
    } else if (keywords.some((kw) => kw === token)) {
      tokenScore = 70;
    } else if (keywords.some((kw) => kw.startsWith(token))) {
      tokenScore = 58;
    } else if (keywords.some((kw) => kw.includes(token)) || route.includes(token)) {
      tokenScore = 45;
    } else if (desc.includes(token)) {
      tokenScore = 25;
    }

    if (tokenScore === 0) {
      return 0; // Require every query token to match somewhere in the module
    }
    totalScore += tokenScore;
  }

  return totalScore;
}

/**
 * Filters and ranks dashboard modules matching a non-empty search query by relevance.
 * Empty query returns [] so clicking the search bar does not dump all modules.
 */
export function filterDashboardModules(query = '', modules = ALL_MODULES) {
  const normalized = String(query || '').trim().toLowerCase();
  if (!normalized) return [];

  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  return modules
    .map((mod, idx) => ({ mod, idx, score: scoreModule(mod, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .map((entry) => entry.mod);
}

