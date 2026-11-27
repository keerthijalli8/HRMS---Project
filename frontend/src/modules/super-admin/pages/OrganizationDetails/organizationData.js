export const organizationStatuses = ["Active", "Suspended", "Pending"];

export const initialOrganizations = [
  { id: "ORG-001", name: "Acme Technologies", industry: "Information Technology", contact: "Rahul Sharma", email: "rahul@acme.com", phone: "+91 9876543210", website: "www.acme.com", address: "Hitech City, Hyderabad, Telangana", employees: 245, activeUsers: 220, plan: "Enterprise", billing: "Annual", status: "Active", modules: ["HR Management", "Payroll", "Attendance", "Recruitment"], date: "2026-10-12" },
  { id: "ORG-002", name: "Bluewave Solutions", industry: "Software Development", contact: "Priya Reddy", email: "priya@bluewave.com", phone: "+91 9876543211", website: "www.bluewave.com", address: "Whitefield, Bangalore, Karnataka", employees: 120, activeUsers: 108, plan: "Professional", billing: "Annual", status: "Active", modules: ["HR Management", "Attendance", "Recruitment"], date: "2026-10-18" },
  { id: "ORG-003", name: "Nova Systems", industry: "Manufacturing", contact: "Arjun Kumar", email: "arjun@nova.com", phone: "+91 9876543212", website: "www.novasystems.com", address: "Guindy, Chennai, Tamil Nadu", employees: 45, activeUsers: 30, plan: "Starter", billing: "Monthly", status: "Suspended", modules: ["HR Management", "Attendance"], date: "2026-10-25" },
  { id: "ORG-004", name: "Vertex Digital", industry: "Digital Services", contact: "Sneha Rao", email: "sneha@vertex.com", phone: "+91 9876543213", website: "www.vertexdigital.com", address: "Andheri, Mumbai, Maharashtra", employees: 310, activeUsers: 295, plan: "Enterprise", billing: "Annual", status: "Active", modules: ["HR Management", "Payroll", "Attendance", "Recruitment", "Performance"], date: "2026-11-02" },
  { id: "ORG-005", name: "Cloudbridge Pvt Ltd", industry: "Consulting", contact: "Kiran Patel", email: "kiran@cloudbridge.com", phone: "+91 9876543214", website: "www.cloudbridge.com", address: "Hinjewadi, Pune, Maharashtra", employees: 85, activeUsers: 0, plan: "Professional", billing: "Monthly", status: "Pending", modules: ["HR Management", "Attendance"], date: "2026-11-10" },
];

export const initialBranches = [
  { id: "BR-001", name: "Hyderabad Head Office", orgId: "ORG-001", code: "ACM-HYD", city: "Hyderabad", address: "4th Floor, Cyber Towers, Hitech City, Hyderabad, Telangana 500081", manager: "Rahul Sharma", email: "hyderabad@acme.com", phone: "+91 9876500001", employees: 100, status: "Active" },
  { id: "BR-002", name: "Bangalore Branch", orgId: "ORG-001", code: "ACM-BLR", city: "Bangalore", address: "27, Whitefield Main Road, Bangalore, Karnataka 560066", manager: "Amit Kumar", email: "bangalore@acme.com", phone: "+91 9876500002", employees: 65, status: "Active" },
  { id: "BR-003", name: "Chennai Branch", orgId: "ORG-001", code: "ACM-CHN", city: "Chennai", address: "18, Guindy Industrial Estate, Chennai, Tamil Nadu 600032", manager: "Priya Rao", email: "chennai@acme.com", phone: "+91 9876500003", employees: 80, status: "Active" },
  { id: "BR-004", name: "Bangalore Office", orgId: "ORG-002", code: "BLW-BLR", city: "Bangalore", address: "12, Whitefield IT Park, Bangalore, Karnataka 560066", manager: "Priya Reddy", email: "blr@bluewave.com", phone: "+91 9876500004", employees: 120, status: "Active" },
  { id: "BR-005", name: "Chennai Factory", orgId: "ORG-003", code: "NVA-CHN", city: "Chennai", address: "8, Guindy Industrial Estate, Chennai, Tamil Nadu 600032", manager: "Arjun Kumar", email: "factory@nova.com", phone: "+91 9876500005", employees: 45, status: "Inactive" },
  { id: "BR-006", name: "Mumbai Office", orgId: "ORG-004", code: "VTX-MUM", city: "Mumbai", address: "17, Andheri East, Mumbai, Maharashtra 400069", manager: "Sneha Rao", email: "mumbai@vertex.com", phone: "+91 9876500006", employees: 150, status: "Active" },
  { id: "BR-007", name: "Pune Office", orgId: "ORG-005", code: "CLD-PUN", city: "Pune", address: "21, Hinjewadi Phase 1, Pune, Maharashtra 411057", manager: "Kiran Patel", email: "pune@cloudbridge.com", phone: "+91 9876500007", employees: 85, status: "Pending" },
  { id: "BR-008", name: "Mumbai Development Center", orgId: "ORG-004", code: "VTX-MDC", city: "Mumbai", address: "9, Powai Lake Road, Mumbai, Maharashtra 400076", manager: "Rohit Mehta", email: "powai@vertex.com", phone: "+91 9876500008", employees: 90, status: "Active" },
  { id: "BR-009", name: "Hyderabad Operations Center", orgId: "ORG-004", code: "VTX-HYD", city: "Hyderabad", address: "3, Gachibowli Road, Hyderabad, Telangana 500032", manager: "Ananya Reddy", email: "hyd.ops@vertex.com", phone: "+91 9876500009", employees: 70, status: "Active" },
];

