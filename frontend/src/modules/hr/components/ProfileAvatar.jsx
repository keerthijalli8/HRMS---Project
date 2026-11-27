import React from 'react';

export const ProfileAvatar = ({
  profile,
  onClick,
  isOpen = false,
  className = ""
}) => {
  const avatarUrl = profile?.avatarUrl;

  // Compute initials fallback
  const first = (profile?.firstName || profile?.name?.split(' ')[0] || "P")[0] || "P";
  const last = (profile?.lastName || profile?.name?.split(' ').slice(1).join(' ') || "P")[0] || "P";
  const initials = `${first}${last}`.toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-[44px] h-[44px] rounded-full border-2 ${
        isOpen
          ? "border-accent ring-2 ring-accent/40"
          : "border-line/70 hover:border-accent ring-2 ring-accent/10 hover:ring-accent/30"
      } bg-surface2/80 transition-all duration-200 cursor-pointer overflow-hidden p-[1.5px] shrink-0 shadow-md focus:outline-none focus:ring-2 focus:ring-accent ${className}`}
      aria-label="User profile account menu"
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      title={`${profile?.name || "User"} (${profile?.role || "Employee"})`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={profile?.name || "User Avatar"}
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            // Fallback gracefully if image fails to render
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <div
          className="w-full h-full rounded-full flex items-center justify-center font-display font-bold text-xs sm:text-[13px] text-ink bg-gradient-to-br from-accent/35 via-accent/15 to-[#062028] border border-accent/20 tracking-wider select-none"
        >
          {initials}
        </div>
      )}

      {/* Online indicator dot */}
      <span
        className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-good rounded-full ring-2 ring-[#06141c] pointer-events-none"
        aria-hidden="true"
      />
    </button>
  );
};
