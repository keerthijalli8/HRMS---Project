import React from 'react';

/**
 * Num component renders numeric values using the Manrope lining/tabular numbers font (font-num).
 * Optional `unit` prop (or auto-detected from string) renders the unit
 * (e.g. "Cr", "L", "%", "h", "m", "/100", "/ 5") right after the value
 * in a smaller muted style (`text-[0.55em] font-semibold text-muted ml-1`, baseline aligned).
 */
export default function Num({
  value,
  children,
  unit,
  className = "",
  weight = "font-extrabold"
}) {
  let val = value !== undefined ? value : children;
  let resolvedUnit = unit;

  if (val === null || val === undefined) {
    return <span className={`font-num ${weight} ${className}`}>--</span>;
  }

  // If unit is not explicitly passed and value is a string, check for common trailing units
  if (typeof val === "string" && !resolvedUnit) {
    const trimmed = val.trim();
    // "%" at end (e.g. "94.4%")
    const pctMatch = trimmed.match(/^(.*?)(%+)$/);
    if (pctMatch) {
      val = pctMatch[1].trim();
      resolvedUnit = pctMatch[2];
    } else {
      // Common suffix units: "L", "Cr", "/100", "/ 5", "h", "m", "Days", "days", "breaks", "break"
      const unitMatch = trimmed.match(/^(.*?)\s+(Cr|L|\/100|\/\s*5|Days|days|breaks|break|Overdue)$/i);
      if (unitMatch) {
        val = unitMatch[1];
        resolvedUnit = unitMatch[2];
      }
    }
  }

  return (
    <span className={`font-num ${weight} inline-flex items-baseline ${className}`}>
      <span>{val}</span>
      {resolvedUnit && (
        <span
          className={`text-[0.55em] font-semibold text-muted ${
            resolvedUnit === "%" ? "ml-0.5" : "ml-1"
          }`}
        >
          {resolvedUnit}
        </span>
      )}
    </span>
  );
}

export { Num };
