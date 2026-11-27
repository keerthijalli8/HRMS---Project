import React from 'react';
import { Icon } from './Icon.jsx';

// Primary & Secondary Buttons matching Monsoon Glass system
export const PrimaryButton = ({ children, onClick, icon, className = "" }) => (
  <button 
    onClick={onClick}
    className={`bg-accent text-on-accent rounded-[var(--radius)] text-[13px] font-semibold px-3 py-1.5 inline-flex items-center gap-1.5 hover:brightness-105 active:scale-[0.98] transition shadow-sm ${className}`}
  >
    {icon && <Icon name={icon} className="w-3.5 h-3.5 text-on-accent" />}
    {children}
  </button>
);

export const SecondaryButton = ({ children, onClick, icon, className = "" }) => (
  <button 
    onClick={onClick}
    className={`bg-surface2 border border-line rounded-[var(--radius)] text-[13px] text-ink font-medium px-3 py-1.5 inline-flex items-center gap-1.5 hover:border-accent active:scale-[0.98] transition ${className}`}
  >
    {icon && <Icon name={icon} className="w-3.5 h-3.5 text-muted" />}
    {children}
  </button>
);

export { QuickActionButton } from './QuickActionButton.jsx';
