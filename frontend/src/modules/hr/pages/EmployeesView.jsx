import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '../components/Icon.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { StatusPill } from '../components/StatusPill.jsx';
import { PrimaryButton } from '../components/Buttons.jsx';
import { Select } from '../components/Select.jsx';
import { AddEmployeeModal } from '../components/AddEmployeeModal.jsx';
import { EmployeeProfileModal } from '../components/EmployeeProfileModal.jsx';
import { formatDate } from '../utils/format.js';
import {
  loadEmployees,
  subscribeEmployeesStore,
  DEPARTMENTS,
  EMPLOYMENT_STATUSES
} from '../services/employeeStore.js';

export const EmployeesView = ({
  searchTerm: parentSearchTerm,
  setSearchTerm: parentSetSearchTerm,
  deptFilter: parentDeptFilter,
  setDeptFilter: parentSetDeptFilter,
  currentUser,
  onTriggerToast
}) => {
  // Live employee store list
  const [employees, setEmployees] = useState(() => loadEmployees());

  // Local filter states if not provided via props
  const [search, setSearch] = useState(parentSearchTerm || "");
  const [selectedDept, setSelectedDept] = useState(parentDeptFilter || "All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);

  // Sync with store updates
  useEffect(() => {
    const unsubscribe = subscribeEmployeesStore((updatedList) => {
      setEmployees(updatedList);
    });
    return unsubscribe;
  }, []);

  // Sync with parent search/dept if changed externally
  useEffect(() => {
    if (parentSearchTerm !== undefined) setSearch(parentSearchTerm);
  }, [parentSearchTerm]);

  useEffect(() => {
    if (parentDeptFilter !== undefined) setSelectedDept(parentDeptFilter);
  }, [parentDeptFilter]);

  const handleSearchChange = (val) => {
    setSearch(val);
    if (parentSetSearchTerm) parentSetSearchTerm(val);
    setCurrentPage(1);
  };

  const handleDeptChange = (val) => {
    setSelectedDept(val);
    if (parentSetDeptFilter) parentSetDeptFilter(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val) => {
    setSelectedStatus(val);
    setCurrentPage(1);
  };

  // Filtered list
  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();

    return employees.filter(emp => {
      // Department match
      const matchDept = selectedDept === "All" || emp.dept === selectedDept;

      // Status match
      const matchStatus = selectedStatus === "All" || (emp.status || "Active").toLowerCase() === selectedStatus.toLowerCase();

      // Search match (name, ID, email, designation)
      const matchSearch = !q || (
        (emp.name || "").toLowerCase().includes(q) ||
        (emp.id || "").toLowerCase().includes(q) ||
        (emp.email || "").toLowerCase().includes(q) ||
        (emp.role || "").toLowerCase().includes(q) ||
        (emp.dept || "").toLowerCase().includes(q)
      );

      return matchDept && matchStatus && matchSearch;
    });
  }, [employees, search, selectedDept, selectedStatus]);

  // Paginated slice
  const totalEmployees = filteredEmployees.length;
  const totalPages = Math.ceil(totalEmployees / PAGE_SIZE) || 1;
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const paginatedEmployees = filteredEmployees.slice(startIdx, startIdx + PAGE_SIZE);

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setIsAddModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (emp, e) => {
    e?.stopPropagation();
    setEditingEmployee(emp);
    setIsAddModalOpen(true);
  };

  // Open View profile modal
  const handleOpenView = (emp, e) => {
    e?.stopPropagation();
    setViewingEmployee(emp);
  };

  // Handle successful save
  const handleSaveSuccess = (savedEmp) => {
    const isEdit = Boolean(editingEmployee);
    if (onTriggerToast) {
      onTriggerToast(`Employee ${savedEmp.name} (${savedEmp.id}) ${isEdit ? "updated" : "added"} successfully.`);
    }
    // Refresh local list immediately
    setEmployees(loadEmployees());
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ================= 1. SEARCH, FILTER & ACTION TOOLBAR ================= */}
      <div className="glass-card !p-3.5 flex flex-wrap items-center justify-between gap-3 border border-line">
        <div className="flex items-center gap-2.5 flex-1 min-w-[260px] max-w-lg">
          <div className="relative w-full">
            <Icon name="search" className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, EMP ID, email or role..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-surface2 border border-line rounded-[var(--radius)] text-xs text-ink pl-9 pr-3 py-1.5 focus:border-accent outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span className="font-semibold uppercase text-[10.5px]">Dept:</span>
            <Select
              size="sm"
              value={selectedDept}
              onChange={(e) => handleDeptChange(e.target.value)}
              className="w-36"
            >
              <option value="All">All Departments</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span className="font-semibold uppercase text-[10.5px]">Status:</span>
            <Select
              size="sm"
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-32"
            >
              <option value="All">All Statuses</option>
              {EMPLOYMENT_STATUSES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </Select>
          </div>

          {/* Add Employee Button */}
          <PrimaryButton icon="user-plus" onClick={handleOpenAdd}>
            + Add Employee
          </PrimaryButton>
        </div>
      </div>

      {/* ================= 2. EMPLOYEE DIRECTORY TABLE ================= */}
      <div className="glass-card overflow-hidden !p-0 border border-line">
        <div className="p-4 border-b border-line flex flex-wrap items-center justify-between gap-2 bg-surface2/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-ink text-base">Employee Directory</span>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-accent/15 text-accent border border-accent/20">
                Live Enterprise Roster
              </span>
            </div>
            <div className="text-[12px] text-muted">
              Click any employee row to inspect their complete profile, credentials, and salary records
            </div>
          </div>
          <span className="text-xs text-muted font-data">
            Showing {filteredEmployees.length} matching {filteredEmployees.length === 1 ? "record" : "records"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface2/60 border-b border-line text-muted uppercase text-[10.5px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Reporting Manager</th>
                <th className="py-3 px-4">Joining Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-line">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Icon name="users" className="w-8 h-8 text-muted/50" />
                      <p className="font-semibold text-ink">No matching employees found</p>
                      <p className="text-[11px] text-muted">Try adjusting your search criteria or add a new employee above.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => handleOpenView(emp)}
                    className="hover:bg-surface2/50 transition cursor-pointer group"
                    title={`Click to view ${emp.name}'s complete profile`}
                  >
                    <td className="py-3 px-4 font-data font-bold text-accent whitespace-nowrap">
                      {emp.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={emp.name}
                          employeeId={emp.id || emp.employeeId}
                          photoUrl={emp.photoUrl}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-ink group-hover:text-accent transition truncate font-sans">
                            {emp.name}
                          </div>
                          <div className="text-muted text-[11px] font-data truncate">
                            {emp.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-ink whitespace-nowrap font-medium">
                      {emp.dept}
                    </td>
                    <td className="py-3 px-4 text-muted whitespace-nowrap">
                      {emp.role}
                    </td>
                    <td className="py-3 px-4 text-muted whitespace-nowrap">
                      {emp.mgr || "Executive Board"}
                    </td>
                    <td className="py-3 px-4 font-num whitespace-nowrap text-muted">
                      {formatDate(emp.joined)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-surface2 border border-line text-[11px] text-muted">
                        {emp.type || "Full-Time"}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusPill
                        type={emp.status === "Active" ? "good" : emp.status === "Probation" ? "warn" : emp.status === "On Leave" ? "accent2" : "bad"}
                        text={emp.status || "Active"}
                      />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleOpenView(emp, e)}
                          className="p-1.5 rounded-lg bg-surface2 border border-line hover:border-accent text-ink transition shadow-sm"
                          title="View Complete Profile"
                        >
                          <Icon name="eye" className="w-3.5 h-3.5 text-accent" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEdit(emp, e)}
                          className="p-1.5 rounded-lg bg-surface2 border border-line hover:border-accent text-muted hover:text-ink transition shadow-sm"
                          title="Edit Employee"
                        >
                          <Icon name="edit" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Real Pagination Controls */}
        <div className="p-3.5 border-t border-line flex flex-wrap items-center justify-between gap-3 text-xs text-muted bg-surface2/30">
          <span>
            Showing <span className="font-num font-semibold text-ink">{totalEmployees === 0 ? 0 : startIdx + 1}</span> to <span className="font-num font-semibold text-ink">{Math.min(startIdx + PAGE_SIZE, totalEmployees)}</span> of <span className="font-num font-semibold text-ink">{totalEmployees}</span> employees
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-surface2 border border-line text-muted hover:text-ink disabled:opacity-40 transition font-medium"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => setCurrentPage(pg)}
                className={`w-7 h-7 rounded text-xs font-semibold font-num transition ${
                  currentPage === pg
                    ? "bg-accent text-on-accent shadow-sm"
                    : "bg-surface2 border border-line text-muted hover:text-ink"
                }`}
              >
                {pg}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded bg-surface2 border border-line text-muted hover:text-ink disabled:opacity-40 transition font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ================= 3. ADD / EDIT EMPLOYEE MODAL ================= */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaveSuccess={handleSaveSuccess}
        editEmployee={editingEmployee}
        currentUser={currentUser}
      />

      {/* ================= 4. VIEW EMPLOYEE PROFILE MODAL ================= */}
      <EmployeeProfileModal
        isOpen={Boolean(viewingEmployee)}
        employee={viewingEmployee}
        onClose={() => setViewingEmployee(null)}
        onEdit={(emp) => {
          setViewingEmployee(null);
          setEditingEmployee(emp);
          setIsAddModalOpen(true);
        }}
        currentUser={currentUser}
      />
    </div>
  );
};
