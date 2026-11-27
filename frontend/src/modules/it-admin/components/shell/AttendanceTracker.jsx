
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback
} from 'react';

import { createPortal } from 'react-dom';

import {
  IconDownload,
  IconX
} from '../shared/Icons';

// ============================================================
// ATTENDANCE CONFIGURATION
// ============================================================

const LEAVE_TYPES = ['Casual', 'Sick', 'Annual'];

const DEFAULT_LEAVE_BALANCES = {
  Casual: 12,
  Sick: 10,
  Annual: 21
};

const INDIA_NATIONAL_HOLIDAYS = [
  { month: 1, day: 26, name: 'Republic Day' },
  { month: 8, day: 15, name: 'Independence Day' },
  { month: 10, day: 2, name: 'Gandhi Jayanti' }
];

const ATTENDANCE_HISTORY_EVENT =
  'it-admin:open-attendance-history';

const STORAGE_UPDATE_EVENT =
  'it-admin:attendance-storage-update';

const INPUT_CLASS =
  'min-w-0 rounded-md border border-line bg-surface px-2.5 py-2 text-xs text-ink focus:outline-none focus:border-accent';

const TOOLBAR_BUTTON =
  'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';

// ============================================================
// LOCAL ATTENDANCE ICONS
// ============================================================

function AttendanceIcon({
  name,
  className = 'w-4 h-4'
}) {
  const paths = {
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    location: (
      <>
        <path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),

    checkIn: (
      <>
        <path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" />
        <path d="m10 8 4 4-4 4M14 12H3" />
      </>
    ),

    checkOut: (
      <>
        <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
        <path d="m15 8 4 4-4 4M19 12H8" />
      </>
    ),

    coffee: (
      <>
        <path d="M3 8h14v5a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5Z" />
        <path d="M17 9h2a3 3 0 0 1 0 6h-2M3 22h16M7 2v3M12 2v3" />
      </>
    ),

    play: (
      <path d="m9 5 11 7-11 7Z" />
    ),

    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 10h18M7 14h2M12 14h2M7 17h2" />
      </>
    ),

    check: (
      <path d="m5 12 4 4L19 6" />
    ),

    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6M12 17h.01" />
      </>
    ),

    loader: (
      <path d="M21 12a9 9 0 1 1-9-9" />
    )
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[name] || paths.clock}
    </svg>
  );
}

// ============================================================
// DATE AND TIME UTILITIES
// ============================================================

function getDateKey(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getMonthDateRange(date) {
  return {
    start: getDateKey(
      new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      )
    ),

    end: getDateKey(
      new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
      )
    )
  };
}

function formatTime(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleTimeString(
    [],
    {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }
  );
}

function formatDuration(durationMs) {
  const totalSeconds = Math.floor(
    Math.max(0, durationMs || 0) / 1000
  );

  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds = totalSeconds % 60;

  return [
    hours,
    minutes,
    seconds
  ]
    .map(value =>
      String(value).padStart(2, '0')
    )
    .join(':');
}

function getOfficeHolidayName(
  date,
  officeHolidays = []
) {
  const nationalHoliday =
    INDIA_NATIONAL_HOLIDAYS.find(
      holiday =>
        holiday.month === date.getMonth() + 1 &&
        holiday.day === date.getDate()
    );

  const dateKey = getDateKey(date);

  const officeHoliday = officeHolidays.find(
    holiday => holiday.date === dateKey
  );

  return [
    nationalHoliday?.name,
    officeHoliday?.name
  ]
    .filter(Boolean)
    .join(' · ');
}

function getChargeableLeaveDates(
  startDate,
  endDate,
  officeHolidays = []
) {
  if (
    !startDate ||
    !endDate ||
    startDate > endDate
  ) {
    return [];
  }

  const chargeableDates = [];

  const currentDate = new Date(
    `${startDate}T12:00:00`
  );

  const lastDate = new Date(
    `${endDate}T12:00:00`
  );

  while (currentDate <= lastDate) {
    const weekday = currentDate.getDay();

    if (
      weekday !== 0 &&
      weekday !== 6 &&
      !getOfficeHolidayName(
        currentDate,
        officeHolidays
      )
    ) {
      chargeableDates.push(
        getDateKey(currentDate)
      );
    }

    currentDate.setDate(
      currentDate.getDate() + 1
    );
  }

  return chargeableDates;
}

// ============================================================
// ATTENDANCE CALCULATION UTILITIES
// ============================================================

function getBreakIntervals(record) {
  if (!record) return [];

  if (Array.isArray(record.breaks)) {
    return record.breaks;
  }

  return record.breakStart
    ? [{
        start: record.breakStart,
        end: record.breakEnd || null
      }]
    : [];
}

function getBreakDurationMs(
  record,
  now
) {
  if (!record?.checkIn) return 0;

  const workStart = Date.parse(
    record.checkIn
  );

  const checkout = record.checkOut
    ? Date.parse(record.checkOut)
    : now;

  const workEnd = Number.isFinite(
    checkout
  ) ? checkout : now;

  return getBreakIntervals(record).reduce(
    (total, interval) => {
      const start = Date.parse(
        interval.start
      );

      if (!Number.isFinite(start)) {
        return total;
      }

      const end = interval.end
        ? Date.parse(interval.end)
        : workEnd;

      const effectiveStart =
        Number.isFinite(workStart)
          ? Math.max(start, workStart)
          : start;

      const effectiveEnd = Math.min(
        Number.isFinite(end)
          ? end
          : workEnd,
        workEnd
      );

      return total + Math.max(
        0,
        effectiveEnd - effectiveStart
      );
    },
    0
  );
}

function getGrossDurationMs(
  record,
  now
) {
  if (!record?.checkIn) return 0;

  const start = Date.parse(
    record.checkIn
  );

  if (!Number.isFinite(start)) {
    return 0;
  }

  const end = record.checkOut
    ? Date.parse(record.checkOut)
    : now;

  return Math.max(
    0,
    (
      Number.isFinite(end)
        ? end
        : now
    ) - start
  );
}

function getNetWorkDurationMs(
  record,
  now
) {
  return Math.max(
    0,
    getGrossDurationMs(record, now) -
      getBreakDurationMs(record, now)
  );
}

function normalizeRecord(record) {
  const breaks = getBreakIntervals(
    record
  ).map(interval => ({
    start: interval.start,

    end:
      interval.end ||
      record.checkOut ||
      null
  }));

  return {
    ...record,

    breaks,

    breakStart:
      breaks[0]?.start || null,

    breakEnd:
      breaks[breaks.length - 1]?.end ||
      null
  };
}

function sortRecords(records) {
  return [...records].sort(
    (first, second) =>
      second.date.localeCompare(
        first.date
      )
  );
}

function getTodayRecord(
  records,
  todayKey
) {
  return records.find(
    record => record.date === todayKey
  ) || {
    date: todayKey,
    type: 'attendance',
    checkIn: null,
    checkOut: null,
    checkInLocation: null,
    breaks: [],
    breakStart: null,
    breakEnd: null,
    leaveType: null
  };
}

function getActiveRecord(records) {
  return sortRecords(records).find(
    record =>
      record.type !== 'leave' &&
      record.checkIn &&
      !record.checkOut
  ) || null;
}

function replaceRecord(
  records,
  updatedRecord
) {
  return sortRecords([
    normalizeRecord(updatedRecord),

    ...records.filter(
      record =>
        record.date !== updatedRecord.date
    )
  ]);
}

// ============================================================
// EXISTING SAMPLE HISTORY
// ============================================================

function createSampleRecords() {
  const records = [];

  const today = new Date();

  for (
    let offset = 1;
    offset <= 30;
    offset += 1
  ) {
    const date = new Date(today);

    date.setDate(
      today.getDate() - offset
    );

    if (
      date.getDay() === 0 ||
      date.getDay() === 6
    ) {
      continue;
    }

    const record = {
      date: getDateKey(date),
      type: 'attendance',
      source: 'sample',
      checkIn: null,
      checkOut: null,
      checkInLocation: null,
      breaks: [],
      breakStart: null,
      breakEnd: null,
      leaveType: null
    };

    if (offset === 8) {
      record.type = 'leave';
      record.leaveType = 'Casual leave';
    } else {
      const checkIn = new Date(date);

      checkIn.setHours(
        9,
        offset % 20,
        0,
        0
      );

      const checkOut = new Date(date);

      checkOut.setHours(
        17,
        45 + (offset % 15),
        0,
        0
      );

      const breakStart = new Date(date);

      breakStart.setHours(
        13,
        0,
        0,
        0
      );

      const breakEnd = new Date(date);

      breakEnd.setHours(
        13,
        30,
        0,
        0
      );

      record.checkIn =
        checkIn.toISOString();

      record.checkOut =
        checkOut.toISOString();

      record.breakStart =
        breakStart.toISOString();

      record.breakEnd =
        breakEnd.toISOString();

      record.breaks = [{
        start: record.breakStart,
        end: record.breakEnd
      }];
    }

    records.push(record);
  }

  return records;
}

