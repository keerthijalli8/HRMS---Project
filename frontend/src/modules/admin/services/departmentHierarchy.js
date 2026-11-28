import { getOrganizationEmployees } from "../data/organizationData";
import { readEmployeeRecords, saveEmployeeRecords } from "./employeeRecords";

const firstValue = (record, keys, fallback = "") => {
  for (const key of keys) {
    if (record?.[key] !== undefined && record[key] !== null && record[key] !== "") {
      return record[key];
    }
  }

  return fallback;
};

const toId = (value) =>
  value === undefined || value === null ? "" : String(value);

const sampleDepartmentRecords = [
  {
    id: "DEMO-DEV",
    name: "Software Development",
    code: "DEV",
    description: "Product engineering and application development.",
    status: "Active",
    managerId: "DEMO-MGR-DEV",
  },
  {
    id: "DEMO-FIN",
    name: "Finance & Accounts",
    code: "FIN",
    description: "Financial planning, accounting, and compliance.",
    status: "Active",
    managerId: "DEMO-MGR-FIN",
  },
  {
    id: "DEMO-HR",
    name: "Human Resources",
    code: "HR",
    description: "People operations, culture, and employee support.",
    status: "Active",
    managerId: "DEMO-MGR-HR",
  },
];

const sampleDepartmentEmployees = [
  {
    id: "DEMO-MGR-DEV",
    name: "Rahul Mehta",
    role: "Manager",
    designation: "Engineering Manager",
    department: "Software Development",
    departmentId: "DEMO-DEV",
    email: "rahul.mehta@example.com",
    phone: "+91 98765 40001",
    joiningDate: "2021-04-12",
    status: "Active",
  },
  {
    id: "DEMO-HR-DEV",
    name: "Priya Nair",
    role: "HR",
    designation: "HR Business Partner",
    department: "Software Development",
    departmentId: "DEMO-DEV",
    managerId: "DEMO-MGR-DEV",
    email: "priya.nair@example.com",
    phone: "+91 98765 40002",
    joiningDate: "2022-08-01",
    status: "Active",
  },
  {
    id: "DEMO-TL-DEV",
    name: "Arjun Rao",
    role: "Team Leader",
    designation: "Frontend Team Lead",
    department: "Software Development",
    departmentId: "DEMO-DEV",
    managerId: "DEMO-MGR-DEV",
    hrId: "DEMO-HR-DEV",
    email: "arjun.rao@example.com",
    phone: "+91 98765 40003",
    joiningDate: "2022-01-17",
    status: "Active",
  },
  {
    id: "DEMO-EMP-DEV-1",
    name: "Kiran Shah",
    role: "Employee",
    designation: "Frontend Developer",
    department: "Software Development",
    departmentId: "DEMO-DEV",
    managerId: "DEMO-MGR-DEV",
    hrId: "DEMO-HR-DEV",
    teamLeaderId: "DEMO-TL-DEV",
    email: "kiran.shah@example.com",
    phone: "+91 98765 40004",
    joiningDate: "2024-06-10",
    status: "Active",
  },
  {
    id: "DEMO-EMP-DEV-2",
    name: "Neha Kapoor",
    role: "Employee",
    designation: "Backend Developer",
    department: "Software Development",
    departmentId: "DEMO-DEV",
    managerId: "DEMO-MGR-DEV",
    hrId: "DEMO-HR-DEV",
    teamLeaderId: "DEMO-TL-DEV",
    email: "neha.kapoor@example.com",
    phone: "+91 98765 40005",
    joiningDate: "2024-09-02",
    status: "Active",
  },
  {
    id: "DEMO-MGR-FIN",
    name: "Vikram Desai",
    role: "Manager",
    designation: "Finance Manager",
    department: "Finance & Accounts",
    departmentId: "DEMO-FIN",
    email: "vikram.desai@example.com",
    phone: "+91 98765 40006",
    joiningDate: "2020-07-20",
    status: "Active",
  },
  {
    id: "DEMO-HR-FIN",
    name: "Ananya Joshi",
    role: "HR",
    designation: "HR Executive",
    department: "Finance & Accounts",
    departmentId: "DEMO-FIN",
    managerId: "DEMO-MGR-FIN",
    email: "ananya.joshi@example.com",
    phone: "+91 98765 40007",
    joiningDate: "2023-02-06",
    status: "Active",
  },
  {
    id: "DEMO-TL-FIN",
    name: "Rakesh Iyer",
    role: "Team Leader",
    designation: "Accounts Team Lead",
    department: "Finance & Accounts",
    departmentId: "DEMO-FIN",
    managerId: "DEMO-MGR-FIN",
    hrId: "DEMO-HR-FIN",
    email: "rakesh.iyer@example.com",
    phone: "+91 98765 40008",
    joiningDate: "2021-11-15",
    status: "Active",
  },
  {
    id: "DEMO-EMP-FIN",
    name: "Maya Thomas",
    role: "Employee",
    designation: "Accountant",
    department: "Finance & Accounts",
    departmentId: "DEMO-FIN",
    managerId: "DEMO-MGR-FIN",
    hrId: "DEMO-HR-FIN",
    teamLeaderId: "DEMO-TL-FIN",
    email: "maya.thomas@example.com",
    phone: "+91 98765 40009",
    joiningDate: "2024-03-18",
    status: "Active",
  },
  {
    id: "DEMO-MGR-HR",
    name: "Meera Menon",
    role: "Manager",
    designation: "People Operations Manager",
    department: "Human Resources",
    departmentId: "DEMO-HR",
    email: "meera.menon@example.com",
    phone: "+91 98765 40010",
    joiningDate: "2019-10-14",
    status: "Active",
  },
  {
    id: "DEMO-HR-HR",
    name: "Sonal Gupta",
    role: "HR",
    designation: "Senior HR Executive",
    department: "Human Resources",
    departmentId: "DEMO-HR",
    managerId: "DEMO-MGR-HR",
    email: "sonal.gupta@example.com",
    phone: "+91 98765 40011",
    joiningDate: "2022-05-09",
    status: "Active",
  },
  {
    id: "DEMO-TL-HR",
    name: "Amit Verma",
    role: "Team Leader",
    designation: "People Services Lead",
    department: "Human Resources",
    departmentId: "DEMO-HR",
    managerId: "DEMO-MGR-HR",
    hrId: "DEMO-HR-HR",
    email: "amit.verma@example.com",
    phone: "+91 98765 40012",
    joiningDate: "2023-01-23",
    status: "Active",
  },
  {
    id: "DEMO-EMP-HR",
    name: "Divya Singh",
    role: "Employee",
    designation: "HR Coordinator",
    department: "Human Resources",
    departmentId: "DEMO-HR",
    managerId: "DEMO-MGR-HR",
    hrId: "DEMO-HR-HR",
    teamLeaderId: "DEMO-TL-HR",
    email: "divya.singh@example.com",
    phone: "+91 98765 40013",
    joiningDate: "2024-07-01",
    status: "Active",
  },
];

