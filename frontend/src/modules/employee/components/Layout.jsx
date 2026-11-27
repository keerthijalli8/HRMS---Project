// src/modules/employee/components/Layout.jsx
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Rail } from './Rail.jsx';
import { Header } from './Header.jsx';
import { settingsService } from '../services/settingsService.js';
import '../styles/employee.css';

export function Layout({ children, title }) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    try {
      const initialSettings = settingsService.getSettings();
      if (initialSettings?.density) {
        settingsService.applyDensity(initialSettings.density);
      }
    } catch (e) {
      console.warn('Failed to initialize employee density settings', e);
    }
  }, []);

  return (
    <div className="mod-employee min-h-screen max-w-[1640px] mx-auto px-4 sm:px-6">
      <div className="flex flex-col md:grid md:grid-cols-[var(--rail)_minmax(0,1fr)] md:gap-6">
        <Rail />

        <main className="flex-1 min-w-0 py-2 pb-12">
          <Header title={title} />
          <div className="mt-2">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