// ============================================================
// PERSISTENT LOCAL STORAGE
// ============================================================

function useLocalData(
  storageKey,
  createDefaultValue,
  normalizeValue,
  showToast
) {
  const toastRef = useRef(showToast);

  toastRef.current = showToast;

  const [initialState] = useState(() => {
    try {
      const saved =
        window.localStorage.getItem(
          storageKey
        );

      const value = saved === null
        ? createDefaultValue()
        : normalizeValue(
            JSON.parse(saved)
          );

      return {
        value,
        ready: true,
        error: null,
        isNew: saved === null
      };
    } catch (error) {
      return {
        value: createDefaultValue(),
        ready: false,
        error: error.message,
        isNew: false
      };
    }
  });

  const [value, setValue] = useState(
    initialState.value
  );

  const [ready, setReady] = useState(
    initialState.ready
  );

  const valueRef = useRef(
    initialState.value
  );

  const readyRef = useRef(
    initialState.ready
  );

  const normalizerRef = useRef(
    normalizeValue
  );

  normalizerRef.current = normalizeValue;

  useEffect(() => {
    if (initialState.error) {
      toastRef.current?.(
        `Could not load saved data: ${initialState.error}`
      );

      return;
    }

    if (!initialState.isNew) return;

    try {
      if (
        window.localStorage.getItem(
          storageKey
        ) === null
      ) {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify(
            initialState.value
          )
        );
      }
    } catch (error) {
      readyRef.current = false;
      setReady(false);

      toastRef.current?.(
        'Local storage is unavailable. Records cannot be saved.'
      );
    }
  }, [
    storageKey,
    initialState
  ]);

  useEffect(() => {
    const synchronize = event => {
      const changedKey =
        event.type === 'storage'
          ? event.key
          : event.detail?.key;

      if (
        changedKey !== storageKey &&
        changedKey !== null
      ) {
        return;
      }

      try {
        const saved =
          window.localStorage.getItem(
            storageKey
          );

        if (saved === null) {
          readyRef.current = false;
          setReady(false);
          return;
        }

        const nextValue =
          normalizerRef.current(
            JSON.parse(saved)
          );

        valueRef.current = nextValue;

        readyRef.current = true;

        setValue(nextValue);

        setReady(true);
      } catch {
        readyRef.current = false;
        setReady(false);
      }
    };

    window.addEventListener(
      'storage',
      synchronize
    );

    window.addEventListener(
      STORAGE_UPDATE_EVENT,
      synchronize
    );

    return () => {
      window.removeEventListener(
        'storage',
        synchronize
      );

      window.removeEventListener(
        STORAGE_UPDATE_EVENT,
        synchronize
      );
    };
  }, [storageKey]);

  const update = useCallback(
    updater => {
      if (!readyRef.current) {
        toastRef.current?.(
          'Saved data is unavailable. Reload the page and try again.'
        );

        return false;
      }

      try {
        const saved =
          window.localStorage.getItem(
            storageKey
          );

        if (saved === null) {
          throw new Error(
            'Saved data was removed.'
          );
        }

        const latest =
          normalizerRef.current(
            JSON.parse(saved)
          );

        const nextValue =
          typeof updater === 'function'
            ? updater(latest)
            : updater;

        if (nextValue === latest) {
          return false;
        }

        window.localStorage.setItem(
          storageKey,
          JSON.stringify(nextValue)
        );

        valueRef.current = nextValue;

        setValue(nextValue);

        window.dispatchEvent(
          new CustomEvent(
            STORAGE_UPDATE_EVENT,
            {
              detail: {
                key: storageKey
              }
            }
          )
        );

        return true;
      } catch (error) {
        toastRef.current?.(
          `Could not save data: ${error.message}`
        );

        return false;
      }
    },
    [storageKey]
  );

  return {
    value,
    update,
    ready,
    valueRef
  };
}

// ============================================================
// STORAGE VALIDATION
// ============================================================

function validateAttendanceRecords(
  value
) {
  if (
    !Array.isArray(value) ||
    value.some(
      record =>
        !record ||
        typeof record.date !== 'string'
    )
  ) {
    throw new Error(
      'Stored attendance records are invalid.'
    );
  }

  return value.map(normalizeRecord);
}

function validateLeaveData(value) {
  if (
    !value ||
    !Array.isArray(value.requests)
  ) {
    throw new Error(
      'Stored leave records are invalid.'
    );
  }

  const balances = {};

  LEAVE_TYPES.forEach(type => {
    const balance =
      value.balances?.[type];

    if (
      !Number.isFinite(balance) ||
      balance < 0
    ) {
      throw new Error(
        `Invalid ${type} leave balance.`
      );
    }

    balances[type] = balance;
  });

  return {
    balances,
    requests: value.requests
  };
}

function validateOfficeHolidays(value) {
  if (
    !Array.isArray(value) ||
    value.some(item =>
      !item ||
      typeof item.name !== 'string' ||
      !item.name.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(
        item.date
      ) ||
      !Number.isFinite(
        Date.parse(
          `${item.date}T12:00:00`
        )
      )
    )
  ) {
    throw new Error(
      'Stored office holidays are invalid.'
    );
  }

  return value;
}

// ============================================================
// BROWSER LOCATION ACCESS
// ============================================================

function requestCurrentLocation() {
  return new Promise(
    (resolve, reject) => {
      if (!window.isSecureContext) {
        reject(
          new Error(
            'Location access requires HTTPS or localhost.'
          )
        );

        return;
      }

      if (!navigator.geolocation) {
        reject(
          new Error(
            'Your browser does not support location access.'
          )
        );

        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          const {
            latitude,
            longitude,
            accuracy
          } = position.coords;

          if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
          ) {
            reject(
              new Error(
                'A valid location could not be captured.'
              )
            );

            return;
          }

          resolve({
            latitude: Number(
              latitude.toFixed(6)
            ),

            longitude: Number(
              longitude.toFixed(6)
            ),

            accuracy: Number.isFinite(
              accuracy
            )
              ? Math.round(accuracy)
              : null,

            capturedAt:
              new Date().toISOString(),

            source:
              'browser-geolocation'
          });
        },

        error => {
          const messages = {
            1: 'Location permission was denied. Allow location access in your browser and try again.',

            2: 'Your current location is unavailable. Enable device location services and try again.',

            3: 'Location request timed out. Please try again.'
          };

          reject(
            new Error(
              messages[error.code] ||
              'Unable to capture your location.'
            )
          );
        },

        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    }
  );
}

// ============================================================
// LOCATION DISPLAY
// ============================================================

function LocationDetails({
  location
}) {
  if (!location) {
    return (
      <span className="text-xs text-muted">
        Location not captured
      </span>
    );
  }

  return (
    <div className="space-y-1">

      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">

        <AttendanceIcon
          name="location"
          className="w-3.5 h-3.5"
        />

        Location captured

      </div>

      <p className="text-xs text-muted font-data">
        Latitude: {location.latitude}
      </p>

      <p className="text-xs text-muted font-data">
        Longitude: {location.longitude}
      </p>

      {Number.isFinite(
        location.accuracy
      ) && (
        <p className="text-xs text-muted">
          Estimated accuracy:
          {' '}
          {location.accuracy} m
        </p>
      )}

    </div>
  );
}

// ============================================================
// ATTENDANCE HISTORY MODAL
// ============================================================

