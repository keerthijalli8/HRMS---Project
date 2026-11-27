import React from 'react';
import { Eye, X, Search, Download, Check, Clock3, CircleAlert, ChevronLeft, ChevronRight } from 'lucide-react';

const iconMap = { eye: Eye, close: X, search: Search, download: Download, check: Check, clock: Clock3, alert: CircleAlert };

export function Card({ title, sub, children, className = '', id, ...props }) {
  return <section id={id} className={`glass-card min-w-0 p-4 sm:p-5 ${className}`} {...props}>
    {(title || sub) && <header className="mb-4"><h2 className="font-display text-base font-bold text-ink">{title}</h2>{sub && <p className="mt-1 text-xs text-muted">{sub}</p>}</header>}
    {children}
  </section>;
}

export function Table({ cols = [], rows = [], className = '' }) {
  return <div className={`overflow-x-auto ${className}`}><table className="w-full min-w-[720px] border-collapse text-left text-xs text-ink"><thead><tr className="border-b border-line/60 text-[10px] uppercase tracking-wider text-muted">{cols.map((col, index) => <th key={`${String(col)}-${index}`} className="px-2 py-2.5">{col}</th>)}</tr></thead><tbody className="divide-y divide-line/40">{rows.map((row, rowIndex) => <tr key={row?.key || rowIndex} className="transition hover:bg-surface2/40">{(Array.isArray(row) ? row : []).map((cell, index) => <td key={cell?.key || index} className="px-2 py-2.5">{cell}</td>)}</tr>)}</tbody></table></div>;
}

export function Who({ n = '—', s = '' }) {
  const initials = String(n).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return <div className="flex min-w-[150px] items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">{initials}</span><span><b className="block text-ink">{n}</b>{s && <small className="text-muted">{s}</small>}</span></div>;
}

export function Pill({ k = 'neutral', children }) {
  const styles = { good: 'border-good/30 bg-good/10 text-good', warn: 'border-warn/30 bg-warn/10 text-warn', bad: 'border-bad/30 bg-bad/10 text-bad', info: 'border-info/30 bg-info/10 text-info', neutral: 'border-line bg-surface2 text-muted' };
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold ${styles[k] || styles.neutral}`}>{children}</span>;
}

export function Icon({ k = 'eye', className = 'h-4 w-4' }) {
  const Component = iconMap[k] || Eye;
  return <Component className={className} aria-hidden="true" />;
}

export function Pagination({ currentPage = 1, totalItems = 0, pageSize = 10, onPageChange }) {
  const pages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (pages <= 1) return null;
  return <div className="flex items-center justify-between gap-3 border-t border-line/50 pt-3 text-xs text-muted"><span>Page {currentPage} of {pages} · {totalItems} results</span><div className="flex gap-1"><button type="button" className="btn2 p-1.5" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button><button type="button" className="btn2 p-1.5" disabled={currentPage >= pages} onClick={() => onPageChange(currentPage + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button></div></div>;
}

export function Kpis({ items = [], onItemClick }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">{items.map((item, index) => {
    const [title, value, sub, active] = item;
    return <button key={`${title}-${index}`} type="button" onClick={() => onItemClick?.({ title, value, sub, active })} aria-pressed={!!active} className={`glass-card min-w-0 p-3 text-left transition hover:border-accent/50 ${active ? 'border-accent/60' : ''}`}><span className="block truncate text-[10px] font-bold uppercase text-muted">{title}</span><b className="mt-1 block truncate font-display text-lg text-ink">{value}</b><small className="text-muted">{sub}</small></button>;
  })}</div>;
}
