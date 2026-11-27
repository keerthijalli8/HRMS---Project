export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const formatDate = (isoString) => {
  if (!isoString) return '-';
  const parts = isoString.split('-');
  if (parts.length < 3) return isoString;
  const [y, m, d] = parts.map(Number);
  return `${d} ${MON[m - 1]} ${y}`;
};

export const formatDateRange = (from, to) => {
  if (!from) return '-';
  if (!to || from === to) return formatDate(from);
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  if (y1 === y2 && m1 === m2) {
    return `${d1}–${d2} ${MON[m1 - 1]} ${y1}`;
  }
  return `${formatDate(from)} – ${formatDate(to)}`;
};

export const formatCurrencyINR = (num) => {
  if (num === undefined || num === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

export const getInitials = (name = '') => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
};

export const getAvatarColor = (name = '') => {
  const hash = [...name].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 360, 11);
  return `hsl(${hash}, 55%, 38%)`;
};

export const STATUS_META = {
  present: { label: 'In Office', color: 'text-good', bg: 'bg-good/15', border: 'border-good/30' },
  office: { label: 'In Office', color: 'text-good', bg: 'bg-good/15', border: 'border-good/30' },
  remote: { label: 'WFH Remote', color: 'text-info', bg: 'bg-info/15', border: 'border-info/30' },
  wfh: { label: 'WFH Remote', color: 'text-info', bg: 'bg-info/15', border: 'border-info/30' },
  late: { label: 'Late Arrival', color: 'text-warn', bg: 'bg-warn/15', border: 'border-warn/30' },
  halfDay: { label: 'Half Day', color: 'text-warn', bg: 'bg-warn/15', border: 'border-warn/30' },
  leave: { label: 'On Leave', color: 'text-accent2', bg: 'bg-accent2/15', border: 'border-accent2/30' },
  absent: { label: 'Absent', color: 'text-bad', bg: 'bg-bad/15', border: 'border-bad/30' },
  none: { label: 'Not Punched', color: 'text-bad', bg: 'bg-bad/15', border: 'border-bad/30' },
  pending: { label: 'Pending', color: 'text-warn', bg: 'bg-warn/15', border: 'border-warn/30' },
  'partially approved': { label: 'Partially Approved', color: 'text-warn', bg: 'bg-warn/15', border: 'border-warn/30' },
  approved: { label: 'Approved', color: 'text-good', bg: 'bg-good/15', border: 'border-good/30' },
  rejected: { label: 'Rejected', color: 'text-bad', bg: 'bg-bad/15', border: 'border-bad/30' },
  completed: { label: 'Completed', color: 'text-good', bg: 'bg-good/15', border: 'border-good/30' },
  in_progress: { label: 'In Progress', color: 'text-info', bg: 'bg-info/15', border: 'border-info/30' },
  in_review: { label: 'In Review', color: 'text-accent2', bg: 'bg-accent2/15', border: 'border-accent2/30' },
  todo: { label: 'To Do', color: 'text-muted', bg: 'bg-surface2', border: 'border-line' },
  overdue: { label: 'Overdue', color: 'text-bad', bg: 'bg-bad/15', border: 'border-bad/30' },
  high: { label: 'High', color: 'text-warn', bg: 'bg-warn/15', border: 'border-warn/30' },
  critical: { label: 'Critical', color: 'text-bad', bg: 'bg-bad/15', border: 'border-bad/30' },
  medium: { label: 'Medium', color: 'text-info', bg: 'bg-info/15', border: 'border-info/30' },
  low: { label: 'Low', color: 'text-muted', bg: 'bg-surface2', border: 'border-line' },
};
