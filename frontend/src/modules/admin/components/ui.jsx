import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from "lucide-react";

export function Card({ id, title, sub, children }) {
  return (
    <section id={id} className="card">
      {(title || sub) && (
        <header className="card-heading">
          <div>
            {title && <h2>{title}</h2>}
            {sub && <p>{sub}</p>}
          </div>
        </header>
      )}
      {children}
    </section>
  );
}

export function Kpis({ items = [], onItemClick }) {
  return (
    <div className="kpis">
      {items.map((item, index) => {
        const [title, value, detail, active = false] = item;
        const data = { title, value, detail, active };
        return (
          <button
            key={title || index}
            type="button"
            className={`kpi-card${active ? " is-active" : ""}`}
            onClick={() => onItemClick?.(data)}
            aria-pressed={active}
          >
            <span>{title}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
          </button>
        );
      })}
    </div>
  );
}

export function Table({ cols, rows }) {
  return (
    <table className="table">
      <thead>
        <tr>{cols.map((column) => <th key={column}>{column}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Who({ n, s }) {
  return (
    <div className="who">
      <strong>{n}</strong>
      <small>{s}</small>
    </div>
  );
}

export function Pill({ k = "good", children }) {
  return <span className={`pill pill-${k}`}>{children}</span>;
}

export function Icon({ k }) {
  const icons = { close: X, eye: Eye, check: Check };
  const Component = icons[k] || Check;
  return <Component size={16} aria-hidden="true" />;
}

export function Pagination({ currentPage, totalItems, pageSize, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return (
    <div className="pagination">
      <button type="button" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} aria-label="Previous page">
        <ChevronLeft size={16} />
      </button>
      <span>Page {currentPage} of {totalPages}</span>
      <button type="button" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} aria-label="Next page">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
