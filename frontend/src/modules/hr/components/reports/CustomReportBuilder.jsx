import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Icon } from '../Icon.jsx';
import { StatusPill } from '../StatusPill.jsx';
import { Avatar } from '../Avatar.jsx';
import { Select } from '../Select.jsx';
import { getUserRoleLevel } from '../../data/reportsData.js';

// Base dataset for custom queries
const MASTER_CUSTOM_DATA = [
  { id: "EMP-1001", name: "Meera Reddy", dept: "Human Resources", role: "HR Manager", status: "Active", location: "Hyderabad", attendanceRate: 98, grossSalary: 233333, performanceScore: 4.8, tasksCompleted: 42, joinedDate: "2021-02-01" },
  { id: "EMP-1042", name: "Aarav Sharma", dept: "Engineering", role: "Staff Architect", status: "Active", location: "Hyderabad", attendanceRate: 96, grossSalary: 320833, performanceScore: 4.9, tasksCompleted: 58, joinedDate: "2021-03-12" },
  { id: "EMP-1088", name: "Pooja Patel", dept: "Human Resources", role: "Senior HRBP", status: "Active", location: "Hyderabad", attendanceRate: 99, grossSalary: 187500, performanceScore: 4.7, tasksCompleted: 39, joinedDate: "2022-01-15" },
  { id: "EMP-1102", name: "Rohan Varma", dept: "Product", role: "Lead Product Designer", status: "Active", location: "Hyderabad", attendanceRate: 94, grossSalary: 216666, performanceScore: 4.6, tasksCompleted: 35, joinedDate: "2022-08-04" },
  { id: "EMP-1145", name: "Sneha Nair", dept: "Engineering", role: "DevOps Specialist", status: "On Leave", location: "Bengaluru", attendanceRate: 88, grossSalary: 175000, performanceScore: 4.5, tasksCompleted: 29, joinedDate: "2023-11-19" },
  { id: "EMP-1201", name: "Kavita Rao", dept: "Finance", role: "Lead Payroll Accountant", status: "Active", location: "Hyderabad", attendanceRate: 97, grossSalary: 165000, performanceScore: 4.7, tasksCompleted: 44, joinedDate: "2024-02-10" },
  { id: "EMP-1234", name: "Devansh Mehta", dept: "Engineering", role: "Frontend Engineer II", status: "Active", location: "Hyderabad", attendanceRate: 92, grossSalary: 110000, performanceScore: 4.3, tasksCompleted: 31, joinedDate: "2024-07-01" },
  { id: "EMP-1248", name: "Priya Sundaram", dept: "Quality Assurance", role: "Senior QA Automation", status: "Active", location: "Bengaluru", attendanceRate: 95, grossSalary: 145000, performanceScore: 4.6, tasksCompleted: 48, joinedDate: "2024-08-15" },
  { id: "EMP-1260", name: "Vikram Malhotra", dept: "Engineering", role: "Backend Engineer II", status: "Probation", location: "Hyderabad", attendanceRate: 91, grossSalary: 105000, performanceScore: 4.1, tasksCompleted: 18, joinedDate: "2026-09-01" },
  { id: "EMP-1275", name: "Ananya Deshmukh", dept: "Operations", role: "Operations Specialist", status: "Active", location: "Hyderabad", attendanceRate: 96, grossSalary: 95000, performanceScore: 4.4, tasksCompleted: 27, joinedDate: "2023-04-10" },
  { id: "EMP-1288", name: "Arjun Nair", dept: "Engineering", role: "Fullstack Developer", status: "Resigned / Inactive", location: "Hyderabad", attendanceRate: 84, grossSalary: 130000, performanceScore: 3.8, tasksCompleted: 22, joinedDate: "2022-05-18" },
  { id: "EMP-1295", name: "Neha Joshi", dept: "Product", role: "Product Manager", status: "Active", location: "Bengaluru", attendanceRate: 95, grossSalary: 195000, performanceScore: 4.5, tasksCompleted: 33, joinedDate: "2024-03-20" }
];

// Available columns / fields for custom selection
const AVAILABLE_FIELDS = [
  { key: "id", label: "Employee ID", category: "Core" },
  { key: "name", label: "Employee Name", category: "Core" },
  { key: "dept", label: "Department", category: "Organization" },
  { key: "role", label: "Designation", category: "Organization" },
  { key: "status", label: "Status", category: "Organization" },
  { key: "location", label: "Work Location", category: "Organization" },
  { key: "attendanceRate", label: "Attendance (%)", category: "Metrics" },
  { key: "performanceScore", label: "Performance", category: "Metrics" },
  { key: "tasksCompleted", label: "Tasks Done", category: "Metrics" },
  { key: "grossSalary", label: "Gross Salary (₹)", category: "Compensation" },
  { key: "joinedDate", label: "Joining Date", category: "Core" }
];

