/**
 * Holiday Calendar Service & Data Store
 * Manages Indian National, Festival, Regional (Telangana & AP), Optional, and Company holidays.
 * Supports multi-year configuration, CSV import/export, role scoping, and attendance/leave integration.
 * Ready for future FastAPI + PostgreSQL REST endpoints.
 */

const STORAGE_KEY = "hrms_holidays_v1";
const EVENT_NAME = "hrms_holidays_updated";

// Standard Holiday Types & Categories
export const HOLIDAY_TYPES = [
  "National",
  "Festival",
  "Regional",
  "Optional",
  "Company"
];

export const HOLIDAY_CATEGORIES = [
  "Gazetted Holiday",
  "Public Holiday",
  "State Special (Telangana / AP)",
  "Restricted / Optional",
  "Corporate Off"
];

export const APPLICABLE_LOCATIONS = [
  "All India",
  "Telangana",
  "Andhra Pradesh",
  "Karnataka",
  "Maharashtra",
  "Corporate Hubs"
];

// Realistic Sample Holiday Data for India (Configured for 2026 & 2027)
const DEFAULT_HOLIDAYS = [
  // ================= 2026 HOLIDAYS =================
  {
    id: "HOL-2026-001",
    name: "Republic Day",
    date: "2026-01-26",
    year: 2026,
    dayOfWeek: "Monday",
    type: "National",
    category: "Gazetted Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "Honoring the adoption of the Constitution of India in 1950. Mandatory pan-India paid holiday.",
    isOptional: false,
    repeatAnnually: true,
    status: "Active"
  },
  {
    id: "HOL-2026-002",
    name: "Maha Shivratri",
    date: "2026-02-15",
    year: 2026,
    dayOfWeek: "Sunday",
    type: "Festival",
    category: "Public Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "Major Hindu festival dedicated to the devotion of Lord Shiva across India.",
    isOptional: false,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2026-003",
    name: "Holi (Festival of Colors)",
    date: "2026-03-04",
    year: 2026,
    dayOfWeek: "Wednesday",
    type: "Festival",
    category: "Gazetted Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "Celebration of the arrival of spring, victory of good over evil, and festive colors.",
    isOptional: false,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2026-004",
    name: "Ugadi / Telugu New Year",
    date: "2026-03-19",
    year: 2026,
    dayOfWeek: "Thursday",
    type: "Regional",
    category: "State Special (Telangana / AP)",
    location: "Telangana",
    departments: ["All Departments"],
    description: "New Year's Day according to the Hindu lunisolar calendar for Telangana and Andhra Pradesh.",
    isOptional: false,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2026-005",
    name: "Eid-ul-Fitr (Ramzan)",
    date: "2026-03-20",
    year: 2026,
    dayOfWeek: "Friday",
    type: "Festival",
    category: "Gazetted Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "Islamic festival marking the end of the sacred month of dawn-to-sunset fasting.",
    isOptional: false,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2026-006",
    name: "Good Friday",
    date: "2026-04-03",
    year: 2026,
    dayOfWeek: "Friday",
    type: "Festival",
    category: "Gazetted Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "Christian commemoration of the crucifixion and resurrection of Jesus Christ.",
    isOptional: false,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2026-007",
    name: "May Day / Workers' Day",
    date: "2026-05-01",
    year: 2026,
    dayOfWeek: "Friday",
    type: "National",
    category: "Public Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "International Labor Day acknowledging the dedication and contributions of workers.",
    isOptional: false,
    repeatAnnually: true,
    status: "Active"
  },
  {
    id: "HOL-2026-007B",
    name: "Telangana Formation Day",
    date: "2026-06-02",
    year: 2026,
    dayOfWeek: "Tuesday",
    type: "Regional",
    category: "State Special (Telangana)",
    location: "Telangana",
    departments: ["All Departments"],
    description: "Official Telangana statehood celebration commemorating the formation of Telangana in 2014.",
    isOptional: false,
    repeatAnnually: true,
    status: "Active"
  },
  {
    id: "HOL-2026-008",
    name: "Bakrid / Eid-ul-Adha",
    date: "2026-05-27",
    year: 2026,
    dayOfWeek: "Wednesday",
    type: "Festival",
    category: "Gazetted Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "Feast of the Sacrifice observed with prayers and community charity.",
    isOptional: false,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2026-009",
    name: "Bonalu Festival (Telangana)",
    date: "2026-07-13",
    year: 2026,
    dayOfWeek: "Monday",
    type: "Regional",
    category: "State Special (Telangana / AP)",
    location: "Telangana",
    departments: ["All Departments"],
    description: "Traditional Hindu festival centering on Goddess Mahakali celebrated widely in Hyderabad and Secunderabad.",
    isOptional: false,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2026-010",
    name: "Independence Day",
    date: "2026-08-15",
    year: 2026,
    dayOfWeek: "Saturday",
    type: "National",
    category: "Gazetted Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "National celebration of India's independence from British rule on 15 August 1947.",
    isOptional: false,
    repeatAnnually: true,
    status: "Active"
  },
  {
    id: "HOL-2026-011",
    name: "Milad-un-Nabi (Eid Milad)",
    date: "2026-08-25",
    year: 2026,
    dayOfWeek: "Tuesday",
    type: "Festival",
    category: "Public Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "Observance of the birthday of the Prophet Muhammad.",
    isOptional: false,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2026-012",
    name: "Raksha Bandhan",
    date: "2026-08-28",
    year: 2026,
    dayOfWeek: "Friday",
    type: "Optional",
    category: "Restricted / Optional",
    location: "All India",
    departments: ["All Departments"],
    description: "Traditional festival celebrating the bonding between brothers and sisters.",
    isOptional: true,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2026-013",
    name: "Sri Krishna Janmashtami",
    date: "2026-09-04",
    year: 2026,
    dayOfWeek: "Friday",
    type: "Festival",
    category: "Public Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "Annual Hindu festival celebrating the birth of Lord Krishna.",
    isOptional: false,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2026-014",
    name: "Vinayaka / Ganesh Chaturthi",
    date: "2026-09-14",
    year: 2026,
    dayOfWeek: "Monday",
    type: "Festival",
    category: "Public Holiday",
    location: "Telangana",
    departments: ["All Departments"],
    description: "10-day festival honoring Lord Ganesha with grand processions across Hyderabad & Deccan.",
    isOptional: false,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2026-015",
    name: "Mahatma Gandhi Jayanti",
    date: "2026-10-02",
    year: 2026,
    dayOfWeek: "Friday",
    type: "National",
    category: "Gazetted Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "National tribute commemorating Mahatma Gandhi, the Father of the Nation.",
    isOptional: false,
    repeatAnnually: true,
    status: "Active"
  },
  {
    id: "HOL-2026-016",
    name: "Saddula Bathukamma (Telangana)",
    date: "2026-10-10",
    year: 2026,
    dayOfWeek: "Saturday",
    type: "Regional",
    category: "State Special (Telangana / AP)",
    location: "Telangana",
    departments: ["All Departments"],
    description: "The grand floral festival of Telangana representing cultural heritage and nature worship.",
    isOptional: false,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2026-017",
    name: "Dussehra (Vijaya Dashami)",
    date: "2026-10-20",
    year: 2026,
    dayOfWeek: "Tuesday",
    type: "Festival",
    category: "Gazetted Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "Celebration of the victory of Lord Rama over Ravana and Durga over Mahishasura.",
    isOptional: false,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2026-018",
    name: "Karwa Chauth",
    date: "2026-10-29",
    year: 2026,
    dayOfWeek: "Thursday",
    type: "Optional",
    category: "Restricted / Optional",
    location: "All India",
    departments: ["All Departments"],
    description: "Traditional fasting day observed by married women across North and Western India.",
    isOptional: true,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2026-019",
    name: "Diwali (Deepavali)",
    date: "2026-11-08",
    year: 2026,
    dayOfWeek: "Sunday",
    type: "Festival",
    category: "Gazetted Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "The Festival of Lights celebrating prosperity, wisdom, and joy across India.",
    isOptional: false,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2026-020",
    name: "Bhai Dooj / Govardhan Puja",
    date: "2026-11-10",
    year: 2026,
    dayOfWeek: "Tuesday",
    type: "Optional",
    category: "Restricted / Optional",
    location: "All India",
    departments: ["All Departments"],
    description: "Celebration following Diwali honoring familial bonds.",
    isOptional: true,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2026-021",
    name: "Guru Nanak Jayanti",
    date: "2026-11-24",
    year: 2026,
    dayOfWeek: "Tuesday",
    type: "Festival",
    category: "Gazetted Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "Celebration of the birth anniversary of the first Sikh Guru, Guru Nanak Dev Ji.",
    isOptional: false,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2026-022",
    name: "Christmas Day",
    date: "2026-12-25",
    year: 2026,
    dayOfWeek: "Friday",
    type: "Festival",
    category: "Gazetted Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "Celebration of the birth of Jesus Christ, celebrated globally and across India.",
    isOptional: false,
    repeatAnnually: true,
    status: "Active"
  },
  {
    id: "HOL-2026-023",
    name: "New Year's Eve (Company Off)",
    date: "2026-12-31",
    year: 2026,
    dayOfWeek: "Thursday",
    type: "Company",
    category: "Corporate Off",
    location: "All India",
    departments: ["All Departments"],
    description: "Annual year-end technological maintenance and workforce rest shutdown.",
    isOptional: false,
    repeatAnnually: true,
    status: "Active"
  },

  // ================= 2027 HOLIDAYS =================
  {
    id: "HOL-2027-001",
    name: "Republic Day",
    date: "2027-01-26",
    year: 2027,
    dayOfWeek: "Tuesday",
    type: "National",
    category: "Gazetted Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "Honoring the adoption of the Constitution of India in 1950.",
    isOptional: false,
    repeatAnnually: true,
    status: "Active"
  },
  {
    id: "HOL-2027-002",
    name: "Eid-ul-Fitr (Ramzan)",
    date: "2027-03-10",
    year: 2027,
    dayOfWeek: "Wednesday",
    type: "Festival",
    category: "Gazetted Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "Islamic festival marking the end of fasting.",
    isOptional: false,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2027-003",
    name: "Holi (Festival of Colors)",
    date: "2027-03-22",
    year: 2027,
    dayOfWeek: "Monday",
    type: "Festival",
    category: "Gazetted Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "Celebration of festive colors and spring arrival.",
    isOptional: false,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2027-004",
    name: "Good Friday",
    date: "2027-03-26",
    year: 2027,
    dayOfWeek: "Friday",
    type: "Festival",
    category: "Gazetted Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "Christian solemn observance of the crucifixion of Jesus.",
    isOptional: false,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2027-005",
    name: "Ugadi / Telugu New Year",
    date: "2027-04-07",
    year: 2027,
    dayOfWeek: "Wednesday",
    type: "Regional",
    category: "State Special (Telangana / AP)",
    location: "Telangana",
    departments: ["All Departments"],
    description: "Deccan and Telugu New Year celebration.",
    isOptional: false,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2027-006",
    name: "Independence Day",
    date: "2027-08-15",
    year: 2027,
    dayOfWeek: "Sunday",
    type: "National",
    category: "Gazetted Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "Celebration of 80th Independence Day of India.",
    isOptional: false,
    repeatAnnually: true,
    status: "Active"
  },
  {
    id: "HOL-2027-007",
    name: "Mahatma Gandhi Jayanti",
    date: "2027-10-02",
    year: 2027,
    dayOfWeek: "Saturday",
    type: "National",
    category: "Gazetted Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "Birth anniversary of Mahatma Gandhi.",
    isOptional: false,
    repeatAnnually: true,
    status: "Active"
  },
  {
    id: "HOL-2027-008",
    name: "Dussehra (Vijaya Dashami)",
    date: "2027-10-09",
    year: 2027,
    dayOfWeek: "Saturday",
    type: "Festival",
    category: "Gazetted Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "Grand Vijaya Dashami festival.",
    isOptional: false,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2027-009",
    name: "Diwali (Deepavali)",
    date: "2027-10-29",
    year: 2027,
    dayOfWeek: "Friday",
    type: "Festival",
    category: "Gazetted Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "Festival of Lights and prosperity.",
    isOptional: false,
    repeatAnnually: false,
    status: "Active"
  },
  {
    id: "HOL-2027-010",
    name: "Christmas Day",
    date: "2027-12-25",
    year: 2027,
    dayOfWeek: "Saturday",
    type: "Festival",
    category: "Gazetted Holiday",
    location: "All India",
    departments: ["All Departments"],
    description: "Celebration of the Nativity of Jesus Christ.",
    isOptional: false,
    repeatAnnually: true,
    status: "Active"
  }
];

