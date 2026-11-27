import React from 'react';
import { Icon } from '../Icon.jsx';

export const TeamBreadcrumbs = ({
  items = [],
  onNavigate,
  showMainTlShortcut = false,
  onGoToMainTl = null
}) => {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If items already starts with "Teams", strip the root or don't double render
  const startsWithTeams = items.length > 0 && items[0]?.label?.toLowerCase() === "teams";
  const displayItems = startsWithTeams ? items.slice(1) : items;

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-1.5 min-w-0">
        <li>
          <button
            type="button"
            onClick={() => onNavigate ? onNavigate("/hr/teams") : (window.location.href = "/hr/teams")}
            className="hover:text-ink transition cursor-pointer flex items-center gap-1 font-medium"
          >
            <Icon name="users" className="w-3.5 h-3.5 text-inherit" />
            <span>Teams</span>
          </button>
        </li>

        {displayItems.map((item, idx) => {
          const isLast = idx === displayItems.length - 1;
          const targetUrl = item.route || item.href;
          const isCurrent = isLast || item.current || !targetUrl;

          return (
            <React.Fragment key={item.label + idx}>
              <li aria-hidden="true" className="text-muted/60 select-none">&gt;</li>
              <li>
                {isCurrent ? (
                  <span className="text-accent font-bold truncate max-w-[180px] sm:max-w-[260px] inline-block align-bottom" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigate) onNavigate(targetUrl);
                      else window.location.href = targetUrl;
                    }}
                    className="hover:text-ink transition cursor-pointer font-medium truncate max-w-[140px] sm:max-w-[200px]"
                  >
                    {item.label}
                  </button>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>

      {/* Helpful Quick Navigation Shortcuts */}
      <div className="flex items-center gap-2 shrink-0">
        {showMainTlShortcut && onGoToMainTl && (
          <button
            type="button"
            onClick={onGoToMainTl}
            title="Jump directly to Main TL view"
            className="px-2 py-0.5 rounded-lg bg-surface2/60 border border-line text-[11px] font-semibold text-muted hover:text-accent hover:border-accent/40 transition cursor-pointer flex items-center gap-1"
          >
            <Icon name="shield" className="w-3 h-3 text-accent" />
            <span>Main TL</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleScrollToTop}
          title="Scroll to top of page"
          className="px-2 py-0.5 rounded-lg bg-surface2/60 border border-line text-[11px] font-semibold text-muted hover:text-ink transition cursor-pointer flex items-center gap-1"
        >
          <span>Top &uarr;</span>
        </button>
      </div>
    </nav>
  );
};

export default TeamBreadcrumbs;
