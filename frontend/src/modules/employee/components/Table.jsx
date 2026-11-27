// src/components/Table.jsx
// Accessible table component with 12px muted uppercase header and dashed row separators.

import React from 'react';

export function Table({
  columns = [],
  data = [],
  keyField = 'id',
  emptyMessage = 'No records found.',
  className = ''
}) {
  return (
    <div className={`overflow-x-auto -mx-1 px-1 ${className}`}>
      <table className="w-full text-left text-[13px] border-collapse min-w-[550px]">
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted font-semibold">
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                scope="col"
                className={`py-2.5 px-3 ${col.className || ''} ${idx === 0 ? 'sticky left-0 bg-surface/90 backdrop-blur-sm z-10' : ''}`}
                style={col.style}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 text-center text-muted text-[13px]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row[keyField] || rowIdx}
                className="border-b border-dashed border-line/60 hover:bg-surface2/40 transition-colors"
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={col.key || colIdx}
                    className={`py-3 px-3 text-ink ${col.className || ''} ${colIdx === 0 ? 'sticky left-0 bg-surface/90 backdrop-blur-sm font-medium' : ''}`}
                  >
                    {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
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

export default Table;