// Helper to determine day of week name from YYYY-MM-DD
export function getDayOfWeek(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(`${dateStr}T12:00:00+05:30`);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { weekday: "long", timeZone: "Asia/Kolkata" });
  } catch (e) {
    return "";
  }
}

// Loads holidays from localStorage, seeding from default list if empty
export function loadHolidays() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading holiday store:", e);
  }

  // Seed default holidays
  saveHolidays(DEFAULT_HOLIDAYS);
  return DEFAULT_HOLIDAYS;
}

// Saves holidays array to localStorage and broadcasts update event
export function saveHolidays(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { count: list.length } }));
    }
  } catch (e) {
    console.error("Error writing holiday store:", e);
  }
}

// Subscribes to changes in holiday calendar
export function subscribeHolidays(callback) {
  if (typeof window === "undefined") return () => {};

  const handleUpdate = () => callback(loadHolidays());
  const handleStorage = (e) => {
    if (e.key === STORAGE_KEY) callback(loadHolidays());
  };

  window.addEventListener(EVENT_NAME, handleUpdate);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(EVENT_NAME, handleUpdate);
    window.removeEventListener("storage", handleStorage);
  };
}

// Returns filtered list of holidays based on query criteria
export function getFilteredHolidays({
  year = null,
  month = "All", // 1 to 12 or "All"
  state = "All",
  type = "All",
  category = "All",
  search = ""
} = {}) {
  const all = loadHolidays();
  const q = search.trim().toLowerCase();

  return all.filter(h => {
    // Year filter
    if (year != null && year !== "All" && Number(h.year) !== Number(year)) {
      return false;
    }

    // Month filter
    if (month !== "All" && month != null) {
      const hMonth = parseInt(h.date.split("-")[1], 10);
      if (hMonth !== Number(month)) {
        return false;
      }
    }

    // State / Location filter
    if (state !== "All" && state != null) {
      if (h.location !== "All India" && h.location !== state) {
        return false;
      }
    }

    // Type filter
    if (type !== "All" && type != null) {
      if (h.type !== type) return false;
    }

    // Category filter
    if (category !== "All" && category != null) {
      if (h.category !== category) return false;
    }

    // Search query
    if (q) {
      const matchName = (h.name || "").toLowerCase().includes(q);
      const matchDesc = (h.description || "").toLowerCase().includes(q);
      const matchLoc = (h.location || "").toLowerCase().includes(q);
      const matchCat = (h.category || "").toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchLoc && !matchCat) return false;
    }

    return true;
  }).sort((a, b) => a.date.localeCompare(b.date));
}

