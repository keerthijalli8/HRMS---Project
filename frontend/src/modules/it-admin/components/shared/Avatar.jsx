import React, { useState } from 'react';

// Avatar: 34px circle, initials or custom image, background hsl(hue 52% 40%) from the name, white text.
function getHueFromName(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name = '', size = 34, className = '', src = null, alt = '' }) {
  const [hasError, setHasError] = useState(false);
  const hue = getHueFromName(name);
  const initials = getInitials(name);

  if (src && !hasError) {
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '9999px',
        }}
        className={`relative overflow-hidden shrink-0 select-none shadow-sm ${className}`}
        title={name}
      >
        <img
          src={src}
          alt={alt || name}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: `hsl(${hue}, 52%, 40%)`,
        borderRadius: '9999px',
        color: '#ffffff',
        fontSize: size >= 48 ? '18px' : size >= 36 ? '13px' : '11px',
      }}
      aria-hidden="true"
      className={`flex items-center justify-center font-display font-bold shrink-0 select-none shadow-sm ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
}
