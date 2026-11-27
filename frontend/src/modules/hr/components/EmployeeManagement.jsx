import React, { useState, useEffect } from 'react';
import { Icon } from './Icon.jsx';

const INITIAL_EMPLOYEES = [
  {
    id: "NEX-101",
    name: "Aarav Sharma",
    email: "aarav@nexora.com",
    phone: "+91 98765 43210",
    role: "Frontend Lead",
    department: "Engineering",
    employmentType: "Full-Time",
    joinDate: "2024-03-15",
    status: "Active",
    manager: "Rohan Verma"
  },
  {
    id: "NEX-102",
    name: "Pooja Patel",
    email: "pooja@nexora.com",
    phone: "+91 98765 43211",
    role: "Full Stack Dev",
    department: "Engineering",
    employmentType: "Full-Time",
    joinDate: "2024-06-01",
    status: "Active",
    manager: "Aarav Sharma"
  },
  {
    id: "NEX-201",
    name: "Ananya Nair",
    email: "ananya@nexora.com",
    phone: "+91 98765 43212",
    role: "Product Manager",
    department: "Product & Design",
    employmentType: "Full-Time",
    joinDate: "2023-11-10",
    status: "Active",
    manager: "Vikram Rao"
  }
];

export function EmployeeManagement() {
  const [employees, setEmployees] = useState(() => {
    try {
      const saved = localStorage.getItem('nexora_employees');
      return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "Engineering",
    employmentType: "Full-Time",
    joinDate: "",
    status: "Active",
    manager: ""
  });

  useEffect(() => {
    localStorage.setItem('nexora_employees', JSON.stringify(employees));
  }, [employees]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      id: `NEX-${Math.floor(100 + Math.random() * 900)}`,
      name: "",
      email: "",
      phone: "",
      role: "",
      department: "Engineering",
      employmentType: "Full-Time",
      joinDate: new Date().toISOString().split('T')[0],
      status: "Active",
      manager: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingId(emp.id);
    setFormData(emp);
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    if (editingId) {
      setEmployees(prev => prev.map(emp => emp.id === editingId ? formData : emp));
    } else {
      setEmployees(prev => [formData, ...prev]);
    }
    setIsModalOpen(false);
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.manager && emp.manager.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDept = filterDept === "All" || emp.department === filterDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-ink">Employee Management</h1>
          <p className="text-xs text-muted mt-0.5">
            Create & update employee records, employment details, and reporting managers.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="bg-accent text-on-accent px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg hover:brightness-105 transition cursor-pointer flex items-center gap-2"
        >
          <Icon name="plus" className="w-4 h-4" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Search & Department Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by name, ID, role, or manager..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface2/60 border border-line rounded-xl pl-10 pr-4 py-2.5 text-xs text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent shadow-sm"
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="w-full sm:w-48 bg-surface2/60 border border-line rounded-xl px-3 py-2.5 text-xs text-ink focus:outline-none focus:border-accent shadow-sm cursor-pointer"
        >
          <option value="All">All Departments</option>
          <option value="Engineering">Engineering</option>
          <option value="Product & Design">Product & Design</option>
          <option value="HR & Operations">HR & Operations</option>
          <option value="Sales & Marketing">Sales & Marketing</option>
        </select>
      </div>

      {/* Employee Records Table (Glass Card style) */}
      <div className="glass-card border border-line/80 rounded-2xl shadow-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-line/60 text-muted uppercase text-[10px] tracking-wider bg-surface2/40">
              <th className="p-4 font-semibold">Employee Info</th>
              <th className="p-4 font-semibold">Employment Details</th>
              <th className="p-4 font-semibold">Reporting Manager</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40 text-xs">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-surface2/30 transition">
                  <td className="p-4">
                    <span className="font-semibold text-ink block">{emp.name}</span>
                    <span className="text-[11px] text-muted">{emp.id} • {emp.email}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-ink block">{emp.role} ({emp.department})</span>
                    <span className="text-[11px] text-muted">{emp.employmentType} • Joined: {emp.joinDate || 'N/A'}</span>
                  </td>
                  <td className="p-4 font-medium text-ink/90">
                    {emp.manager || <span className="text-muted/50 italic">Not Assigned</span>}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                      emp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(emp)}
                      className="bg-surface2 hover:bg-accent hover:text-on-accent text-ink px-3 py-1.5 rounded-lg text-[11px] font-medium transition border border-line cursor-pointer"
                    >
                      Edit Record
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-8 text-center text-muted text-xs">
                  No employee records found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Update Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="glass-card bg-[#0e1626] border border-line rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-surface2/80 border-b border-line p-4 flex justify-between items-center">
              <h3 className="font-semibold text-sm text-ink font-display">
                {editingId ? `Update Employee Record (${editingId})` : "Create New Employee Record"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:text-ink text-lg font-bold cursor-pointer px-2"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Employee ID</label>
                  <input
                    type="text"
                    disabled={!!editingId}
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full bg-surface2/80 border border-line rounded-xl px-3 py-2 text-xs text-ink opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Kiran Kumar"
                    className="w-full bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="kiran@nexora.com"
                    className="w-full bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 00000"
                    className="w-full bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Role / Designation *</label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Software Engineer"
                    className="w-full bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent cursor-pointer"
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
                  <label className="block text-[11px] font-semibold text-muted mb-1">Employment Type</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    className="w-full bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    className="w-full bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Reporting Manager</label>
                  <select
                    value={formData.manager}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    className="w-full bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="">-- Select Manager --</option>
                    {employees
                      .filter(e => e.id !== formData.id)
                      .map(e => (
                        <option key={e.id} value={e.name}>
                          {e.name} ({e.role})
                        </option>
                      ))}
                    <option value="Rohan Verma">Rohan Verma (Engineering Head)</option>
                    <option value="Vikram Rao">Vikram Rao (Design Head)</option>
                    <option value="Kavita Desai">Kavita Desai (HR Manager)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">Employment Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="On Probation">On Probation</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-surface2 text-ink px-4 py-2 rounded-xl text-xs font-semibold hover:bg-surface2/80 transition border border-line cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-accent text-on-accent px-4 py-2 rounded-xl text-xs font-semibold hover:brightness-105 transition shadow-md cursor-pointer"
                >
                  {editingId ? "Save Changes" : "Create Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}