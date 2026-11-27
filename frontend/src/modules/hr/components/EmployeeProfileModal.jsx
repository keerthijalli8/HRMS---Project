import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Avatar } from './Avatar.jsx';
import { Icon } from './Icon.jsx';
import { StatusPill } from './StatusPill.jsx';
import { formatDate, formatCurrency } from '../utils/format.js';
import { renderValue, formatAddress, formatEmergencyContact } from '../utils/renderValue.js';
import { fetchDocuments, getDocumentDownloadUrl } from '../services/documentService.js';

export const EmployeeProfileModal = ({
  employee,
  isOpen,
  onClose,
  onEdit,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!isOpen || !employee) return null;

  const isHrOrAdmin = (() => {
    if (!currentUser) return true;
    const sys = (currentUser.systemRole || currentUser.role || "").toLowerCase();
    return sys === "hr" || sys === "hr manager" || sys.includes("hr") || sys.includes("admin");
  })();

  const [backendDocs, setBackendDocs] = useState([]);

  useEffect(() => {
    const empId = employee.id || employee.employeeId;
    if (empId) {
      fetchDocuments({ currentUser, category: 'All' })
        .then(docs => {
          const matched = docs.filter(d => (d.employeeId || '').toLowerCase() === empId.toLowerCase());
          setBackendDocs(matched);
        })
        .catch(() => {});
    }
  }, [employee.id, employee.employeeId, currentUser]);

  const allDocuments = useMemo(() => {
    const staticDocs = employee.documents || [];
    const formattedBackend = backendDocs.map(d => ({
      id: d.id,
      name: d.name,
      size: d.formattedSize,
      uploadedAt: d.formattedDate || 'Recent',
      type: d.category || d.fileType,
      isBackend: true,
      fileName: d.fileName
    }));
    return [...formattedBackend, ...staticDocs];
  }, [employee.documents, backendDocs]);

  const rawSalary = employee.salaryBreakdown || employee.salary_breakdown || (typeof employee.salary === "object" ? employee.salary : null);
  const salary = rawSalary || {
    basic: 0,
    hra: 0,
    da: 0,
    conveyance: 0,
    medical: 0,
    special: 0,
    pf: 0,
    esi: 0,
    pt: 0,
    tds: 0,
    gross: 0,
    deductions: 0,
    net: 0
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "layout-dashboard" },
    { id: "personal", label: "Personal Details", icon: "user" },
    { id: "employment", label: "Employment", icon: "briefcase" },
    { id: "address", label: "Address", icon: "map-pin" },
    { id: "emergency", label: "Emergency Contact", icon: "phone" },
    { id: "salary", label: "Bank & Salary", icon: "credit-card" },
    { id: "documents", label: `Documents (${allDocuments.length})`, icon: "file-text" }
  ];

  return typeof document !== "undefined" && createPortal(
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="glass-card !p-0 w-full max-w-4xl max-h-[92vh] flex flex-col border border-line shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* ================= MODAL TOP PROFILE BANNER ================= */}
        <div className="p-5 border-b border-line bg-surface/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              name={employee.name}
              employeeId={employee.id || employee.employeeId}
              photoUrl={employee.photoUrl}
              size="lg"
              className="w-16 h-16 text-xl rounded-2xl shadow-md"
            />

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-bold text-ink text-lg sm:text-xl">
                  {employee.name}
                </h2>
                <StatusPill
                  type={employee.status === "Active" ? "good" : employee.status === "Probation" ? "warn" : "info"}
                  text={employee.status || "Active"}
                />
              </div>

              <div className="text-xs text-muted flex items-center gap-2 mt-1 flex-wrap">
                <span className="font-semibold text-accent font-data">{employee.id}</span>
                <span>•</span>
                <span className="text-ink font-medium">{employee.role}</span>
                <span>•</span>
                <span>{employee.dept}</span>
                <span>•</span>
                <span>{employee.location || "Hyderabad"}</span>
              </div>

              <div className="text-[11.5px] text-muted font-num mt-0.5">
                {employee.email} • Mobile: {employee.mobile ? `+91 ${employee.mobile}` : "--"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {isHrOrAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(employee);
                }}
                className="px-3.5 py-1.5 rounded-[var(--radius)] bg-accent text-on-accent text-xs font-semibold hover:brightness-105 active:scale-[0.98] transition flex items-center gap-1.5 shadow-sm"
              >
                <Icon name="edit" className="w-3.5 h-3.5 text-on-accent" />
                <span>Edit Profile</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-surface2 border border-line text-muted hover:text-ink hover:border-accent transition"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= PROFILE TABS ================= */}
        <div className="flex items-center gap-1 px-4 sm:px-5 border-b border-line overflow-x-auto bg-surface2/30">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "border-accent text-accent bg-accent/5"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              <Icon name={tab.icon} className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-accent' : 'text-muted'}`} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ================= TAB CONTENTS ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs">
          
          {/* 1. OVERVIEW */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-surface2/40 border border-line">
                  <span className="text-[10.5px] font-semibold text-muted uppercase">Joining Date</span>
                  <div className="font-num font-semibold text-ink text-sm mt-1">{formatDate(employee.joined)}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface2/40 border border-line">
                  <span className="text-[10.5px] font-semibold text-muted uppercase">Employment Type</span>
                  <div className="font-semibold text-ink text-sm mt-1">{employee.type || "Full-Time"}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface2/40 border border-line">
                  <span className="text-[10.5px] font-semibold text-muted uppercase">Reporting Manager</span>
                  <div className="font-semibold text-ink text-sm mt-1">{employee.mgr || "Executive Board"}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface2/40 border border-line">
                  <span className="text-[10.5px] font-semibold text-muted uppercase">Work Shift</span>
                  <div className="font-semibold text-ink text-xs mt-1 truncate font-num">{employee.shift || "General (09:00 AM - 06:00 PM)"}</div>
                </div>
              </div>

              {/* Quick Contact & Address Card */}
              <div className="p-4 rounded-xl border border-line bg-surface2/30 flex flex-col gap-3">
                <div className="font-display font-bold text-ink text-sm border-b border-line pb-2">
                  Key Contact & Address Summary
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted block text-[11px] uppercase">Residential Address</span>
                    <p className="text-ink font-medium mt-1 leading-relaxed">
                      {formatAddress(employee.currentAddress || employee.address)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px] uppercase">Emergency Point of Contact</span>
                    <p className="text-ink font-medium mt-1">
                      {formatEmergencyContact(employee.emergencyContact)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. PERSONAL DETAILS */}
          {activeTab === "personal" && (
            <div className="p-4 rounded-xl border border-line bg-surface2/30 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-muted block text-[11px] uppercase">First Name</span>
                <span className="font-semibold text-ink text-sm">{employee.firstName || employee.name?.split(" ")[0]}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px] uppercase">Middle Name</span>
                <span className="font-semibold text-ink text-sm">{employee.middleName || "--"}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px] uppercase">Last Name</span>
                <span className="font-semibold text-ink text-sm">{employee.lastName || employee.name?.split(" ")[1] || "--"}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px] uppercase">Gender</span>
                <span className="font-semibold text-ink text-sm">{employee.gender || "Other"}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px] uppercase">Date of Birth</span>
                <span className="font-semibold text-ink text-sm font-num">{employee.dob ? formatDate(employee.dob) : "--"}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px] uppercase">Blood Group</span>
                <span className="font-semibold text-accent text-sm font-num">{employee.bloodGroup || "O+"}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px] uppercase">Marital Status</span>
                <span className="font-semibold text-ink text-sm">{employee.maritalStatus || "Single"}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px] uppercase">Primary Mobile Number</span>
                <span className="font-semibold text-ink text-sm font-num">{employee.mobile ? `+91 ${employee.mobile}` : "--"}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px] uppercase">Alternate Contact</span>
                <span className="font-semibold text-ink text-sm font-num">{employee.altMobile ? `+91 ${employee.altMobile}` : "--"}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px] uppercase">Personal Email</span>
                <span className="font-semibold text-ink text-xs">{employee.personalEmail || "--"}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted block text-[11px] uppercase">Aadhaar Identification (Masked)</span>
                <span className="font-semibold text-ink text-sm font-num">
                  {isHrOrAdmin ? (employee.aadhaar || "XXXX-XXXX-8921") : "••••-••••-8921 (Restricted)"}
                </span>
              </div>
            </div>
          )}

          {/* 3. EMPLOYMENT */}
          {activeTab === "employment" && (
            <div className="p-4 rounded-xl border border-line bg-surface2/30 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-muted block text-[11px] uppercase">Employee ID</span>
                <span className="font-bold text-accent text-sm font-data">{employee.id}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px] uppercase">Department</span>
                <span className="font-semibold text-ink text-sm">{employee.dept}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px] uppercase">Designation</span>
                <span className="font-semibold text-ink text-sm">{employee.role}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px] uppercase">Functional Job Role</span>
                <span className="font-semibold text-ink text-sm">{employee.jobRole || employee.role}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px] uppercase">Reporting Line Manager</span>
                <span className="font-semibold text-ink text-sm">{employee.mgr || "Executive Board"}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px] uppercase">Team Lead</span>
                <span className="font-semibold text-ink text-sm">{employee.teamLead || employee.mgr}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px] uppercase">Work Location</span>
                <span className="font-semibold text-ink text-sm">{employee.location || "Hyderabad"}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px] uppercase">Work Shift</span>
                <span className="font-semibold text-ink text-xs font-data">{employee.shift || "General (09:00 - 18:00)"}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px] uppercase">Work Official Email</span>
                <span className="font-semibold text-ink text-xs font-data">{employee.email}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px] uppercase">Probation Period</span>
                <span className="font-semibold text-ink text-sm">{employee.probation || "None"}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px] uppercase">Confirmation Date</span>
                <span className="font-semibold text-ink text-sm font-data">{employee.confirmationDate || employee.joined}</span>
              </div>
              <div>
                <span className="text-muted block text-[11px] uppercase">Company Unit</span>
                <span className="font-semibold text-ink text-sm font-data">{employee.companyId || "NEX-IND"}</span>
              </div>
            </div>
          )}

          {/* 4. ADDRESS */}
          {activeTab === "address" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-line bg-surface2/30 flex flex-col gap-2">
                <div className="font-display font-bold text-ink text-sm border-b border-line pb-2 flex items-center gap-2">
                  <Icon name="map-pin" className="w-4 h-4 text-accent" />
                  <span>Current Residential Address</span>
                </div>
                <div className="text-xs text-ink leading-relaxed">
                  <div>{employee.currentAddress?.flat || "Flat / Building Details"}</div>
                  <div>{employee.currentAddress?.street || "Street Area Landmark"}</div>
                  <div>{employee.currentAddress?.city || "Hyderabad"}, {employee.currentAddress?.state || "Telangana"}</div>
                  <div className="font-data font-semibold text-muted mt-1">PIN: {employee.currentAddress?.pincode || "500081"} • {employee.currentAddress?.country || "India"}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-line bg-surface2/30 flex flex-col gap-2">
                <div className="font-display font-bold text-ink text-sm border-b border-line pb-2 flex items-center gap-2">
                  <Icon name="map-pin" className="w-4 h-4 text-accent" />
                  <span>Permanent Domicile Address</span>
                </div>
                <div className="text-xs text-ink leading-relaxed">
                  <div>{employee.permanentAddress?.flat || employee.currentAddress?.flat}</div>
                  <div>{employee.permanentAddress?.street || employee.currentAddress?.street}</div>
                  <div>{employee.permanentAddress?.city || employee.currentAddress?.city}, {employee.permanentAddress?.state || employee.currentAddress?.state}</div>
                  <div className="font-data font-semibold text-muted mt-1">PIN: {employee.permanentAddress?.pincode || employee.currentAddress?.pincode} • {employee.permanentAddress?.country || "India"}</div>
                </div>
              </div>
            </div>
          )}

          {/* 5. EMERGENCY CONTACT */}
          {activeTab === "emergency" && (
            <div className="p-4 rounded-xl border border-line bg-surface2/30 flex flex-col gap-3 max-w-lg">
              <div className="font-display font-bold text-ink text-sm border-b border-line pb-2">
                Emergency Contact Details
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted block text-[11px] uppercase">Contact Person</span>
                  <span className="font-bold text-ink text-sm">{employee.emergencyContact?.name || "Emergency Contact"}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px] uppercase">Relationship</span>
                  <span className="font-semibold text-accent text-sm">{employee.emergencyContact?.relationship || "Parent"}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px] uppercase">Primary Mobile</span>
                  <span className="font-semibold text-ink text-sm font-num">{employee.emergencyContact?.mobile ? `+91 ${employee.emergencyContact.mobile}` : "--"}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px] uppercase">Alternate Phone</span>
                  <span className="font-semibold text-ink text-sm font-num">{employee.emergencyContact?.altPhone ? `+91 ${employee.emergencyContact.altPhone}` : "--"}</span>
                </div>
              </div>
            </div>
          )}

          {/* 6. BANK & SALARY */}
          {activeTab === "salary" && (
            <div className="flex flex-col gap-4">
              {!isHrOrAdmin ? (
                <div className="p-8 text-center text-muted border border-line rounded-xl bg-surface2/30">
                  <Icon name="shield" className="w-8 h-8 text-accent mx-auto mb-2" />
                  <p className="font-semibold text-ink">Confidential Compensation Details</p>
                  <p className="text-xs text-muted mt-1">Access to statutory compensation and bank account data is restricted to authorized HR and Payroll administrators.</p>
                </div>
              ) : (
                <>
                  {/* Bank Account */}
                  <div className="p-4 rounded-xl border border-line bg-surface2/30 flex flex-col gap-3">
                    <div className="font-display font-bold text-ink text-sm border-b border-line pb-2 flex items-center justify-between">
                      <span>Salary Disbursement Bank Account</span>
                      <span className="text-[11px] font-data text-accent font-semibold">Active NEFT Gateway</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <span className="text-muted block text-[11px] uppercase">Account Holder</span>
                        <span className="font-semibold text-ink text-xs">{employee.bank?.holderName || employee.name}</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[11px] uppercase">Bank Name</span>
                        <span className="font-semibold text-ink text-xs">{employee.bank?.bankName || "HDFC Bank"}</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[11px] uppercase">Account Number</span>
                        <span className="font-bold text-ink font-data text-xs">{employee.bank?.accountNumber || "50100458923145"}</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[11px] uppercase">IFSC Code</span>
                        <span className="font-bold text-accent font-data text-xs uppercase">{employee.bank?.ifsc || "HDFC0000542"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Compensation Breakdown */}
                  <div className="p-4 rounded-xl border border-line bg-surface2/30 flex flex-col gap-3">
                    <div className="font-display font-bold text-ink text-sm border-b border-line pb-2 flex items-center justify-between">
                      <span>Monthly CTC Structure (India Statutory)</span>
                      <span className="text-[11px] font-data text-muted">FY27 Payroll Plan</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-muted block text-[10.5px] uppercase">Basic Salary</span>
                        <span className="font-bold text-ink font-num">{formatCurrency(salary.basic || 0)}</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10.5px] uppercase">House Rent Allowance</span>
                        <span className="font-bold text-ink font-num">{formatCurrency(salary.hra || 0)}</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10.5px] uppercase">Dearness Allowance</span>
                        <span className="font-bold text-ink font-num">{formatCurrency(salary.da || 0)}</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10.5px] uppercase">Conveyance Allowance</span>
                        <span className="font-bold text-ink font-num">{formatCurrency(salary.conveyance || 0)}</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10.5px] uppercase">Medical Allowance</span>
                        <span className="font-bold text-ink font-num">{formatCurrency(salary.medical || 0)}</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10.5px] uppercase">Special Allowance</span>
                        <span className="font-bold text-ink font-num">{formatCurrency(salary.special || 0)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-line/60">
                      <div>
                        <span className="text-bad block text-[10.5px] uppercase">PF (12%)</span>
                        <span className="font-bold text-bad font-num">{formatCurrency(-(salary.pf || 0))}</span>
                      </div>
                      <div>
                        <span className="text-bad block text-[10.5px] uppercase">ESI</span>
                        <span className="font-bold text-bad font-num">{formatCurrency(-(salary.esi || 0))}</span>
                      </div>
                      <div>
                        <span className="text-bad block text-[10.5px] uppercase">Professional Tax</span>
                        <span className="font-bold text-bad font-num">{formatCurrency(-(salary.pt || 0))}</span>
                      </div>
                      <div>
                        <span className="text-bad block text-[10.5px] uppercase">TDS Income Tax</span>
                        <span className="font-bold text-bad font-num">{formatCurrency(-(salary.tds || 0))}</span>
                      </div>
                    </div>

                    {/* Net take home */}
                    <div className="p-3 rounded-lg bg-good/10 border border-good/40 flex items-center justify-between mt-1">
                      <span className="text-good font-bold text-xs uppercase">Net Monthly Take-Home Salary</span>
                      <span className="font-num font-extrabold text-good text-lg">{formatCurrency(salary.net || 0)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 7. DOCUMENTS */}
          {activeTab === "documents" && (
            <div className="flex flex-col gap-3">
              <div className="font-display font-bold text-ink text-sm border-b border-line pb-2 flex items-center justify-between">
                <span>Verified Employee Credentials & Documents</span>
                <span className="text-[11px] text-muted">{allDocuments.length} items uploaded</span>
              </div>

              {allDocuments.length === 0 ? (
                <div className="p-8 text-center text-muted">
                  No documents on file for this employee.
                </div>
              ) : (
                <div className="divide-y divide-line rounded-xl border border-line overflow-hidden font-data">
                  {allDocuments.map(doc => (
                    <div key={doc.id} className="p-3 flex items-center justify-between gap-3 hover:bg-surface2/40 transition">
                      <div className="flex items-center gap-3">
                        <Icon name="file-text" className="w-4 h-4 text-accent" />
                        <div>
                          <div className="font-semibold text-ink font-sans text-xs">{doc.name}</div>
                          <div className="text-[10.5px] text-muted">{doc.size} • Uploaded on {doc.uploadedAt}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded bg-surface border border-line text-[11px] font-sans text-ink">
                          {doc.type}
                        </span>
                        {doc.isBackend && (
                          <a
                            href={getDocumentDownloadUrl(doc.id)}
                            download={doc.fileName}
                            className="p-1 rounded bg-surface2 border border-line text-accent hover:border-accent text-xs"
                            title="Download document"
                          >
                            <Icon name="download" className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="p-4 border-t border-line flex items-center justify-between bg-surface/90">
          <div className="text-[11px] text-muted font-data">
            Last Updated: {employee.joined || "Recent"} • HRMS India
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-[var(--radius)] bg-surface2 border border-line text-xs font-semibold text-ink hover:border-accent transition"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