const normalizeRole = (value) => {
  const role = String(value || "Employee").trim();

  if (/team\s*(lead|leader)/i.test(role)) return "Team Leader";
  if (/manager/i.test(role) && !/assistant/i.test(role)) return "Manager";
  if (/human\s*resource|^hr$/i.test(role)) return "HR";
  if (/admin/i.test(role)) return "Administration";

  return role;
};

function normalizeEmployee(record) {
  const role = normalizeRole(
    firstValue(record, ["role", "user_role", "employee_role", "designation"])
  );

  return {
    ...record,
    id: toId(
      firstValue(record, ["id", "employee_id", "employeeId", "user_id", "userId"])
    ),
    name: firstValue(
      record,
      ["name", "full_name", "fullName", "employee_name"],
      "Unnamed employee"
    ),
    role,
    designation: firstValue(
      record,
      ["designation", "job_title", "jobTitle", "position"],
      role
    ),
    department: firstValue(
      record,
      ["department", "department_name", "departmentName"],
      "Unassigned"
    ),
    departmentId: toId(firstValue(record, ["department_id", "departmentId"])),
    managerId: toId(
      firstValue(record, [
        "manager_id",
        "managerId",
        "reporting_manager_id",
        "reportingManagerId",
      ])
    ),
    hrId: toId(
      firstValue(record, ["hr_id", "hrId", "reporting_hr_id", "reportingHrId"])
    ),
    teamLeaderId: toId(
      firstValue(record, ["team_leader_id", "teamLeaderId", "teamlead_id"])
    ),
    email: firstValue(
      record,
      ["email", "work_email", "official_email"],
      "Not provided"
    ),
    phone: firstValue(
      record,
      ["phone", "phone_number", "phoneNumber", "mobile"],
      "Not provided"
    ),
    joiningDate: firstValue(
      record,
      ["joining_date", "joiningDate", "date_of_joining"],
      "Not provided"
    ),
    status: firstValue(
      record,
      ["status", "employment_status", "employmentStatus"],
      "Active"
    ),
  };
}

function normalizeDepartment(record) {
  return {
    ...record,
    id: toId(firstValue(record, ["id", "department_id", "departmentId"])),
    name: firstValue(
      record,
      ["name", "department_name", "departmentName"],
      "Unnamed department"
    ),
    description: firstValue(record, ["description", "overview"], ""),
    status: firstValue(record, ["status", "department_status"], "Active"),
    managerId: toId(
      firstValue(record, ["manager_id", "managerId", "head_id", "headId"])
    ),
  };
}

