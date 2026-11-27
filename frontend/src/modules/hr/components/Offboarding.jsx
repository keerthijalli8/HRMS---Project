import React, { useState, useEffect } from 'react';
import { Icon } from './Icon.jsx';

const INITIAL_OFFBOARDING = [
  {
    id: "EXIT-101",
    empId: "NEX-108",
    name: "Rahul Deshmukh",
    role: "Backend Engineer",
    department: "Engineering",
    resignationDate: "2026-11-01",
    lastWorkingDay: "2026-11-30",
    reason: "Higher Studies",
    status: "Clearance Pending", // 'Pending Approval' | 'Clearance Pending' | 'Completed'
    checklist: {
      itAssets: true,
      financeSettlement: false,
      managerHandover: true,
      exitInterview: false
    }
  },
  {
    id: "EXIT-102",
    empId: "NEX-114",
    name: "Neha Kulkarni",
    role: "QA Analyst",
    department: "Engineering",
    resignationDate: "2026-10-15",
    lastWorkingDay: "2026-11-15",
    reason: "Relocation",
    status: "Completed",
    checklist: {
      itAssets: true,
      financeSettlement: true,
      managerHandover: true,
      exitInterview: true
    }
  }
];

const CHECKLIST_ITEMS = [
  { key: "itAssets", label: "IT Assets & Laptop Return" },
  { key: "managerHandover", label: "Knowledge & Project Handover" },
  { key: "financeSettlement", label: "Finance & FnF Settlement" },
  { key: "exitInterview", label: "HR Exit Interview & NOC" }
];