// Checks if a given YYYY-MM-DD date is an active official company holiday
export function isHolidayDate(dateStr) {
  if (!dateStr) return false;
  const holidays = loadHolidays();
  return holidays.some(h => h.date === dateStr && h.status === "Active" && !h.isOptional);
}

// Returns the holiday object for a given date or null
export function getHolidayByDate(dateStr) {
  if (!dateStr) return null;
  const holidays = loadHolidays();
  return holidays.find(h => h.date === dateStr && h.status === "Active") || null;
}

// Adds a new holiday record
export function addHoliday(holidayData) {
  if (!holidayData.name || !holidayData.date) {
    return { ok: false, error: "Holiday Name and Date are required." };
  }

  const list = loadHolidays();
  const dateObj = new Date(`${holidayData.date}T12:00:00+05:30`);
  const year = dateObj.getFullYear();
  const dayOfWeek = getDayOfWeek(holidayData.date);

  const newHoliday = {
    ...holidayData,
    id: `HOL-${year}-${String(Math.floor(Math.random() * 900) + 100)}`,
    year,
    dayOfWeek,
    status: holidayData.status || "Active",
    type: holidayData.type || "Festival",
    category: holidayData.category || "Public Holiday",
    location: holidayData.location || "All India",
    departments: Array.isArray(holidayData.departments) && holidayData.departments.length > 0 ? holidayData.departments : ["All Departments"],
    isOptional: Boolean(holidayData.isOptional),
    repeatAnnually: Boolean(holidayData.repeatAnnually)
  };

  const updated = [...list, newHoliday].sort((a, b) => a.date.localeCompare(b.date));
  saveHolidays(updated);

  return { ok: true, holiday: newHoliday };
}

