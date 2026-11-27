import React, { useState, useEffect } from 'react';
import { Icon } from '../components/Icon.jsx';
import { LopOverview } from '../components/lop/LopOverview.jsx';
import { MarkLopForm } from '../components/lop/MarkLopForm.jsx';
import { LopRecordsTable } from '../components/lop/LopRecordsTable.jsx';
import { PendingApprovalsList } from '../components/lop/PendingApprovalsList.jsx';
import { LopHistoryTable } from '../components/lop/LopHistoryTable.jsx';
import { LopReports } from '../components/lop/LopReports.jsx';
import { getPendingLopCount, subscribeLop } from '../services/lopService.js';

export const LopView = ({ currentUser, onTriggerToast, setCurrentRoute }) => {
  // Read initial tab from URL query params or default to 'overview'
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (["overview", "mark", "records", "pending", "history", "reports"].includes(tab)) {
        return tab;
      }
    } catch (e) {}
    return "overview";
  });

  const [selectedMonth, setSelectedMonth] = useState("November 2026");
  const [pendingCount, setPendingCount] = useState(() => getPendingLopCount());

  // Listen to LOP updates in real time
  useEffect(() => {
    const unsub = subscribeLop(() => {
      setPendingCount(getPendingLopCount());
    });
    return () => unsub();
  }, []);

  // Sync tab with URL
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.pushState({}, "", url.toString());
    } catch (e) {}
  };

  const tabs = [
    { id: "overview", label: "LOP Overview", icon: "layout-dashboard" },
    { id: "mark", label: "Mark LOP", icon: "user-plus" },
    { id: "records", label: "LOP Records", icon: "file-text" },
    { id: "pending", label: "Pending Approvals", icon: "clock", badge: pendingCount > 0 ? pendingCount : null },
    { id: "history", label: "LOP History", icon: "clock" },
    { id: "reports", label: "LOP Reports", icon: "bar-chart-2" }
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="glass-card !p-5 border border-line flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted font-data mb-1">
            <span className="hover:text-ink cursor-pointer" onClick={() => setCurrentRoute?.("overview")}>Dashboard</span>
            <span>/</span>
            <span className="text-accent font-semibold">Loss of Pay (LOP) Management</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-display font-extrabold text-ink tracking-tight">
              Loss of Pay (LOP) Management
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 font-data">
              Manual Policy
            </span>
          </div>
          <p className="text-xs text-muted mt-1 max-w-xl">
            Controlled manual recording, approvals, and payroll deduction adjustments for Indian enterprise operations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <div className="px-3 py-1.5 rounded-xl bg-surface2 border border-line flex items-center gap-2 text-xs">
            <Icon name="shield" className="w-4 h-4 text-accent" />
            <span className="text-muted">HR Mode:</span>
            <strong className="text-ink">{currentUser?.name || "HR Lead"}</strong>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-line pb-px overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border-t border-l border-r ${
                isActive
                  ? "bg-surface2 text-accent border-line -mb-px border-b-surface2 shadow-sm"
                  : "text-muted hover:text-ink hover:bg-surface2/50 border-transparent"
              }`}
            >
              <Icon name={tab.icon} className={`w-3.5 h-3.5 ${isActive ? "text-accent" : "text-muted"}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="bg-accent2/25 text-accent2 border border-accent2/40 text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums font-num animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <div className="min-h-[450px]">
        {activeTab === "overview" && (
          <LopOverview
            currentUser={currentUser}
            onNavigateTab={handleTabChange}
            onTriggerToast={onTriggerToast}
            selectedMonth={selectedMonth}
            onChangeMonth={setSelectedMonth}
          />
        )}

        {activeTab === "mark" && (
          <MarkLopForm
            currentUser={currentUser}
            onTriggerToast={onTriggerToast}
            onSuccess={() => handleTabChange("records")}
            onCancel={() => handleTabChange("overview")}
          />
        )}

        {activeTab === "records" && (
          <LopRecordsTable
            currentUser={currentUser}
            onTriggerToast={onTriggerToast}
          />
        )}

        {activeTab === "pending" && (
          <PendingApprovalsList
            currentUser={currentUser}
            onTriggerToast={onTriggerToast}
          />
        )}

        {activeTab === "history" && (
          <LopHistoryTable
            onTriggerToast={onTriggerToast}
          />
        )}

        {activeTab === "reports" && (
          <LopReports
            onTriggerToast={onTriggerToast}
          />
        )}
      </div>
    </div>
  );
};
