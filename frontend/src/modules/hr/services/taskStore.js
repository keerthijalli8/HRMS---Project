/**
 * Unified Task Management Store for HRMS India
 * Supports My Tasks, Assigned by Me, Team Monitoring, Kanban, Activity Tracking, and Real-time Alerts.
 * Persisted in localStorage (hrms_tasks_v1).
 * Ready for future FastAPI + PostgreSQL integration.
 */

import { addNotification } from './notificationStore.js';

const STORAGE_KEY = "hrms_tasks_v1";
const EVENT_NAME = "hrms_tasks_updated";

export const TASK_PRIORITIES = ["High", "Medium", "Low"];
export const TASK_STATUSES = ["Pending", "In Progress", "On Hold", "Completed", "Closed"];

const INITIAL_TASKS = [
  {
    id: "TSK-1001",
    title: "Q3 Indian Payroll Compliance Audit",
    description: "Audit PF, ESI, Professional Tax (PT), and TDS deductions for all October payroll runs across Bengaluru and Hyderabad legal entities. Reconcile Form 16 Part A/B and prepare compliance certificate for executive signoff.",
    assigneeId: "EMP-1088",
    assigneeName: "Pooja Patel",
    assigneeRole: "Senior HRBP",
    assigneeDept: "Human Resources",
    assignedByEmpId: "EMP-1001",
    assignedByName: "Meera Reddy",
    assignedByRole: "HR Manager",
    assignedDate: "2026-11-05",
    startDate: "2026-11-06",
    dueDate: "2026-11-12",
    priority: "High",
    status: "In Progress",
    progress: 65,
    instructions: "Please reconcile all Telangana PT brackets against latest official state commercial tax gazettes.",
    attachments: [
      { name: "Oct_Payroll_Summary_Hyd.xlsx", size: "2.4 MB", type: "excel" },
      { name: "Compliance_Checklist_Q3.pdf", size: "540 KB", type: "pdf" }
    ],
    comments: [
      {
        id: "c-1",
        author: "Meera Reddy",
        authorRole: "HR Manager",
        text: "Please prioritize the Hyderabad headcount TDS calculations first.",
        timestamp: "2026-11-06T11:30:00.000Z"
      },
      {
        id: "c-2",
        author: "Pooja Patel",
        authorRole: "Senior HRBP",
        text: "Bengaluru entities verified. Reconciling Hyderabad and Pune branches today.",
        timestamp: "2026-11-08T15:20:00.000Z"
      }
    ],
    activityHistory: [
      { id: "a-1", action: "Task Assigned", by: "Meera Reddy", timestamp: "2026-11-05T09:00:00.000Z" },
      { id: "a-2", action: "Task Started", by: "Pooja Patel", timestamp: "2026-11-06T10:15:00.000Z" },
      { id: "a-3", action: "Progress updated to 65%", by: "Pooja Patel", timestamp: "2026-11-08T15:20:00.000Z" }
    ]
  },
  {
    id: "TSK-1002",
    title: "Kubernetes Cluster Node Migration (Hyderabad Hub)",
    description: "Perform zero-downtime rolling upgrade of AWS EKS worker nodes in ap-south-1 region for HRMS core services and attendance microservice endpoints.",
    assigneeId: "EMP-1145",
    assigneeName: "Sneha Nair",
    assigneeRole: "DevOps Specialist",
    assigneeDept: "Engineering",
    assignedByEmpId: "EMP-1042",
    assignedByName: "Aarav Sharma",
    assignedByRole: "Engineering Manager",
    assignedDate: "2026-11-07",
    startDate: "2026-11-08",
    dueDate: "2026-11-14",
    priority: "High",
    status: "In Progress",
    progress: 80,
    instructions: "Maintain canary traffic splitting to ensure 99.99% uptime during shift-change hours.",
    attachments: [
      { name: "EKS_Upgrade_Playbook_v2.pdf", size: "1.1 MB", type: "pdf" }
    ],
    comments: [
      {
        id: "c-3",
        author: "Aarav Sharma",
        authorRole: "Engineering Manager",
        text: "Make sure backup snapshot is captured before draining worker node pool 2.",
        timestamp: "2026-11-08T09:15:00.000Z"
      }
    ],
    activityHistory: [
      { id: "a-4", action: "Task Assigned", by: "Aarav Sharma", timestamp: "2026-11-07T10:00:00.000Z" },
      { id: "a-5", action: "Task Started", by: "Sneha Nair", timestamp: "2026-11-08T08:30:00.000Z" },
      { id: "a-6", action: "Progress updated to 80%", by: "Sneha Nair", timestamp: "2026-11-09T17:45:00.000Z" }
    ]
  },
  {
    id: "TSK-1003",
    title: "POSH Awareness Training Deck Review",
    description: "Review annual Prevention of Sexual Harassment (POSH) mandatory training deck for FY 26-27 with internal IC committee recommendations.",
    assigneeId: "EMP-1088",
    assigneeName: "Pooja Patel",
    assigneeRole: "Senior HRBP",
    assigneeDept: "Human Resources",
    assignedByEmpId: "EMP-1001",
    assignedByName: "Meera Reddy",
    assignedByRole: "HR Manager",
    assignedDate: "2026-11-09",
    startDate: "2026-11-10",
    dueDate: "2026-11-16",
    priority: "Medium",
    status: "Pending",
    progress: 0,
    instructions: "Ensure updated contact emails of Hyderabad and Bengaluru IC presiding officers are listed.",
    attachments: [
      { name: "POSH_Training_Draft_2026.pptx", size: "4.8 MB", type: "ppt" }
    ],
    comments: [],
    activityHistory: [
      { id: "a-7", action: "Task Assigned", by: "Meera Reddy", timestamp: "2026-11-09T14:00:00.000Z" }
    ]
  },
  {
    id: "TSK-1004",
    title: "Gratuity Valuation Report Preparation",
    description: "Compile employee actuarial liability inputs and service tenure records for annual valuation as mandated under Payment of Gratuity Act 1972.",
    assigneeId: "EMP-1088",
    assigneeName: "Pooja Patel",
    assigneeRole: "Senior HRBP",
    assigneeDept: "Human Resources",
    assignedByEmpId: "EMP-1001",
    assignedByName: "Meera Reddy",
    assignedByRole: "HR Manager",
    assignedDate: "2026-11-01",
    startDate: "2026-11-02",
    dueDate: "2026-11-08", // Overdue by 2 days!
    priority: "High",
    status: "In Progress",
    progress: 40,
    instructions: "Cross-check salary baselines with last 10 months basic+DA amounts.",
    attachments: [
      { name: "Actuarial_Input_Template.xlsx", size: "820 KB", type: "excel" }
    ],
    comments: [
      {
        id: "c-4",
        author: "Meera Reddy",
        authorRole: "HR Manager",
        text: "This is now overdue. Please expedite so auditors can begin review.",
        timestamp: "2026-11-09T09:00:00.000Z"
      }
    ],
    activityHistory: [
      { id: "a-8", action: "Task Assigned", by: "Meera Reddy", timestamp: "2026-11-01T09:00:00.000Z" },
      { id: "a-9", action: "Task Started", by: "Pooja Patel", timestamp: "2026-11-02T11:00:00.000Z" },
      { id: "a-10", action: "Progress updated to 40%", by: "Pooja Patel", timestamp: "2026-11-06T16:30:00.000Z" }
    ]
  },
  {
    id: "TSK-1005",
    title: "Form 12BB Proof Verification Batch #1",
    description: "Validate HRA rent agreements, Section 80C insurance receipts, and Section 80D medical policies uploaded by employees during interim investment proof window.",
    assigneeId: "EMP-1088",
    assigneeName: "Pooja Patel",
    assigneeRole: "Senior HRBP",
    assigneeDept: "Human Resources",
    assignedByEmpId: "EMP-1001",
    assignedByName: "Meera Reddy",
    assignedByRole: "HR Manager",
    assignedDate: "2026-11-03",
    startDate: "2026-11-03",
    dueDate: "2026-11-09",
    priority: "Medium",
    status: "Completed",
    progress: 100,
    instructions: "Ensure landlord PAN is attached for all annual rents exceeding ₹1,00,000.",
    completionRemarks: "Verified all 142 employee declarations for Batch #1. Landlord PAN validated for all applicable HRA claims.",
    completionProof: { name: "Batch1_Verification_Signoff.pdf", size: "450 KB", type: "pdf", uploadedAt: "2026-11-09T18:00:00.000Z" },
    attachments: [],
    comments: [
      {
        id: "c-5",
        author: "Pooja Patel",
        authorRole: "Senior HRBP",
        text: "Completed verification and compiled discrepancy list.",
        timestamp: "2026-11-09T18:05:00.000Z"
      }
    ],
    activityHistory: [
      { id: "a-11", action: "Task Assigned", by: "Meera Reddy", timestamp: "2026-11-03T10:00:00.000Z" },
      { id: "a-12", action: "Task Started", by: "Pooja Patel", timestamp: "2026-11-03T11:30:00.000Z" },
      { id: "a-13", action: "Task Marked as Completed", by: "Pooja Patel", timestamp: "2026-11-09T18:00:00.000Z" }
    ]
  },
  {
    id: "TSK-1006",
    title: "Monsoon Glass Design System Dark Mode Contrast Audit",
    description: "Audit WCAG 2.1 AA color contrast compliance for text, cards, buttons, status pills and SVG sparklines across all application views.",
    assigneeId: "EMP-1234",
    assigneeName: "Devansh Mehta",
    assigneeRole: "Frontend Engineer II",
    assigneeDept: "Engineering",
    assignedByEmpId: "EMP-1042",
    assignedByName: "Aarav Sharma",
    assignedByRole: "Engineering Manager",
    assignedDate: "2026-11-06",
    startDate: "2026-11-07",
    dueDate: "2026-11-11", // Due tomorrow
    priority: "Medium",
    status: "In Progress",
    progress: 50,
    instructions: "Verify muted text `#8da2be` against surface background `#0f1d32`.",
    attachments: [],
    comments: [],
    activityHistory: [
      { id: "a-14", action: "Task Assigned", by: "Aarav Sharma", timestamp: "2026-11-06T11:00:00.000Z" },
      { id: "a-15", action: "Task Started", by: "Devansh Mehta", timestamp: "2026-11-07T09:30:00.000Z" },
      { id: "a-16", action: "Progress updated to 50%", by: "Devansh Mehta", timestamp: "2026-11-09T16:00:00.000Z" }
    ]
  },
  {
    id: "TSK-1007",
    title: "EPF ECR Filing Validation for October",
    description: "Generate Electronic Challan cum Return (ECR) text format file and validate UAN vs Aadhaar seeding status before 15th portal deadline.",
    assigneeId: "EMP-1201",
    assigneeName: "Kavita Rao",
    assigneeRole: "Lead Payroll Accountant",
    assigneeDept: "Finance",
    assignedByEmpId: "EMP-1001",
    assignedByName: "Meera Reddy",
    assignedByRole: "HR Manager",
    assignedDate: "2026-11-07",
    startDate: "2026-11-08",
    dueDate: "2026-11-13",
    priority: "High",
    status: "In Progress",
    progress: 75,
    instructions: "Cross-verify voluntary PF deductions under VPF column.",
    attachments: [],
    comments: [],
    activityHistory: [
      { id: "a-17", action: "Task Assigned", by: "Meera Reddy", timestamp: "2026-11-07T12:00:00.000Z" },
      { id: "a-18", action: "Progress updated to 75%", by: "Kavita Rao", timestamp: "2026-11-09T14:30:00.000Z" }
    ]
  },
  {
    id: "TSK-1008",
    title: "Candidate Background Verification (Tech Team Hires)",
    description: "Conduct credential and past employment verification with external agency for 4 shortlisted frontend and cloud engineers.",
    assigneeId: "EMP-1088",
    assigneeName: "Pooja Patel",
    assigneeRole: "Senior HRBP",
    assigneeDept: "Human Resources",
    assignedByEmpId: "EMP-1001",
    assignedByName: "Meera Reddy",
    assignedByRole: "HR Manager",
    assignedDate: "2026-10-25",
    startDate: "2026-10-26",
    dueDate: "2026-11-02",
    priority: "Low",
    status: "Closed",
    progress: 100,
    instructions: "Check criminal background and educational degrees via Digilocker/vendor API.",
    completionRemarks: "Vendor reports received with clean verification results for all 4 candidates.",
    closedBy: "Meera Reddy",
    closedAt: "2026-11-03T11:00:00.000Z",
    closingNote: "Verified and closed. Good job on swift turnaround.",
    attachments: [],
    comments: [],
    activityHistory: [
      { id: "a-19", action: "Task Assigned", by: "Meera Reddy", timestamp: "2026-10-25T10:00:00.000Z" },
      { id: "a-20", action: "Task Marked as Completed", by: "Pooja Patel", timestamp: "2026-11-02T16:00:00.000Z" },
      { id: "a-21", action: "Task Verified & Closed", by: "Meera Reddy", timestamp: "2026-11-03T11:00:00.000Z" }
    ]
  }
];

