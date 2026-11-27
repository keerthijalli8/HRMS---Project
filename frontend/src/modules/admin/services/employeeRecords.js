import initialEmployeeData from "../data/employeeData";

const EMPLOYEE_RECORDS_KEY = "hrms-employee-records";

export function readEmployeeRecords() {
  try {
    const savedRecords = localStorage.getItem(EMPLOYEE_RECORDS_KEY);
    if (!savedRecords) return initialEmployeeData;

    const parsedRecords = JSON.parse(savedRecords);
    if (!Array.isArray(parsedRecords)) {
      throw new TypeError("Saved employee records must be an array.");
    }

    const savedById = new Map(parsedRecords.map((record) => [record.id, record]));
    const initialIds = new Set(initialEmployeeData.map((employee) => employee.id));
    return [
      ...initialEmployeeData.map((employee) => ({
        ...employee,
        ...(savedById.get(employee.id) || {}),
      })),
      ...parsedRecords.filter((record) => !initialIds.has(record.id)),
    ];
  } catch (error) {
    console.error("Unable to load saved employee records.", error);
    return initialEmployeeData;
  }
}

export function saveEmployeeRecords(records) {
  localStorage.setItem(EMPLOYEE_RECORDS_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event("hrms-employees-updated"));
}
