import React, { useEffect, useRef } from 'react';
import Avatar from './Avatar';
import {
  User,
  Settings,
  Bell,
  Command,
  Download,
  LogOut,
  ExternalLink,
} from 'lucide-react';

export default function AccountMenu({
  isOpen,
  onClose,
  triggerRef,
  user,
  onNavigate,
  onOpenShortcuts,
  onOpenExportModal,
  onSignOut,
}) {
  const menuRef = useRef(null);
  const itemsRef = useRef([]);

  // Close on outside click or Esc
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        onClose();
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
        if (triggerRef.current) {
          triggerRef.current.focus();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (document.activeElement === itemsRef.current[0])
          ? itemsRef.current[1]
          : itemsRef.current[itemsRef.current.indexOf(document.activeElement) + 1] || itemsRef.current[0];
        next?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = itemsRef.current[itemsRef.current.indexOf(document.activeElement) - 1] || itemsRef.current[itemsRef.current.length - 1];
        prev?.focus();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    // Auto-focus first item on open
    setTimeout(() => {
      itemsRef.current[0]?.focus();
    }, 50);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const menuItems = [
    {
      id: 'profile',
      label: 'My profile',
      icon: User,
      action: () => {
        onNavigate('/manager/profile');
        onClose();
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      action: () => {
        onNavigate('/manager/settings');
        onClose();
      },
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      action: () => {
        onNavigate('/manager/notifications');
        onClose();
      },
    },
    ...(onOpenExportModal
      ? [
          {
            id: 'export',
            label: 'Export reports',
            icon: Download,
            action: () => {
              onOpenExportModal();
              onClose();
            },
          },
        ]
      : []),
    {
      id: 'shortcuts',
      label: 'Keyboard shortcuts',
      icon: Command,
      action: () => {
        onOpenShortcuts();
        onClose();
      },
    },
  ];

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Manager account menu"
      className="absolute right-0 top-12 z-50 w-[240px] p-2 bg-[#0a222b] border border-line shadow-2xl flex flex-col gap-1 text-ink animate-in fade-in zoom-in-95 duration-150"
      style={{
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--card-shadow)',
        backdropFilter: 'var(--blur)',
      }}
    >
      {/* Top User Pill Card */}
      <div className="flex items-center gap-3 px-3 py-2 rounded-full bg-surface2/50 border border-line/70 select-none">
        {user?.photoUrl ? (
          <img
            src={user.photoUrl}
            alt={user.name || 'Lokesh Kumar'}
            className="w-9 h-9 rounded-full object-cover ring-1 ring-accent shrink-0"
          />
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-white text-[13px] shrink-0 select-none shadow-sm"
            style={{ backgroundColor: '#548a28' }}
          >
            LK
          </div>
        )}
        <div className="flex flex-col min-w-0 leading-tight">
          <span className="font-display font-bold text-[13px] text-ink truncate">
            {user?.name || 'Lokesh Kumar'}
          </span>
          <span className="text-[11.5px] text-muted truncate mt-0.5 font-normal">
            {user?.designation || 'Frontend Developer'}
          </span>
        </div>
      </div>

      {/* Menu Options */}
      <div className="flex flex-col gap-0.5 pt-1">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              ref={(el) => (itemsRef.current[idx] = el)}
              role="menuitem"
              type="button"
              onClick={item.action}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-medium text-muted hover:text-ink hover:bg-surface2 transition-colors text-left outline-none focus-visible:bg-surface2 focus-visible:text-ink focus-visible:ring-1 focus-visible:ring-accent"
            >
              <Icon size={14} className="text-muted/80 shrink-0" strokeWidth={1.8} />
              <span className="flex-1 truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dashed Divider */}
      <div className="my-1 border-t border-dashed border-line/60" />

      {/* Sign Out Pill */}
      <button
        ref={(el) => (itemsRef.current[menuItems.length] = el)}
        role="menuitem"
        type="button"
        onClick={() => {
          onSignOut();
          onClose();
        }}
        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-full border border-line/70 text-[12.5px] font-medium text-bad hover:bg-bad/10 hover:border-bad/60 transition-all text-center outline-none focus-visible:bg-bad/20 mt-1 cursor-pointer"
      >
        <LogOut size={14} strokeWidth={1.8} className="shrink-0" />
        <span>Sign out</span>
      </button>
    </div>
  );
}