export function isTaskOverdue(task) {
  if (!task || task.status === "Completed" || task.status === "Closed") return false;
  if (!task.dueDate) return false;
  const due = new Date(task.dueDate);
  due.setHours(23, 59, 59, 999);
  return due.getTime() < Date.now();
}

export function getTaskDueNotice(task) {
  if (!task || !task.dueDate) return null;
  if (task.status === "Completed") return { text: "Completed", type: "good" };
  if (task.status === "Closed") return { text: "Closed", type: "neutral" };

  const due = new Date(task.dueDate);
  due.setHours(23, 59, 59, 999);
  const now = new Date();
  const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return { text: `Overdue by ${overdueDays}d`, type: "bad", isOverdue: true };
  }
  if (diffDays === 0) {
    return { text: "Due Today", type: "warn", isToday: true };
  }
  if (diffDays === 1) {
    return { text: "Due Tomorrow", type: "warn" };
  }
  if (diffDays <= 3) {
    return { text: `Due in ${diffDays}d`, type: "warn" };
  }
  return { text: `Due in ${diffDays}d`, type: "muted" };
}

export function loadAllTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
      return INITIAL_TASKS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return INITIAL_TASKS;
  } catch (e) {
    console.warn("Failed to load tasks from storage", e);
    return INITIAL_TASKS;
  }
}

