import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon.jsx';

/**
 * Reusable Monsoon Glass <Select> Component
 * 
 * Features:
 * - Trigger: Dark glass styling matching app inputs, chevron icon, focus ring
 * - Panel: Rendered via createPortal to document.body (immune to card overflow:hidden)
 * - Auto-positioning & Flip: Opens below trigger, flips above if screen space is constrained
 * - Search Filter: Automatically surfaces a search box when options count > 8
 * - Keyboard Navigation: Arrow Up/Down, Enter, Space, Escape, Home, End
 * - Accessibility: role="combobox", role="listbox", role="option", aria-expanded
 * - Backward Compatible: Supports both `options` array and standard `<option>` children
 * - Form & Filter integration: emits synthetic change event and raw value
 */
export const Select = ({
  options: propOptions,
  children,
  value,
  defaultValue,
  onChange,
  onValueChange,
  placeholder = "Select...",
  size = "md", // "sm" | "md"
  disabled = false,
  error = false,
  clearable = false,
  searchable, // if undefined, auto-enables when options > 8
  className = "",
  triggerClassName = "",
  panelClassName = "",
  name,
  id,
  title,
  ariaLabel,
  autoWidth = false,
  ...restProps
}) => {
  // Normalize options from either propOptions or JSX children (<option>, <optgroup>)
  const parsedOptions = useMemo(() => {
    if (Array.isArray(propOptions)) {
      return propOptions.map(opt => {
        if (typeof opt === 'string' || typeof opt === 'number') {
          return { value: String(opt), label: String(opt), disabled: false };
        }
        return {
          value: opt.value != null ? String(opt.value) : "",
          label: opt.label != null ? opt.label : String(opt.value),
          icon: opt.icon || null,
          disabled: Boolean(opt.disabled)
        };
      });
    }

    // Extract from JSX children if options prop was not provided
    if (children) {
      const extracted = [];
      React.Children.forEach(children, child => {
        if (!child) return;
        if (child.type === 'option') {
          extracted.push({
            value: child.props.value != null ? String(child.props.value) : "",
            label: child.props.children || String(child.props.value),
            icon: child.props.icon || null,
            disabled: Boolean(child.props.disabled)
          });
        } else if (child.type === 'optgroup') {
          React.Children.forEach(child.props.children, subChild => {
            if (subChild && subChild.type === 'option') {
              extracted.push({
                value: subChild.props.value != null ? String(subChild.props.value) : "",
                label: subChild.props.children || String(subChild.props.value),
                icon: subChild.props.icon || null,
                disabled: Boolean(subChild.props.disabled),
                group: child.props.label
              });
            }
          });
        }
      });
      return extracted;
    }

    return [];
  }, [propOptions, children]);

  // Controlled or uncontrolled value
  const [internalValue, setInternalValue] = useState(() => {
    return value !== undefined ? (value != null ? String(value) : "") : (defaultValue != null ? String(defaultValue) : "");
  });

  const selectedValue = value !== undefined ? (value != null ? String(value) : "") : internalValue;

  // Selected Option object
  const selectedOption = useMemo(() => {
    return parsedOptions.find(o => o.value === selectedValue) || null;
  }, [parsedOptions, selectedValue]);

  // Open/Close state
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  // Auto-searchable threshold: > 8 options unless explicitly configured
  const isSearchable = searchable !== undefined ? Boolean(searchable) : parsedOptions.length > 8;

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!isSearchable || !searchQuery.trim()) return parsedOptions;
    const q = searchQuery.toLowerCase().trim();
    return parsedOptions.filter(o => {
      const labelStr = typeof o.label === 'string' ? o.label : String(o.value);
      return labelStr.toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q);
    });
  }, [parsedOptions, isSearchable, searchQuery]);

  // DOM refs
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Position calculation for Portal floating menu (viewport fixed)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, placement: "bottom" });

  const calculateCoords = useCallback(() => {
    if (!triggerRef.current) return null;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const panelMaxHeight = 280;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    let placement = "bottom";
    let top = rect.bottom + 4;

    // Flip above if space below is limited and space above is greater
    if (spaceBelow < panelMaxHeight && spaceAbove > spaceBelow) {
      placement = "top";
      top = rect.top - 4;
    }

    let left = rect.left;
    let width = Math.max(rect.width, 160);

    if (left + width > viewportWidth - 12) {
      left = Math.max(12, viewportWidth - width - 12);
    }

    return {
      top,
      left,
      width: rect.width,
      placement
    };
  }, []);

  const updatePosition = useCallback(() => {
    const nextCoords = calculateCoords();
    if (nextCoords) {
      setCoords(nextCoords);
    }
  }, [calculateCoords]);

  const handleToggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      const initialCoords = calculateCoords();
      if (initialCoords) {
        setCoords(initialCoords);
      }
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Update position when opening or on window resize / scroll
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleWindowEvents = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleWindowEvents);
    window.addEventListener('scroll', handleWindowEvents, true);

    return () => {
      window.removeEventListener('resize', handleWindowEvents);
      window.removeEventListener('scroll', handleWindowEvents, true);
    };
  }, [isOpen, updatePosition]);

  // Focus search input when panel opens without causing page scroll
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      // Find initial active index matching current selection
      const idx = filteredOptions.findIndex(o => o.value === selectedValue);
      setActiveIndex(idx >= 0 ? idx : 0);

      if (isSearchable && searchInputRef.current) {
        setTimeout(() => {
          searchInputRef.current?.focus({ preventScroll: true });
        }, 30);
      }
    } else {
      setActiveIndex(-1);
    }
  }, [isOpen, isSearchable, selectedValue, filteredOptions]);

  // Outside click listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        triggerRef.current && triggerRef.current.contains(e.target) ||
        panelRef.current && panelRef.current.contains(e.target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [isOpen]);

  // Commit selection
  const handleSelectOption = (opt) => {
    if (!opt || opt.disabled) return;
    const newVal = opt.value;
    if (value === undefined) {
      setInternalValue(newVal);
    }
    setIsOpen(false);

    // Call onValueChange if provided
    if (onValueChange) {
      onValueChange(newVal);
    }

    // Call onChange with synthetic event (and raw value as 2nd param)
    if (onChange) {
      const syntheticEvent = {
        target: { value: newVal, name: name || id || '' },
        currentTarget: { value: newVal, name: name || id || '' },
        preventDefault: () => {},
        stopPropagation: () => {}
      };
      onChange(syntheticEvent, newVal);
    }

    // Re-focus trigger without jumping page
    triggerRef.current?.focus({ preventScroll: true });
  };

  // Clear selection handler
  const handleClear = (e) => {
    e.stopPropagation();
    if (disabled) return;
    const emptyVal = "";
    if (value === undefined) {
      setInternalValue(emptyVal);
    }

    if (onValueChange) {
      onValueChange(emptyVal);
    }

    if (onChange) {
      const syntheticEvent = {
        target: { value: emptyVal, name: name || id || '' },
        currentTarget: { value: emptyVal, name: name || id || '' },
        preventDefault: () => {},
        stopPropagation: () => {}
      };
      onChange(syntheticEvent, emptyVal);
    }
  };

  // Keyboard navigation on Trigger & Panel
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const initialCoords = calculateCoords();
        if (initialCoords) setCoords(initialCoords);
        setIsOpen(true);
      }
      return;
    }

    // When open
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus({ preventScroll: true });
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => {
        let next = prev + 1;
        while (next < filteredOptions.length && filteredOptions[next]?.disabled) {
          next++;
        }
        return next < filteredOptions.length ? next : prev;
      });
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => {
        let next = prev - 1;
        while (next >= 0 && filteredOptions[next]?.disabled) {
          next--;
        }
        return next >= 0 ? next : prev;
      });
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
        handleSelectOption(filteredOptions[activeIndex]);
      }
      return;
    }

    if (e.key === 'Home') {
      e.preventDefault();
      const firstEnabled = filteredOptions.findIndex(o => !o.disabled);
      if (firstEnabled >= 0) setActiveIndex(firstEnabled);
      return;
    }

    if (e.key === 'End') {
      e.preventDefault();
      for (let i = filteredOptions.length - 1; i >= 0; i--) {
        if (!filteredOptions[i].disabled) {
          setActiveIndex(i);
          break;
        }
      }
      return;
    }
  };

  // Keep active option in view
  useEffect(() => {
    if (!isOpen || activeIndex < 0 || !listRef.current) return;
    const activeEl = listRef.current.children[activeIndex];
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, isOpen]);

  // Size styles
  const isSm = size === "sm";
  const sizeClasses = isSm
    ? "h-8 text-xs px-2.5 rounded-lg gap-1.5"
    : "h-9 text-xs sm:text-[13px] px-3 rounded-xl gap-2";

  return (
    <div className={`relative inline-block ${autoWidth ? 'w-auto' : 'w-full'} ${className}`}>
      {/* Visual Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        name={name}
        title={title}
        disabled={disabled}
        onClick={handleToggleOpen}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || (typeof placeholder === 'string' ? placeholder : undefined)}
        className={`w-full flex items-center justify-between text-left transition-all duration-150 select-none cursor-pointer border ${
          disabled
            ? "bg-surface2/30 border-line/40 text-muted opacity-50 cursor-not-allowed"
            : error
            ? "bg-bad/10 border-bad text-bad focus:ring-2 focus:ring-bad/30"
            : isOpen
            ? "bg-surface2 border-accent text-ink ring-2 ring-accent/20 shadow-sm"
            : "bg-surface2/70 hover:bg-surface2 border-line hover:border-accent/60 text-ink"
        } ${sizeClasses} ${triggerClassName}`}
      >
        {/* Selected Label / Placeholder */}
        <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 pr-1">
          {selectedOption?.icon && (
            <Icon name={selectedOption.icon} className="w-3.5 h-3.5 text-accent shrink-0" />
          )}
          <span className={`truncate ${selectedOption ? "font-medium text-ink" : "text-muted"}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        {/* Clear Icon (Optional) & Chevron */}
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {clearable && selectedOption && !disabled && (
            <span
              onClick={handleClear}
              title="Clear selection"
              className="p-0.5 rounded hover:bg-surface2 text-muted hover:text-ink transition cursor-pointer"
            >
              <Icon name="x" className="w-3 h-3" />
            </span>
          )}
          <Icon
            name="chevron-down"
            className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${
              isOpen ? "rotate-180 text-accent" : ""
            }`}
          />
        </div>
      </button>

      {/* Floating Options Panel rendered via Portal */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          onKeyDown={handleKeyDown}
          role="listbox"
          aria-label={ariaLabel || placeholder}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${Math.max(coords.width, 160)}px`,
            transform: coords.placement === 'top' ? 'translateY(-100%)' : 'none',
            maxHeight: '320px',
            overflowY: 'auto',
            zIndex: 99999
          }}
          className={`glass-panel overflow-hidden rounded-xl border border-white/15 bg-[#0f2330]/95 backdrop-blur-md shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-100 ${panelClassName}`}
        >
          {/* Optional Search Input for lists with > 8 options */}
          {isSearchable && (
            <div className="p-2 border-b border-line/40 bg-surface2/30 sticky top-0 z-10 flex items-center gap-2">
              <Icon name="search" className="w-3.5 h-3.5 text-muted shrink-0 ml-1" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search options..."
                className="w-full bg-transparent border-0 text-xs text-ink placeholder-muted/70 focus:outline-none focus:ring-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-0.5 rounded text-muted hover:text-ink text-[11px]"
                >
                  <Icon name="x" className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Options List */}
          <div
            ref={listRef}
            className="max-h-60 overflow-y-auto p-1 sidebar-scroll-container flex flex-col gap-0.5"
          >
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === selectedValue;
                const isHighlighted = idx === activeIndex;

                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled}
                    onClick={() => !opt.disabled && handleSelectOption(opt)}
                    onMouseEnter={() => !opt.disabled && setActiveIndex(idx)}
                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-100 cursor-pointer select-none ${
                      opt.disabled
                        ? "opacity-40 cursor-not-allowed text-muted"
                        : isSelected
                        ? "bg-accent/15 text-accent font-semibold"
                        : isHighlighted
                        ? "bg-white/[0.08] text-ink"
                        : "text-ink/90 hover:bg-white/[0.06] hover:text-ink"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      {opt.icon && (
                        <Icon
                          name={opt.icon}
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected ? "text-accent" : "text-muted"
                          }`}
                        />
                      )}
                      <span className="truncate">{opt.label}</span>
                    </div>

                    {/* Teal checkmark indicator for selected item */}
                    {isSelected && (
                      <Icon name="check" className="w-3.5 h-3.5 text-accent shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Select;
