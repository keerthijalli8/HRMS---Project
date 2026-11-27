import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from './Icon.jsx';
import { KPITile } from './KPITile.jsx';
import { PrimaryButton, SecondaryButton } from './Buttons.jsx';
import { Select } from './Select.jsx';
import { formatDate } from '../utils/format.js';
import { AddHolidayModal } from './holidays/AddHolidayModal.jsx';
import { HolidayDetailModal } from './holidays/HolidayDetailModal.jsx';
import { DeleteHolidayConfirmModal } from './holidays/DeleteHolidayConfirmModal.jsx';
import { ImportHolidaysModal } from './holidays/ImportHolidaysModal.jsx';
import {
  loadHolidays,
  subscribeHolidays,
  getFilteredHolidays,
  deleteHoliday,
  exportHolidaysToCSV,
  HOLIDAY_TYPES,
  APPLICABLE_LOCATIONS
} from '../services/holidayStore.js';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const HolidayCalendarPanel = ({ currentUser, onTriggerToast }) => {
  // Role checking
  const isHrOrAdmin = useMemo(() => {
    if (!currentUser) return true;
    const sys = (currentUser.systemRole || currentUser.role || "").toLowerCase();
    return sys === "hr" || sys === "hr manager" || sys.includes("hr") || sys.includes("admin");
  }, [currentUser]);

  // Selected Year & Month state (Supports 2026 & 2027)
  const [selectedYear, setSelectedYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(11); // 1-indexed, default Nov (11)
  const [activeView, setActiveView] = useState("monthly"); // "monthly" | "yearly" | "list"

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("All");
  const [filterLocation, setFilterLocation] = useState("All");
  const [filterType, setFilterType] = useState("All");

  // Live Holiday Data
  const [allHolidays, setAllHolidays] = useState(() => loadHolidays());

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [viewingHoliday, setViewingHoliday] = useState(null);
  const [deletingHoliday, setDeletingHoliday] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Sync with store updates
  useEffect(() => {
    const unsubscribe = subscribeHolidays((updatedList) => {
      setAllHolidays(updatedList);
    });
    return unsubscribe;
  }, []);

  // Today ISO Date string in Asia/Kolkata
  const todayIso = useMemo(() => {
    try {
      return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    } catch (e) {
      return "2026-11-10";
    }
  }, []);

  // Filtered Holidays for Selected Year
  const yearHolidays = useMemo(() => {
    return allHolidays.filter(h => Number(h.year) === Number(selectedYear));
  }, [allHolidays, selectedYear]);

  // Comprehensive Filtered Holidays for List/Calendar
  const displayedHolidays = useMemo(() => {
    return getFilteredHolidays({
      year: selectedYear,
      month: filterMonth,
      state: filterLocation,
      type: filterType,
      search: searchQuery
    });
  }, [allHolidays, selectedYear, filterMonth, filterLocation, filterType, searchQuery]);

  // Dashboard KPI Metrics
  const kpiStats = useMemo(() => {
    const total = yearHolidays.length;
    const upcoming = yearHolidays.filter(h => h.date >= todayIso && h.status === "Active").length;
    const optional = yearHolidays.filter(h => h.isOptional).length;

    const currentMonthNum = parseInt(todayIso.split("-")[1], 10);
    const thisMonthCount = yearHolidays.filter(h => {
      const m = parseInt(h.date.split("-")[1], 10);
      return m === currentMonthNum && h.status === "Active";
    }).length;

    return { total, upcoming, optional, thisMonthCount };
  }, [yearHolidays, todayIso]);

  // Type Color Mapping for Badges
  const getTypeBadge = (type) => {
    switch (type) {
      case "National":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "Festival":
        return "bg-purple-500/20 text-purple-400 border-purple-500/40";
      case "Regional":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40";
      case "Optional":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
      case "Company":
        return "bg-blue-500/20 text-blue-400 border-blue-500/40";
      default:
        return "bg-surface2 text-ink border-line";
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (displayedHolidays.length === 0) {
      onTriggerToast?.("No holidays to export for current criteria.");
      return;
    }
    const csvContent = exportHolidaysToCSV(displayedHolidays);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `holidays_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onTriggerToast?.(`Exported ${displayedHolidays.length} holidays to CSV`);
  };

  const handlePrintPDF = () => {
    onTriggerToast?.("Opening print preview for Holiday Calendar...");
    window.print();
  };

  const handleConfirmDelete = (id) => {
    const success = deleteHoliday(id);
    if (success) {
      onTriggerToast?.("Holiday removed from enterprise schedule.");
      setDeletingHoliday(null);
    }
  };

  return (
    <div className="flex flex-col gap-4" id="printable-holiday-calendar">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-holiday-calendar, #printable-holiday-calendar * { visibility: visible; }
          #printable-holiday-calendar { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* 1. HEADER & ACTIONS BAR */}
      <div className="glass-card !p-4 border border-line">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold">
              <Icon name="calendar" className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-ink text-base sm:text-lg">
                  Holiday Calendar & Observances
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent/10 text-accent border border-accent/20">
                  {selectedYear} Schedule
                </span>
              </div>
              <p className="text-[12px] text-muted">
                Statutory national, cultural festivals, and regional gazetted holidays for India IT hubs (Hyderabad & Telangana)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            {/* Year Selector - 2026 & 2027 Supported */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted font-semibold uppercase text-[10.5px]">Year:</span>
              <Select
                size="sm"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(Number(e.target.value));
                  setCalendarMonth(1);
                }}
                className="w-24"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2028}>2028</option>
              </Select>
            </div>

            <SecondaryButton icon="download" onClick={handleExportCSV}>
              Export CSV
            </SecondaryButton>
            <button
              type="button"
              onClick={handlePrintPDF}
              className="px-3 py-1.5 rounded-[var(--radius)] bg-surface2 border border-line text-xs font-semibold text-ink hover:border-accent transition flex items-center gap-1.5 shadow-sm"
              title="Print Holiday Calendar"
            >
              <Icon name="printer" className="w-3.5 h-3.5 text-accent" />
              <span>Print / PDF</span>
            </button>

            {isHrOrAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-3 py-1.5 rounded-[var(--radius)] bg-surface2 border border-line text-xs font-semibold text-ink hover:border-accent transition flex items-center gap-1.5"
                >
                  <Icon name="upload" className="w-3.5 h-3.5 text-accent" />
                  <span>Import</span>
                </button>
                <PrimaryButton icon="user-plus" onClick={() => { setEditingHoliday(null); setIsAddModalOpen(true); }}>
                  + Add Holiday
                </PrimaryButton>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. DASHBOARD KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPITile
          metric={kpiStats.total}
          label={`Total Holidays (${selectedYear})`}
          icon="calendar"
          trend="Statutory Roster"
        />
        <KPITile
          metric={kpiStats.upcoming}
          label="Upcoming Holidays"
          icon="trending-up"
          trend="Balance of Year"
        />
        <KPITile
          metric={kpiStats.optional}
          label="Restricted / Optional"
          icon="check-circle"
          trend="Floating Allowance"
        />
        <KPITile
          metric={kpiStats.thisMonthCount}
          label="This Month Count"
          icon="clock"
          trend="Scheduled Days Off"
        />
      </div>

      {/* 3. CONTROLS & VIEW SWITCHER */}
      <div className="glass-card !p-3 border border-line no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-surface2 p-1 rounded-lg border border-line text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveView("monthly")}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 font-semibold ${
                activeView === "monthly" ? "bg-accent text-on-accent shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              <Icon name="calendar" className="w-3.5 h-3.5" />
              <span>Monthly Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("yearly")}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 font-semibold ${
                activeView === "yearly" ? "bg-accent text-on-accent shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              <Icon name="columns" className="w-3.5 h-3.5" />
              <span>Year View</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("list")}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 font-semibold ${
                activeView === "list" ? "bg-accent text-on-accent shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              <Icon name="list" className="w-3.5 h-3.5" />
              <span>Master List ({displayedHolidays.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[170px]">
              <Icon name="search" className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search holiday..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface2 border border-line rounded-lg text-xs text-ink pl-8 pr-3 py-1.5 outline-none focus:border-accent"
              />
            </div>

            <Select
              size="sm"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-36"
            >
              <option value="All">All Types</option>
              {HOLIDAY_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>

            <Select
              size="sm"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-40"
            >
              <option value="All">All Locations</option>
              {APPLICABLE_LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* 4. MAIN VIEWS */}
      {activeView === "monthly" && (
        <div className="glass-card !p-4 border border-line flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCalendarMonth(prev => Math.max(1, prev - 1))}
                disabled={calendarMonth <= 1}
                className="p-1.5 rounded-lg border border-line bg-surface2 text-muted hover:text-ink disabled:opacity-30"
              >
                <Icon name="chevron-left" className="w-4 h-4" />
              </button>
              <h2 className="font-display font-bold text-ink text-base">
                {MONTH_NAMES[calendarMonth - 1]} <span className="font-num">{selectedYear}</span>
              </h2>
              <button
                type="button"
                onClick={() => setCalendarMonth(prev => Math.min(12, prev + 1))}
                disabled={calendarMonth >= 12}
                className="p-1.5 rounded-lg border border-line bg-surface2 text-muted hover:text-ink disabled:opacity-30"
              >
                <Icon name="chevron-right" className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-semibold text-muted">
              {MONTH_NAMES.map((name, idx) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCalendarMonth(idx + 1)}
                  className={`px-2 py-0.5 rounded transition ${
                    calendarMonth === idx + 1 ? "bg-accent text-on-accent" : "hover:text-ink hover:bg-surface2"
                  }`}
                >
                  {name.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center font-bold text-muted text-xs uppercase py-1 border-b border-line">
                {d}
              </div>
            ))}

            {(() => {
              const firstDayOfWeek = new Date(selectedYear, calendarMonth - 1, 1).getDay();
              const daysInMonth = new Date(selectedYear, calendarMonth, 0).getDate();
              const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
              const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

              return (
                <>
                  {blanks.map(b => (
                    <div key={`blank-${b}`} className="min-h-[85px] rounded-xl bg-surface2/20 border border-line/40 opacity-40" />
                  ))}

                  {days.map(d => {
                    const monthPadded = String(calendarMonth).padStart(2, '0');
                    const dayPadded = String(d).padStart(2, '0');
                    const dateStr = `${selectedYear}-${monthPadded}-${dayPadded}`;
                    const holidaysOnDay = yearHolidays.filter(h => h.date === dateStr);
                    const isToday = dateStr === todayIso;
                    const dayOfWeekNum = new Date(selectedYear, calendarMonth - 1, d).getDay();
                    const isWeekend = dayOfWeekNum === 0 || dayOfWeekNum === 6;

                    return (
                      <div
                        key={d}
                        className={`min-h-[85px] rounded-xl p-2 border flex flex-col justify-between transition ${
                          isToday
                            ? "border-accent bg-accent/5 ring-1 ring-accent"
                            : holidaysOnDay.length > 0
                            ? "border-purple-500/40 bg-purple-500/10"
                            : isWeekend
                            ? "border-line/60 bg-surface2/30"
                            : "border-line bg-surface"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold font-data ${isToday ? "text-accent font-extrabold" : "text-ink"}`}>
                            {d}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1 mt-1">
                          {holidaysOnDay.map(h => (
                            <button
                              key={h.id}
                              type="button"
                              onClick={() => setViewingHoliday(h)}
                              className="text-left p-1 rounded-md bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-[11px] font-semibold text-purple-200 truncate transition"
                            >
                              <div className="truncate">{h.name}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {activeView === "yearly" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {MONTH_NAMES.map((mName, mIdx) => {
            const mNum = mIdx + 1;
            const mHolidays = yearHolidays.filter(h => parseInt(h.date.split("-")[1], 10) === mNum);

            return (
              <div key={mName} className="glass-card !p-3 border border-line flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-line">
                    <span className="font-display font-bold text-ink text-sm">{mName}</span>
                    <span className="text-xs font-bold text-accent px-1.5 py-0.5 rounded bg-accent/10">
                      {mHolidays.length} Days
                    </span>
                  </div>

                  {mHolidays.length === 0 ? (
                    <div className="py-4 text-center text-muted text-xs italic">No holidays</div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {mHolidays.map(h => (
                        <div
                          key={h.id}
                          onClick={() => setViewingHoliday(h)}
                          className="p-1.5 rounded-lg bg-surface2/60 border border-line/60 hover:border-accent cursor-pointer transition flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="truncate">
                            <div className="font-semibold text-ink text-xs truncate">{h.name}</div>
                            <div className="text-[10px] text-muted"><span className="font-num">{formatDate(h.date)}</span></div>
                          </div>
                          <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold border ${getTypeBadge(h.type)} whitespace-nowrap`}>
                            {h.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 mt-2 border-t border-line/40 text-right">
                  <button
                    type="button"
                    onClick={() => { setCalendarMonth(mNum); setActiveView("monthly"); }}
                    className="text-[11px] text-accent hover:underline font-semibold"
                  >
                    Open Grid →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeView === "list" && (
        <div className="glass-card !p-0 overflow-hidden border border-line">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface2/60 border-b border-line text-muted uppercase text-[10.5px] font-semibold tracking-wider">
                <tr>
                  <th className="p-3 pl-4">Date</th>
                  <th className="p-3">Holiday Name</th>
                  <th className="p-3">Day of Week</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Applicable Hubs</th>
                  <th className="p-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium">
                {displayedHolidays.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted">No holidays match filter criteria.</td>
                  </tr>
                ) : (
                  displayedHolidays.map(h => (
                    <tr key={h.id} className="hover:bg-surface2/40 transition">
                      <td className="p-3 pl-4 font-num font-semibold text-ink">{formatDate(h.date)}</td>
                      <td className="p-3 font-semibold text-ink">{h.name}</td>
                      <td className="p-3 text-muted">{h.dayOfWeek}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${getTypeBadge(h.type)}`}>
                          {h.type}
                        </span>
                      </td>
                      <td className="p-3 text-muted">{h.location}</td>
                      <td className="p-3 text-right pr-4">
                        <button
                          type="button"
                          onClick={() => setViewingHoliday(h)}
                          className="p-1.5 rounded-lg bg-surface2 border border-line text-muted hover:text-ink transition"
                        >
                          <Icon name="eye" className="w-3.5 h-3.5 text-accent" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      <AddHolidayModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(savedHol, action) => {
          onTriggerToast?.(`Holiday "${savedHol.name}" ${action} successfully.`);
          setAllHolidays(loadHolidays());
        }}
        editHoliday={editingHoliday}
      />

      <HolidayDetailModal
        holiday={viewingHoliday}
        isOpen={Boolean(viewingHoliday)}
        onClose={() => setViewingHoliday(null)}
        onEdit={(h) => { setViewingHoliday(null); setEditingHoliday(h); setIsAddModalOpen(true); }}
        onDelete={(h) => { setViewingHoliday(null); setDeletingHoliday(h); }}
        isHrOrAdmin={isHrOrAdmin}
      />

      <DeleteHolidayConfirmModal
        holiday={deletingHoliday}
        isOpen={Boolean(deletingHoliday)}
        onClose={() => setDeletingHoliday(null)}
        onConfirm={handleConfirmDelete}
      />

      <ImportHolidaysModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(count) => {
          onTriggerToast?.(`Successfully imported ${count} holidays.`);
          setAllHolidays(loadHolidays());
        }}
      />
    </div>
  );
};

export default HolidayCalendarPanel;