import { useMemo, useState } from "react";
import { Download, Eye, Filter, MoreVertical, Pencil, Search } from "lucide-react";
import { formatDate, organizationStatuses } from "./organizationData";
import { downloadPdf } from "../../utils/pdfDownload";

const downloadOrganizationReport = (organization, branches, departments) => {
  const relatedBranches = branches.filter((branch) => branch.orgId === organization.id);
  const relatedDepartments = departments.filter((department) => department.orgId === organization.id);
  downloadPdf(`${organization.id}-organization-report.pdf`, `${organization.name} Organization Report`, [
    { heading: "Organization profile", rows: Object.entries({ "Organization ID": organization.id, Industry: organization.industry, "Contact person": organization.contact, Email: organization.email, Phone: organization.phone, Website: organization.website, Address: organization.address, "Subscription plan": organization.plan, Billing: organization.billing, Status: organization.status, Employees: organization.employees, "Active users": organization.activeUsers, "Registration date": formatDate(organization.date) }).map(([label, value]) => ({ label, value })) },
    { heading: "Branches", rows: relatedBranches.length ? relatedBranches.map((branch) => `${branch.name} (${branch.id}) · ${branch.city} · ${branch.status} · ${branch.employees} employees`) : ["No branches assigned."] },
    { heading: "Departments", rows: relatedDepartments.length ? relatedDepartments.map((department) => `${department.name} (${department.id}) · ${department.code} · ${department.status} · ${department.employees} employees`) : ["No departments assigned."] },
  ], { reportTitle: "ORGANIZATION REPORT", subtitle: `${organization.name} | Organization ID: ${organization.id}` });
};

