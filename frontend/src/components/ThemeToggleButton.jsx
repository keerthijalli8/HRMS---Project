import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

/**
 * Shared Theme Toggle Button matching the Login page pill control.
 * Switches between dark and light themes globally across all dashboards.
 */
export function ThemeToggleButton({ className = '', showStateHint = false }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={!isDark}
      className={`bg-surface backdrop-blur-md border border-line text-ink text-[12.5px] font-semibold px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 hover:border-accent hover:bg-surface2 transition-all focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer select-none ${className}`}
    >
      {isDark ? (
        <>
          <Moon className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>{showStateHint ? 'Dark (Switch to Light)' : 'Dark'}</span>
        </>
      ) : (
        <>
          <Sun className="w-3.5 h-3.5 text-warn shrink-0" />
          <span>{showStateHint ? 'Light (Switch to Dark)' : 'Light'}</span>
        </>
      )}
    </button>
  );
}

export default ThemeToggleButton;
