import { getTenantId } from "./companyBranding";

export const workflowTypes = [
  "Leave Approval",
  "Attendance Regularization",
  "Expense Reimbursement",
  "Payroll Change Approval",
  "Employee Onboarding",
  "Employee Resignation",
  "Document Verification",
  "Purchase Request",
];

export const approverTypes = [
  "Reporting Manager",
  "Department Manager",
  "HR",
  "Finance",
  "Admin",
  "Specific User",
  "Designated Role",
];

export const approvalModes = ["Any One Approver", "All Approvers"];

export const emptyWorkflow = {
  name: "",
  code: "",
  description: "",
  requestType: workflowTypes[0],
  department: "All departments",
  employeeType: "All employees",
  branch: "All branches",
  effectiveStartDate: "",
  effectiveEndDate: "",
  status: "Inactive",
  stages: [],
};

export const emptyEscalation = {
  name: "",
  workflowId: "",
  stageId: "",
  maximumWaitingHours: 48,
  reminderBeforeHours: 24,
  firstEscalationTo: "",
  secondEscalationTo: "",
  finalEscalationTo: "",
  frequencyHours: 24,
  automaticReassignment: false,
  status: "Active",
};

const demoStage = (id, name, level, approverType, slaHours = 24) => ({
  id,
  name,
  level,
  approverType,
  approverId: "",
  mode: "Any One Approver",
  mandatory: true,
  slaHours,
  allowRejection: true,
  allowSendBack: true,
});

export function demoApprovalData() {
  const workflows = [
    {
      id: "DEMO-WF-FINANCE",
      name: "Finance Expense Reimbursement",
      code: "FIN-EXP-001",
      description: "Finance review and payment authorization.",
      requestType: "Expense Reimbursement",
      department: "Finance",
      employeeType: "All employees",
      branch: "All branches",
      effectiveStartDate: "2026-01-01",
      status: "Active",
      isDemo: true,
      stages: [
        demoStage("DEMO-FIN-1", "Finance Executive Review", 1, "Finance"),
        demoStage("DEMO-FIN-2", "Finance Manager Approval", 2, "Department Manager"),
        demoStage("DEMO-FIN-3", "Final Admin Authorization", 3, "Admin", 48),
      ],
    },
    {
      id: "DEMO-WF-SOFTWARE",
      name: "Software Development Change Approval",
      code: "SDE-CHG-001",
      description: "Technical review and release approval for software changes.",
      requestType: "Purchase Request",
      department: "Software Development",
      employeeType: "All employees",
      branch: "All branches",
      effectiveStartDate: "2026-01-01",
      status: "Active",
      isDemo: true,
      stages: [
        demoStage("DEMO-SDE-1", "Development Lead Review", 1, "Designated Role"),
        demoStage("DEMO-SDE-2", "Technology QA Review", 2, "Technology"),
        demoStage("DEMO-SDE-3", "Release Approval", 3, "Admin", 48),
      ],
    },
    {
      id: "DEMO-WF-TECHNOLOGY",
      name: "Technology Access Request",
      code: "TEC-ACC-001",
      description: "Technology and security approval for system access.",
      requestType: "Document Verification",
      department: "Technology",
      employeeType: "All employees",
      branch: "All branches",
      effectiveStartDate: "2026-01-01",
      status: "Active",
      isDemo: true,
      stages: [
        demoStage("DEMO-TEC-1", "Technology Service Desk Review", 1, "Technology"),
        demoStage("DEMO-TEC-2", "Security Verification", 2, "Designated Role"),
        demoStage("DEMO-TEC-3", "Department Manager Approval", 3, "Department Manager"),
      ],
    },
    {
      id: "DEMO-WF-HR",
      name: "Human Resources Employee Onboarding",
      code: "HR-ONB-001",
      description: "HR, department and administration onboarding checks.",
      requestType: "Employee Onboarding",
      department: "Human Resources",
      employeeType: "New employees",
      branch: "All branches",
      effectiveStartDate: "2026-01-01",
      status: "Active",
      isDemo: true,
      stages: [
        demoStage("DEMO-HR-1", "HR Documentation Review", 1, "HR"),
        demoStage("DEMO-HR-2", "Department Manager Confirmation", 2, "Department Manager"),
        demoStage("DEMO-HR-3", "Admin Account Provisioning", 3, "Admin"),
      ],
    },
  ];

  const approvers = [
    {
      id: "DEMO-APR-1",
      employeeId: "DEMO-FINANCE-MANAGER",
      approverRole: "Finance Manager",
      workflowIds: ["DEMO-WF-FINANCE"],
      status: "Active",
      isDemo: true,
    },
    {
      id: "DEMO-APR-2",
      employeeId: "DEMO-SDE-LEAD",
      approverRole: "Software Development Lead",
      workflowIds: ["DEMO-WF-SOFTWARE"],
      status: "Active",
      isDemo: true,
    },
    {
      id: "DEMO-APR-3",
      employeeId: "DEMO-TECH-LEAD",
      approverRole: "Technology Lead",
      workflowIds: ["DEMO-WF-TECHNOLOGY"],
      status: "Active",
      isDemo: true,
    },
    {
      id: "DEMO-APR-4",
      employeeId: "DEMO-HR-MANAGER",
      approverRole: "HR Manager",
      workflowIds: ["DEMO-WF-HR"],
      status: "Active",
      isDemo: true,
    },
  ];

  const escalations = workflows.map((workflow, index) => ({
    id: `DEMO-ESC-${index + 1}`,
    name: `${workflow.department} approval escalation`,
    workflowId: workflow.id,
    stageId: workflow.stages[1]?.id,
    maximumWaitingHours: 48,
    reminderBeforeHours: 24,
    firstEscalationTo: "Department Manager",
    secondEscalationTo: "HR",
    finalEscalationTo: "Admin",
    frequencyHours: 24,
    automaticReassignment: false,
    status: "Active",
    isDemo: true,
  }));

  const history = workflows.map((workflow, index) => ({
    id: `DEMO-HISTORY-${index + 1}`,
    requestId: `REQ-${String(index + 1).padStart(3, "0")}`,
    workflowName: workflow.name,
    approverName: workflow.stages[0].approverType,
    dueAt: "2026-11-24 17:00",
    actionAt: index === 0 ? null : "2026-11-24 10:30",
    status: ["Pending", "Completed", "Escalated", "Approved"][index],
    isDemo: true,
  }));

  return {
    workflows,
    approvers,
    escalations,
    history,
    isDemo: true,
  };
}

