import React, { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { Avatar } from '../components/Avatar.jsx';

export const PerformanceView = ({ currentUser, onTriggerToast }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Sample Data for Rating Distribution
  const ratingDistribution = [
    { rating: "5 - Outstanding", count: 1, percentage: 8, width: "8%" },
    { rating: "4 - Exceeds Expectations", count: 4, percentage: 33, width: "33%" },
    { rating: "3 - Meets Expectations", count: 7, percentage: 58, width: "58%" },
    { rating: "2 - Needs Improvement", count: 0, percentage: 0, width: "0%" },
    { rating: "1 - Unsatisfactory", count: 0, percentage: 0, width: "0%" },
  ];

  // Department Performance Data
  const departmentPerformance = [
    { dept: "Human Resources", evaluated: 2, score: 86, width: "86%" },
    { dept: "Sales", evaluated: 1, score: 82, width: "82%" },
    { dept: "Marketing", evaluated: 1, score: 80, width: "80%" },
    { dept: "Finance", evaluated: 1, score: 78, width: "78%" },
    { dept: "Engineering", evaluated: 4, score: "77.5", width: "77.5%" },
    { dept: "Operations", evaluated: 1, score: 75, width: "75%" },
    { dept: "Design", evaluated: 1, score: 72, width: "72%" },
    { dept: "Support", evaluated: 1, score: 70, width: "70%" },
  ];

  // Sample Employee Performance Records
  const employees = [
    { id: "EMP-1042", name: "Aarav Sharma", role: "MAIN_TL", dept: "Engineering", overall: 91, rating: "Outstanding", trend: "+0", status: "Reviewed" },
    { id: "EMP-1001", name: "Meera Reddy", role: "TL", dept: "Human Resources", overall: 88, rating: "Exceeds Expectations", trend: "+2", status: "Reviewed" },
    { id: "EMP-1088", name: "Pooja Patel", role: "EMPLOYEE", dept: "Human Resources", overall: 84, rating: "Exceeds Expectations", trend: "-1", status: "Reviewed" },
    { id: "EMP-1301", name: "Vikram Malhotra", role: "TL", dept: "Sales", overall: 82, rating: "Exceeds Expectations", trend: "+0", status: "Reviewed" },
    { id: "EMP-1401", name: "Ananya Roy", role: "EMPLOYEE", dept: "Marketing", overall: 80, rating: "Exceeds Expectations", trend: "+0", status: "Reviewed" },
    { id: "EMP-2002", name: "Anita Desai", role: "EMPLOYEE", dept: "Engineering", overall: 79, rating: "Meets Expectations", trend: "+0", status: "Reviewed" },
    { id: "EMP-1201", name: "Kavita Rao", role: "EMPLOYEE", dept: "Finance", overall: 78, rating: "Meets Expectations", trend: "+3", status: "Reviewed" },
    { id: "EMP-1501", name: "Suresh Menon", role: "EMPLOYEE", dept: "Operations", overall: 75, rating: "Meets Expectations", trend: "+2", status: "Reviewed" },
  ];

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in">
      {/* Page Header */}
      <div className="glass-card !p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border border-line shadow-sm">
        <div>
          <h1 className="font-display font-bold text-ink text-xl">Organization Performance</h1>
          <p className="text-xs text-muted mt-0.5">
            Comprehensive analytics, rating distributions, and departmental performance benchmarks.
          </p>
        </div>
        <div className="glass-pill px-3 py-1.5 text-xs text-accent font-data font-semibold">
          Q3 FY27 Active Cycle
        </div>
      </div>

      {/* Main Grid Section (Analytics & Graphs) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* 1. Rating Distribution Card */}
        <div className="glass-card flex flex-col gap-5 border border-line shadow-lg">
          <div className="flex items-center justify-between border-b border-line/60 pb-3">
            <div>
              <h2 className="font-display font-bold text-ink text-base">Rating Distribution</h2>
              <p className="text-xs text-muted">Overall performance bands across organization</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-accent/15 text-accent border border-accent/30 text-xs font-data font-bold">
              Q3 FY27
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {ratingDistribution.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1.5 p-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink">{item.rating}</span>
                  <span className="font-num font-bold text-muted">
                    {item.count} <span className="font-normal text-[11px]">({item.percentage}%)</span>
                  </span>
                </div>
                {/* Clean line where the color fills according to percentage width */}
                <div className="w-full h-0.5 rounded-full bg-surface2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: item.width }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Department Performance Card */}
        <div className="glass-card flex flex-col gap-5 border border-line shadow-lg">
          <div className="flex items-center justify-between border-b border-line/60 pb-3">
            <div>
              <h2 className="font-display font-bold text-ink text-base">Department Performance</h2>
              <p className="text-xs text-muted">Average score and headcounts sorted high to low</p>
            </div>
            <span className="text-xs text-muted font-num bg-surface2 px-2.5 py-1 rounded-lg border border-line">
              8 Departments
            </span>
          </div>

          <div className="flex flex-col gap-4 max-h-[380px] overflow-y-auto pr-1">
            {departmentPerformance.map((dept, idx) => (
              <div key={idx} className="flex flex-col gap-1.5 p-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{dept.dept}</span>
                    <span className="text-[10.5px] text-muted">({dept.evaluated} evaluated)</span>
                  </div>
                  <span className="font-num font-bold text-accent text-xs">
                    {dept.score} <span className="text-[10px] font-normal text-muted">/ 100 ({dept.width})</span>
                  </span>
                </div>
                {/* Clean line filled according to score width */}
                <div className="w-full h-0.5 rounded-full bg-surface2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: dept.width }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Employee Performance Records Table */}
      <div className="glass-card overflow-hidden !p-0 border border-line shadow-lg mt-2">
        <div className="p-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface2/40">
          <div>
            <h3 className="font-display font-bold text-ink text-base">Employee Performance Records</h3>
            <p className="text-xs text-muted">Review performance ratings, overall scores, and 6-month trends</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Icon name="search" className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search employee, ID, dept..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface2/60 border border-line text-xs text-ink placeholder:text-muted focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface2/60 border-b border-line text-muted uppercase text-[10.5px] font-semibold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">EMP ID</th>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Overall</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Trend (6M)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-muted text-xs">
                    No employee performance records found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-surface2/30 transition">
                    <td className="py-3.5 px-4 font-mono text-accent font-semibold">
                      {emp.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={emp.name} />
                        <div>
                          <div className="font-semibold text-ink">{emp.name}</div>
                          <div className="text-[10.5px] text-muted">{emp.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted">{emp.dept}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-num font-bold text-ink">{emp.overall}</span>
                        <div className="w-16 h-0.5 rounded-full bg-surface2 overflow-hidden">
                          <div 
                            className="h-full bg-accent rounded-full" 
                            style={{ width: `${emp.overall}%` }} 
                          />
                        </div>
                      </div>
                    </td>

                    {/* RATING Column (Clean text & dot without box) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          emp.rating === "Outstanding" ? "bg-emerald-400" :
                          emp.rating === "Exceeds Expectations" ? "bg-accent" :
                          "bg-sky-400"
                        }`} />
                        <span className="text-xs font-medium text-ink">
                          {emp.rating}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-muted">
                      {emp.trend}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-ink font-medium">
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onTriggerToast?.(`Viewing performance profile for ${emp.name}`)}
                        className="px-3 py-1.5 rounded-lg bg-surface2/80 border border-line text-accent hover:bg-accent hover:text-on-accent transition text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        View
                      </button>
                    </td>
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

export default PerformanceView;