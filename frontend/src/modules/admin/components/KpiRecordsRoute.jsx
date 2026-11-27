import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import "../style/KpiRecordsRoute.css";

const pageTitles = {
  employees: "Employees",
  departments: "Departments",
  leaves: "Leaves",
  payroll: "Payroll",
  documents: "Documents",
  performance: "Performance",
  support: "Help & Support",
};

const filterTitles = {
  all: "All Records",
  totalDepartments: "Total Departments",
  activeDepartments: "Active Departments",
  totalEmployees: "Total Employees",
  completed: "Reviews Completed",
  pending: "Pending Records",
  average: "Average Score",
  high: "High Priority",
  report: "Performance Report",
};

const moduleFilterTitles = {
  employees: {
    all: "All Employees",
  },
  departments: {
    totalDepartments: "Total Departments",
    activeDepartments: "Active Departments",
    totalEmployees: "Department Employee Records",
  },
  leaves: {
    All: "All Leave Requests",
    Pending: "Pending Leaves",
    Approved: "Approved Leaves",
    Rejected: "Rejected Leaves",
  },
  payroll: {
    All: "All Payroll Records",
    Paid: "Paid Payroll",
    Pending: "Pending Payroll",
    Employees: "Payroll Employees",
    "Monthly Payroll": "Monthly Payroll Details",
    Deductions: "Payroll Deductions",
    "Payroll Status": "Payroll Processing Status",
  },
  documents: {
    "Total Documents": "All Documents",
    Submitted: "Submitted Documents",
    Pending: "Pending Documents",
    Approved: "Approved Documents",
    Verified: "Approved Documents",
    Rejected: "Rejected Documents",
  },
  support: {
    all: "All Support Tickets",
    Open: "Open Tickets",
    "In Progress": "In Progress Tickets",
    high: "High Priority Tickets",
    pending: "Pending Tickets",
    Resolved: "Resolved Tickets",
    Closed: "Closed Tickets",
  },
  performance: {
    total: "Total Employee Reviews",
    completed: "Reviews Completed",
    pending: "Reviews Pending",
    average: "Average Performance Scores",
  },
};

function getFilterTitle(module, filter) {
  if (moduleFilterTitles[module]?.[filter]) return moduleFilterTitles[module][filter];
  if (!filter) return "All Records";
  if (filter.startsWith("workmode:")) return `${filter.slice("workmode:".length)} Employees`;
  if (filter.startsWith("role:")) return `${filter.slice("role:".length)} Employees`;
  if (filter.startsWith("report:")) {
    const report = filter.slice("report:".length).replaceAll("-", " ");
    return `${report.replace(/\b\w/g, (letter) => letter.toUpperCase())} Report`;
  }
  if (filterTitles[filter]) return filterTitles[filter];
  return filter.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function KpiRecordsRoute({ module, children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const filter = searchParams.get("filter") || "";
  const basePath = pathname.replace(/\/records\/?$/, "");
  const title = getFilterTitle(module, filter);

  return (
    <div
      className="kpi-records-route"
      data-module={module}
      data-filter={filter}
    >
      <header className="kpi-records-header">
        <div>
          <span>{pageTitles[module] || "Dashboard"} · KPI Records</span>
          <h1>{title}</h1>
          <p>Records filtered for the selected KPI.</p>
        </div>
        <button type="button" onClick={() => navigate(basePath)}>
          <ArrowLeft size={17} />
          Back to {pageTitles[module] || "Page"}
        </button>
      </header>
      {children}
    </div>
  );
}
