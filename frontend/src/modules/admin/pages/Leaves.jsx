import { useEffect, useState } from "react";
import "../style/Leaves.css";
import {
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useKpiFilter, useKpiNavigation } from "../hooks/useKpiNavigation";
import { initialLeaveData } from "../data/leaveData";

// Convert "10 Nov 2026" into a JavaScript Date
const parseLeaveDate = (dateString) => {
  const [day, month, year] = dateString.split(" ");
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  return new Date(
    Number(year),
    monthNames.indexOf(month),
    Number(day)
  );
};

// Format date as YYYY-MM-DD
const getDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function Leaves() {
  const navigate = useNavigate();
  const navigateToKpi = useKpiNavigation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useKpiFilter("All");
  const [selectedLeave, setSelectedLeave] = useState(null);

  const [leaveData] = useState(() => {
    try {
      const saved = localStorage.getItem("hrms-leave-requests");
      if (!saved) return initialLeaveData;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) throw new TypeError("Saved leave requests must be an array.");
      return parsed;
    } catch (error) {
      console.error("Unable to load saved leave requests.", error);
      return initialLeaveData;
    }
  });

  useEffect(() => {
    localStorage.setItem("hrms-leave-requests", JSON.stringify(leaveData));
    window.dispatchEvent(new Event("hrms-leave-requests-updated"));
  }, [leaveData]);

  // Summary counts
  const total = leaveData.length;
  const pending = leaveData.filter(item => item.status === "Pending").length;
  const approved = leaveData.filter(item => item.status === "Approved").length;
  const rejected = leaveData.filter(item => item.status === "Rejected").length;

  const getReviewDetails = (item) => {
    const history = (item.approvalHistory || []).filter((entry) =>
      entry.decision === "Approved" || entry.decision === "Rejected"
    );
    const latest = history[history.length - 1];
    const reviewer = item.approvedBy || item.rejectedBy || latest?.actor;
    return {
      reviewer: reviewer || "Pending / Not Yet Reviewed",
      reviewerHistory: history.length
        ? history
        : reviewer
          ? [{ stage: item.approvedByRole || item.rejectedByRole || "Reviewer", actor: reviewer }]
          : [],
      reviewedAt: item.approvalDate || item.rejectionDate || latest?.timestamp || "Not available",
      rejectionReason: item.rejectionReason || "Not provided",
    };
  };

  // Search and filter
  const filteredData = leaveData.filter(item => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      item.name.toLowerCase().includes(searchText) ||
      item.role.toLowerCase().includes(searchText) ||
      item.leaveType.toLowerCase().includes(searchText) ||
      item.employeeId.toLowerCase().includes(searchText) ||
      item.department.toLowerCase().includes(searchText);

    const matchesFilter =
      filter === "All" || item.status === filter;

    return matchesSearch && matchesFilter;
  });

  // Calendar states
  const [calendarMonth, setCalendarMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const [selectedDate, setSelectedDate] = useState(getDateKey(new Date()));

  const changeCalendarMonth = (amount) => {
    setCalendarMonth(previous =>
      new Date(
        previous.getFullYear(),
        previous.getMonth() + amount,
        1
      )
    );
  };

  const goToToday = () => {
    const today = new Date();

    setCalendarMonth(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );

    setSelectedDate(getDateKey(today));
  };

  // Calendar date information
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const startingOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarCells = [
    ...Array(startingOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1)
  ];

  // Get leave applications covering a calendar date
  const getLeavesForDate = (date) => {
    const selected = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    return leaveData.filter(item => {
      const fromDate = parseLeaveDate(item.from);
      const toDate = parseLeaveDate(item.to);

      return selected >= fromDate && selected <= toDate;
    });
  };

  const selectedDateObject = new Date(
    Number(selectedDate.split("-")[0]),
    Number(selectedDate.split("-")[1]) - 1,
    Number(selectedDate.split("-")[2])
  );

  const selectedDateLeaves = getLeavesForDate(selectedDateObject);

  const selectedDateLabel = selectedDateObject.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  const showLegacyCalendar = false;

  return (
    <div className="leaves-page">

      <header className="leaves-header">
        <div>
          <span className="leaves-eyebrow">HRMS / ADMIN / LEAVES</span>
          <h1>Leave Management</h1>
          <p>Manage employee leave applications and approvals.</p>
        </div>

        <div className="leaves-header-actions">
          <button type="button" className="leaves-back-button" onClick={() => navigate("/admin/hr-configuration")}>
            <ChevronLeft size={17} />
            Back to HR Configuration
          </button>
          <div className="leaves-date">
          <CalendarDays size={17} />
          {new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          })}
          </div>
        </div>
      </header>

      {/* ORIGINAL SUMMARY CARDS - NOW CLICKABLE */}

      <section className="leaves-stats">

        <button
          type="button"
          className="leaves-stat-card leaves-stat-clickable"
          onClick={() => navigateToKpi("/admin/leaves", "All")}
        >
          <div className="leaves-stat-icon mint">
            <CalendarDays />
          </div>
          <p>Total Requests</p>
          <h2>{total}</h2>
          <span>All leave applications</span>
        </button>

        <button
          type="button"
          className="leaves-stat-card leaves-stat-clickable"
          onClick={() => navigateToKpi("/admin/leaves", "Pending")}
        >
          <div className="leaves-stat-icon orange">
            <Clock />
          </div>
          <p>Pending Requests</p>
          <h2>{pending}</h2>
          <span>Awaiting approval</span>
        </button>

        <button
          type="button"
          className="leaves-stat-card leaves-stat-clickable"
          onClick={() => navigateToKpi("/admin/leaves", "Approved")}
        >
          <div className="leaves-stat-icon blue">
            <CheckCircle />
          </div>
          <p>Approved</p>
          <h2>{approved}</h2>
          <span>Approved applications</span>
        </button>

        <button
          type="button"
          className="leaves-stat-card leaves-stat-clickable"
          onClick={() => navigateToKpi("/admin/leaves", "Rejected")}
        >
          <div className="leaves-stat-icon purple">
            <XCircle />
          </div>
          <p>Rejected</p>
          <h2>{rejected}</h2>
          <span>Rejected applications</span>
        </button>

      </section>

      {showLegacyCalendar && (

      <section className="leaves-calendar-panel">

        <div className="leaves-calendar-header">
          <div>
            <h2>Leave Calendar</h2>
            <p>View employee leave schedules by date.</p>
          </div>

          <div className="leaves-calendar-controls">
            <button onClick={goToToday} className="leaves-today-btn">
              Today
            </button>

            <button
              onClick={() => changeCalendarMonth(-1)}
              className="leaves-calendar-nav"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>

            <strong>
              {calendarMonth.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric"
              })}
            </strong>

            <button
              onClick={() => changeCalendarMonth(1)}
              className="leaves-calendar-nav"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="leaves-calendar-grid">

          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
            <div className="leaves-calendar-weekday" key={day}>
              {day}
            </div>
          ))}

          {calendarCells.map((day, index) => {
            if (day === null) {
              return (
                <div
                  className="leaves-calendar-empty"
                  key={`empty-${index}`}
                />
              );
            }

            const date = new Date(year, month, day);
            const dateKey = getDateKey(date);
            const dayLeaves = getLeavesForDate(date);

            const hasPending = dayLeaves.some(
              item => item.status === "Pending"
            );

            const hasApproved = dayLeaves.some(
              item => item.status === "Approved"
            );

            const hasRejected = dayLeaves.some(
              item => item.status === "Rejected"
            );

            const isToday = dateKey === getDateKey(new Date());
            const isSelected = dateKey === selectedDate;

            return (
              <button
                key={dateKey}
                className={`leaves-calendar-day
                  ${isToday ? "leaves-day-today" : ""}
                  ${isSelected ? "leaves-day-selected" : ""}
                  ${dayLeaves.length > 0 ? "leaves-day-has-data" : ""}
                `}
                onClick={() => setSelectedDate(dateKey)}
              >
                <span className="leaves-calendar-date-number">
                  {day}
                </span>

                <div className="leaves-calendar-dots">
                  {hasPending && (
                    <span className="leave-dot pending-dot" />
                  )}

                  {hasApproved && (
                    <span className="leave-dot approved-dot" />
                  )}

                  {hasRejected && (
                    <span className="leave-dot rejected-dot" />
                  )}
                </div>

                {dayLeaves.length > 0 && (
                  <span className="leaves-calendar-count">
                    {dayLeaves.length} {dayLeaves.length === 1 ? "leave" : "leaves"}
                  </span>
                )}
              </button>
            );
          })}

        </div>

        <div className="leaves-calendar-legend">
          <span>
            <i className="leave-dot pending-dot" />
            Pending
          </span>

          <span>
            <i className="leave-dot approved-dot" />
            Approved
          </span>

          <span>
            <i className="leave-dot rejected-dot" />
            Rejected
          </span>
        </div>

        {/* SELECTED DATE LEAVE DETAILS */}

        <div className="leaves-calendar-details">

          <div className="leaves-calendar-details-heading">
            <div>
              <h3>Leave Details</h3>
              <p>{selectedDateLabel}</p>
            </div>

            <span className="leaves-calendar-total">
              {selectedDateLeaves.length} Employees
            </span>
          </div>

          {selectedDateLeaves.length > 0 ? (
            <div className="leaves-calendar-employee-list">
              {selectedDateLeaves.map(item => (
                <div
                  className="leaves-calendar-employee"
                  key={item.id}
                >
                  <div className="leaves-calendar-employee-info">
                    <div className="leaves-avatar">
                      {item.name.charAt(0)}
                    </div>

                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.role} · {item.leaveType}</span>
                    </div>
                  </div>

                  <span className={`leaves-status ${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="leaves-calendar-no-data">
              <CalendarDays size={25} />
              <p>No leave applications for this date.</p>
            </div>
          )}

        </div>

      </section>

      )}

      {/* ORIGINAL LEAVE REQUESTS TABLE */}

      <section className="leaves-table-panel">

        <div className="leaves-table-heading">
          <div>
            <h2>Leave Applications</h2>
            <p>Review and manage employee leave requests.</p>
          </div>
        </div>

        <div className="leaves-toolbar">

          <div className="leaves-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search employee, role or leave type..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

        </div>

        <div className="leaves-table-wrapper">
          <table className="leaves-table">

            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Leave Type</th>
                <th>From Date</th>
                <th>To Date</th>
                <th>Total Days</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th>Approved / Rejected By</th>
              </tr>
            </thead>

            <tbody>
              {filteredData.map(item => (
                <tr key={item.id} onClick={() => setSelectedLeave(item)} title="Open read-only leave details">

                  <td>
                    <div className="leaves-employee">
                      <div className="leaves-avatar">
                        {item.name.charAt(0)}
                      </div>
                      <strong>{item.name}</strong>
                    </div>
                  </td>

                  <td>{item.employeeId}</td>
                  <td>{item.department}</td>
                  <td>{item.leaveType}</td>
                  <td>{item.from}</td>
                  <td>{item.to}</td>
                  <td>{item.days}</td>
                  <td>{item.appliedDate || item.submittedAt || "Not provided"}</td>

                  <td>
                    <span className={`leaves-status ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>

                  <td>
                    {item.status === "Pending" ? (
                      <span className="leave-reviewer-pending">Pending / Not Yet Reviewed</span>
                    ) : getReviewDetails(item).reviewerHistory.length ? (
                      <div className="leave-reviewer-history">
                        {getReviewDetails(item).reviewerHistory.map((entry, index) => (
                          <span key={`${entry.timestamp || entry.actor}-${index}`}>
                            <strong>{entry.stage || "Reviewer"}</strong>
                            <small>{entry.actor}</small>
                          </span>
                        ))}
                      </div>
                    ) : (
                      getReviewDetails(item).reviewer
                    )}
                  </td>

                </tr>
              ))}

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="10" className="leaves-empty">
                    No leave applications found.
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>

        <div className="leaves-table-footer">
          Showing {filteredData.length} of {total} sample applications
        </div>

      </section>

      {selectedLeave && (
        <div className="leave-details-overlay" onClick={() => setSelectedLeave(null)}>
          <section className="leave-details-modal" role="dialog" aria-modal="true" aria-labelledby="leave-details-title" onClick={(event) => event.stopPropagation()}>
            <div className="leave-details-heading">
              <div><span className="leaves-eyebrow">READ-ONLY REQUEST DETAILS</span><h2 id="leave-details-title">{selectedLeave.name}</h2></div>
              <button type="button" aria-label="Close leave details" onClick={() => setSelectedLeave(null)}><X size={19} /></button>
            </div>
            <dl className="leave-details-grid">
              <dt>Employee ID</dt><dd>{selectedLeave.employeeId}</dd>
              <dt>Department</dt><dd>{selectedLeave.department}</dd>
              <dt>Leave type</dt><dd>{selectedLeave.leaveType}</dd>
              <dt>Leave dates</dt><dd>{selectedLeave.from} to {selectedLeave.to}</dd>
              <dt>Total days</dt><dd>{selectedLeave.days}</dd>
              <dt>Applied date</dt><dd>{selectedLeave.appliedDate || selectedLeave.submittedAt || "Not provided"}</dd>
              <dt>Current status</dt><dd><span className={`leaves-status ${selectedLeave.status.toLowerCase()}`}>{selectedLeave.status}</span></dd>
              <dt>Approved / rejected by</dt>
              <dd>
                {selectedLeave.status === "Pending" ? (
                  <span className="leave-reviewer-pending">Pending / Not Yet Reviewed</span>
                ) : (
                  <div className="leave-reviewer-history">
                    {getReviewDetails(selectedLeave).reviewerHistory.map((entry, index) => (
                      <span key={`${entry.timestamp || entry.actor}-${index}`}>
                        <strong>{entry.stage || "Reviewer"}</strong>
                        <small>{entry.actor}</small>
                      </span>
                    ))}
                  </div>
                )}
              </dd>
              <dt>Decision date</dt><dd>{getReviewDetails(selectedLeave).reviewedAt}</dd>
              <dt>Rejection reason</dt><dd>{getReviewDetails(selectedLeave).rejectionReason}</dd>
            </dl>
            <button type="button" className="leave-details-close" onClick={() => setSelectedLeave(null)}>Close</button>
          </section>
        </div>
      )}
    </div>
  );
}

export default Leaves;
