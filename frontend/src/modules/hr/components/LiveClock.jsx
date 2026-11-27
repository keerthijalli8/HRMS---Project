import React, { useState, useEffect } from 'react';
import { formatDateLong, formatDate } from '../utils/format.js';

const DEFAULT_LOCATION = "Hyderabad, Telangana";
const CACHE_KEY = "hrms_location";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const LiveClock = ({ className = "" }) => {
  // Clock state (kept inside LiveClock only to avoid re-rendering parent components)
  const [time, setTime] = useState(() => new Date());

  // Location state: load cached location if < 24h old, else "Detecting location…"
  const [location, setLocation] = useState(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.location && parsed?.timestamp && (Date.now() - parsed.timestamp < ONE_DAY_MS)) {
          return parsed.location;
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return "Detecting location…";
  });

  // 1. Clock ticker: updates every second in Asia/Kolkata
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Browser Geolocation & Reverse Geocoding
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchLocation = async (lat, lon) => {
      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          const city = data.city || data.locality || "";
          const state = data.principalSubdivision || "";
          let locStr = DEFAULT_LOCATION;
          if (city && state) {
            locStr = `${city}, ${state}`;
          } else if (city || state) {
            locStr = city || state;
          }

          if (isMounted) {
            setLocation(locStr);
          }

          try {
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ location: locStr, timestamp: Date.now() })
            );
            window.dispatchEvent(new Event("hrms-location-updated"));
          } catch (e) {}
        } else {
          if (isMounted) {
            setLocation((prev) => (prev === "Detecting location…" ? DEFAULT_LOCATION : prev));
          }
        }
      } catch (err) {
        if (isMounted && err.name !== 'AbortError') {
          setLocation((prev) => (prev === "Detecting location…" ? DEFAULT_LOCATION : prev));
        }
      }
    };

    try {
      if (typeof navigator !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!isMounted) return;
            fetchLocation(position.coords.latitude, position.coords.longitude);
          },
          (geoErr) => {
            if (!isMounted) return;
            // Blocked, timed out, or unavailable: fallback to DEFAULT_LOCATION with no error UI
            setLocation((prev) => (prev === "Detecting location…" ? DEFAULT_LOCATION : prev));
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
        );
      } else {
        if (isMounted) {
          setLocation(DEFAULT_LOCATION);
        }
      }
    } catch (err) {
      if (isMounted) {
        setLocation(DEFAULT_LOCATION);
      }
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Format time strictly to 12-hour format with AM/PM (No timezone label)
  const formatTime = (d) => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).formatToParts(d).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});

      const dayPeriod = (parts.dayPeriod || 'AM').toUpperCase();
      return `${parts.hour}:${parts.minute}:${parts.second} ${dayPeriod}`;
    } catch (e) {
      return d.toLocaleTimeString('en-US');
    }
  };

  // Format full date: "Day, DD Month YYYY" (e.g., "Monday, 09 November 2026")
  const formatFullDate = (d) => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).formatToParts(d).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});
      return `${parts.weekday}, ${parts.day} ${parts.month} ${parts.year}`;
    } catch (e) {
      return d.toLocaleDateString();
    }
  };

  // Format short date: "Mon, 09 Nov 2026"
  const formatShortDate = (d) => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).formatToParts(d).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});
      return `${parts.weekday}, ${parts.day} ${parts.month} ${parts.year}`;
    } catch (e) {
      return d.toLocaleDateString();
    }
  };

  const formattedTime = formatTime(time);
  const formattedFullDate = formatDateLong(time);
  const formattedShortDate = formatDate(time);

  return (
    <div className={`h-[48px] px-4 rounded-[14px] bg-surface2/60 border border-line font-num tabular-nums flex flex-col justify-center select-none shrink-0 min-w-0 ${className}`}>
      {/* Line 1: 14px, weight 600 */}
      <div className="text-[14px] font-semibold text-ink flex items-center gap-1.5 whitespace-nowrap leading-tight">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
        <span>{formattedTime}</span>
      </div>

      {/* Line 2: 12px, muted, single line, no wrap, ellipsis if too long. Hidden below 1024px */}
      <div className="hidden lg:flex items-center gap-1 text-[12px] text-muted whitespace-nowrap leading-tight truncate max-w-full mt-0.5">
        <span className="truncate">{formattedShortDate}</span>

        {/* Location text with pin SVG icon (hidden below 1280px) */}
        <span className="hidden xl:inline-flex items-center gap-1 text-muted truncate">
          <span>·</span>
          <svg
            className="w-2.5 h-2.5 text-accent shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className={`truncate ${location === "Detecting location…" ? "italic text-muted/70" : "text-muted"}`}>
            {location}
          </span>
        </span>
      </div>
    </div>
  );
};