export function saveAllTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: tasks }));
  } catch (e) {
    console.error("Failed to save tasks", e);
  }
}

/**
 * Check if the user is authorized to assign and monitor team tasks
 */
export function canUserAssignTasks(user) {
  if (!user) return false;
  const sysRole = (user.systemRole || "").toLowerCase();
  const role = (user.role || "").toLowerCase();
  if (sysRole === "admin" || sysRole.includes("hr") || sysRole.includes("manager") || sysRole.includes("lead")) {
    return true;
  }
  return role.includes("manager") || role.includes("lead") || role.includes("head") || role.includes("hr") || role.includes("architect") || role.includes("admin");
}

/**
 * Filter tasks assigned to the current employee only (My Tasks)
 */
export function getMyTasks(user) {
  const all = loadAllTasks();
  if (!user) return all;
  const empId = user.employeeId || "";
  const name = (user.name || "").trim().toLowerCase();

  return all.filter(t => {
    if (empId && t.assigneeId === empId) return true;
    if (name && (t.assigneeName || "").trim().toLowerCase() === name) return true;
    return false;
  });
}

/**
 * Filter tasks assigned by the supervisor, or all company tasks if Admin/HR Manager
 */
export function getTeamTasks(user) {
  const all = loadAllTasks();
  if (!user) return [];
  const empId = user.employeeId || "";
  const name = (user.name || "").trim().toLowerCase();
  const sysRole = (user.systemRole || "").toLowerCase();
  const role = (user.role || "").toLowerCase();

  const isExecutive = sysRole === "admin" || sysRole === "hr manager" || role.includes("hr manager") || role.includes("director");

  return all.filter(t => {
    if (isExecutive) return true;
    if (empId && t.assignedByEmpId === empId) return true;
    if (name && (t.assignedByName || "").trim().toLowerCase() === name) return true;
    // Also include department tasks if manager of that department
    if (user.dept && t.assigneeDept === user.dept) return true;
    return false;
  });
}

