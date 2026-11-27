import React, { useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { DocumentManagementPage } from './DocumentManagementPage';
import { DatabaseStatusPage } from './DatabaseStatusPage';

const TAB_IDS = {
  documents: 'documents',
  databaseStatus: 'databaseStatus'
};

export function DocumentStorageDashboard() {
  const { activePage, navigate, hasPermission } = useStore();
  const tabRefs = useRef({});
  const canReadDocuments = hasPermission('Documents', 'read');
  const canReadDatabase = hasPermission('System Settings', 'read');
  const availableTabs = [
    ...(canReadDocuments ? [TAB_IDS.documents] : []),
    ...(canReadDatabase ? [TAB_IDS.databaseStatus] : []),
  ];
  const activeTab = availableTabs.includes(activePage)
    ? activePage
    : availableTabs[0];

  const selectTab = (tab) => {
    if (!availableTabs.includes(tab)) return;
    if (activePage !== tab) navigate(tab);
  };

  const handleTabKeyDown = (event) => {
    const tabs = availableTabs;
    if (tabs.length < 2) return;
    const currentIndex = tabs.indexOf(activeTab);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    selectTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  if (availableTabs.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-center">
        <h2 className="font-display font-bold text-[18px] text-ink">Document Storage Restricted</h2>
        <p className="mt-1 text-[13px] text-muted">Your role needs Documents: read or System Settings: read permission.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" id="document-storage-dashboard">
      <div
        role="tablist"
        aria-label="Document and storage views"
        aria-orientation="horizontal"
        className="inline-flex w-full sm:w-auto p-1.5 gap-1.5 rounded-2xl bg-surface border border-line shadow-card"
      >
        {canReadDocuments && <button
          ref={element => { tabRefs.current[TAB_IDS.documents] = element; }}
          type="button"
          role="tab"
          id="document-management-tab"
          aria-selected={activeTab === TAB_IDS.documents}
          aria-controls="document-management-panel"
          tabIndex={activeTab === TAB_IDS.documents ? 0 : -1}
          onClick={() => selectTab(TAB_IDS.documents)}
          onKeyDown={handleTabKeyDown}
          className={`flex-1 sm:flex-none px-5 py-3 rounded-xl font-semibold transition-colors ${
            activeTab === TAB_IDS.documents
              ? 'bg-accent text-on-accent shadow-sm'
              : 'text-muted hover:text-ink hover:bg-surface2'
          }`}
        >
          Document Management
        </button>}
        {canReadDatabase && <button
          ref={element => { tabRefs.current[TAB_IDS.databaseStatus] = element; }}
          type="button"
          role="tab"
          id="database-status-tab"
          aria-selected={activeTab === TAB_IDS.databaseStatus}
          aria-controls="database-status-panel"
          tabIndex={activeTab === TAB_IDS.databaseStatus ? 0 : -1}
          onClick={() => selectTab(TAB_IDS.databaseStatus)}
          onKeyDown={handleTabKeyDown}
          className={`flex-1 sm:flex-none px-5 py-3 rounded-xl font-semibold transition-colors ${
            activeTab === TAB_IDS.databaseStatus
              ? 'bg-accent text-on-accent shadow-sm'
              : 'text-muted hover:text-ink hover:bg-surface2'
          }`}
        >
          Database Status
        </button>}
      </div>

      <section
        role="tabpanel"
        id="document-management-panel"
        aria-labelledby="document-management-tab"
        tabIndex={0}
        hidden={activeTab !== TAB_IDS.documents}
      >
        {activeTab === TAB_IDS.documents && <DocumentManagementPage />}
      </section>

      <section
        role="tabpanel"
        id="database-status-panel"
        aria-labelledby="database-status-tab"
        tabIndex={0}
        hidden={activeTab !== TAB_IDS.databaseStatus}
      >
        {activeTab === TAB_IDS.databaseStatus && <DatabaseStatusPage />}
      </section>
    </div>
  );
}
