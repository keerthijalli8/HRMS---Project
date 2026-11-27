// src/components/common/Input.jsx
import React from 'react';

export function Input({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete,
  icon: Icon,
  rightElement,
  error,
  className = '',
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-[12px] font-medium text-muted mb-1.5"
        >
          {label} {required && <span className="text-bad">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            strokeWidth={1.8}
          />
        )}
        <input
          id={id}
          type={type}
          required={required}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-surface2 border border-line rounded-tpl py-2.5 text-[13px] text-ink focus:border-accent focus:outline-none transition-colors placeholder:text-muted/60 ${
            Icon ? 'pl-10' : 'pl-4'
          } ${rightElement ? 'pr-10' : 'pr-4'} ${
            error ? 'border-bad/60 focus:border-bad' : ''
          } ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-[11px] text-bad font-medium leading-tight">
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;