export const initialDepartments = [
  { id: "DEP-001", name: "Human Resources", code: "ACM-HR", orgId: "ORG-001", branchId: "BR-001", head: "Rahul Sharma", email: "hr@acme.com", employees: 25, parentId: "", status: "Active" },
  { id: "DEP-002", name: "Engineering", code: "ACM-ENG", orgId: "ORG-001", branchId: "BR-002", head: "Amit Kumar", email: "engineering@acme.com", employees: 100, parentId: "", status: "Active" },
  { id: "DEP-003", name: "Finance", code: "ACM-FIN", orgId: "ORG-001", branchId: "BR-001", head: "Priya Rao", email: "finance@acme.com", employees: 20, parentId: "", status: "Active" },
  { id: "DEP-004", name: "Development", code: "BLW-DEV", orgId: "ORG-002", branchId: "BR-004", head: "Priya Reddy", email: "dev@bluewave.com", employees: 65, parentId: "", status: "Active" },
  { id: "DEP-005", name: "Quality Assurance", code: "BLW-QA", orgId: "ORG-002", branchId: "BR-004", head: "Arun Das", email: "qa@bluewave.com", employees: 30, parentId: "DEP-004", status: "Active" },
  { id: "DEP-006", name: "Production", code: "NVA-PRD", orgId: "ORG-003", branchId: "BR-005", head: "Arjun Kumar", email: "production@nova.com", employees: 25, parentId: "", status: "Inactive" },
  { id: "DEP-007", name: "Marketing", code: "VTX-MKT", orgId: "ORG-004", branchId: "BR-006", head: "Sneha Rao", email: "marketing@vertex.com", employees: 40, parentId: "", status: "Active" },
  { id: "DEP-008", name: "Consulting", code: "CLD-CON", orgId: "ORG-005", branchId: "BR-007", head: "Kiran Patel", email: "consulting@cloudbridge.com", employees: 35, parentId: "", status: "Pending" },
  { id: "DEP-009", name: "Payroll", code: "ACM-PAY", orgId: "ORG-001", branchId: "BR-001", head: "Neha Sharma", email: "payroll@acme.com", employees: 18, parentId: "DEP-001", status: "Active" },
  { id: "DEP-010", name: "Customer Support", code: "VTX-CS", orgId: "ORG-004", branchId: "BR-008", head: "Rohit Mehta", email: "support@vertex.com", employees: 35, parentId: "", status: "Active" },
  { id: "DEP-011", name: "Operations", code: "VTX-OPS", orgId: "ORG-004", branchId: "BR-009", head: "Ananya Reddy", email: "operations@vertex.com", employees: 50, parentId: "", status: "Active" },
  { id: "DEP-012", name: "Research and Development", code: "NVA-RND", orgId: "ORG-003", branchId: "BR-005", head: "Arjun Kumar", email: "rnd@nova.com", employees: 12, parentId: "", status: "Active" },
];

export const makeId = (prefix, records) => {
  const max = records.reduce((highest, record) => {
    const number = Number(record.id.replace(`${prefix}-`, ""));
    return Number.isFinite(number) ? Math.max(highest, number) : highest;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
};

export const formatDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
