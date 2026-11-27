// Offline Rule-Based HR Chatbot Service (No External API Keys Needed)
export const askGeminiHR = async (userMessage) => {
  // సహజమైన చాట్ అనుభూతి కోసం 400ms చిన్న డిలే
  await new Promise((resolve) => setTimeout(resolve, 400));

  const query = (userMessage || "").toLowerCase().trim();

  if (!query) {
    return "Hello! How can I assist you with Nexora HRMS today?";
  }

  // 1. Greetings
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|namaste)\b/.test(query)) {
    return "Hello! I am Nexora HR Assistant. You can ask me about Leave Policy, Attendance, Payroll, Recruitment, Employee Management, or Offboarding.";
  }

  // 2. Leave & Holidays
  if (query.includes("leave") || query.includes("holiday") || query.includes("sick") || query.includes("casual")) {
    return "Employees get 12 Casual Leaves, 10 Sick Leaves, and 15 Earned Leaves annually. You can apply for leaves or view the holiday calendar under 'Time & Attendance → Leave Management'.";
  }

  // 3. Attendance & Shifts
  if (query.includes("attendance") || query.includes("check in") || query.includes("shift") || query.includes("roster") || query.includes("lop")) {
    return "Standard shift timings are 9:30 AM to 6:30 PM IST. You can track daily check-ins in 'Attendance', view schedules in 'Shifts & Roster', or check Loss of Pay details in 'LOP Management'.";
  }

  // 4. Payroll & Payslips
  if (query.includes("payroll") || query.includes("salary") || query.includes("payslip") || query.includes("bonus") || query.includes("allowance")) {
    return "Salaries are credited on the last working day of every month. Go to 'Payroll & Growth → Payroll' to unlock and download your monthly payslips or view tax deductions.";
  }

  // 5. Employee Management
  if (query.includes("employee") || query.includes("record") || query.includes("manager") || query.includes("add user")) {
    return "HR and Admins can create new employee records, update employment details, or assign reporting managers in the 'Workspace → Employee Management' section.";
  }

  // 6. Recruitment & Hiring
  if (query.includes("recruit") || query.includes("hiring") || query.includes("job") || query.includes("candidate") || query.includes("interview")) {
    return "You can post new job openings, close filled roles, and move applicants across stages (Applied → Interview → Offer → Hired) under 'Administration → Recruitment'.";
  }

  // 7. Offboarding & Resignation
  if (query.includes("offboard") || query.includes("resign") || query.includes("exit") || query.includes("clearance") || query.includes("notice")) {
    return "Notice period is 60 days for full-time employees. You can submit resignations, complete the 4-step IT/Finance clearance checklist, and view exit records in 'Administration → Offboarding'.";
  }

  // 8. Performance & Documents
  if (query.includes("performance") || query.includes("appraisal") || query.includes("document") || query.includes("policy")) {
    return "Performance reviews happen bi-annually in June and December. Company policies, offer letters, and ID proofs can be accessed under 'Payroll & Growth → Documents'.";
  }

  // 9. Thank you / Bye
  if (query.includes("thank") || query.includes("bye") || query.includes("ok")) {
    return "You're welcome! Let me know anytime if you need help navigating Nexora HRMS.";
  }

  // Default Fallback Response
  return "I can help you with Leave Policy, Attendance, Payroll/Payslips, Employee Management, Recruitment, and Offboarding. Please ask a specific HR question or select a module from the sidebar!";
};