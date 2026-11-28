import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const THEME_STORAGE_KEY = 'hrms_theme';
const SUPER_ADMIN_THEME_KEY = 'superAdminTheme';

const ThemeContext = createContext({
  theme: 'dark',
  isDark: true,
  isLight: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

function readStoredTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    const saSaved = localStorage.getItem(SUPER_ADMIN_THEME_KEY);
    if (saSaved === 'light') {
      return 'light';
    }
  } catch {
    // Ignore storage read errors
  }
  return 'dark';
}

export function applyThemeToDocument(theme) {
  const normalized = theme === 'light' ? 'light' : 'dark';
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.setAttribute('data-theme', normalized);
  if (normalized === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }

  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  if (metaColorScheme) {
    metaColorScheme.setAttribute('content', normalized);
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);

  const setTheme = useCallback((nextTheme) => {
    const resolved = typeof nextTheme === 'function' ? nextTheme(readStoredTheme()) : nextTheme;
    const normalized = resolved === 'light' ? 'light' : 'dark';
    setThemeState(normalized);
    applyThemeToDocument(normalized);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, normalized);
      localStorage.setItem(SUPER_ADMIN_THEME_KEY, normalized);
    } catch {
      // Ignore storage write errors
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  useEffect(() => {
    applyThemeToDocument(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage write errors
    }
  }, [theme]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === THEME_STORAGE_KEY && (event.newValue === 'light' || event.newValue === 'dark')) {
        setThemeState(event.newValue);
        applyThemeToDocument(event.newValue);
      } else if (event.key === SUPER_ADMIN_THEME_KEY && event.newValue) {
        const mapped = event.newValue === 'light' ? 'light' : 'dark';
        setThemeState(mapped);
        applyThemeToDocument(mapped);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      isLight: theme === 'light',
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
