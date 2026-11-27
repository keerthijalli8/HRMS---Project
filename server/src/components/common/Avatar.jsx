// src/components/common/Avatar.jsx
import React from 'react';
import { getInitials, getAvatarColor } from '../../utils/format.js';

export function Avatar({ name = '', size = 34, src = null, className = '', alt = '' }) {
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name}
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`rounded-full object-cover shrink-0 border border-line ${className}`}
      />
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: bgColor,
        fontSize: size >= 70 ? '28px' : size >= 48 ? '18px' : '12px'
      }}
      className={`rounded-full shrink-0 flex items-center justify-center font-bold text-white tracking-wide border border-line/40 select-none shadow-sm ${className}`}
      aria-label={alt || name}
    >
      {initials}
    </div>
  );
}

export default Avatar;