function buildDepartmentRecords(departmentRows, employees) {
  const records = new Map();

  departmentRows.forEach((row) => {
    const key = String(row.name || row.id || "").trim().toLowerCase();
    if (!key) return;

    const existing = records.get(key);

    records.set(
      key,
      existing
        ? {
            ...existing,
            managerId: existing.managerId || row.managerId || "",
            description: existing.description || row.description || "",
            status: existing.status || row.status || "Active",
          }
        : row
    );
  });

  employees.forEach((employee) => {
    const key = String(employee.department || employee.departmentId || "")
      .trim()
      .toLowerCase();

    if (!key || records.has(key)) return;

    records.set(key, {
      id: employee.departmentId || employee.department,
      name: employee.department,
      status: "Active",
      managerId: "",
    });
  });

  return [...records.values()].map((department) => {
    const members = employees.filter((employee) =>
      department.id && employee.departmentId
        ? employee.departmentId === department.id ||
          employee.department === department.name
        : employee.department === department.name
    );

    const manager =
      employees.find((employee) =>
        department.managerId
          ? employee.id === department.managerId
          : employee.role === "Manager" &&
            (employee.department === department.name ||
              employee.departmentId === department.id)
      ) ||
      employees.find((employee) =>
        members.some((member) => member.managerId === employee.id)
      );

    const hrMembers = members.filter((employee) => employee.role === "HR");
    const teamLeaders = members.filter(
      (employee) => employee.role === "Team Leader"
    );

    return {
      ...department,
      managerId: department.managerId || manager?.id || "",
      manager,
      members,
      employeeCount: members.length,
      hrCount: hrMembers.length,
      teamLeaderCount: teamLeaders.length,
    };
  });
}

export async function fetchDepartmentHierarchy() {
  const fallback = getFallbackDepartmentHierarchy();

  return {
    ...fallback,
    source: "local-demo",
  };
}

export function getFallbackDepartmentHierarchy() {
  const employees = [
    ...getOrganizationEmployees(),
    ...sampleDepartmentEmployees,
  ].map(normalizeEmployee);

  let savedDepartments = [];

  try {
    const parsed = JSON.parse(
      localStorage.getItem("hrms-department-records") || "[]"
    );

    savedDepartments = Array.isArray(parsed)
      ? parsed.map(normalizeDepartment)
      : [];
  } catch (error) {
    console.error("Unable to load saved department records.", error);
  }

  return {
    source: "local-demo",
    employees,
    departments: buildDepartmentRecords(
      [...sampleDepartmentRecords, ...savedDepartments],
      employees
    ),
  };
}

export async function saveDepartment(department) {
  const existing = (() => {
    try {
      const parsed = JSON.parse(
        localStorage.getItem("hrms-department-records") || "[]"
      );
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const localRecord = {
    ...department,
    id: department.id || `LOCAL-DEPT-${Date.now()}`,
    managerId: department.managerId || "",
  };

  const updated = existing.filter(
    (item) => String(item.id) !== String(localRecord.id)
  );

  localStorage.setItem(
    "hrms-department-records",
    JSON.stringify([...updated, localRecord])
  );

  return {
    source: "local-demo",
    data: localRecord,
  };
}

export async function updateDepartmentMembership(
  department,
  employeeIds,
  managerId
) {
  const assignments = new Set(employeeIds.map((id) => String(id)));
  const localRecords = readEmployeeRecords();

  const nextRecords = localRecords.map((employee) =>
    assignments.has(String(employee.id))
      ? {
          ...employee,
          department: department.name,
          departmentId: department.id,
          managerId: managerId || employee.managerId || "",
        }
      : employee
  );

  saveEmployeeRecords(nextRecords);

  let savedDepartments = [];

  try {
    const parsed = JSON.parse(
      localStorage.getItem("hrms-department-records") || "[]"
    );

    savedDepartments = Array.isArray(parsed) ? parsed : [];
  } catch {
    savedDepartments = [];
  }

  const updatedDepartments = savedDepartments.some(
    (item) => String(item.id) === String(department.id)
  )
    ? savedDepartments.map((item) =>
        String(item.id) === String(department.id)
          ? {
              ...item,
              managerId: managerId || item.managerId || "",
            }
          : item
      )
    : [
        ...savedDepartments,
        {
          ...department,
          managerId: managerId || department.managerId || "",
        },
      ];

  localStorage.setItem(
    "hrms-department-records",
    JSON.stringify(updatedDepartments)
  );

  return {
    source: "local-demo",
    records: nextRecords,
  };
}