export function Offboarding({ onTriggerToast }) {
  const [activeTab, setActiveTab] = useState("active"); // 'active' (Resignation & Clearance) | 'records' (Exit Records)
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('nexora_offboarding_records');
      return saved ? JSON.parse(saved) : INITIAL_OFFBOARDING;
    } catch {
      return INITIAL_OFFBOARDING;
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    empId: "",
    name: "",
    role: "",
    department: "Engineering",
    resignationDate: new Date().toISOString().split('T')[0],
    lastWorkingDay: "",
    reason: "Better Career Opportunity"
  });

  useEffect(() => {
    localStorage.setItem('nexora_offboarding_records', JSON.stringify(records));
  }, [records]);

  // Submit New Resignation
  const handleAddResignation = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.empId.trim()) return;

    const newRecord = {
      id: `EXIT-${Math.floor(100 + Math.random() * 900)}`,
      ...formData,
      empId: formData.empId.toUpperCase(),
      status: "Pending Approval",
      checklist: {
        itAssets: false,
        financeSettlement: false,
        managerHandover: false,
        exitInterview: false
      }
    };

    setRecords(prev => [newRecord, ...prev]);
    setIsModalOpen(false);
    setFormData({
      empId: "",
      name: "",
      role: "",
      department: "Engineering",
      resignationDate: new Date().toISOString().split('T')[0],
      lastWorkingDay: "",
      reason: "Better Career Opportunity"
    });
    onTriggerToast?.(`Resignation submitted for ${newRecord.name}`);
  };

  // Approve Resignation -> Move to Clearance
  const handleApproveResignation = (id) => {
    setRecords(prev =>
      prev.map(rec =>
        rec.id === id ? { ...rec, status: "Clearance Pending" } : rec
      )
    );
    onTriggerToast?.("Resignation approved. Clearance checklist initiated.");
  };

  // Toggle Individual Checklist Item
  const handleToggleChecklist = (id, key) => {
    setRecords(prev =>
      prev.map(rec => {
        if (rec.id !== id) return rec;
        return {
          ...rec,
          checklist: {
            ...rec.checklist,
            [key]: !rec.checklist[key]
          }
        };
      })
    );
  };

  // Finalize Exit -> Move to Exit Records
  const handleCompleteExit = (rec) => {
    const allCleared = Object.values(rec.checklist).every(Boolean);
    if (!allCleared) {
      onTriggerToast?.("Please complete all 4 clearance checklist items before finalizing exit.");
      return;
    }

    setRecords(prev =>
      prev.map(item =>
        item.id === rec.id ? { ...item, status: "Completed" } : item
      )
    );
    onTriggerToast?.(`Offboarding completed for ${rec.name}. Moved to Exit Records.`);
  };

  const activeOffboardings = records.filter(r => r.status !== "Completed");
  const completedExits = records.filter(r => r.status === "Completed");

  const filteredActive = activeOffboardings.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompleted = completedExits.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-ink">Employee Offboarding</h1>
          <p className="text-xs text-muted mt-0.5">
            Manage resignations, department clearance checklists, and historical exit records.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="bg-accent text-on-accent px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg hover:brightness-105 transition cursor-pointer flex items-center gap-1.5"
        >
          <Icon name="user-minus" className="w-4 h-4" />
          <span>+ Submit Resignation</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 border border-line/80 rounded-2xl">
          <span className="text-[11px] text-muted uppercase font-semibold">Pending Approvals</span>
          <div className="text-2xl font-bold font-display text-amber-400 mt-1">
            {records.filter(r => r.status === "Pending Approval").length}
          </div>
          <span className="text-[11px] text-muted">Awaiting HR/Manager sign-off</span>
        </div>

        <div className="glass-card p-4 border border-line/80 rounded-2xl">
          <span className="text-[11px] text-muted uppercase font-semibold">In Clearance Process</span>
          <div className="text-2xl font-bold font-display text-sky-400 mt-1">
            {records.filter(r => r.status === "Clearance Pending").length}
          </div>
          <span className="text-[11px] text-muted">IT, Finance & Handover checks</span>
        </div>

        <div className="glass-card p-4 border border-line/80 rounded-2xl">
          <span className="text-[11px] text-muted uppercase font-semibold">Completed Exits</span>
          <div className="text-2xl font-bold font-display text-emerald-400 mt-1">
            {completedExits.length}
          </div>
          <span className="text-[11px] text-emerald-400/80">Archived in Exit Records</span>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex bg-surface2/70 p-1 rounded-xl border border-line">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "active"
                ? "bg-accent text-on-accent shadow"
                : "text-muted hover:text-ink"
            }`}
          >
            Resignations & Clearance ({activeOffboardings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("records")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "records"
                ? "bg-accent text-on-accent shadow"
                : "text-muted hover:text-ink"
            }`}
          >
            Exit Records ({completedExits.length})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
          <input
            type="text"
            placeholder="Search employee name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface2/60 border border-line rounded-xl pl-9 pr-3 py-2 text-xs text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* TAB 1: RESIGNATIONS & CLEARANCE CHECKLIST */}
      {activeTab === "active" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredActive.length > 0 ? (
            filteredActive.map(rec => {
              const clearedCount = Object.values(rec.checklist).filter(Boolean).length;
              const isAllCleared = clearedCount === 4;

              return (
                <div key={rec.id} className="glass-card p-5 border border-line/80 rounded-2xl flex flex-col justify-between gap-4">
                  {/* Top Employee & Resignation Info */}
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-base font-bold text-ink">{rec.name}</h3>
                        <p className="text-xs text-muted">{rec.empId} • {rec.role} ({rec.department})</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                        rec.status === "Pending Approval"
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : "bg-sky-500/15 text-sky-300 border-sky-500/30"
                      }`}>
                        {rec.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 p-3 rounded-xl bg-surface2/50 border border-line/50 text-[11px]">
                      <div>
                        <span className="text-muted block">Resigned On</span>
                        <strong className="text-ink">{rec.resignationDate}</strong>
                      </div>
                      <div>
                        <span className="text-muted block">Last Working Day</span>
                        <strong className="text-ink">{rec.lastWorkingDay || "TBD"}</strong>
                      </div>
                      <div>
                        <span className="text-muted block">Reason</span>
                        <strong className="text-ink truncate block">{rec.reason}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Clearance Checklist */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-muted uppercase tracking-wider">Clearance Checklist</span>
                      <span className="font-bold text-accent">{clearedCount} / 4 Cleared</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {CHECKLIST_ITEMS.map(item => {
                        const checked = rec.checklist[item.key];
                        return (
                          <label
                            key={item.key}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                              checked
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                : "bg-surface2/40 border-line/60 text-muted hover:text-ink"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={rec.status === "Pending Approval"}
                              onChange={() => handleToggleChecklist(rec.id, item.key)}
                              className="accent-emerald-400 cursor-pointer"
                            />
                            <span className="truncate">{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 pt-3 border-t border-line/50">
                    {rec.status === "Pending Approval" ? (
                      <button
                        type="button"
                        onClick={() => handleApproveResignation(rec.id)}
                        className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        Approve Resignation
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCompleteExit(rec)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          isAllCleared
                            ? "bg-emerald-500 text-slate-950 shadow hover:brightness-105"
                            : "bg-surface2 text-muted border border-line hover:text-ink"
                        }`}
                      >
                        Complete Exit & Archive
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full glass-card p-10 border border-line/80 rounded-2xl text-center text-muted text-xs">
              No active resignation or clearance requests found.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMPLETED EXIT RECORDS */}
      {activeTab === "records" && (
        <div className="glass-card border border-line/80 rounded-2xl shadow-xl overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line/60 text-muted uppercase text-[10px] tracking-wider bg-surface2/40">
                <th className="p-4 font-semibold">Employee</th>
                <th className="p-4 font-semibold">Role & Department</th>
                <th className="p-4 font-semibold">Resignation & LWD</th>
                <th className="p-4 font-semibold">Exit Reason</th>
                <th className="p-4 font-semibold text-right">Exit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40 text-xs">
              {filteredCompleted.length > 0 ? (
                filteredCompleted.map(rec => (
                  <tr key={rec.id} className="hover:bg-surface2/30 transition">
                    <td className="p-4">
                      <span className="font-semibold text-ink block">{rec.name}</span>
                      <span className="text-[11px] text-muted">{rec.empId} • {rec.id}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-ink block">{rec.role}</span>
                      <span className="text-[11px] text-muted">{rec.department}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-ink block">LWD: {rec.lastWorkingDay}</span>
                      <span className="text-[11px] text-muted">Resigned: {rec.resignationDate}</span>
                    </td>
                    <td className="p-4 text-ink/90">{rec.reason}</td>
                    <td className="p-4 text-right">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Relieved & Cleared
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-muted text-xs">
                    No completed exit records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: SUBMIT RESIGNATION */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="glass-card bg-[#0e1626] border border-line rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-surface2/80 border-b border-line p-4 flex justify-between items-center">
              <h3 className="font-semibold text-sm text-ink font-display">Submit Employee Resignation</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-muted hover:text-ink text-lg font-bold cursor-pointer">×</button>
            </div>
            <form onSubmit={handleAddResignation} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.empId}
                    onChange={(e) => setFormData({ ...formData, empId: e.target.value })}
                    placeholder="e.g. NEX-105"
                    className="w-full bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Tarun Kumar"
                    className="w-full bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Role</label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. UI Developer"
                    className="w-full bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product & Design">Product & Design</option>
                    <option value="HR & Operations">HR & Operations</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Resignation Date</label>
                  <input
                    type="date"
                    required
                    value={formData.resignationDate}
                    onChange={(e) => setFormData({ ...formData, resignationDate: e.target.value })}
                    className="w-full bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Last Working Day *</label>
                  <input
                    type="date"
                    required
                    value={formData.lastWorkingDay}
                    onChange={(e) => setFormData({ ...formData, lastWorkingDay: e.target.value })}
                    className="w-full bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Exit Reason</label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                >
                  <option value="Better Career Opportunity">Better Career Opportunity</option>
                  <option value="Higher Studies">Higher Studies</option>
                  <option value="Relocation">Relocation</option>
                  <option value="Personal / Health Reasons">Personal / Health Reasons</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-surface2 text-ink px-4 py-2 rounded-xl text-xs font-semibold border border-line cursor-pointer">Cancel</button>
                <button type="submit" className="bg-accent text-on-accent px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer">Submit Resignation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}