/**
 * Calculate KPI summary stats for a given task list
 */
export function getTaskStats(taskList) {
  const tasks = taskList || [];
  let totalAssigned = tasks.length;
  let pending = 0;
  let inProgress = 0;
  let completed = 0;
  let overdue = 0;

  tasks.forEach(t => {
    if (t.status === "Pending") pending++;
    else if (t.status === "In Progress" || t.status === "On Hold") inProgress++;
    else if (t.status === "Completed" || t.status === "Closed") completed++;

    if (isTaskOverdue(t)) overdue++;
  });

  return { totalAssigned, pending, inProgress, completed, overdue };
}

/**
 * Assign a new task (can assign to multiple employees)
 */
export function createTask(taskData, creatorUser) {
  const all = loadAllTasks();
  const {
    title,
    description,
    assignees = [], // Array of employee objects { id, name, role, dept }
    priority = "Medium",
    startDate,
    dueDate,
    instructions = "",
    attachments = []
  } = taskData;

  const createdTasks = [];
  const baseTime = Date.now();

  assignees.forEach((assignee, index) => {
    const taskId = `TSK-${baseTime.toString().slice(-4)}${index + 1}`;
    const newTask = {
      id: taskId,
      title: title.trim(),
      description: description.trim(),
      assigneeId: assignee.id || assignee.employeeId,
      assigneeName: assignee.name,
      assigneeRole: assignee.role || assignee.designation || "Team Member",
      assigneeDept: assignee.dept || assignee.department || "General",
      assignedByEmpId: creatorUser?.employeeId || "EMP-1001",
      assignedByName: creatorUser?.name || "Meera Reddy",
      assignedByRole: creatorUser?.role || "HR Manager",
      assignedDate: new Date().toISOString().split("T")[0],
      startDate: startDate || new Date().toISOString().split("T")[0],
      dueDate,
      priority,
      status: "Pending",
      progress: 0,
      instructions: instructions ? instructions.trim() : "",
      attachments: attachments || [],
      comments: [],
      activityHistory: [
        {
          id: `a-${Date.now()}-${index}`,
          action: "Task Assigned",
          by: creatorUser?.name || "Supervisor",
          timestamp: new Date().toISOString()
        }
      ]
    };

    createdTasks.push(newTask);

    // Send Notification to Employee
    addNotification({
      title: `New Task: ${newTask.title}`,
      desc: `Assigned by ${newTask.assignedByName} (${newTask.assignedByRole}). Due on ${newTask.dueDate}.`,
      icon: "check-square",
      type: "task",
      targetEmployeeId: newTask.assigneeId,
      taskId: newTask.id
    });
  });

  const updated = [...createdTasks, ...all];
  saveAllTasks(updated);
  return createdTasks;
}

