import React from 'react';
import { ScoreRing } from './ScoreRing.jsx';
import { MetricBar } from './MetricBar.jsx';
import { Icon } from './Icon.jsx';
import { formatRating, formatDelta, deltaClass } from '../utils/format.js';

export const MyPerformanceCard = ({ record, onViewFull }) => {
  // New joiner state or missing record
  if (!record || record.status === "New joiner") {
    return (
      <div className="glass-card !p-4 border border-line rounded-[18px] flex flex-col gap-2.5 text-left">
        <div className="flex items-center justify-between border-b border-line/40 pb-2.5">
          <div className="font-display font-semibold text-ink text-[16px]">My Performance</div>
          <span className="text-[11px] text-accent font-data font-semibold">Q3 FY27</span>
        </div>
        <div className="p-3 rounded-xl bg-surface2/50 border border-line text-xs text-muted flex items-center gap-2">
          <Icon name="clock" className="w-4 h-4 text-accent shrink-0" />
          <span>Your first review starts after 90 days of service.</span>
        </div>
      </div>
    );
  }

  // Calculate change vs last month from trend (months 4 vs 5)
  const trend = record.trend || [];
  let diff = 0;
  if (trend.length >= 2) {
    const prev = trend[trend.length - 2].score;
    const curr = trend[trend.length - 1].score;
    diff = curr - prev;
  }

  // Three highest metrics
  const topMetrics = [...(record.metrics || [])]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <div className="glass-card !p-4 border border-line rounded-[18px] flex flex-col gap-3 text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line/40 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center font-bold shrink-0">
            <Icon name="trending-up" className="w-3.5 h-3.5 text-accent" />
          </div>
          <div>
            <div className="font-display font-semibold text-ink text-[16px]">My Performance</div>
            <div className="text-[11px] text-muted -mt-0.5">Appraisal & Goals Summary</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10.5px] font-semibold text-accent font-data px-2 py-0.5 rounded-full bg-surface2 border border-line">
            {record.cycle}
          </span>
          {onViewFull && (
            <button
              type="button"
              onClick={onViewFull}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-line text-[11px] font-semibold text-ink hover:border-accent hover:text-accent hover:bg-accent/5 transition cursor-pointer"
            >
              <span>View full</span>
              <Icon name="arrow-right" className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content: 2-Column Balanced Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        
        {/* Left: Score Ring & Rating info (4 cols) */}
        <div className="md:col-span-4 flex flex-row items-center gap-3 p-3 rounded-xl bg-surface2/30 border border-line">
          <ScoreRing score={record.overall} size={78} />
          <div className="min-w-0">
            <div className="font-display font-bold text-ink text-xs leading-tight">
              {record.ratingLabel}
            </div>
            <div className="text-[10.5px] font-data text-muted mt-0.5">
              Rating: <strong className="text-ink font-num">{formatRating(record.rating)}</strong>
            </div>
            <div className={`text-[10.5px] font-semibold font-num mt-1 flex items-center gap-1 ${deltaClass(diff)}`}>
              <span>{formatDelta(diff, { suffix: "" })}</span>
              <span className="text-muted/80 font-normal">vs last month</span>
            </div>
          </div>
        </div>

        {/* Right: Top 3 Metrics with Slimmer Percentage Progress Bar (8 cols) */}
        <div className="md:col-span-8 flex flex-col gap-2 p-3 rounded-xl bg-surface2/30 border border-line">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-muted flex justify-between items-center">
            <span>Key Metric Highlights</span>
            <span className="text-[10px] text-accent lowercase">out of 100%</span>
          </div>
          <div className="flex flex-col gap-2">
            {topMetrics.map((m) => (
              <div key={m.key} className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-ink">{m.label}</span>
                  <span className="font-mono font-bold text-accent">{m.score}%</span>
                </div>
                {/* Slimmer progress bar height changed to h-1.5 */}
                <div className="w-full bg-surface2/80 h-1.5 rounded-full overflow-hidden border border-line/40">
                  <div 
                    className="bg-accent h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(Math.max(m.score, 0), 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Mobile view full button */}
      {onViewFull && (
        <div className="sm:hidden pt-0.5">
          <button
            type="button"
            onClick={onViewFull}
            className="w-full py-1.5 rounded-lg border border-line text-[11px] font-semibold text-accent hover:border-accent hover:bg-accent/5 transition flex items-center justify-center gap-1.5"
          >
            <span>View full performance</span>
            <Icon name="arrow-right" className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};