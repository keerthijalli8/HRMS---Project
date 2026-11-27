// src/components/layout/Layout.jsx
// Desktop >=768px/900px grid [236px | minmax(0,1fr)], max-width 1640px, centered.
// Below breakpoint rail becomes horizontal scrollable bar.

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Rail } from './Rail.jsx';
import { Header } from './Header.jsx';

export function Layout({ children, title }) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen max-w-[1640px] mx-auto px-4 sm:px-6">
      {/* Shell Grid: [236px | minmax(0,1fr)] */}
      <div className="flex flex-col md:grid md:grid-cols-[var(--rail)_minmax(0,1fr)] md:gap-6">
        <Rail />

        <main className="flex-1 min-w-0 py-2 pb-12 flex flex-col justify-between">
          <div>
            <Header title={title} />
            <div className="mt-2">{children}</div>
          </div>

          <footer className="mt-12 pt-6 border-t border-line/30 flex items-center justify-between text-[12px] text-muted flex-wrap gap-2">
            <span>
              Technomold IT Solutions Pvt Ltd · HRMS Portal
            </span>
            <span className="font-mono text-[11px] text-muted/70">
              Secure Session Active
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default Layout;