/**
 * Start a task (Employee action)
 */
export function startTask(taskId, user) {
  const all = loadAllTasks();
  const updated = all.map(t => {
    if (t.id === taskId) {
      const newProgress = t.progress === 0 ? 15 : t.progress;
      return {
        ...t,
        status: "In Progress",
        progress: newProgress,
        activityHistory: [
          ...(t.activityHistory || []),
          {
            id: `a-${Date.now()}`,
            action: "Task Started",
            by: user?.name || "Employee",
            timestamp: new Date().toISOString()
          }
        ]
      };
    }
    return t;
  });

  saveAllTasks(updated);

  const task = updated.find(t => t.id === taskId);
  if (task) {
    addNotification({
      title: `Task Started: ${task.title}`,
      desc: `${user?.name || "Employee"} started working on this task.`,
      icon: "play",
      type: "task",
      targetEmployeeId: task.assignedByEmpId,
      taskId: task.id
    });
  }
  return task;
}

/**
 * Update task progress (Employee action)
 */
export function updateTaskProgress(taskId, progress, status, note, user) {
  const all = loadAllTasks();
  const updated = all.map(t => {
    if (t.id === taskId) {
      const historyItem = {
        id: `a-${Date.now()}`,
        action: `Progress updated to ${progress}% (${status})`,
        by: user?.name || "Employee",
        timestamp: new Date().toISOString()
      };
      const comments = note ? [
        ...(t.comments || []),
        {
          id: `c-${Date.now()}`,
          author: user?.name || "Employee",
          authorRole: user?.role || "Team Member",
          text: `Progress update (${progress}%): ${note}`,
          timestamp: new Date().toISOString()
        }
      ] : (t.comments || []);

      return {
        ...t,
        progress: Number(progress),
        status: status || t.status,
        comments,
        activityHistory: [...(t.activityHistory || []), historyItem]
      };
    }
    return t;
  });

  saveAllTasks(updated);

  const task = updated.find(t => t.id === taskId);
  if (task) {
    addNotification({
      title: `Progress Update: ${task.title} (${progress}%)`,
      desc: `${user?.name || "Employee"} updated progress to ${progress}%.${note ? ` Note: "${note}"` : ""}`,
      icon: "trending-up",
      type: "task",
      targetEmployeeId: task.assignedByEmpId,
      taskId: task.id
    });
  }
  return task;
}