const cacheKey = (tenantId, kind) => `hrms-approval-${tenantId}-${kind}`;

const readCache = (tenantId, kind, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(cacheKey(tenantId, kind)) || "null") || fallback;
  } catch {
    return fallback;
  }
};

const writeCache = (tenantId, kind, rows) => {
  localStorage.setItem(cacheKey(tenantId, kind), JSON.stringify(rows));
};

const normalize = (_kind, row) => row;

export async function loadApprovalData(tenantId = getTenantId()) {
  const demo = demoApprovalData();

  const result = Object.fromEntries(
    ["workflows", "approvers", "escalations", "history"].map((kind) => {
      const rows = readCache(tenantId, kind).map((row) => normalize(kind, row));
      return [kind, rows.length ? rows : demo[kind]];
    })
  );

  return {
    ...result,
    isDemo: Object.values(result).some(
      (rows) => Array.isArray(rows) && rows.some((row) => row.isDemo)
    ),
  };
}

export async function saveApprovalRecord(kind, row, tenantId = getTenantId()) {
  const validKinds = ["workflows", "approvers", "escalations", "history"];

  if (!validKinds.includes(kind)) {
    throw new Error(`Invalid approval record type: ${kind}`);
  }

  const rows = readCache(tenantId, kind)
    .filter((item) => item.id !== row.id)
    .concat(row);

  writeCache(tenantId, kind, rows);
  return row;
}

export async function removeApprovalRecord(kind, id, tenantId = getTenantId()) {
  const validKinds = ["workflows", "approvers", "escalations", "history"];

  if (!validKinds.includes(kind)) {
    throw new Error(`Invalid approval record type: ${kind}`);
  }

  writeCache(
    tenantId,
    kind,
    readCache(tenantId, kind).filter((item) => item.id !== id)
  );
}

export function newId(prefix) {
  return `${prefix}-${Date.now()}`;
}

export { readCache, writeCache };