export default function OrganizationOverview({ organizations, branches, departments, onView, onEdit, onRelated, search, setSearch, statusFilter, setStatusFilter }) {
  const [openMenu, setOpenMenu] = useState(null);
  const visible = useMemo(() => organizations.filter((org) => {
    const query = search.toLowerCase();
    const matchesSearch = [org.name, org.id, org.industry, org.contact, org.email].join(" ").toLowerCase().includes(query);
    return matchesSearch && (statusFilter === "All" || org.status === statusFilter);
  }), [organizations, search, statusFilter]);
  const countFor = (status) => organizations.filter((org) => status === "Total" ? true : org.status === status).length;
  const orgBranches = (orgId) => branches.filter((branch) => branch.orgId === orgId).length;
  const orgDepartments = (orgId) => departments.filter((department) => department.orgId === orgId).length;
  const focusOrganizations = (filter) => {
    setStatusFilter(filter);
    requestAnimationFrame(() => document.getElementById("organization-records")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return <>
    <div className="org-kpi-grid sa-main-kpi-grid">
      <button type="button" className={`org-kpi sa-main-kpi-card ${statusFilter === "All" ? "selected" : ""}`} onClick={() => focusOrganizations("All")}><span>Total Organizations</span><strong>{countFor("Total")}</strong><small>Registered companies</small></button>
      <button type="button" className={`org-kpi positive sa-main-kpi-card ${statusFilter === "Active" ? "selected" : ""}`} onClick={() => focusOrganizations("Active")}><span>Active Organizations</span><strong>{countFor("Active")}</strong><small>Operating normally</small></button>
      <button type="button" className={`org-kpi warning sa-main-kpi-card ${statusFilter === "Suspended" ? "selected" : ""}`} onClick={() => focusOrganizations("Suspended")}><span>Suspended Organizations</span><strong>{countFor("Suspended")}</strong><small>Require attention</small></button>
      <button type="button" className={`org-kpi pending sa-main-kpi-card ${statusFilter === "Pending" ? "selected" : ""}`} onClick={() => focusOrganizations("Pending")}><span>Pending Organizations</span><strong>{countFor("Pending")}</strong><small>Awaiting approval</small></button>
    </div>
    <section className="org-panel" id="organization-records">
      <div className="org-panel-heading"><div><h2>Registered Organizations</h2><p>Manage company profiles, subscriptions and organization structure.</p></div><span className="org-count">{visible.length} Records</span></div>
      <div className="org-toolbar"><label className="org-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search organization, ID, industry, contact..." /></label><label className="org-filter"><Filter size={16} /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="All">All Status</option>{organizationStatuses.map((status) => <option key={status}>{status}</option>)}</select></label></div>
      <div className="org-table-wrapper"><table className="org-table"><thead><tr><th>Organization Name</th><th>Organization ID</th><th>Industry</th><th>Contact Person</th><th>Email</th><th>Employees</th><th>Branches</th><th>Departments</th><th>Plan</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {visible.map((org) => <tr key={org.id}><td><strong className="org-primary">{org.name}</strong><small>{org.website}</small></td><td className="org-code">{org.id}</td><td>{org.industry}</td><td>{org.contact}</td><td>{org.email}</td><td>{org.employees}</td><td>{orgBranches(org.id)}</td><td>{orgDepartments(org.id)}</td><td><span className="org-plan">{org.plan}</span></td><td><span className={`org-status ${org.status.toLowerCase()}`}>{org.status}</span></td><td><div className="org-row-actions"><button className="org-icon-btn" aria-label={`Actions for ${org.name}`} onClick={() => setOpenMenu(openMenu === org.id ? null : org.id)}><MoreVertical size={17} /></button>{openMenu === org.id && <div className="org-action-menu"><button onClick={() => onView(org)}><Eye size={14} /> View details</button><button onClick={() => onEdit(org)}><Pencil size={14} /> Edit organization</button><button onClick={() => downloadOrganizationReport(org, branches, departments)}><Download size={14} /> Download report</button><button onClick={() => onRelated(org, "branches")}>View branches ({orgBranches(org.id)})</button><button onClick={() => onRelated(org, "departments")}>View departments ({orgDepartments(org.id)})</button></div>}</div></td></tr>)}
        {!visible.length && <tr><td colSpan="11" className="org-empty">No organizations match the current search and filters.</td></tr>}
      </tbody></table></div>
    </section>
  </>;
}

export function OrganizationModal({ organization, onClose, onEdit, branches, departments }) {
  if (!organization) return null;
  const orgBranches = branches.filter((branch) => branch.orgId === organization.id);
  const orgDepartments = departments.filter((department) => department.orgId === organization.id);
  return <div className="org-modal-overlay" onClick={onClose}><div className="org-modal org-details-modal" onClick={(event) => event.stopPropagation()}><div className="org-modal-header"><div><span className="org-eyebrow">ORGANIZATION PROFILE</span><h2>{organization.name}</h2><p>{organization.id} · Registered {formatDate(organization.date)}</p></div><button className="org-modal-close" onClick={onClose}>×</button></div><div className="org-detail-section"><h3>Contact and registration</h3><div className="org-detail-grid"><div><span>Contact Person</span><strong>{organization.contact}</strong></div><div><span>Email</span><strong>{organization.email}</strong></div><div><span>Phone</span><strong>{organization.phone}</strong></div><div><span>Website</span><strong>{organization.website}</strong></div><div className="org-detail-full"><span>Company Address</span><strong>{organization.address}</strong></div></div></div><div className="org-detail-section"><h3>Subscription and structure</h3><div className="org-usage-grid"><div><span>Subscription</span><strong>{organization.plan} · {organization.billing}</strong></div><div><span>Users</span><strong>{organization.activeUsers} active / {organization.employees} employees</strong></div><div><span>Branches</span><strong>{orgBranches.length}</strong></div><div><span>Departments</span><strong>{orgDepartments.length}</strong></div></div><p className="org-related-summary">{orgBranches.length} locations and {orgDepartments.length} departments are linked to this company.</p></div><div className="org-detail-section"><h3>Enabled HRMS modules</h3><div className="org-module-list">{organization.modules.map((module) => <span key={module}>{module}</span>)}</div></div><div className="org-modal-footer"><button className="org-primary-btn" onClick={() => downloadOrganizationReport(organization, branches, departments)}><Download size={16} /> Download report</button><button className="org-primary-btn" onClick={() => onEdit(organization)}>Edit profile</button></div></div></div>;
}
