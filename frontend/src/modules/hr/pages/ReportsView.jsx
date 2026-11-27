import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon.jsx';
import { KPITile } from '../components/KPITile.jsx';
import { PrimaryButton, SecondaryButton } from '../components/Buttons.jsx';
import { ReportCategorySelector } from '../components/reports/ReportCategorySelector.jsx';
import { ReportFilterBar } from '../components/reports/ReportFilterBar.jsx';
import { ReportChartsSection } from '../components/reports/ReportChartsSection.jsx';
import { ReportDataTable } from '../components/reports/ReportDataTable.jsx';
import { CustomReportBuilder } from '../components/reports/CustomReportBuilder.jsx';
import {
  fetchReportData,
  getUserRoleLevel,
  REPORT_CATEGORIES
} from '../data/reportsData.js';

export const ReportsView = ({ currentUser, onTriggerToast }) => {
  const userRole = getUserRoleLevel(currentUser);

  // Active Category state
  const [activeCategory, setActiveCategory] = useState("employee");

  // Filter Engine state
  const [filters, setFilters] = useState({
    category: "employee",
    datePreset: "this_month",
    startDate: "2026-11-01",
    endDate: "2026-11-30",
    dept: "All",
    status: "All",
    search: ""
  });

  const [isGenerating, setIsGenerating] = useState(false);

  // Handle Category selection from selector cards
  const handleSelectCategory = (categoryId) => {
    setActiveCategory(categoryId);
    setFilters(prev => ({ ...prev, category: categoryId }));
  };

  // Handle individual filter changes
  const handleChangeFilter = (key, value) => {
    if (key === "category") {
      setActiveCategory(value);
      setFilters(prev => ({ ...prev, category: value }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  // Handle "Generate Report" click
  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      if (onTriggerToast) {
        const catObj = REPORT_CATEGORIES.find(c => c.id === activeCategory);
        onTriggerToast(`Generated live ${catObj ? catObj.label : 'report'} successfully.`);
      }
    }, 450);
  };

  // Reset Filters to default
  const handleResetFilters = () => {
    setFilters({
      category: activeCategory,
      datePreset: "this_month",
      startDate: "2026-11-01",
      endDate: "2026-11-30",
      dept: "All",
      status: "All",
      search: ""
    });
    if (onTriggerToast) onTriggerToast("Filters reset to default.");
  };

  // Fetch report data based on current state & user role
  const reportData = useMemo(() => {
    return fetchReportData(activeCategory, currentUser, filters);
  }, [activeCategory, currentUser, filters]);

  // Export Table Data to Excel (CSV)
  const handleExportExcel = () => {
    if (!reportData || !reportData.table || reportData.table.length === 0) {
      if (onTriggerToast) onTriggerToast("No data available to export.");
      return;
    }

    const rows = reportData.table;
    const keys = Object.keys(rows[0]);
    const headers = keys.map(k => `"${k.toUpperCase()}"`).join(",");
    const csvRows = rows.map(r => {
      return keys.map(k => {
        const val = r[k];
        return `"${val != null ? String(val).replace(/"/g, '""') : ''}"`;
      }).join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...csvRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeCategory}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onTriggerToast) onTriggerToast(`Exported ${activeCategory.toUpperCase()} Report to Excel (CSV)`);
  };

  // Export PDF / Print Report
  const handleExportPDF = () => {
    if (onTriggerToast) onTriggerToast("Opening browser print dialog for PDF export...");
    window.print();
  };

  return (
    <div id="printable-reports-view" className="flex flex-col gap-4">
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-reports-view, #printable-reports-view * {
            visibility: visible;
          }
          #printable-reports-view {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .no-print {
            display: none !important;
          }
          .glass-card {
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            background: #f8fafc !important;
            color: #0f172a !important;
          }
        }
      `}</style>

      {/* 1. TOP HEADER & EXPORT ACTIONS BAR */}
      <div className="glass-card !p-4 border border-line">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold">
              <Icon name="bar-chart-2" className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-ink text-base md:text-lg">
                  Reports & Workforce Analytics
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent/10 text-accent border border-accent/20">
                  Live Monsoon Glass Engine
                </span>
              </div>
              <p className="text-[12px] text-muted">
                Centralized organizational intelligence, statutory compliance, and executive dashboards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-3 py-1.5 rounded-[var(--radius)] bg-surface2 border border-line text-xs font-semibold text-ink hover:border-accent transition flex items-center gap-1.5 shadow-sm"
              title="Print or Save as PDF"
            >
              <Icon name="printer" className="w-3.5 h-3.5 text-accent" />
              <span>Print / PDF</span>
            </button>
            <SecondaryButton icon="download" onClick={handleExportPDF}>
              Export PDF
            </SecondaryButton>
            <PrimaryButton icon="file-text" onClick={handleExportExcel}>
              Export Excel
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* 2. ROLE-BASED SCOPE NOTICE */}
      <div className="rounded-xl border border-line bg-surface2/40 px-3.5 py-2.5 flex items-center justify-between text-xs no-print">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${userRole === "hr" ? "bg-good animate-pulse" : userRole === "manager" ? "bg-accent" : "bg-warn"}`} />
          <span className="text-muted font-medium">Access Scope:</span>
          <span className="font-semibold text-ink uppercase tracking-wider text-[11px]">
            {userRole === "hr" ? "Pan-Organization (HR Admin)" : userRole === "manager" ? `Department Lead (${currentUser?.dept || "Engineering"})` : `Individual (${currentUser?.name || "Employee"})`}
          </span>
          <span className="text-muted hidden sm:inline">—</span>
          <span className="text-muted hidden sm:inline text-[11.5px]">
            {userRole === "hr"
              ? "Full enterprise statutory compliance, executive compensation, and pan-company analytics."
              : userRole === "manager"
              ? `Displaying team analytics for ${currentUser?.dept || "Engineering"} department.`
              : `Displaying your individual performance scorecard, shifts, and leaves.`}
          </span>
        </div>
        <div className="text-[11px] text-muted font-data hidden md:block">
          FY27 • Q3 Pipeline
        </div>
      </div>

      {/* 3. REPORT CATEGORY SELECTOR CARDS */}
      <div className="no-print">
        <ReportCategorySelector
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
        />
      </div>

      {/* 4. DYNAMIC FILTER BAR */}
      <div className="no-print">
        <ReportFilterBar
          filters={filters}
          onChangeFilter={handleChangeFilter}
          onGenerateReport={handleGenerateReport}
          onResetFilters={handleResetFilters}
          isGenerating={isGenerating}
        />
      </div>

      {/* 5. SUMMARY KPI TILES (Category Specific) */}
      {reportData && reportData.kpis && reportData.kpis.length > 0 && activeCategory !== "custom" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {reportData.kpis.map((kpi, idx) => (
            <KPITile
              key={idx}
              metric={kpi.value}
              label={kpi.label}
              icon={kpi.icon}
              trend={kpi.trend}
              hideSuffix={true}
            />
          ))}
        </div>
      )}

      {/* 6. MAIN CONTENT AREA: CHARTS + DETAILED TABLES OR CUSTOM BUILDER */}
      {activeCategory === "custom" ? (
        <CustomReportBuilder
          currentUser={currentUser}
          onTriggerToast={onTriggerToast}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Dynamic Recharts Visualizations */}
          <ReportChartsSection
            category={activeCategory}
            data={reportData}
          />

          {/* Dynamic Filterable & Sortable Data Table */}
          <ReportDataTable
            category={activeCategory}
            tableData={reportData?.table || []}
            onTriggerToast={onTriggerToast}
          />
        </div>
      )}
    </div>
  );
};