function AttendanceHistoryModal({
  userName,
  records,
  leaveBalances,
  leaveRequests,
  officeHolidays = [],
  now,
  onClose,
  onExport,
  onCreateLeaveRequest,
  onApproveLeave,
  onRejectLeave,
  onAddOfficeHoliday,
  onRemoveOfficeHoliday
}) {
  const [visibleMonth, setVisibleMonth] =
    useState(() => {
      const today = new Date();

      return new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
    });

  const [dateRange, setDateRange] =
    useState(() =>
      getMonthDateRange(new Date())
    );

  const [rangeAnchor, setRangeAnchor] =
    useState(null);

  const [selectedDate, setSelectedDate] =
    useState(
      getDateKey(new Date())
    );

  const [leaveType, setLeaveType] =
    useState('Casual');

  const [leaveStartDate, setLeaveStartDate] =
    useState(() => {
      const tomorrow = new Date(now);

      tomorrow.setDate(
        tomorrow.getDate() + 1
      );

      return getDateKey(tomorrow);
    });

  const [leaveEndDate, setLeaveEndDate] =
    useState(leaveStartDate);

  const [holidayDate, setHolidayDate] =
    useState('');

  const [holidayName, setHolidayName] =
    useState('');

  const closeButtonRef = useRef(null);

  const recordsByDate = useMemo(
    () => new Map(
      records.map(record => [
        record.date,
        record
      ])
    ),
    [records]
  );

  const firstWeekday = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1
  ).getDay();

  const dayCount = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0
  ).getDate();

  const calendarCells = [
    ...Array(firstWeekday).fill(null),

    ...Array.from(
      { length: dayCount },
      (_, index) => index + 1
    )
  ];

  const selectedRecord =
    recordsByDate.get(selectedDate);

  const filteredRecords =
    sortRecords(records).filter(
      record =>
        (
          !dateRange.start ||
          record.date >= dateRange.start
        ) &&
        (
          !dateRange.end ||
          record.date <= dateRange.end
        )
    );

  const chargeableLeaveDays =
    getChargeableLeaveDates(
      leaveStartDate,
      leaveEndDate,
      officeHolidays
    ).length;

  const visibleMonthHolidays =
    Array.from(
      { length: dayCount },
      (_, index) => {
        const date = new Date(
          visibleMonth.getFullYear(),
          visibleMonth.getMonth(),
          index + 1
        );

        return {
          date,
          name: getOfficeHolidayName(
            date,
            officeHolidays
          )
        };
      }
    ).filter(holiday => holiday.name);

  useEffect(() => {
    const previousFocus =
      document.activeElement;

    closeButtonRef.current?.focus();

    return () => {
      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        onClose();
      }

      if (event.key === 'Tab') {
        const modal =
          document.querySelector(
            '[data-attendance-modal] section[role="dialog"]'
          );

        const elements = Array.from(
          modal?.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]'
          ) || []
        ).filter(
          element =>
            element.getClientRects().length
        );

        if (!elements.length) return;

        const first = elements[0];

        const last =
          elements[elements.length - 1];

        if (
          event.shiftKey &&
          document.activeElement === first
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === last
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
  }, [onClose]);

  const shiftMonth = direction => {
    const nextMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + direction,
      1
    );

    setVisibleMonth(nextMonth);

    setSelectedDate(
      getDateKey(nextMonth)
    );

    setDateRange(
      getMonthDateRange(nextMonth)
    );

    setRangeAnchor(null);
  };

  const selectCalendarDate = dateKey => {
    setSelectedDate(dateKey);

    if (!rangeAnchor) {
      setDateRange({
        start: dateKey,
        end: dateKey
      });

      setRangeAnchor(dateKey);

      return;
    }

    setDateRange({
      start:
        rangeAnchor < dateKey
          ? rangeAnchor
          : dateKey,

      end:
        rangeAnchor < dateKey
          ? dateKey
          : rangeAnchor
    });

    setRangeAnchor(null);
  };

  const updateRangeStart = start => {
    setRangeAnchor(null);

    setDateRange(current => ({
      start,

      end:
        start &&
        current.end &&
        start > current.end
          ? start
          : current.end
    }));
  };

  const updateRangeEnd = end => {
    setRangeAnchor(null);

    setDateRange(current => ({
      start:
        end &&
        current.start &&
        end < current.start
          ? end
          : current.start,

      end
    }));
  };

  const updateLeaveStartDate = start => {
    setLeaveStartDate(start);

    if (
      start &&
      start > leaveEndDate
    ) {
      setLeaveEndDate(start);
    }
  };

  const updateLeaveEndDate = end => {
    setLeaveEndDate(end);

    if (
      end &&
      end < leaveStartDate
    ) {
      setLeaveStartDate(end);
    }
  };

  const submitLeaveRequest = event => {
    event.preventDefault();

    if (
      !leaveStartDate ||
      !leaveEndDate ||
      leaveStartDate > leaveEndDate
    ) {
      return;
    }

    onCreateLeaveRequest({
      leaveType,

      startDate: leaveStartDate,

      endDate: leaveEndDate
    });
  };

  const submitOfficeHoliday = event => {
    event.preventDefault();

    const name = holidayName.trim();

    if (!holidayDate || !name) return;

    const result = onAddOfficeHoliday({
      date: holidayDate,
      name
    });

    if (result) {
      setHolidayDate('');
      setHolidayName('');
    }
  };

  // ==========================================================
  // HISTORY MODAL RENDER
  // ==========================================================

  return createPortal(
    <div
      data-attendance-modal
      className="mod-it fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={event => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendance-history-title"
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
      >

        {/* MODAL HEADER */}

        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">

          <div>

            <h2
              id="attendance-history-title"
              className="font-display text-xl font-bold text-ink"
            >
              Attendance History
            </h2>

            <p className="mt-1 text-sm text-muted">
              {userName} · Individual attendance records
            </p>

          </div>

          <div className="flex shrink-0 items-center gap-2">

            <button
              type="button"
              onClick={() =>
                onExport(filteredRecords)
              }
              className="inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/20"
            >

              <IconDownload className="h-4 w-4" />

              Export CSV

            </button>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close attendance history"
              className="rounded-lg p-2 text-muted hover:bg-surface2 hover:text-ink"
            >

              <IconX className="h-5 w-5" />

            </button>

          </div>

        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-y-auto p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">

          {/* ATTENDANCE CALENDAR */}

          <section
            aria-label="Attendance calendar"
            className="rounded-xl border border-line bg-surface2/30 p-4"
          >

            <div className="mb-4 flex items-center justify-between gap-2">

              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                className="rounded-lg border border-line px-3 py-1.5 text-lg text-ink hover:bg-surface2"
              >
                ‹
              </button>

              <h3 className="font-display text-base font-bold text-ink">

                {visibleMonth.toLocaleDateString(
                  undefined,
                  {
                    month: 'long',
                    year: 'numeric'
                  }
                )}

              </h3>

              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                className="rounded-lg border border-line px-3 py-1.5 text-lg text-ink hover:bg-surface2"
              >
                ›
              </button>

            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-muted">

              {[
                'Sun',
                'Mon',
                'Tue',
                'Wed',
                'Thu',
                'Fri',
                'Sat'
              ].map(day => (
                <span
                  key={day}
                  className="py-2"
                >
                  {day}
                </span>
              ))}

            </div>

            <div className="grid grid-cols-7 gap-1">

              {calendarCells.map(
                (day, index) => {
                  if (!day) {
                    return (
                      <span
                        key={`empty-${index}`}
                      />
                    );
                  }

                  const date = new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth(),
                    day
                  );

                  const dateKey =
                    getDateKey(date);

                  const record =
                    recordsByDate.get(
                      dateKey
                    );

                  const isSelected =
                    selectedDate === dateKey;

                  const isLeave =
                    record?.type === 'leave';

                  const isWeekend =
                    date.getDay() === 0 ||
                    date.getDay() === 6;

                  const holidayName =
                    getOfficeHolidayName(
                      date,
                      officeHolidays
                    );

                  const inRange =
                    dateRange.start &&
                    dateRange.end &&
                    dateKey >= dateRange.start &&
                    dateKey <= dateRange.end;

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() =>
                        selectCalendarDate(
                          dateKey
                        )
                      }
                      title={
                        holidayName ||
                        (
                          isLeave
                            ? 'Leave'
                            : record
                              ? 'Attendance'
                              : dateKey
                        )
                      }
                      aria-label={`${dateKey}${holidayName ? `, ${holidayName}` : ''}${isLeave ? ', leave' : record ? ', attendance recorded' : ', no record'}`}
                      aria-pressed={isSelected}
                      className={`relative aspect-square rounded-lg text-sm transition-colors ${
                        isSelected
                          ? 'bg-accent font-bold text-on-accent'
                          : inRange
                            ? 'bg-accent/15 font-semibold text-accent hover:bg-accent/25'
                            : holidayName || isLeave
                              ? 'bg-amber-400/20 font-semibold text-amber-200'
                              : record
                                ? 'bg-emerald-400/15 font-semibold text-emerald-200'
                                : isWeekend
                                  ? 'bg-surface2/60 text-muted'
                                  : 'text-muted hover:bg-surface2'
                      }`}
                    >

                      {day}

                      {record && !isSelected && (
                        <span
                          className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                            isLeave
                              ? 'bg-amber-300'
                              : 'bg-emerald-300'
                          }`}
                        />
                      )}

                    </button>
                  );
                }
              )}

            </div>

            {/* CALENDAR LEGEND */}

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">

              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-emerald-300" />
                Attendance
              </span>

              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-amber-300" />
                Leave / Holiday
              </span>

              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-surface2" />
                Weekend
              </span>

            </div>

            <p className="mt-3 text-xs text-muted">

              Select a start date and end date
              to filter the attendance log.

            </p>

            {/* OFFICE HOLIDAYS */}

            <section
              aria-label="Office holidays"
              className="mt-4 rounded-lg border border-line bg-surface/70 p-3"
            >

              <h4 className="text-xs font-bold uppercase tracking-wide text-ink">

                India National & Hyderabad Office Holidays

              </h4>

              <form
                onSubmit={submitOfficeHoliday}
                className="mt-3 flex flex-wrap gap-2"
              >

                <input
                  type="date"
                  aria-label="Office holiday date"
                  value={holidayDate}
                  onChange={event =>
                    setHolidayDate(
                      event.target.value
                    )
                  }
                  required
                  className={`${INPUT_CLASS} flex-1 [color-scheme:dark]`}
                />

                <input
                  type="text"
                  aria-label="Office holiday name"
                  value={holidayName}
                  onChange={event =>
                    setHolidayName(
                      event.target.value
                    )
                  }
                  maxLength={100}
                  placeholder="Company holiday"
                  required
                  className={`${INPUT_CLASS} flex-1`}
                />

                <button
                  type="submit"
                  className="rounded-md border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20"
                >
                  Add
                </button>

              </form>

              <div className="mt-3 space-y-2">

                {visibleMonthHolidays.length
                  ? visibleMonthHolidays.map(
                      holiday => {
                        const dateKey =
                          getDateKey(
                            holiday.date
                          );

                        const companyHoliday =
                          officeHolidays.find(
                            item =>
                              item.date === dateKey
                          );

                        return (
                          <div
                            key={dateKey}
                            className="flex items-center justify-between gap-2 text-xs text-muted"
                          >

                            <span>

                              {holiday.date.toLocaleDateString(
                                undefined,
                                {
                                  month: 'short',
                                  day: 'numeric'
                                }
                              )}

                              {' · '}

                              {holiday.name}

                            </span>

                            {companyHoliday && (
                              <button
                                type="button"
                                onClick={() =>
                                  onRemoveOfficeHoliday(
                                    dateKey
                                  )
                                }
                                aria-label={`Remove ${companyHoliday.name}`}
                                className="shrink-0 rounded px-1.5 py-0.5 text-rose-300 hover:bg-rose-400/10"
                              >
                                Remove
                              </button>
                            )}

                          </div>
                        );
                      }
                    )
                  : (
                    <p className="text-xs text-muted">
                      No holidays listed for this month.
                    </p>
                  )}

              </div>

            </section>

            {/* SELECTED DAY DETAILS */}

            <div className="mt-4 rounded-lg border border-line bg-surface/70 p-3">

              <p className="text-sm font-semibold text-ink">

                {new Date(
                  `${selectedDate}T00:00:00`
                ).toLocaleDateString(
                  undefined,
                  {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  }
                )}

              </p>

              {selectedRecord?.type === 'leave' ? (

                <p className="mt-2 text-xs text-amber-200">

                  {selectedRecord.leaveType ||
                    'Leave recorded'}

                  {selectedRecord.leaveStatus
                    ? ` · ${selectedRecord.leaveStatus}`
                    : ''}

                </p>

              ) : selectedRecord ? (

                <div className="mt-3 space-y-3">

                  <div className="grid grid-cols-2 gap-2">

                    {[
                      [
                        'Check In',
                        formatTime(
                          selectedRecord.checkIn
                        )
                      ],
                      [
                        'Check Out',
                        formatTime(
                          selectedRecord.checkOut
                        )
                      ],
                      [
                        'Net Working Time',
                        formatDuration(
                          getNetWorkDurationMs(
                            selectedRecord,
                            now
                          )
                        )
                      ],
                      [
                        'Total Break',
                        formatDuration(
                          getBreakDurationMs(
                            selectedRecord,
                            now
                          )
                        )
                      ]
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-line bg-surface2/40 p-2"
                      >

                        <span className="block text-[10px] text-muted">
                          {label}
                        </span>

                        <strong className="font-data text-xs text-ink">
                          {value}
                        </strong>

                      </div>
                    ))}

                  </div>

                  {getBreakIntervals(
                    selectedRecord
                  ).length > 0 && (

                    <div className="space-y-1.5">

                      <h4 className="text-xs font-semibold text-ink">
                        Break Sessions
                      </h4>

                      {getBreakIntervals(
                        selectedRecord
                      ).map(
                        (interval, index) => (
                          <div
                            key={`${interval.start}-${index}`}
                            className="flex justify-between gap-2 text-xs text-muted"
                          >

                            <span>
                              Break {index + 1}
                            </span>

                            <span className="font-data">

                              {formatTime(
                                interval.start
                              )}

                              {' – '}

                              {interval.end
                                ? formatTime(
                                    interval.end
                                  )
                                : 'Active'}

                            </span>

                          </div>
                        )
                      )}

                    </div>

                  )}

                  <div className="border-t border-line pt-3">

                    <LocationDetails
                      location={
                        selectedRecord.checkInLocation
                      }
                    />

                  </div>

                  {selectedRecord.source ===
                    'sample' && (
                    <p className="text-[10px] text-muted">
                      Sample historical entry.
                    </p>
                  )}

                </div>

              ) : (

                <p className="mt-2 text-xs text-muted">
                  No attendance or leave entry for this date.
                </p>

              )}

            </div>

          </section>

          {/* LEAVE MANAGEMENT */}

          <section
            aria-label="Attendance and leave records"
            className="min-w-0"
          >

            <section
              aria-label="Leave balance and approvals"
              className="mb-4 rounded-xl border border-line bg-surface2/30 p-3"
            >

              <div className="flex flex-wrap items-baseline justify-between gap-2">

                <h3 className="font-display text-base font-bold text-ink">
                  Leave Balance
                </h3>

                <span className="text-[10px] text-muted">
                  Local approval workflow
                </span>

              </div>

              <p className="mt-1 text-xs text-muted">
                Only approved working days are deducted.
              </p>

              <div className="mt-3 grid grid-cols-3 gap-2">

                {LEAVE_TYPES.map(type => (

                  <div
                    key={type}
                    className="rounded-lg border border-line bg-surface/70 px-2.5 py-2"
                  >

                    <span className="block text-xs text-muted">
                      {type}
                    </span>

                    <strong className="font-data text-lg text-ink">

                      {leaveBalances[type]}

                      <span className="ml-1 text-xs font-normal text-muted">
                        days
                      </span>

                    </strong>

                  </div>

                ))}

              </div>

              {/* LEAVE APPLICATION */}

              <form
                onSubmit={submitLeaveRequest}
                className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
              >

                <label className="grid gap-1 text-xs text-muted">

                  Leave Type

                  <select
                    value={leaveType}
                    onChange={event =>
                      setLeaveType(
                        event.target.value
                      )
                    }
                    className={INPUT_CLASS}
                  >

                    {LEAVE_TYPES.map(type => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    ))}

                  </select>

                </label>

                <label className="grid gap-1 text-xs text-muted">

                  From

                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={event =>
                      updateLeaveStartDate(
                        event.target.value
                      )
                    }
                    required
                    className={`${INPUT_CLASS} [color-scheme:dark]`}
                  />

                </label>

                <label className="grid gap-1 text-xs text-muted">

                  To

                  <input
                    type="date"
                    value={leaveEndDate}
                    min={leaveStartDate}
                    onChange={event =>
                      updateLeaveEndDate(
                        event.target.value
                      )
                    }
                    required
                    className={`${INPUT_CLASS} [color-scheme:dark]`}
                  />

                </label>

                <div className="flex flex-col justify-end gap-1">

                  <span className="text-[10px] text-muted">

                    {chargeableLeaveDays}
                    {' '}
                    working day
                    {chargeableLeaveDays === 1
                      ? ''
                      : 's'}

                  </span>

                  <button
                    type="submit"
                    disabled={
                      chargeableLeaveDays === 0
                    }
                    className="rounded-md border border-accent/40 bg-accent/10 px-2 py-2 text-xs font-semibold text-accent hover:bg-accent/20 disabled:opacity-40"
                  >
                    Submit Request
                  </button>

                </div>

              </form>

              {/* LEAVE REQUESTS AND APPROVALS */}

              <div className="mt-3 max-h-[250px] space-y-2 overflow-y-auto">

                {leaveRequests.map(request => {
                  const workDays =
                    request.chargedDays ??
                    getChargeableLeaveDates(
                      request.startDate,
                      request.endDate,
                      officeHolidays
                    ).length;

                  return (
                    <div
                      key={request.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line/70 bg-surface/60 px-2.5 py-2"
                    >

                      <div className="min-w-0 text-xs">

                        <strong className="text-ink">

                          {request.leaveType}

                          {' · '}

                          {request.startDate}

                          {' – '}

                          {request.endDate}

                        </strong>

                        <div className="mt-1 flex flex-wrap items-center gap-2">

                          <span className="text-muted">

                            {workDays} working day
                            {workDays === 1
                              ? ''
                              : 's'}

                          </span>

                          <span className={`capitalize font-semibold ${
                            request.status ===
                              'approved'
                              ? 'text-emerald-300'
                              : request.status ===
                                'rejected'
                                ? 'text-rose-300'
                                : 'text-amber-300'
                          }`}>

                            {request.status}

                          </span>

                        </div>

                      </div>

                      {request.status ===
                        'pending' && (

                        <div className="flex shrink-0 gap-1.5">

                          <button
                            type="button"
                            onClick={() =>
                              onApproveLeave(
                                request.id
                              )
                            }
                            className="rounded-md bg-emerald-400/10 px-2 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/20"
                          >
                            Approve
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onRejectLeave(
                                request.id
                              )
                            }
                            className="rounded-md bg-rose-400/10 px-2 py-1 text-xs font-semibold text-rose-200 hover:bg-rose-400/20"
                          >
                            Reject
                          </button>

                        </div>

                      )}

                    </div>
                  );
                })}

                {leaveRequests.length === 0 && (

                  <p className="py-2 text-xs text-muted">
                    No leave requests yet.
                  </p>

                )}

              </div>

            </section>

            {/* ATTENDANCE LOG FILTERS */}

            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">

              <div>

                <h3 className="font-display text-base font-bold text-ink">
                  Daily Attendance & Leave Log
                </h3>

                <p className="mt-1 text-xs text-muted">

                  {filteredRecords.length}
                  {' '}
                  record
                  {filteredRecords.length === 1
                    ? ''
                    : 's'}
                  {' '}
                  in selected period

                </p>

              </div>

              <div className="flex flex-wrap items-end gap-2">

                <label className="grid gap-1 text-xs text-muted">

                  Start Date

                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={event =>
                      updateRangeStart(
                        event.target.value
                      )
                    }
                    className={`${INPUT_CLASS} [color-scheme:dark]`}
                  />

                </label>

                <label className="grid gap-1 text-xs text-muted">

                  End Date

                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={event =>
                      updateRangeEnd(
                        event.target.value
                      )
                    }
                    className={`${INPUT_CLASS} [color-scheme:dark]`}
                  />

                </label>

                <button
                  type="button"
                  onClick={() => {
                    setDateRange(
                      getMonthDateRange(
                        visibleMonth
                      )
                    );

                    setRangeAnchor(null);
                  }}
                  className="rounded-md border border-line px-2.5 py-2 text-xs font-semibold text-muted hover:text-ink"
                >
                  Reset
                </button>

              </div>

            </div>

            {/* ATTENDANCE TABLE */}

            <div className="overflow-x-auto rounded-xl border border-line">

              <table className="w-full min-w-[1100px] text-left text-xs">

                <thead className="bg-surface2/60 text-[10px] uppercase tracking-wide text-muted">

                  <tr>

                    {[
                      'Date',
                      'Record',
                      'Check In',
                      'Check Out',
                      'Break Start',
                      'Break End',
                      'Total Break',
                      'Net Work',
                      'Location'
                    ].map(label => (

                      <th
                        key={label}
                        scope="col"
                        className="whitespace-nowrap px-3 py-3"
                      >
                        {label}
                      </th>

                    ))}

                  </tr>

                </thead>

                <tbody className="divide-y divide-line/70">

                  {filteredRecords.map(record => {
                    const breaks =
                      getBreakIntervals(
                        record
                      );

                    const isLeave =
                      record.type === 'leave';

                    return (
                      <tr
                        key={record.date}
                        className="hover:bg-surface2/30"
                      >

                        <td className="whitespace-nowrap px-3 py-3 font-data text-ink">

                          {record.date}

                        </td>

                        <td className={`px-3 py-3 font-semibold ${
                          isLeave
                            ? 'text-amber-200'
                            : 'text-emerald-200'
                        }`}>

                          {isLeave
                            ? `${record.leaveType || 'Leave'}${record.leaveStatus ? ` · ${record.leaveStatus}` : ''}`
                            : 'Attendance'}

                          {record.source ===
                            'sample' && (
                            <span className="block text-[10px] font-normal text-muted">
                              Sample
                            </span>
                          )}

                        </td>

                        <td className="whitespace-nowrap px-3 py-3 font-data text-muted">

                          {isLeave
                            ? '—'
                            : formatTime(
                                record.checkIn
                              )}

                        </td>

                        <td className="whitespace-nowrap px-3 py-3 font-data text-muted">

                          {isLeave
                            ? '—'
                            : formatTime(
                                record.checkOut
                              )}

                        </td>

                        <td className="whitespace-nowrap px-3 py-3 font-data text-muted">

                          {isLeave ||
                          !breaks.length
                            ? '—'
                            : breaks.map(
                                interval =>
                                  formatTime(
                                    interval.start
                                  )
                              ).join(', ')}

                        </td>

                        <td className="whitespace-nowrap px-3 py-3 font-data text-muted">

                          {isLeave ||
                          !breaks.length
                            ? '—'
                            : breaks.map(
                                interval =>
                                  interval.end
                                    ? formatTime(
                                        interval.end
                                      )
                                    : 'Active'
                              ).join(', ')}

                        </td>

                        <td className="whitespace-nowrap px-3 py-3 font-data text-ink">

                          {isLeave
                            ? '—'
                            : formatDuration(
                                getBreakDurationMs(
                                  record,
                                  now
                                )
                              )}

                        </td>

                        <td className="whitespace-nowrap px-3 py-3 font-data font-semibold text-ink">

                          {isLeave
                            ? '—'
                            : formatDuration(
                                getNetWorkDurationMs(
                                  record,
                                  now
                                )
                              )}

                        </td>

                        <td className="whitespace-nowrap px-3 py-3">

                          {record.checkInLocation ? (

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedDate(
                                  record.date
                                )
                              }
                              className="inline-flex items-center gap-1 text-emerald-300 hover:underline"
                            >

                              <AttendanceIcon
                                name="location"
                                className="w-3.5 h-3.5"
                              />

                              Captured

                            </button>

                          ) : (

                            <span className="text-muted">
                              —
                            </span>

                          )}

                        </td>

                      </tr>
                    );
                  })}

                  {filteredRecords.length === 0 && (

                    <tr>

                      <td
                        colSpan={9}
                        className="px-3 py-8 text-center text-xs text-muted"
                      >
                        No attendance or leave records
                        in this date range.
                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-muted">

              Attendance, sample history, leave
              balances and office holidays are
              stored locally in this browser.
              Local leave approvals are not
              connected to an HR approval server.
              Location is requested only during
              Check In.

            </p>

          </section>

        </div>

      </section>

    </div>,
    document.body
  );
}

// ============================================================
// COMPACT ATTENDANCE TRACKER
// ============================================================

function AttendanceTrackerContent({
  currentUser,
  userKey,
  showToast
}) {
  const storageKey =
    `it_admin_attendance_${encodeURIComponent(userKey)}`;

  const leaveStorageKey =
    `it_admin_leave_${encodeURIComponent(userKey)}`;

  const officeHolidayStorageKey =
    'it_admin_office_holidays';

  const attendance = useLocalData(
    storageKey,
    createSampleRecords,
    validateAttendanceRecords,
    showToast
  );

  const leave = useLocalData(
    leaveStorageKey,

    () => ({
      balances: {
        ...DEFAULT_LEAVE_BALANCES
      },
      requests: []
    }),

    validateLeaveData,
    showToast
  );

  const holidays = useLocalData(
    officeHolidayStorageKey,

    () => [],

    validateOfficeHolidays,
    showToast
  );

  const records =
    attendance.value;

  const currentLeaveState =
    leave.value;

  const officeHolidays =
    holidays.value;

  const [now, setNow] = useState(
    () => Date.now()
  );

  const [isHistoryOpen, setIsHistoryOpen] =
    useState(false);

  const [isLocating, setIsLocating] =
    useState(false);

  const [locationError, setLocationError] =
    useState('');

  const locationRequestRef =
    useRef(false);

  const mountedRef =
    useRef(true);

  const toast = message => {
    showToast?.(message);
  };

  // ==========================================================
  // LIVE ATTENDANCE STATE
  // ==========================================================

  const todayKey = getDateKey(
    new Date(now)
  );

  const activeRecord =
    getActiveRecord(records);

  const todayRecord =
    getTodayRecord(
      records,
      todayKey
    );

  const currentRecord =
    activeRecord || todayRecord;

  const isCheckedIn = Boolean(
    activeRecord
  );

  const isCheckedOut = Boolean(
    !activeRecord &&
    todayRecord.checkOut
  );

  const isOnLeave =
    !activeRecord &&
    todayRecord.type === 'leave';

  const currentBreaks =
    getBreakIntervals(
      currentRecord
    );

  const currentBreak =
    currentBreaks[
      currentBreaks.length - 1
    ];

  const isOnBreak = Boolean(
    isCheckedIn &&
    currentBreak?.start &&
    !currentBreak.end
  );

  const totalBreakMs =
    getBreakDurationMs(
      currentRecord,
      now
    );

  const activeBreakMs =
    isOnBreak
      ? Math.max(
          0,
          now - Date.parse(
            currentBreak.start
          )
        )
      : 0;

  const netWorkMs =
    getNetWorkDurationMs(
      currentRecord,
      now
    );

  const grossWorkMs =
    getGrossDurationMs(
      currentRecord,
      now
    );

  const hasLocation = Boolean(
    currentRecord.checkInLocation
  );

  const attendanceStatus =
    isOnBreak
      ? 'On Break'
      : isCheckedIn
        ? 'Checked In'
        : isCheckedOut
          ? 'Checked Out'
          : isOnLeave
            ? 'On Leave'
            : 'Not Checked In';

  // ==========================================================
  // TIMER LIFECYCLE
  // ==========================================================

  useEffect(() => {
    mountedRef.current = true;

    const timer = window.setInterval(
      () => setNow(Date.now()),
      1000
    );

    const refreshTime = () => {
      setNow(Date.now());
    };

    window.addEventListener(
      'focus',
      refreshTime
    );

    document.addEventListener(
      'visibilitychange',
      refreshTime
    );

    return () => {
      mountedRef.current = false;

      window.clearInterval(timer);

      window.removeEventListener(
        'focus',
        refreshTime
      );

      document.removeEventListener(
        'visibilitychange',
        refreshTime
      );
    };
  }, []);

  // ==========================================================
  // PROFILE HISTORY INTEGRATION
  // ==========================================================

  useEffect(() => {
    const openHistory = event => {
      const requestedUser =
        event.detail?.userKey;

      if (
        requestedUser &&
        requestedUser !== userKey
      ) {
        return;
      }

      setIsHistoryOpen(true);
    };

    window.addEventListener(
      ATTENDANCE_HISTORY_EVENT,
      openHistory
    );

    return () => {
      window.removeEventListener(
        ATTENDANCE_HISTORY_EVENT,
        openHistory
      );
    };
  }, [userKey]);

  // ==========================================================
  // CHECK IN WITH LOCATION
  // ==========================================================

  const registerCheckIn = async () => {
    if (
      !attendance.ready ||
      locationRequestRef.current
    ) {
      return;
    }

    const latestRecords =
      attendance.valueRef.current;

    const currentDateKey =
      getDateKey(new Date());

    const existingRecord =
      getTodayRecord(
        latestRecords,
        currentDateKey
      );

    if (getActiveRecord(latestRecords)) {
      toast(
        'You are already checked in.'
      );

      return;
    }

    if (existingRecord.checkOut) {
      toast(
        'Attendance has already been completed for today.'
      );

      return;
    }

    if (existingRecord.type === 'leave') {
      toast(
        'You have an existing leave record for today.'
      );

      return;
    }

    locationRequestRef.current = true;

    setIsLocating(true);

    setLocationError('');

    try {
      const location =
        await requestCurrentLocation();

      if (!mountedRef.current) {
        return;
      }

      const timestamp =
        new Date().toISOString();

      const dateKey =
        getDateKey(
          new Date(timestamp)
        );

      let blockedReason = '';

      const saved = attendance.update(
        latest => {
          if (getActiveRecord(latest)) {
            blockedReason =
              'You are already checked in.';

            return latest;
          }

          const record =
            getTodayRecord(
              latest,
              dateKey
            );

          if (
            record.checkIn ||
            record.checkOut ||
            record.type === 'leave'
          ) {
            blockedReason =
              'An attendance or leave record already exists for today.';

            return latest;
          }

          return replaceRecord(
            latest,
            {
              ...record,

              type: 'attendance',

              source: 'local-check-in',

              checkIn: timestamp,

              checkOut: null,

              checkInLocation: location,

              breaks: [],

              breakStart: null,

              breakEnd: null,

              leaveType: null
            }
          );
        }
      );

      if (!saved) {
        if (blockedReason) {
          toast(blockedReason);
        }

        return;
      }

      setNow(Date.now());

      toast(
        'Checked in successfully. Location captured and working timer started.'
      );
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      setLocationError(error.message);

      toast(error.message);
    } finally {
      locationRequestRef.current = false;

      if (mountedRef.current) {
        setIsLocating(false);
      }
    }
  };

  // ==========================================================
  // START BREAK / END BREAK
  // ==========================================================

  const toggleBreak = () => {
    if (!attendance.ready) return;

    const timestamp =
      new Date().toISOString();

    let action = '';

    const saved = attendance.update(
      latest => {
        const record =
          getActiveRecord(latest);

        if (!record) {
          return latest;
        }

        const breaks =
          getBreakIntervals(
            record
          );

        const lastBreak =
          breaks[breaks.length - 1];

        const onBreak = Boolean(
          lastBreak?.start &&
          !lastBreak.end
        );

        const updatedBreaks = onBreak
          ? breaks.map(
              (interval, index) =>
                index === breaks.length - 1
                  ? {
                      ...interval,
                      end: timestamp
                    }
                  : interval
            )
          : [
              ...breaks,
              {
                start: timestamp,
                end: null
              }
            ];

        action = onBreak
          ? 'ended'
          : 'started';

        return replaceRecord(
          latest,
          {
            ...record,

            breaks: updatedBreaks,

            breakStart:
              updatedBreaks[0]?.start ||
              null,

            breakEnd:
              updatedBreaks[
                updatedBreaks.length - 1
              ]?.end || null
          }
        );
      }
    );

    if (saved) {
      setNow(Date.now());

      toast(
        action === 'ended'
          ? 'Break ended. Working timer resumed.'
          : 'Break started. Working timer paused.'
      );
    }
  };

  // ==========================================================
  // CHECK OUT
  // ==========================================================

  const registerCheckOut = () => {
    if (!attendance.ready) return;

    const confirmed = window.confirm(
      'Are you sure you want to check out? Your current attendance session will be completed.'
    );

    if (!confirmed) return;

    const timestamp =
      new Date().toISOString();

    let completedRecord = null;

    const saved = attendance.update(
      latest => {
        const record =
          getActiveRecord(latest);

        if (!record) {
          return latest;
        }

        const breaks =
          getBreakIntervals(record).map(
            interval => ({
              ...interval,

              end:
                interval.end ||
                timestamp
            })
          );

        completedRecord =
          normalizeRecord({
            ...record,

            checkOut: timestamp,

            breaks,

            breakStart:
              breaks[0]?.start || null,

            breakEnd:
              breaks[
                breaks.length - 1
              ]?.end || null
          });

        return replaceRecord(
          latest,
          completedRecord
        );
      }
    );

    if (saved && completedRecord) {
      setNow(Date.now());

      const finalWorkDuration =
        formatDuration(
          getNetWorkDurationMs(
            completedRecord,
            Date.now()
          )
        );

      toast(
        `Checked out successfully. Net working time: ${finalWorkDuration}`
      );
    }
  };

  // ==========================================================
  // LEAVE REQUEST CREATION
  // ==========================================================

  const createLeaveRequest = ({
    leaveType,
    startDate,
    endDate
  }) => {
    if (
      !LEAVE_TYPES.includes(leaveType) ||
      !startDate ||
      !endDate ||
      startDate > endDate
    ) {
      toast(
        'Choose a valid leave type and date range.'
      );

      return;
    }

    if (!leave.ready) {
      toast(
        'Leave data is unavailable.'
      );

      return;
    }

    const chargeableDates =
      getChargeableLeaveDates(
        startDate,
        endDate,
        holidays.valueRef.current
      );

    if (!chargeableDates.length) {
      toast(
        'Choose a date range containing at least one working day.'
      );

      return;
    }

    let validationError = '';

    const saved = leave.update(
      current => {
        const overlaps =
          current.requests.some(
            request =>
              [
                'pending',
                'approved'
              ].includes(request.status) &&
              request.startDate <= endDate &&
              startDate <= request.endDate
          );

        if (overlaps) {
          validationError =
            'This request overlaps an existing pending or approved leave request.';

          return current;
        }

        const request = {
          id:
            globalThis.crypto?.randomUUID?.() ||
            `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,

          leaveType,

          startDate,

          endDate,

          status: 'pending',

          createdAt:
            new Date().toISOString()
        };

        return {
          ...current,

          requests: [
            request,
            ...current.requests
          ]
        };
      }
    );

    if (validationError) {
      toast(validationError);
      return;
    }

    if (saved) {
      toast(
        `${leaveType} leave request submitted for local approval.`
      );
    }
  };

  // ==========================================================
  // LEAVE APPROVAL
  // ==========================================================

  const approveLeaveRequest =
    requestId => {
      if (
        !leave.ready ||
        !attendance.ready ||
        !holidays.ready
      ) {
        return;
      }

      const leaveSnapshot =
        leave.valueRef.current;

      const request =
        leaveSnapshot.requests.find(
          item => item.id === requestId
        );

      if (
        !request ||
        request.status !== 'pending'
      ) {
        return;
      }

      const chargeableDates =
        getChargeableLeaveDates(
          request.startDate,
          request.endDate,
          holidays.valueRef.current
        );

      if (!chargeableDates.length) {
        toast(
          'This request contains no chargeable working days.'
        );

        return;
      }

      if (
        chargeableDates.length >
        leaveSnapshot.balances[
          request.leaveType
        ]
      ) {
        toast(
          `Insufficient ${request.leaveType.toLowerCase()} leave balance.`
        );

        return;
      }

      const conflictingDates =
        chargeableDates.filter(
          date =>
            attendance.valueRef.current.some(
              record =>
                record.date === date
            )
        );

      if (conflictingDates.length) {
        toast(
          `Existing attendance or leave records found on ${conflictingDates.join(', ')}.`
        );

        return;
      }

      const approvedAt =
        new Date().toISOString();

      const approvedRecords =
        chargeableDates.map(date => ({
          date,

          type: 'leave',

          source:
            'local-leave-approval',

          checkIn: null,

          checkOut: null,

          checkInLocation: null,

          breaks: [],

          breakStart: null,

          breakEnd: null,

          leaveType:
            `${request.leaveType} leave`,

          leaveCategory:
            request.leaveType,

          leaveStatus: 'approved',

          leaveRequestId:
            request.id
        }));

      const recordsSaved =
        attendance.update(
          current => {
            const hasConflict =
              chargeableDates.some(
                date =>
                  current.some(
                    record =>
                      record.date === date
                  )
              );

            if (hasConflict) {
              return current;
            }

            return sortRecords([
              ...approvedRecords,
              ...current
            ]);
          }
        );

      if (!recordsSaved) {
        toast(
          'Unable to approve leave because attendance records have changed.'
        );

        return;
      }

      const leaveSaved =
        leave.update(current => {
          const latestRequest =
            current.requests.find(
              item =>
                item.id === requestId
            );

          if (
            latestRequest?.status !==
              'pending' ||
            current.balances[
              request.leaveType
            ] < chargeableDates.length
          ) {
            return current;
          }

          return {
            ...current,

            balances: {
              ...current.balances,

              [request.leaveType]:
                current.balances[
                  request.leaveType
                ] -
                chargeableDates.length
            },

            requests:
              current.requests.map(
                item =>
                  item.id === requestId
                    ? {
                        ...item,

                        status:
                          'approved',

                        approvedAt,

                        chargedDays:
                          chargeableDates.length
                      }
                    : item
              )
          };
        });

      if (!leaveSaved) {
        const rolledBack =
          attendance.update(
            current =>
              current.filter(
                record =>
                  record.leaveRequestId !==
                  requestId
              )
          );

        toast(
          rolledBack
            ? 'Leave approval could not be saved. No leave days were deducted.'
            : 'Leave approval was partially saved. Review the local attendance and leave records.'
        );

        return;
      }

      toast(
        `Leave approved. ${chargeableDates.length} working day(s) deducted.`
      );
    };

  // ==========================================================
  // LEAVE REJECTION
  // ==========================================================

  const rejectLeaveRequest =
    requestId => {
      if (!leave.ready) return;

      const saved = leave.update(
        current => {
          const request =
            current.requests.find(
              item =>
                item.id === requestId
            );

          if (
            !request ||
            request.status !== 'pending'
          ) {
            return current;
          }

          return {
            ...current,

            requests:
              current.requests.map(
                item =>
                  item.id === requestId
                    ? {
                        ...item,

                        status:
                          'rejected',

                        rejectedAt:
                          new Date().toISOString()
                      }
                    : item
              )
          };
        }
      );

      if (saved) {
        toast(
          'Leave request rejected. Balance unchanged.'
        );
      }
    };

  // ==========================================================
  // OFFICE HOLIDAY MANAGEMENT
  // ==========================================================

  const addOfficeHoliday = ({
    date,
    name
  }) => {
    if (
      !holidays.ready ||
      !date ||
      !name?.trim()
    ) {
      return false;
    }

    let duplicate = false;

    const saved = holidays.update(
      current => {
        if (
          current.some(
            holiday =>
              holiday.date === date
          )
        ) {
          duplicate = true;

          return current;
        }

        return [
          ...current,

          {
            date,
            name: name.trim()
          }
        ].sort(
          (first, second) =>
            first.date.localeCompare(
              second.date
            )
        );
      }
    );

    if (duplicate) {
      toast(
        'An office holiday already exists for this date.'
      );
    }

    if (saved) {
      toast(
        `${name} added to the office calendar.`
      );
    }

    return saved;
  };

  const removeOfficeHoliday = date => {
    const saved = holidays.update(
      current =>
        current.filter(
          holiday =>
            holiday.date !== date
        )
    );

    if (saved) {
      toast(
        'Office holiday removed.'
      );
    }
  };

  // ==========================================================
  // ATTENDANCE CSV EXPORT
  // ==========================================================

  const exportHistory = (
    exportRecords = records
  ) => {
    if (!exportRecords.length) {
      toast(
        'No attendance records available for export.'
      );

      return;
    }

    const header = [
      'Date',
      'Record',
      'Check In',
      'Check Out',
      'Break Starts',
      'Break Ends',
      'Total Break Duration',
      'Net Working Duration',
      'Leave Type',
      'Leave Status',
      'Location Captured',
      'Record Source'
    ];

    const rows = [...exportRecords]
      .sort(
        (first, second) =>
          first.date.localeCompare(
            second.date
          )
      )
      .map(record => {
        const breaks =
          getBreakIntervals(
            record
          );

        return [
          record.date,

          record.type,

          record.checkIn || '',

          record.checkOut || '',

          breaks.map(
            interval => interval.start
          ).join('; '),

          breaks.map(
            interval => interval.end || ''
          ).join('; '),

          record.type === 'leave'
            ? ''
            : formatDuration(
                getBreakDurationMs(
                  record,
                  now
                )
              ),

          record.type === 'leave'
            ? ''
            : formatDuration(
                getNetWorkDurationMs(
                  record,
                  now
                )
              ),

          record.leaveType || '',

          record.leaveStatus || '',

          record.checkInLocation
            ? 'Yes'
            : 'No',

          record.source ||
            'Existing local record'
        ];
      });

    const escapeCsv = value => {
      let text = String(
        value ?? ''
      );

      if (/^[\s]*[=+\-@]/.test(text)) {
        text = `'${text}`;
      }

      return `"${text.replace(/"/g, '""')}"`;
    };

    const csv = [
      header,
      ...rows
    ]
      .map(row =>
        row.map(escapeCsv).join(',')
      )
      .join('\r\n');

    const blob = new Blob(
      ['\uFEFF', csv],
      {
        type:
          'text/csv;charset=utf-8'
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    const safeName = String(
      currentUser.name || 'user'
    ).replace(
      /[^a-z0-9_-]+/gi,
      '-'
    );

    link.href = url;

    link.download =
      `${safeName}-attendance-history.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.setTimeout(
      () => URL.revokeObjectURL(url),
      1000
    );

    toast(
      'Attendance history exported.'
    );
  };

  // ==========================================================
  // TOOLBAR DISPLAY VALUES
  // ==========================================================

  const timerValue = isOnBreak
    ? activeBreakMs
    : netWorkMs;

  const timerClass = isOnBreak
    ? 'border-amber-400/25 bg-amber-400/10 text-amber-200'
    : isCheckedIn
      ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
      : isCheckedOut
        ? 'border-accent/25 bg-accent/10 text-accent'
        : 'border-line bg-surface2/40 text-muted';

  const timerTitle = [
    attendanceStatus,

    `Check In: ${formatTime(currentRecord.checkIn)}`,

    `Check Out: ${formatTime(currentRecord.checkOut)}`,

    `Working Time: ${formatDuration(netWorkMs)}`,

    `Total Break: ${formatDuration(totalBreakMs)}`,

    `Total Duration: ${formatDuration(grossWorkMs)}`,

    hasLocation
      ? 'Check-in location captured'
      : 'Check-in location not captured'
  ].join('\n');

  // ==========================================================
  // COMPACT COMMON HEADER TOOLBAR
  // ==========================================================

  return (
    <>

      <div
        data-attendance-toolbar
        aria-label="Attendance controls"
        className="relative inline-flex min-w-0 shrink-0 flex-wrap items-center gap-1.5"
      >

        {/* LIVE WORKING / BREAK TIMER */}

        <button
          type="button"
          onClick={() =>
            setIsHistoryOpen(true)
          }
          title={timerTitle}
          aria-label={`${attendanceStatus}. Open attendance history`}
          className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 transition-colors ${timerClass}`}
        >

          <AttendanceIcon
            name={
              isOnBreak
                ? 'coffee'
                : hasLocation
                  ? 'location'
                  : 'clock'
            }
            className="w-3.5 h-3.5 shrink-0"
          />

          <span className="font-data text-[12px] font-bold tabular-nums tracking-tight">

            {formatDuration(timerValue)}

          </span>

          {isCheckedOut && (

            <AttendanceIcon
              name="check"
              className="w-3 h-3"
            />

          )}

        </button>

        {/* CHECK IN */}

        {!isCheckedIn &&
          !isCheckedOut &&
          !isOnLeave && (

          <button
            type="button"
            onClick={registerCheckIn}
            disabled={
              isLocating ||
              !attendance.ready
            }
            title="Check in using your current device location"
            className={`${TOOLBAR_BUTTON} border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20`}
          >

            <AttendanceIcon
              name={
                isLocating
                  ? 'loader'
                  : 'checkIn'
              }
              className={`w-3.5 h-3.5 ${
                isLocating
                  ? 'animate-spin'
                  : ''
              }`}
            />

            {isLocating
              ? 'Locating...'
              : 'Check In'}

          </button>

        )}

        {/* START BREAK / END BREAK */}

        {isCheckedIn && (

          <button
            type="button"
            onClick={toggleBreak}
            disabled={!attendance.ready}
            title={
              isOnBreak
                ? 'End break and resume working timer'
                : 'Start break and pause working timer'
            }
            className={`${TOOLBAR_BUTTON} ${
              isOnBreak
                ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20'
                : 'border border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20'
            }`}
          >

            <AttendanceIcon
              name={
                isOnBreak
                  ? 'play'
                  : 'coffee'
              }
              className="w-3.5 h-3.5"
            />

            {isOnBreak
              ? 'End Break'
              : 'Break'}

          </button>

        )}

        {/* CHECK OUT */}

        {isCheckedIn && (

          <button
            type="button"
            onClick={registerCheckOut}
            disabled={!attendance.ready}
            title="Complete the current attendance session"
            className={`${TOOLBAR_BUTTON} border border-rose-400/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20`}
          >

            <AttendanceIcon
              name="checkOut"
              className="w-3.5 h-3.5"
            />

            Check Out

          </button>

        )}

        {/* COMPLETED ATTENDANCE STATUS */}

        {isCheckedOut && (

          <span
            title={`Checked out at ${formatTime(
              currentRecord.checkOut
            )}`}
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300"
          >

            <AttendanceIcon
              name="check"
              className="w-3.5 h-3.5"
            />

            Completed

          </span>

        )}

        {/* APPROVED LEAVE STATUS */}

        {isOnLeave && (

          <span className="whitespace-nowrap rounded-lg border border-amber-400/25 bg-amber-400/10 px-2.5 py-1.5 text-[11px] font-semibold text-amber-200">

            On Leave

          </span>

        )}

        {/* ATTENDANCE HISTORY */}

        <button
          type="button"
          onClick={() =>
            setIsHistoryOpen(true)
          }
          title="Attendance History, Calendar and Leave Management"
          aria-label="Open attendance history"
          className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line/60 bg-surface2/30 p-1.5 text-muted transition-colors hover:border-accent/40 hover:text-accent"
        >

          <AttendanceIcon
            name="calendar"
            className="w-4 h-4"
          />

        </button>

        {/* LOCATION ERROR */}

        {locationError &&
          !isCheckedIn && (

          <button
            type="button"
            onClick={() =>
              toast(locationError)
            }
            title={locationError}
            aria-label={locationError}
            className="inline-flex shrink-0 items-center justify-center rounded-md p-1 text-rose-300 hover:bg-rose-400/10"
          >

            <AttendanceIcon
              name="alert"
              className="w-4 h-4"
            />

          </button>

        )}

        <span
          className="sr-only"
          role="status"
        >
          {isLocating
            ? 'Requesting location permission'
            : attendanceStatus}
        </span>

      </div>

      {/* ATTENDANCE HISTORY POPUP */}

      {isHistoryOpen && (

        <AttendanceHistoryModal
          userName={
            currentUser.name ||
            'IT Administrator'
          }

          records={records}

          leaveBalances={
            currentLeaveState.balances
          }

          leaveRequests={
            currentLeaveState.requests
          }

          officeHolidays={
            officeHolidays
          }

          now={now}

          onClose={() =>
            setIsHistoryOpen(false)
          }

          onExport={exportHistory}

          onCreateLeaveRequest={
            createLeaveRequest
          }

          onApproveLeave={
            approveLeaveRequest
          }

          onRejectLeave={
            rejectLeaveRequest
          }

          onAddOfficeHoliday={
            addOfficeHoliday
          }

          onRemoveOfficeHoliday={
            removeOfficeHoliday
          }
        />

      )}

    </>
  );
}

// ============================================================
// PUBLIC ATTENDANCE COMPONENT
// ============================================================

export function AttendanceTracker({
  currentUser,
  showToast
}) {
  if (!currentUser) {
    return null;
  }

  const identity =
    currentUser.employeeId ||
    currentUser.id ||
    currentUser.email ||
    currentUser.name;

  if (!identity) {
    return null;
  }

  const userKey = String(identity);

  return (
    <AttendanceTrackerContent
      key={userKey}
      userKey={userKey}
      currentUser={currentUser}
      showToast={showToast}
    />
  );
}

export default AttendanceTracker;
