// src/utils/format.js
// Helper functions for initials and avatar hue matching Monsoon Glass standards.

export function getInitials(name) {
  if (!name) return 'EM';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');
}

export function getAvatarColor(name) {
  if (!name) return 'hsl(180, 52%, 40%)';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 52%, 40%)`;
}
