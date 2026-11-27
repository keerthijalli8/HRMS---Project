// src/components/ui.jsx
// Adapter and unified UI component collection for Finance and Dashboard modules.

import React from 'react';
import { Card as BaseCard } from './Card.jsx';
import { Table as BaseTable } from './Table.jsx';
import { StatusPill } from './StatusPill.jsx';
import { Avatar } from './Avatar.jsx';
import {
  Eye,
  X,
  Plus,
  Search,
  Download,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Building,
  CreditCard,
  AlertCircle
} from 'lucide-react';

/**
 * Enhanced Card supporting sub/subtext and right/action slots
 */
export function Card({
  title,
  sub,
  subtext,
  right,
  action,
  children,
  className = '',
  ...props
}) {
  return (
    <BaseCard
      title={title}
      subtext={sub || subtext}
      action={right || action}
      className={className}
      {...props}
    >
      {children}
    </BaseCard>
  );
}

/**
 * Universal Table component supporting both:
 * - cols={[...]} and rows={[[...], [...]]}
 * - columns={[...]} and data={[...]}
 */
export function Table({ cols, rows, columns, data, className = '', ...props }) {
  if (cols && rows) {
    return (
      <div className={`overflow-x-auto w-full -mx-1 px-1 ${className}`}>
        <table className="w-full text-left text-[13px] border-collapse min-w-[550px]">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted font-semibold">
              {cols.map((col, idx) => (
                <th key={idx} scope="col" className="py-2.5 px-3 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="py-8 text-center text-muted text-[13px]">
                  No records found.
                </td>
              </tr>
            ) : (
              rows.map((rowCells, rIdx) => (
                <tr
                  key={rIdx}
                  className="border-b border-dashed border-line/60 hover:bg-surface2/40 transition-colors"
                >
                  {rowCells.map((cell, cIdx) => (
                    <td key={cIdx} className="py-3 px-3 text-ink">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return <BaseTable columns={columns} data={data} className={className} {...props} />;
}

/**
 * Who: displays employee avatar, name, and subtitle
 */
export function Who({ n = '', s = '', className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      <Avatar name={n} size={28} />
      <div className="min-w-0 flex flex-col">
        <span className="font-medium text-white truncate text-xs sm:text-sm">{n}</span>
        {s && <span className="text-[11px] text-muted truncate">{s}</span>}
      </div>
    </div>
  );
}

/**
 * Pill: badge pill with status color mapping (good, warn, bad, info, etc.)
 */
export function Pill({ k, children, className = '' }) {
  return (
    <StatusPill status={k || 'muted'} label={children} className={className} />
  );
}

/**
 * Icon: Lucide icon key resolver
 */
export function Icon({ k, className = '', size = 16, ...props }) {
  const iconProps = { size, className, ...props };
  switch (k) {
    case 'eye':
      return <Eye {...iconProps} />;
    case 'close':
      return <X {...iconProps} />;
    case 'plus':
      return <Plus {...iconProps} />;
    case 'search':
      return <Search {...iconProps} />;
    case 'download':
      return <Download {...iconProps} />;
    case 'check':
      return <Check {...iconProps} />;
    case 'filter':
      return <Filter {...iconProps} />;
    case 'sort':
      return <ArrowUpDown {...iconProps} />;
    case 'bank':
      return <Building {...iconProps} />;
    case 'card':
      return <CreditCard {...iconProps} />;
    case 'alert':
      return <AlertCircle {...iconProps} />;
    default:
      return null;
  }
}

/**
 * Pagination control
 */
export function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 5,
  onPageChange
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  if (totalPages <= 1 && totalItems === 0) return null;

  return (
    <div className="flex items-center justify-between border-t border-line/40 pt-4 mt-4 px-1 text-xs text-muted flex-wrap gap-3">
      <div>
        Showing <span className="text-white font-medium">{start}</span> to{' '}
        <span className="text-white font-medium">{end}</span> of{' '}
        <span className="text-white font-medium">{totalItems}</span> entries
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange?.(currentPage - 1)}
          className="btn2 px-2.5 py-1 text-xs rounded border border-line disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface2 transition-colors flex items-center gap-1 text-ink"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
          <span>Prev</span>
        </button>

        <span className="px-2 py-1 text-xs font-semibold text-accent">
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange?.(currentPage + 1)}
          className="btn2 px-2.5 py-1 text-xs rounded border border-line disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface2 transition-colors flex items-center gap-1 text-ink"
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/**
 * Kpis: grid of interactive KPI cards
 */
export function Kpis({ items = [], onItemClick, className = '' }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 ${className}`}>
      {items.map((raw, idx) => {
        const isArr = Array.isArray(raw);
        const title = isArr ? raw[0] : raw?.title;
        const value = isArr ? raw[1] : raw?.value;
        const sub = isArr ? raw[2] : (raw?.sub || raw?.subtext);
        const active = isArr ? Boolean(raw[3]) : Boolean(raw?.active);

        const itemPayload = isArr
          ? Object.assign([...raw], { title, value, sub, active })
          : raw;

        const isInteractive = Boolean(onItemClick);

        return (
          <div
            key={title || idx}
            onClick={isInteractive ? () => onItemClick(itemPayload) : undefined}
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            onKeyDown={
              isInteractive
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onItemClick(itemPayload);
                    }
                  }
                : undefined
            }
            className={`glass-card p-2.5 sm:p-3 rounded-lg border transition-all duration-200 select-none flex flex-col justify-between ${
              active
                ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(97,216,196,0.15)] ring-1 ring-accent'
                : 'border-line/60 hover:border-line hover:bg-surface2/60'
            } ${isInteractive ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
          >
            <div className="text-[10px] uppercase tracking-wider text-muted font-semibold truncate mb-0.5">
              {title}
            </div>
            <div
              className={`font-display font-bold text-lg leading-tight truncate ${
                active ? 'text-accent' : 'text-white'
              }`}
            >
              {value}
            </div>
            {sub && (
              <div className="text-[10px] text-muted/80 truncate mt-0.5">
                {sub}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default {
  Card,
  Table,
  Who,
  Pill,
  Icon,
  Pagination,
  Kpis,
};
