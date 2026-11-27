import React from 'react';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'danger'
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  ariaLabel,
  ariaPressed,
  className = '',
  icon: Icon
}) {
  const baseClasses = "inline-flex items-center justify-center gap-1.5 font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none focus-visible:outline-accent";
  
  // Primary button: accent bg, on-accent text, radius var(--radius), 14px/600, padding 8px 16px.
  // Secondary button: surface2 bg, 1px line border, hover border accent.
  let variantClasses = "";
  let customStyle = {
    borderRadius: 'var(--radius)'
  };

  if (variant === 'primary') {
    variantClasses = "bg-accent text-on-accent font-semibold text-[14px] px-4 py-2 hover:opacity-90 active:scale-[0.98]";
  } else if (variant === 'secondary') {
    variantClasses = "bg-surface2 text-ink border border-line text-[14px] px-4 py-2 hover:border-accent";
  } else if (variant === 'danger') {
    variantClasses = "bg-bad/20 text-bad border border-bad/40 text-[14px] px-4 py-2 hover:bg-bad/30";
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      style={customStyle}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
}
