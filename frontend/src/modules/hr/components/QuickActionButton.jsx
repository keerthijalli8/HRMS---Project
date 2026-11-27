import React from 'react';
import { Icon } from './Icon.jsx';

/**
 * Shared QuickActionButton component for Dashboard and quick navigation rows.
 * Implements Monsoon Glass subtle translucent styling.
 * 
 * Shared style rules:
 * - Background: translucent rgba(255,255,255,0.05)
 * - Border: 1px subtle border rgba(255,255,255,0.12)
 * - Soft text color: var(--ink) / text-ink
 * - Same height, padding, radius and icon size
 * - Hover: slightly lighter background (rgba(255,255,255,0.09)) and teal border/text (var(--accent)) with smooth transition
 * - Focus: visible focus ring (focus-visible:ring-2 ring-accent)
 * - Active / pressed: slightly darker (active:bg-white/[0.03] active:scale-[0.98])
 * - Active route state: faint teal background (bg-accent/10) with teal border/text (border-accent/50 text-accent), never a solid bright fill
 */
export const QuickActionButton = ({
  children,
  onClick,
  icon,
  isActive = false,
  className = "",
  type = "button",
  title,
  ariaLabel,
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-current={isActive ? "page" : undefined}
      className={`group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[13px] font-medium transition-all duration-150 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg active:scale-[0.98] ${
        isActive
          ? "bg-accent/10 border border-accent/50 text-accent font-semibold shadow-sm"
          : "bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.12] hover:border-accent text-ink hover:text-accent active:bg-white/[0.03]"
      } ${className}`}
      {...props}
    >
      {icon && (
        <Icon
          name={icon}
          className={`w-3.5 h-3.5 shrink-0 transition-colors duration-150 ${
            isActive ? "text-accent" : "text-muted group-hover:text-accent"
          }`}
        />
      )}
      <span className="truncate">{children}</span>
    </button>
  );
};

export default QuickActionButton;
