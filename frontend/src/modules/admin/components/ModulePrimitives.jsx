import { ArrowUpRight } from "lucide-react";

export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="module-page-header d-flex flex-wrap">
      <div>
        <span className="module-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}

export function MetricCard({ label, value, detail, icon: Icon, tone = "mint", onClick, active = false }) {
  const Element = onClick ? "button" : "article";
  return (
    <Element
      className={`module-metric-card h-100 tone-${tone}${onClick ? " module-metric-card-clickable" : ""}${active ? " module-metric-card-active" : ""}`}
      onClick={onClick}
      type={onClick ? "button" : undefined}
      aria-pressed={onClick ? active : undefined}
    >
      <div className="module-metric-heading">
        <span>{label}</span>
        {Icon && <span className="module-metric-icon"><Icon size={18} aria-hidden="true" /></span>}
      </div>
      <strong>{value}</strong>
      <small><ArrowUpRight size={13} aria-hidden="true" />{detail}</small>
    </Element>
  );
}

export function SectionCard({ title, description, action, children, className = "" }) {
  return (
    <section className={`module-card w-100 ${className}`}>
      {(title || action) && (
        <div className="module-card-heading">
          <div>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatusBadge({ children, tone }) {
  const normalized = tone || String(children).toLowerCase().replaceAll(" ", "-");
  return <span className={`module-badge badge-${normalized}`}>{children}</span>;
}
