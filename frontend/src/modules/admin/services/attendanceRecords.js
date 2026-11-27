const ATTENDANCE_RECORDS_KEY = "hrms-attendance-records-v2";

const recordKey = (record) => `${record.date}:${record.employeeId}`;

export function readAttendanceRecords() {
  try {
    const saved = localStorage.getItem(ATTENDANCE_RECORDS_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      throw new TypeError("Saved attendance records must be an array.");
    }

    const uniqueRecords = new Map();
    parsed.forEach((record) => {
      if (record?.date && record?.employeeId) uniqueRecords.set(recordKey(record), record);
    });
    return [...uniqueRecords.values()];
  } catch (error) {
    console.error("Unable to load attendance records.", error);
    return [];
  }
}

export function readAttendanceRecord(date, employeeId) {
  return readAttendanceRecords().find(
    (record) => record.date === date && record.employeeId === employeeId
  ) || null;
}

export function saveAttendanceRecord(record) {
  if (!record?.date || !record?.employeeId) {
    throw new TypeError("Attendance records require a date and employee ID.");
  }

  const records = readAttendanceRecords();
  const nextRecords = [
    ...records.filter((item) => recordKey(item) !== recordKey(record)),
    record,
  ];
  localStorage.setItem(ATTENDANCE_RECORDS_KEY, JSON.stringify(nextRecords));
  window.dispatchEvent(new Event("hrms-attendance-updated"));
  return record;
}
