import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// Monsoon Glass Custom Chart Tooltip
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

// Monsoon Glass Color Palette
const PALETTE = ["#0077b6", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6", "#14b8a6"];

export const ReportChartsSection = ({ category, data }) => {
  if (!data || !data.charts) return null;
  const { charts } = data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* ================= 1. EMPLOYEE CHARTS ================= */}
      {category === "employee" && (
        <>
          {/* Dept Bar Chart (7 cols) */}
          <div className="lg:col-span-7 glass-card !p-4 gap-2">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="font-display font-bold text-ink text-sm">Department Distribution</div>
              <span className="text-[11px] text-muted">Active Headcount</span>
            </div>
            <div className="w-full h-[240px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.department} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.5} />
                  <XAxis dataKey="name" stroke="var(--muted)" fontSize={10} angle={-15} textAnchor="end" />
                  <YAxis stroke="var(--muted)" fontSize={10} />
                  <Tooltip content={<GlassTooltip />} />
                  <Bar dataKey="count" name="Employees" fill="#0077b6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gender Donut Chart (5 cols) */}
          <div className="lg:col-span-5 glass-card !p-4 gap-2">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="font-display font-bold text-ink text-sm">Gender Ratio</div>
              <span className="text-[11px] text-muted">Diversity Metrics</span>
            </div>
            <div className="w-full h-[240px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.gender}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {charts.gender.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<GlassTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '11px', color: 'var(--muted)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Attrition Trend Area Chart (12 cols) */}
          <div className="lg:col-span-12 glass-card !p-4 gap-2">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div>
                <div className="font-display font-bold text-ink text-sm">Monthly Headcount Movement & Attrition</div>
                <div className="text-[11px] text-muted">Joiners vs Exits and Rolling Turnover %</div>
              </div>
              <span className="text-good text-xs font-semibold font-data">Avg Attrition: 2.7%</span>
            </div>
            <div className="w-full h-[220px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.attrition} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="joinersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="exitsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.5} />
                  <XAxis dataKey="month" stroke="var(--muted)" fontSize={11} />
                  <YAxis stroke="var(--muted)" fontSize={11} />
                  <Tooltip content={<GlassTooltip />} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="joiners" name="New Joiners" stroke="#10b981" fill="url(#joinersGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="exits" name="Exits" stroke="#ef4444" fill="url(#exitsGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ================= 2. ATTENDANCE CHARTS ================= */}
      {category === "attendance" && (
        <>
          {/* Monthly Attendance Trend (7 cols) */}
          <div className="lg:col-span-7 glass-card !p-4 gap-2">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="font-display font-bold text-ink text-sm">Monthly Attendance Rate (%)</div>
              <span className="text-[11px] text-accent font-data">Target: 95%+</span>
            </div>
            <div className="w-full h-[240px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.5} />
                  <XAxis dataKey="month" stroke="var(--muted)" fontSize={11} />
                  <YAxis stroke="var(--muted)" fontSize={11} domain={[88, 100]} />
                  <Tooltip content={<GlassTooltip />} />
                  <Line type="monotone" dataKey="attendance" name="Attendance %" stroke="#0077b6" strokeWidth={3} dot={{ r: 4, fill: '#0077b6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mode Donut Chart (5 cols) */}
          <div className="lg:col-span-5 glass-card !p-4 gap-2">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="font-display font-bold text-ink text-sm">Verification Mode Ratio</div>
              <span className="text-[11px] text-muted">Hardware Logs</span>
            </div>
            <div className="w-full h-[240px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.verificationMode}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    <Cell fill="#0077b6" />
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip content={<GlassTooltip />} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Attendance Bar (12 cols) */}
          <div className="lg:col-span-12 glass-card !p-4 gap-2">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="font-display font-bold text-ink text-sm">Department-wise Attendance Ranking</div>
              <span className="text-[11px] text-muted">Punctuality Scorecard</span>
            </div>
            <div className="w-full h-[200px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.department} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.5} />
                  <XAxis dataKey="dept" stroke="var(--muted)" fontSize={11} />
                  <YAxis stroke="var(--muted)" fontSize={11} domain={[85, 100]} />
                  <Tooltip content={<GlassTooltip />} />
                  <Bar dataKey="attendanceRate" name="Attendance %" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ================= 3. LEAVE CHARTS ================= */}
      {category === "leave" && (
        <>
          {/* Leave Type Donut (5 cols) */}
          <div className="lg:col-span-5 glass-card !p-4 gap-2">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="font-display font-bold text-ink text-sm">Leave Type Utilization</div>
              <span className="text-[11px] text-muted">Statutory Leaves</span>
            </div>
            <div className="w-full h-[240px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.typeDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {charts.typeDistribution.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<GlassTooltip />} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10.5px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Approved vs Pending (7 cols) */}
          <div className="lg:col-span-7 glass-card !p-4 gap-2">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="font-display font-bold text-ink text-sm">Department Leave Days</div>
              <span className="text-[11px] text-muted">Approved vs Pending</span>
            </div>
            <div className="w-full h-[240px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.deptBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.5} />
                  <XAxis dataKey="dept" stroke="var(--muted)" fontSize={11} />
                  <YAxis stroke="var(--muted)" fontSize={11} />
                  <Tooltip content={<GlassTooltip />} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="approvedDays" name="Approved Days" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pendingDays" name="Pending Signoff" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Leave Trend (12 cols) */}
          <div className="lg:col-span-12 glass-card !p-4 gap-2">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="font-display font-bold text-ink text-sm">Monthly Leave Consumption Pattern</div>
              <span className="text-[11px] text-muted">Cumulative Leave Days</span>
            </div>
            <div className="w-full h-[200px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="leaveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0077b6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0077b6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.5} />
                  <XAxis dataKey="month" stroke="var(--muted)" fontSize={11} />
                  <YAxis stroke="var(--muted)" fontSize={11} />
                  <Tooltip content={<GlassTooltip />} />
                  <Area type="monotone" dataKey="days" name="Total Leave Days" stroke="#0077b6" fill="url(#leaveGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ================= 4. PAYROLL CHARTS ================= */}
      {category === "payroll" && (
        <>
          {/* Department Payroll Cost (7 cols) */}
          <div className="lg:col-span-7 glass-card !p-4 gap-2">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="font-display font-bold text-ink text-sm">Department-wise Salary Disbursement</div>
              <span className="text-[11px] text-muted">₹ INR Monthly</span>
            </div>
            <div className="w-full h-[240px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.department} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.5} />
                  <XAxis dataKey="dept" stroke="var(--muted)" fontSize={10} angle={-15} textAnchor="end" />
                  <YAxis stroke="var(--muted)" fontSize={10} tickFormatter={(v) => `₹${(v/100000).toFixed(1)}L`} />
                  <Tooltip content={<GlassTooltip />} />
                  <Bar dataKey="amount" name="Payroll Cost" fill="#0077b6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Deductions Pie (5 cols) */}
          <div className="lg:col-span-5 glass-card !p-4 gap-2">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="font-display font-bold text-ink text-sm">Deductions Breakdown</div>
              <span className="text-[11px] text-muted">TDS / PF / PT / ESI</span>
            </div>
            <div className="w-full h-[240px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.deductions}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    <Cell fill="#0077b6" />
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#8b5cf6" />
                  </Pie>
                  <Tooltip content={<GlassTooltip />} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10.5px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Gross vs Net Area (12 cols) */}
          <div className="lg:col-span-12 glass-card !p-4 gap-2">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="font-display font-bold text-ink text-sm">Monthly Payroll Trend (Gross vs Net vs Deductions)</div>
              <span className="text-[11px] text-muted font-data">FY 2026-27</span>
            </div>
            <div className="w-full h-[220px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.monthly} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.5} />
                  <XAxis dataKey="month" stroke="var(--muted)" fontSize={11} />
                  <YAxis stroke="var(--muted)" fontSize={11} tickFormatter={(v) => `₹${(v/100000).toFixed(1)}L`} />
                  <Tooltip content={<GlassTooltip />} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="gross" name="Gross Salary" stroke="#0077b6" fill="#0077b6" fillOpacity={0.2} strokeWidth={2} />
                  <Area type="monotone" dataKey="net" name="Net Disbursed" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                  <Area type="monotone" dataKey="deductions" name="Statutory Deductions" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ================= 5. PERFORMANCE CHARTS ================= */}
      {category === "performance" && (
        <>
          {/* Rating Bell Curve Bar (6 cols) */}
          <div className="lg:col-span-6 glass-card !p-4 gap-2">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="font-display font-bold text-ink text-sm">Appraisal Bell Curve Distribution</div>
              <span className="text-[11px] text-muted">Bands 1 to 5</span>
            </div>
            <div className="w-full h-[240px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.ratingDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.5} />
                  <XAxis dataKey="name" stroke="var(--muted)" fontSize={10} angle={-15} textAnchor="end" />
                  <YAxis stroke="var(--muted)" fontSize={10} />
                  <Tooltip content={<GlassTooltip />} />
                  <Bar dataKey="count" name="Employees" fill="#0077b6" radius={[4, 4, 0, 0]}>
                    {charts.ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Scores (6 cols) */}
          <div className="lg:col-span-6 glass-card !p-4 gap-2">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="font-display font-bold text-ink text-sm">Department Performance Ranking</div>
              <span className="text-[11px] text-muted">Average / 100</span>
            </div>
            <div className="w-full h-[240px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.deptScores} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.5} />
                  <XAxis type="number" domain={[50, 100]} stroke="var(--muted)" fontSize={10} />
                  <YAxis type="category" dataKey="dept" stroke="var(--muted)" fontSize={10} width={90} />
                  <Tooltip content={<GlassTooltip />} />
                  <Bar dataKey="avgScore" name="Avg Score" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quarterly Trend Line (12 cols) */}
          <div className="lg:col-span-12 glass-card !p-4 gap-2">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="font-display font-bold text-ink text-sm">Quarter-over-Quarter Performance Progression</div>
              <span className="text-[11px] text-accent font-data">Continuous Improvement</span>
            </div>
            <div className="w-full h-[200px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.quarterlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.5} />
                  <XAxis dataKey="quarter" stroke="var(--muted)" fontSize={11} />
                  <YAxis stroke="var(--muted)" fontSize={11} domain={[65, 85]} />
                  <Tooltip content={<GlassTooltip />} />
                  <Line type="monotone" dataKey="score" name="Avg Score" stroke="#0077b6" strokeWidth={3} dot={{ r: 4, fill: '#0077b6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ================= 6. ONBOARDING & EXIT CHARTS ================= */}
      {category === "onboarding_exit" && (
        <>
          {/* Pipeline Funnel Bar (7 cols) */}
          <div className="lg:col-span-7 glass-card !p-4 gap-2">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="font-display font-bold text-ink text-sm">Onboarding Pipeline Stage Velocity</div>
              <span className="text-[11px] text-muted">Active Pipeline</span>
            </div>
            <div className="w-full h-[240px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.pipeline} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.5} />
                  <XAxis dataKey="stage" stroke="var(--muted)" fontSize={10} angle={-15} textAnchor="end" />
                  <YAxis stroke="var(--muted)" fontSize={10} />
                  <Tooltip content={<GlassTooltip />} />
                  <Bar dataKey="candidates" name="Candidates" fill="#0077b6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Exit Reasons Donut (5 cols) */}
          <div className="lg:col-span-5 glass-card !p-4 gap-2">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="font-display font-bold text-ink text-sm">Exit Interview Reasons</div>
              <span className="text-[11px] text-muted">Attrition Insights</span>
            </div>
            <div className="w-full h-[240px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.exitReasons}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {charts.exitReasons.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<GlassTooltip />} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10.5px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ================= 7. TASK CHARTS ================= */}
      {category === "tasks" && (
        <>
          {/* Weekly Completion Area (7 cols) */}
          <div className="lg:col-span-7 glass-card !p-4 gap-2">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="font-display font-bold text-ink text-sm">Sprint Task Velocity (Created vs Completed)</div>
              <span className="text-[11px] text-muted">Weekly Output</span>
            </div>
            <div className="w-full h-[240px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.5} />
                  <XAxis dataKey="week" stroke="var(--muted)" fontSize={11} />
                  <YAxis stroke="var(--muted)" fontSize={11} />
                  <Tooltip content={<GlassTooltip />} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                  <Area type="monotone" dataKey="created" name="Created" stroke="#0077b6" fill="#0077b6" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority Donut (5 cols) */}
          <div className="lg:col-span-5 glass-card !p-4 gap-2">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="font-display font-bold text-ink text-sm">Task Priority Breakdown</div>
              <span className="text-[11px] text-muted">Active Workload</span>
            </div>
            <div className="w-full h-[240px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.priority}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {charts.priority.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<GlassTooltip />} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10.5px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
