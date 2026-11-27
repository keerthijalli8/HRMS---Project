import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import Icon from "../Icon";
import { loadAllEmployees, addDepartment } from "../../services/teamService";

const AVAILABLE_ICONS = [
  { id: "code", label: "Code" },
  { id: "users", label: "Users" },
  { id: "dollar-sign", label: "Finance" },
  { id: "trending-up", label: "Growth" },
  { id: "share-2", label: "Marketing" },
  { id: "settings", label: "Operations" },
  { id: "palette", label: "Design" },
  { id: "headphones", label: "Support" },
  { id: "shield", label: "Security" },
  { id: "briefcase", label: "General" },
];

export default function AddDepartmentModal({ isOpen, onClose, onSaved }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("briefcase");
  const [headId, setHeadId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const employees = useMemo(() => {
    return loadAllEmployees();
  }, []);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Department name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedHead = employees.find((e) => e.id === headId);
      const res = addDepartment({
        name: name.trim(),
        description: description.trim(),
        icon,
        headName: selectedHead ? selectedHead.name : "",
        headId: headId || "",
      });

      if (res && res.ok === false) {
        setError(res.error || "Failed to create department");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      if (onSaved) onSaved(res?.department);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create department");
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0d1520]/95 p-6 shadow-2xl shadow-emerald-950/40 backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
              <Icon name="briefcase" className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Add New Department</h2>
              <p className="text-xs text-white/50">Create an organizational unit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <Icon name="alert-circle" className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-white/70">
              Department Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              required
              placeholder="e.g. Data & Analytics"
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-white/70">Icon</label>
            <div className="mt-1.5 grid grid-cols-5 gap-2">
              {AVAILABLE_ICONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIcon(item.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition-all ${
                    icon === item.id
                      ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                  title={item.label}
                >
                  <Icon name={item.id} className="h-4 w-4" />
                  <span className="text-[10px] truncate max-w-full">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-white/70">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of department responsibilities..."
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-white/70">
              Department Lead / Head (Optional)
            </label>
            <select
              value={headId}
              onChange={(e) => setHeadId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2 text-xs text-white focus:border-emerald-500/50 focus:outline-none"
            >
              <option value="">Select a Department Head...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.id}) &bull; {emp.department}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 disabled:opacity-50"
            >
              <Icon name="plus" className="h-4 w-4" />
              <span>{isSubmitting ? "Creating..." : "Create Department"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
