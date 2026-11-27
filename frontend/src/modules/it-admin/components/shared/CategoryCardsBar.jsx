import React from 'react';

/**
 * CategoryCardsBar:
 * Horizontal cards/widgets bar displayed across the main view of dashboards.
 * Replaces left-rail sub-menus with prominent, populated category widgets.
 */
export function CategoryCardsBar({
  categories = [],
  activeCategory,
  onSelectCategory,
  columnsClass = ''
}) {
  if (!categories || categories.length === 0) return null;

  const defaultCols =
    categories.length === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : categories.length === 3
      ? 'grid-cols-1 sm:grid-cols-3'
      : categories.length === 4
      ? 'grid-cols-2 lg:grid-cols-4'
      : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';

  const getStatusBadgeClass = (statusColor) => {
    switch (statusColor) {
      case 'emerald':
      case 'good':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'sky':
      case 'info':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'amber':
      case 'warn':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'purple':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'red':
      case 'bad':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-surface2 border-line text-muted';
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Category Overview Widgets"
      className={`grid gap-3 w-full ${columnsClass || defaultCols}`}
    >
      {categories.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeCategory === cat.id;
        const titleText = cat.title || cat.label;
        const statusText = cat.status || cat.badge;
        const subtextContent = cat.subtext || cat.subText;

        return (
          <div
            key={cat.id}
            data-category-id={cat.id}
            role="button"
            tabIndex={0}
            aria-label={`${titleText} repository`}
            aria-pressed={isActive}
            onClick={() => onSelectCategory && onSelectCategory(cat.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectCategory && onSelectCategory(cat.id);
              }
            }}
            style={{
              backgroundColor: isActive ? 'rgba(110, 231, 208, 0.12)' : 'var(--surface)',
              backdropFilter: 'var(--blur)',
              WebkitBackdropFilter: 'var(--blur)',
              border: isActive ? '1px solid rgba(110, 231, 208, 0.45)' : 'var(--card-border)',
              boxShadow: isActive ? '0 8px 25px -4px rgba(110, 231, 208, 0.22)' : 'var(--card-shadow)',
              borderRadius: 'var(--radius)',
            }}
            className={`group p-3.5 transition-all text-left flex flex-col justify-between gap-2.5 cursor-pointer relative overflow-hidden select-none ${
              isActive
                ? 'ring-1 ring-accent/40 text-ink'
                : 'hover:border-line hover:bg-surface2'
            }`}
          >
            {/* Active Accent Top Indicator Line */}
            {isActive && (
              <span className="absolute top-0 left-0 right-0 h-[2.5px] bg-accent" />
            )}

            {/* Top row: Icon + Title + Status Badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {Icon && (
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-sky-500 text-white'
                        : 'bg-surface2 border border-line text-slate-300 group-hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className="text-[13px] font-bold text-ink truncate leading-tight">
                  {titleText}
                </span>
              </div>

              {statusText && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                    getStatusBadgeClass(cat.statusColor || cat.badgeColor)
                  }`}
                >
                  {statusText}
                </span>
              )}
            </div>

            {/* Value / Metric Row */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display font-bold text-[20px] text-ink leading-tight tabular-nums">
                  {cat.metric || cat.count || '0'}
                </span>
                {cat.metricLabel && (
                  <span className="text-[11px] text-muted font-medium truncate">
                    {cat.metricLabel}
                  </span>
                )}
              </div>
              {subtextContent && (
                <span className="text-[11px] text-muted mt-0.5 line-clamp-1">
                  {subtextContent}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
