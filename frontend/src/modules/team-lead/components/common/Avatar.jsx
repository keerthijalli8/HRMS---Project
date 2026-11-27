import React from 'react';
import { getInitials, getAvatarColor } from '../../utils/helpers.js';

export const Avatar = ({ name = '', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-lg'
  };

  const initials = getInitials(name);
  const bg = getAvatarColor(name);

  return (
    <div
      style={{ backgroundColor: bg }}
      className={`rounded-full shrink-0 flex items-center justify-center font-bold text-white tracking-wider shadow-sm select-none ${sizeClasses[size] || sizeClasses.md} ${className}`}
      title={name}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
};