// Updates an existing holiday record
export function updateHoliday(id, holidayData) {
  if (!id) return { ok: false, error: "Holiday ID is required." };

  const list = loadHolidays();
  const exists = list.find(h => h.id === id);
  if (!exists) {
    return { ok: false, error: "Holiday not found." };
  }

  const dateObj = new Date(`${holidayData.date}T12:00:00+05:30`);
  const year = dateObj.getFullYear();
  const dayOfWeek = getDayOfWeek(holidayData.date);

  const updatedHoliday = {
    ...exists,
    ...holidayData,
    id,
    year,
    dayOfWeek
  };

  const updated = list.map(h => h.id === id ? updatedHoliday : h).sort((a, b) => a.date.localeCompare(b.date));
  saveHolidays(updated);

  return { ok: true, holiday: updatedHoliday };
}

// Deletes a holiday record
export function deleteHoliday(id) {
  if (!id) return false;
  const list = loadHolidays();
  const updated = list.filter(h => h.id !== id);
  saveHolidays(updated);
  return true;
}

// Calculates working days between two dates, excluding weekends and active official company holidays
export function calculateWorkingDays(startDateStr, endDateStr, location = "All India") {
  if (!startDateStr || !endDateStr) return 0;
  try {
    const start = new Date(`${startDateStr}T00:00:00+05:30`);
    const end = new Date(`${endDateStr}T00:00:00+05:30`);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

    const holidays = loadHolidays();
    const holidayDateSet = new Set(
      holidays
        .filter(h => h.status === "Active" && !h.isOptional && (h.location === "All India" || h.location === location))
        .map(h => h.date)
    );

    let workingDays = 0;
    let curr = new Date(start);

    while (curr <= end) {
      const dow = curr.getDay();
      const currIso = curr.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      const isWeekend = (dow === 0 || dow === 6);
      const isHoliday = holidayDateSet.has(currIso);

      if (!isWeekend && !isHoliday) {
        workingDays++;
      }
      curr.setDate(curr.getDate() + 1);
    }

    return workingDays;
  } catch (e) {
    return 0;
  }
}

