import React from 'react';
import { Avatar } from './Avatar.jsx';
import { StatusPill } from './StatusPill.jsx';
import { ScoreRing } from './ScoreRing.jsx';
import { MetricBar } from './MetricBar.jsx';
import { SVGSparkChart } from './SVGSparkChart.jsx';
import { formatDate, formatScore, formatRating } from '../utils/format.js';

export const PerformanceDetail = ({ record, deptAvg, orgAvg }) => {
  if (!record) {
    return (
      <div className="glass-card p-6 text-center text-muted text-xs">
        No performance record found.
      </div>
    );
  }

  // New Joiner State: single card with required message and no charts
  if (record.status === "New joiner") {
    return (
      <div className="glass-card !p-8 border border-line text-center flex flex-col items-center justify-center gap-3">
        <Avatar name={record.name} size="lg" />
        <div>
          <div className="font-display font-bold text-ink text-lg">{record.name}</div>
          <div className="text-muted text-xs mt-0.5">
            <span className="font-data font-semibold text-accent">{record.employeeId}</span> · {record.role} · {record.dept}
          </div>
          <div className="text-muted text-[11px] mt-0.5">
            Manager: {record.manager} · Joined: <span className="font-num">{formatDate(record.joined)}</span>
          </div>
        </div>
        <div className="mt-3 p-4 rounded-xl bg-surface2/60 border border-line text-xs text-muted max-w-md">
          New joiner: the first performance review starts after 90 days of service.
        </div>
      </div>
    );
  }

  // Pill color type
  let pillType = "good";
  if (record.overall >= 80) pillType = "good";
  else if (record.overall >= 65) pillType = "accent2";
  else if (record.overall >= 50) pillType = "warn";
  else pillType = "bad";

  const trendPoints = (record.trend || []).map(t => t.score);
  const trendLabels = (record.trend || []).map(t => t.month);

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* 1. Header Row (Plain div with explicit flex flex-row) */}
      <div className="p-4 rounded-2xl bg-surface2/60 border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-row items-center gap-3.5 min-w-0">
          <Avatar name={record.name} />
          <div className="min-w-0">
            <div className="font-display font-bold text-ink text-base truncate">{record.name}</div>
            <div className="text-xs text-muted truncate">
              <span className="font-data font-semibold text-accent">{record.employeeId}</span> · {record.role} · {record.dept}
            </div>
            <div className="text-[11px] text-muted mt-0.5 truncate">
              Manager: <span className="text-ink">{record.manager}</span> · Joined: <span className="font-num text-ink">{formatDate(record.joined)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <StatusPill type={pillType} text={`${record.ratingLabel} · ${record.cycle}`} />
        </div>
      </div>

      {/* 2. Top 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Overall Score Card */}
        <div className="glass-card !p-5 items-center justify-center text-center gap-3">
          <div className="font-display font-bold text-ink text-sm uppercase tracking-wider self-start">
            Overall Score
          </div>
          <div className="py-2">
            <ScoreRing score={record.overall} size={140} />
          </div>
          <div className="font-display font-bold text-ink text-sm">
            {record.ratingLabel} (<span className="font-num font-semibold">{formatRating(record.rating)}</span>)
          </div>
          {(deptAvg !== undefined || orgAvg !== undefined) && (
            <div className="text-[11px] text-muted font-medium">
              Dept avg <span className="font-num">{formatScore(deptAvg)}</span> · Org avg <span className="font-num">{formatScore(orgAvg)}</span>
            </div>
          )}
        </div>

        {/* Middle: Performance Breakdown */}
        <div className="glass-card !p-5 gap-3.5">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div className="font-display font-bold text-ink text-sm uppercase tracking-wider">
              Performance Breakdown
            </div>
            <span className="text-[11px] text-muted">Weighted Evaluation</span>
          </div>

          <div className="flex flex-col gap-3">
            {(record.metrics || []).map((m) => (
              <MetricBar
                key={m.key}
                label={m.label}
                weight={m.weight}
                score={m.score}
              />
            ))}
          </div>
        </div>

        {/* Right: Last 6 Months Trend */}
        <div className="glass-card !p-5 gap-3">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div className="font-display font-bold text-ink text-sm uppercase tracking-wider">
              Last 6 Months
            </div>
            <span className="text-[11px] text-muted font-data">Appraisal Trend</span>
          </div>

          <div className="w-full flex-1 flex flex-col justify-center pt-2">
            {trendPoints.length > 0 ? (
              <SVGSparkChart
                points={trendPoints}
                labels={trendLabels}
                height={140}
                title="Performance Score Trend"
              />
            ) : (
              <div className="text-center text-muted text-xs py-8">
                Trend data not available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Goals & KPIs */}
        <div className="glass-card !p-5 gap-3">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div className="font-display font-bold text-ink text-sm uppercase tracking-wider">
              Goals & KPIs
            </div>
            <span className="text-[11px] text-muted">{record.goals?.length || 0} Key Results</span>
          </div>

          <div className="flex flex-col gap-3 mt-1">
            {(record.goals || []).map((g, idx) => {
              const gType = g.status === "Completed" ? "good" : g.status === "On track" ? "info" : "bad";
              return (
                <div key={idx} className="p-3 rounded-xl bg-surface2/50 border border-line flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-ink text-xs leading-snug">{g.title}</span>
                    <StatusPill type={gType} text={g.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-surface2 border border-line overflow-hidden">
                      <div
                        className={`h-full ${g.status === "Completed" ? "bg-good" : g.status === "On track" ? "bg-accent" : "bg-bad"} rounded-full transition-all duration-500`}
                        style={{ width: `${g.progress}%` }}
                      />
                    </div>
                    <span className="font-data font-bold text-ink text-[11px] shrink-0">
                      {g.progress}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Manager Feedback */}
        <div className="glass-card !p-5 gap-3">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div className="font-display font-bold text-ink text-sm uppercase tracking-wider">
              Manager Feedback
            </div>
            <span className="text-[11px] text-muted">{record.cycle} Appraisal</span>
          </div>

          {record.feedback ? (
            <div className="flex-1 flex flex-col justify-between gap-4 p-4 rounded-xl bg-surface2/40 border border-line mt-1">
              <p className="text-ink text-xs leading-relaxed italic">
                "{record.feedback.text}"
              </p>

              <div className="pt-3 border-t border-line/60 flex items-center justify-between text-[11px] text-muted">
                <div>
                  Review by: <strong className="text-ink">{record.feedback.by}</strong>
                </div>
                <div className="font-data">
                  {record.feedback.date}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted text-xs py-8">
              No feedback recorded for this cycle
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
