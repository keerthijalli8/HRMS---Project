// src/components/Buttons.jsx
// Primary and secondary button primitives adhering to Monsoon Glass design tokens.

import React from 'react';

export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  size = 'md',
  ...props
}) {
  const sizeClasses = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-[13px]';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-tpl font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-accent bg-accent text-on-accent hover:brightness-105 shadow-sm ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  size = 'md',
  ...props
}) {
  const sizeClasses = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-[13px]';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-tpl font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-accent bg-surface2 text-ink border border-line hover:border-accent/60 hover:bg-surface2/80 ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default PrimaryButton;

