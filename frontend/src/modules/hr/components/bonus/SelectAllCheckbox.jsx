import React, { useEffect, useRef } from 'react';

/**
 * SelectAllCheckbox component with synchronized indeterminate state.
 */
export const SelectAllCheckbox = ({
  checked = false,
  indeterminate = false,
  onChange,
  disabled = false,
  ariaLabel = "Select all employees",
  className = ""
}) => {
  const checkboxRef = useRef(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      aria-label={ariaLabel}
      className={`w-4 h-4 rounded border-line bg-surface2 text-accent focus:ring-accent focus:ring-offset-0 focus:ring-2 cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    />
  );
};

export default SelectAllCheckbox;