const PALETTE = ["#0077b6", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6", "#14b8a6"];

// Monsoon Glass Tooltip
const GlassTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="p-2.5 rounded-xl bg-surface border border-line shadow-2xl text-xs backdrop-blur-md z-50">
      {label && <div className="font-semibold text-ink mb-1.5">{label}</div>}
      <div className="flex flex-col gap-1">
        {payload.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center gap-1.5 text-muted">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
              <span>{item.name}:</span>
            </div>
            <span className="font-data font-bold text-ink">
              {typeof item.value === 'number' && item.value > 1000 ? item.value.toLocaleString() : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CustomReportBuilder = ({ currentUser, onTriggerToast }) => {
  const roleLevel = getUserRoleLevel(currentUser);

  // Field selection state (defaults)
  const [selectedFields, setSelectedFields] = useState([
    "id", "name", "dept", "role", "status", "attendanceRate", "performanceScore"
  ]);

  // Dimension & Metric state
  const [groupBy, setGroupBy] = useState("dept"); // dept, status, location, role
  const [metric, setMetric] = useState("headcount"); // headcount, avgAttendance, avgPerformance, totalSalary, totalTasks
  const [chartType, setChartType] = useState("bar"); // bar, line, area, pie

  // Table search & sort
  const [tableSearch, setTableSearch] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortAsc, setSortAsc] = useState(true);

  // Toggle field selection
  const toggleField = (fieldKey) => {
    setSelectedFields(prev => {
      if (prev.includes(fieldKey)) {
        if (prev.length <= 2) {
          if (onTriggerToast) onTriggerToast("A custom report requires at least 2 fields.");
          return prev;
        }
        return prev.filter(k => k !== fieldKey);
      } else {
        return [...prev, fieldKey];
      }
    });
  };

  const selectAllFields = () => {
    setSelectedFields(AVAILABLE_FIELDS.map(f => f.key));
  };

  const resetFields = () => {
    setSelectedFields(["id", "name", "dept", "role", "status", "attendanceRate", "performanceScore"]);
  };

  // Scoped dataset based on role
  const scopedData = useMemo(() => {
    let list = [...MASTER_CUSTOM_DATA];
    if (roleLevel === "employee") {
      list = list.filter(e => e.id.toUpperCase() === (currentUser?.employeeId || "").toUpperCase());
    } else if (roleLevel === "manager") {
      const userDept = currentUser?.dept || "Engineering";
      list = list.filter(e => e.dept === userDept);
    }
    return list;
  }, [currentUser, roleLevel]);

  // Aggregated data for Recharts based on GroupBy & Metric
  const chartData = useMemo(() => {
    const groups = {};

    scopedData.forEach(row => {
      const key = row[groupBy] || "Other";
      if (!groups[key]) {
        groups[key] = {
          name: key,
          count: 0,
          totalAttendance: 0,
          totalPerformance: 0,
          totalSalary: 0,
          totalTasks: 0
        };
      }
      groups[key].count += 1;
      groups[key].totalAttendance += (row.attendanceRate || 0);
      groups[key].totalPerformance += (row.performanceScore || 0);
      groups[key].totalSalary += (row.grossSalary || 0);
      groups[key].totalTasks += (row.tasksCompleted || 0);
    });

    return Object.values(groups).map(g => {
      let metricValue = g.count;
      let metricLabel = "Headcount";

      if (metric === "avgAttendance") {
        metricValue = Math.round((g.totalAttendance / g.count) * 10) / 10;
        metricLabel = "Avg Attendance %";
      } else if (metric === "avgPerformance") {
        metricValue = Math.round((g.totalPerformance / g.count) * 10) / 10;
        metricLabel = "Avg Performance";
      } else if (metric === "totalSalary") {
        metricValue = g.totalSalary;
        metricLabel = "Total Salary (₹)";
      } else if (metric === "totalTasks") {
        metricValue = g.totalTasks;
        metricLabel = "Tasks Completed";
      }

      return {
        name: g.name,
        value: metricValue,
        headcount: g.count,
        label: metricLabel
      };
    });
  }, [scopedData, groupBy, metric]);

  // Filtered and Sorted Table Data
  const tableData = useMemo(() => {
    let list = [...scopedData];
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      list = list.filter(row => {
        return Object.values(row).some(v => String(v).toLowerCase().includes(q));
      });
    }

    list.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === "number" && typeof valB === "number") {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });

    return list;
  }, [scopedData, tableSearch, sortField, sortAsc]);

  const handleSort = (fieldKey) => {
    if (sortField === fieldKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(fieldKey);
      setSortAsc(true);
    }
  };

  // Export custom report as CSV
  const handleExportCustomCSV = () => {
    if (tableData.length === 0) {
      if (onTriggerToast) onTriggerToast("No data to export");
      return;
    }

    const headers = selectedFields.map(f => {
      const fieldObj = AVAILABLE_FIELDS.find(af => af.key === f);
      return `"${fieldObj ? fieldObj.label : f}"`;
    }).join(",");

    const rows = tableData.map(row => {
      return selectedFields.map(f => `"${row[f] != null ? row[f] : ''}"`).join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `custom_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onTriggerToast) onTriggerToast("Custom Report CSV downloaded successfully");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Custom Report Builder Configuration Panel */}
      <div className="glass-card !p-4 border border-line flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-line pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
              <Icon name="file-text" className="w-4 h-4" />
            </div>
            <div>
              <div className="font-display font-bold text-ink text-sm">Custom Report Dimension & Metric Engine</div>
              <div className="text-[11px] text-muted">Select specific fields, aggregation metrics, and visual chart presentations</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAllFields}
              className="text-xs text-accent hover:underline px-2 py-1 font-semibold"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={resetFields}
              className="text-xs text-muted hover:text-ink px-2 py-1 border border-line rounded bg-surface2/60"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Available Fields Selection (Checkboxes) */}
        <div>
          <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
            1. Select Included Data Fields ({selectedFields.length} of {AVAILABLE_FIELDS.length} selected)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {AVAILABLE_FIELDS.map(f => {
              const isChecked = selectedFields.includes(f.key);
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggleField(f.key)}
                  className={`p-2 rounded-lg border text-left text-xs flex items-center gap-2 transition ${
                    isChecked
                      ? 'bg-accent/15 border-accent text-ink font-medium'
                      : 'bg-surface2/40 border-line text-muted hover:border-accent/40 hover:text-ink'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                    isChecked ? 'bg-accent border-accent text-on-accent' : 'border-line bg-surface'
                  }`}>
                    {isChecked && <Icon name="check" className="w-3 h-3 text-on-accent stroke-[3]" />}
                  </div>
                  <span className="truncate">{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Aggregation & Chart Customization Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-line">
          {/* Dimension: Group By */}
          <div>
            <label className="block text-[10.5px] font-semibold text-muted uppercase mb-1">
              2. Group Dimension By
            </label>
            <Select
              size="sm"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="w-full"
            >
              <option value="dept">Department</option>
              <option value="status">Employment Status</option>
              <option value="location">Work Location</option>
              <option value="role">Designation / Role</option>
            </Select>
          </div>

          {/* Metric: Aggregate Value */}
          <div>
            <label className="block text-[10.5px] font-semibold text-muted uppercase mb-1">
              3. Visual Metric Value
            </label>
            <Select
              size="sm"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="w-full"
            >
              <option value="headcount">Headcount (Count)</option>
              <option value="avgAttendance">Average Attendance Rate (%)</option>
              <option value="avgPerformance">Average Performance Score</option>
              <option value="totalSalary">Total Monthly Gross Salary (₹)</option>
              <option value="totalTasks">Total Tasks Completed</option>
            </Select>
          </div>

          {/* Chart Type */}
          <div>
            <label className="block text-[10.5px] font-semibold text-muted uppercase mb-1">
              4. Chart Visualization Style
            </label>
            <div className="grid grid-cols-4 gap-1">
              {[
                { id: "bar", label: "Bar" },
                { id: "line", label: "Line" },
                { id: "area", label: "Area" },
                { id: "pie", label: "Pie" }
              ].map(ct => (
                <button
                  key={ct.id}
                  type="button"
                  onClick={() => setChartType(ct.id)}
                  className={`py-1.5 text-xs font-semibold rounded border text-center transition ${
                    chartType === ct.id
                      ? 'bg-accent text-on-accent border-accent'
                      : 'bg-surface2/60 border-line text-muted hover:text-ink'
                  }`}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Dynamic Chart Section */}
      <div className="glass-card !p-4 gap-2">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <div>
            <div className="font-display font-bold text-ink text-sm">
              Custom Visual Analytics: {groupBy === "dept" ? "Department" : groupBy === "status" ? "Status" : groupBy === "location" ? "Location" : "Role"} vs {
                metric === "headcount" ? "Headcount" : metric === "avgAttendance" ? "Avg Attendance %" : metric === "avgPerformance" ? "Avg Performance" : metric === "totalSalary" ? "Total Salary" : "Completed Tasks"
              }
            </div>
            <div className="text-[11px] text-muted">
              Live rendering with {chartData.length} aggregated data segments
            </div>
          </div>
          <span className="text-[11px] font-data px-2.5 py-1 rounded-full bg-accent/10 text-accent font-semibold border border-accent/20">
            {chartType.toUpperCase()} CHART
          </span>
        </div>

        <div className="h-64 w-full pt-3">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} angle={-15} textAnchor="end" interval={0} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip content={<GlassTooltip />} />
                <Bar dataKey="value" name={chartData[0]?.label || "Value"} fill="#0077b6" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : chartType === "line" ? (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} angle={-15} textAnchor="end" interval={0} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip content={<GlassTooltip />} />
                <Line type="monotone" dataKey="value" name={chartData[0]?.label || "Value"} stroke="#0077b6" strokeWidth={2.5} dot={{ r: 4, fill: "#0077b6" }} />
              </LineChart>
            ) : chartType === "area" ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <defs>
                  <linearGradient id="customAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0077b6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0077b6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} angle={-15} textAnchor="end" interval={0} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip content={<GlassTooltip />} />
                <Area type="monotone" dataKey="value" name={chartData[0]?.label || "Value"} stroke="#0077b6" fillOpacity={1} fill="url(#customAreaGrad)" />
              </AreaChart>
            ) : (
              <PieChart>
                <Tooltip content={<GlassTooltip />} />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Custom Dynamic Data Table with Chosen Columns */}
      <div className="glass-card !p-4 gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-ink text-sm">Dynamic Custom Data Grid</span>
            <span className="text-[11px] font-data text-muted">({tableData.length} records matching scope)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search custom records..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="bg-surface2/60 border border-line rounded px-2.5 py-1 text-xs text-ink placeholder:text-muted outline-none focus:border-accent w-52"
              />
            </div>
            <button
              type="button"
              onClick={handleExportCustomCSV}
              className="px-3 py-1 bg-surface2 border border-line rounded text-xs text-ink font-semibold hover:border-accent transition flex items-center gap-1.5"
            >
              <Icon name="download" className="w-3.5 h-3.5 text-accent" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Scrollable table showing only checked columns */}
        <div className="overflow-x-auto rounded border border-line">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface2/60 text-muted border-b border-line text-[11px] font-semibold">
              <tr>
                {selectedFields.map(key => {
                  const fieldDef = AVAILABLE_FIELDS.find(f => f.key === key);
                  const label = fieldDef ? fieldDef.label : key;
                  return (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="p-2.5 font-semibold cursor-pointer hover:text-ink transition whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>{label}</span>
                        <span className="text-[10px] text-muted">
                          {sortField === key ? (sortAsc ? "↑" : "↓") : "↕"}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-data">
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={selectedFields.length} className="text-center py-8 text-muted">
                    No matching records found for current criteria.
                  </td>
                </tr>
              ) : (
                tableData.map(row => (
                  <tr key={row.id} className="hover:bg-surface2/40 transition">
                    {selectedFields.map(key => {
                      const val = row[key];

                      if (key === "name") {
                        return (
                          <td key={key} className="p-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Avatar name={row.name} size="sm" />
                              <span className="font-semibold text-ink font-sans">{row.name}</span>
                            </div>
                          </td>
                        );
                      }

                      if (key === "id") {
                        return (
                          <td key={key} className="p-2.5 font-bold text-accent whitespace-nowrap">
                            {row.id}
                          </td>
                        );
                      }

                      if (key === "status") {
                        return (
                          <td key={key} className="p-2.5 whitespace-nowrap">
                            <StatusPill status={val.includes("Active") ? "active" : val.includes("Leave") ? "warning" : val.includes("Probation") ? "pending" : "danger"}>
                              {val}
                            </StatusPill>
                          </td>
                        );
                      }

                      if (key === "attendanceRate") {
                        return (
                          <td key={key} className="p-2.5 whitespace-nowrap">
                            <span className={`font-bold ${val >= 95 ? 'text-good' : val >= 90 ? 'text-warn' : 'text-bad'}`}>
                              {val}%
                            </span>
                          </td>
                        );
                      }

                      if (key === "performanceScore") {
                        return (
                          <td key={key} className="p-2.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-accent/10 text-accent font-bold">
                              ★ {val}
                            </span>
                          </td>
                        );
                      }

                      if (key === "grossSalary") {
                        return (
                          <td key={key} className="p-2.5 whitespace-nowrap font-bold text-ink">
                            ₹{val.toLocaleString()}
                          </td>
                        );
                      }

                      return (
                        <td key={key} className="p-2.5 text-muted whitespace-nowrap">
                          {val != null ? String(val) : "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