/**
 * Mark task as completed with remarks and proof attachment (Employee action)
 */
export function completeTask(taskId, completionRemarks, completionProof, user) {
  const all = loadAllTasks();
  const updated = all.map(t => {
    if (t.id === taskId) {
      return {
        ...t,
        status: "Completed",
        progress: 100,
        completionRemarks: completionRemarks || "Task completed successfully.",
        completionProof: completionProof || null,
        activityHistory: [
          ...(t.activityHistory || []),
          {
            id: `a-${Date.now()}`,
            action: "Task Marked as Completed",
            by: user?.name || "Employee",
            timestamp: new Date().toISOString()
          }
        ]
      };
    }
    return t;
  });

  saveAllTasks(updated);

  const task = updated.find(t => t.id === taskId);
  if (task) {
    addNotification({
      title: `Task Completed: ${task.title}`,
      desc: `${user?.name || "Employee"} completed the task and submitted completion remarks for review.`,
      icon: "check-circle",
      type: "task",
      targetEmployeeId: task.assignedByEmpId,
      taskId: task.id
    });
  }
  return task;
}

/**
 * Verify and close a completed task (Supervisor action)
 */
export function verifyAndCloseTask(taskId, closingNote, supervisor) {
  const all = loadAllTasks();
  const updated = all.map(t => {
    if (t.id === taskId) {
      return {
        ...t,
        status: "Closed",
        closedBy: supervisor?.name || "Supervisor",
        closedAt: new Date().toISOString(),
        closingNote: closingNote || "Verified and approved.",
        activityHistory: [
          ...(t.activityHistory || []),
          {
            id: `a-${Date.now()}`,
            action: "Task Verified & Closed",
            by: supervisor?.name || "Supervisor",
            timestamp: new Date().toISOString()
          }
        ]
      };
    }
    return t;
  });

  saveAllTasks(updated);

  const task = updated.find(t => t.id === taskId);
  if (task) {
    addNotification({
      title: `Task Verified & Closed: ${task.title}`,
      desc: `${supervisor?.name || "Supervisor"} verified and closed your task. "${closingNote || "Great work!"}"`,
      icon: "check-circle",
      type: "task",
      targetEmployeeId: task.assigneeId,
      taskId: task.id
    });
  }
  return task;
}

