import React, { useState, useEffect } from 'react';

export const HeaderClock = ({ className = "" }) => {
  const [timeStr, setTimeStr] = useState(() => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(new Date());
  });

  useEffect(() => {
    const updateTime = () => {
      setTimeStr(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).format(new Date())
      );
    };

    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface2/60 border border-line font-mono text-[11.5px] font-semibold text-muted select-none ${className}`}
      title="Current Indian Standard Time (Asia/Kolkata)"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
      <span className="tabular-nums tracking-wide text-ink">{timeStr}</span>
      <span className="text-[9.5px] text-muted/70 font-sans uppercase font-bold">IST</span>
    </div>
  );
};
