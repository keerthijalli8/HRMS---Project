import React, { useState, useEffect } from 'react';
import { useProfile } from '../context/ProfileContext.jsx';

export const GreetingBlock = ({ currentUser: propUser, showDate = false }) => {
  let ctxUser = null;
  try {
    const ctx = useProfile();
    ctxUser = ctx?.profile;
  } catch (e) {}
  const currentUser = ctxUser || propUser;

  const [now, setNow] = useState(() => new Date());

  // Helper to extract city from "City, State" string in localStorage cache
  const readCityFromCache = () => {
    try {
      const raw = localStorage.getItem("hrms_location");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.location) {
          const cityPart = parsed.location.split(',')[0].trim();
          if (cityPart && cityPart !== "Detecting location…") {
            return cityPart;
          }
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return "Hyderabad";
  };

  const [city, setCity] = useState(readCityFromCache);

  // 1. Minute ticker: re-evaluates greeting and date every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // 2. Listen for location updates dispatched by LiveClock
  useEffect(() => {
    const handleLocationUpdate = () => {
      setCity(readCityFromCache());
    };

    setCity(readCityFromCache());
    window.addEventListener("hrms-location-updated", handleLocationUpdate);
    return () => {
      window.removeEventListener("hrms-location-updated", handleLocationUpdate);
    };
  }, []);

  // Time-of-day greeting in Asia/Kolkata timezone
  const getGreeting = (date) => {
    try {
      const hourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        hour12: false
      }).format(date);
      const hour = parseInt(hourStr, 10);

      if (hour >= 5 && hour < 12) return "Good morning";
      if (hour >= 12 && hour < 17) return "Good afternoon";
      if (hour >= 17 && hour < 21) return "Good evening";
      return "Good night";
    } catch (e) {
      return "Good day";
    }
  };

  // Capitalized first name safe extraction
  const getFirstName = (user) => {
    let raw = (user?.firstName || user?.name?.split(/\s+/)[0] || "").trim();
    raw = raw.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
    if (!raw) return "there";
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  };

  // Formats date as: "Monday, 9 November 2026"
  const formatDate = (date) => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).formatToParts(date).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});

      const dayNumber = String(parseInt(parts.day, 10));
      return `${parts.weekday}, ${dayNumber} ${parts.month} ${parts.year}`;
    } catch (e) {
      return date.toLocaleDateString();
    }
  };

  const greeting = getGreeting(now);
  const firstName = getFirstName(currentUser);
  const formattedDate = formatDate(now);
  const systemRole = currentUser?.systemRole || "Employee";

  return (
    <div className="flex flex-col items-start justify-start text-left gap-1.5 w-full">
      {/* Line 1: Role Chip & MYWORKSPACE Label */}
      <div className="flex items-center gap-2 select-none leading-none">
        <span className="glass-pill px-2.5 py-0.5 text-[11px] font-semibold text-accent font-data tracking-wide border border-line">
          {systemRole}
        </span>
        <span className="text-[11px] uppercase font-bold tracking-widest text-muted/80">
          MYWORKSPACE
        </span>
      </div>

      {/* Line 2: Big Greeting Heading */}
      <h2 className="font-display font-bold text-ink text-3xl xl:text-4xl leading-tight truncate max-w-full">
        {greeting}, {firstName} 👋
      </h2>

      {/* Optional Date (Only if showDate is true) */}
      {showDate && (
        <div className="text-[12px] text-muted font-medium mt-0.5 truncate">
          {formattedDate} · {city}
        </div>
      )}
    </div>
  );
};