/**
 * Reassign task with mandatory reason (Supervisor action)
 */
export function reassignTask(taskId, newAssignee, reason, supervisor) {
  const all = loadAllTasks();
  const updated = all.map(t => {
    if (t.id === taskId) {
      return {
        ...t,
        assigneeId: newAssignee.id || newAssignee.employeeId,
        assigneeName: newAssignee.name,
        assigneeRole: newAssignee.role || newAssignee.designation,
        assigneeDept: newAssignee.dept || newAssignee.department,
        activityHistory: [
          ...(t.activityHistory || []),
          {
            id: `a-${Date.now()}`,
            action: `Reassigned to ${newAssignee.name}. Reason: ${reason}`,
            by: supervisor?.name || "Supervisor",
            timestamp: new Date().toISOString()
          }
        ]
      };
    }
    return t;
  });

  saveAllTasks(updated);

  const task = updated.find(t => t.id === taskId);
  if (task) {
    addNotification({
      title: `Task Reassigned: ${task.title}`,
      desc: `Assigned to you by ${supervisor?.name || "Supervisor"}. Reason: ${reason}`,
      icon: "check-square",
      type: "task",
      targetEmployeeId: task.assigneeId,
      taskId: task.id
    });
  }
  return task;
}

/**
 * Change due date with mandatory reason (Supervisor action)
 */
export function changeTaskDueDate(taskId, newDueDate, reason, supervisor) {
  const all = loadAllTasks();
  const updated = all.map(t => {
    if (t.id === taskId) {
      const oldDue = t.dueDate;
      return {
        ...t,
        dueDate: newDueDate,
        activityHistory: [
          ...(t.activityHistory || []),
          {
            id: `a-${Date.now()}`,
            action: `Due date changed from ${oldDue} to ${newDueDate}. Reason: ${reason}`,
            by: supervisor?.name || "Supervisor",
            timestamp: new Date().toISOString()
          }
        ]
      };
    }
    return t;
  });

  saveAllTasks(updated);

  const task = updated.find(t => t.id === taskId);
  if (task) {
    addNotification({
      title: `Task Due Date Updated: ${task.title}`,
      desc: `Due date updated to ${newDueDate} by ${supervisor?.name || "Supervisor"}. Reason: ${reason}`,
      icon: "calendar",
      type: "task",
      targetEmployeeId: task.assigneeId,
      taskId: task.id
    });
  }
  return task;
}

/**
 * Add a comment to task discussion
 */
export function addTaskComment(taskId, commentText, user) {
  if (!commentText || !commentText.trim()) return;
  const all = loadAllTasks();
  let targetTask = null;

  const updated = all.map(t => {
    if (t.id === taskId) {
      const newComment = {
        id: `c-${Date.now()}`,
        author: user?.name || "User",
        authorRole: user?.role || user?.systemRole || "Staff",
        text: commentText.trim(),
        timestamp: new Date().toISOString()
      };
      targetTask = t;
      return {
        ...t,
        comments: [...(t.comments || []), newComment]
      };
    }
    return t;
  });

  saveAllTasks(updated);

  if (targetTask) {
    const isAssignee = user?.employeeId === targetTask.assigneeId;
    const recipientId = isAssignee ? targetTask.assignedByEmpId : targetTask.assigneeId;

    addNotification({
      title: `New Comment on: ${targetTask.title}`,
      desc: `${user?.name || "Colleague"}: "${commentText.trim().slice(0, 70)}${commentText.length > 70 ? "..." : ""}"`,
      icon: "message-square",
      type: "task",
      targetEmployeeId: recipientId,
      taskId: targetTask.id
    });
  }
}

/**
 * Subscribe to task updates
 */
export function subscribeTasks(callback) {
  const handler = () => {
    callback();
  };
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}