// Exports holiday list to CSV string
export function exportHolidaysToCSV(holidays) {
  const headers = [
    "Holiday ID",
    "Holiday Name",
    "Date (YYYY-MM-DD)",
    "Day of Week",
    "Type",
    "Category",
    "Applicable Location",
    "Optional (Yes/No)",
    "Repeat Annually",
    "Status",
    "Description"
  ];

  const escapeCsv = (val) => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = holidays.map(h => [
    escapeCsv(h.id),
    escapeCsv(h.name),
    escapeCsv(h.date),
    escapeCsv(h.dayOfWeek),
    escapeCsv(h.type),
    escapeCsv(h.category),
    escapeCsv(h.location),
    escapeCsv(h.isOptional ? "Yes" : "No"),
    escapeCsv(h.repeatAnnually ? "Yes" : "No"),
    escapeCsv(h.status),
    escapeCsv(h.description)
  ].join(","));

  return [headers.join(","), ...rows].join("\n");
}

// Imports holidays from CSV string
export function importHolidaysFromCSV(csvContent) {
  if (!csvContent || typeof csvContent !== "string") {
    return { ok: false, error: "Invalid CSV content." };
  }

  try {
    const lines = csvContent.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return { ok: false, error: "CSV file must contain a header row and at least one data row." };
    }

    const importedHolidays = [];
    const currentList = loadHolidays();
    const existingDatesAndNames = new Set(currentList.map(h => `${h.date}:${h.name.toLowerCase()}`));

    // Process each line after header
    for (let i = 1; i < lines.length; i++) {
      // Basic CSV token split handling quotes
      const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
      if (row.length < 3) continue;

      const name = row[1] || row[0];
      const date = row[2] || row[1];
      if (!name || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

      const uniqueKey = `${date}:${name.toLowerCase()}`;
      if (existingDatesAndNames.has(uniqueKey)) continue;

      const year = parseInt(date.split("-")[0], 10);
      const dayOfWeek = getDayOfWeek(date);

      const holiday = {
        id: `HOL-${year}-${String(Math.floor(Math.random() * 900) + 100)}`,
        name,
        date,
        year,
        dayOfWeek,
        type: row[4] || "Festival",
        category: row[5] || "Public Holiday",
        location: row[6] || "All India",
        departments: ["All Departments"],
        isOptional: (row[7] || "").toLowerCase() === "yes",
        repeatAnnually: (row[8] || "").toLowerCase() === "yes",
        status: (row[9] || "Active"),
        description: row[10] || "Imported corporate holiday"
      };

      importedHolidays.push(holiday);
      existingDatesAndNames.add(uniqueKey);
    }

    if (importedHolidays.length === 0) {
      return { ok: false, error: "No new valid holidays found in CSV (duplicates or invalid dates were skipped)." };
    }

    const merged = [...currentList, ...importedHolidays].sort((a, b) => a.date.localeCompare(b.date));
    saveHolidays(merged);

    return { ok: true, count: importedHolidays.length };
  } catch (err) {
    return { ok: false, error: `CSV Parsing failed: ${err.message}` };
  }
}
